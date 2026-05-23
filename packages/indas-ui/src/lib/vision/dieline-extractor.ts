/**
 * Vision LLM dieline extractor — reads L/W/H + content type from a dieline image.
 *
 * Two-pass extraction grounded in real keyline geometry:
 *   Pass 1 (triage): user image + composite reference grid of all known
 *                    content-type keylines → model returns top-5 candidates
 *                    + L/W/H read from the user's labels.
 *   Pass 2 (refine): user image + only the top-5 individual thumbnails →
 *                    model picks the single best match with confidence.
 *
 * The reference grid is built once client-side from real DB keyline data
 * (see reference-grid.ts), cached in IndexedDB. Per-type rendered thumbnails
 * come from that same grid build, so pass 2 reuses already-rendered images.
 */

import APIClient from '@/lib/api/core/client'
import { getReferenceGrid, type ReferenceGrid } from './reference-grid'

export type VisionProvider = 'backend' | 'claude'

export interface ExtractedSpecs {
  L: number | null
  W: number | null
  H: number | null
  contentType: string | null
  notes?: string
  /** Top candidates from pass 1, in confidence order. Useful for UI override. */
  candidates?: string[]
}

export interface ExtractRequest {
  file: File
  provider: VisionProvider
  /** Required only for provider='claude'. */
  apiKey?: string
  contentTypes: string[]
  /** Required — used both for the backend session AND to fetch keyline coords. */
  session: any
  /** Grain used when fetching reference keylines (default 'With Grain'). */
  grain?: string
}

/* ───────────────────── Prompts ───────────────────── */

const TRIAGE_SYSTEM_PROMPT = `You are a packaging-carton expert helping extract specifications from a dieline (keyline) image.

You will receive TWO images:
  1. USER IMAGE — a dieline the user uploaded. It shows the flat unfolded carton with dimension labels in mm.
  2. REFERENCE GRID — a labeled grid of all known carton TYPES, each drawn as a 2D keyline using identical reference dimensions. Treat this as ground truth for what each named type looks like.

## Dimension extraction approach

DO NOT try to figure out which label is L, W, or H based on the panel structure — visual judgment of which panel has a tuck flap vs dust ear is unreliable at small image scales.

Instead, read the dimension labels and report:
- The VERTICAL label (the one with a vertical double-headed arrow, measuring the central strip's height) → this is H.
- The two HORIZONTAL labels → report them BOTH, in order from LEFT TO RIGHT as they appear in the image. Call them horizontalLeft and horizontalRight.

The downstream pipeline will assign L vs W based on the matched content type's geometry. You only need to do accurate OCR of label values and their positions.

## Your job (pass 1 — triage)
1. Read every visible dimension label on the USER IMAGE.
2. Identify the vertical label (vertical arrow on the central strip) → H.
3. Identify the two horizontal labels → record their values AND their left/right order in the image.
4. Compare the USER IMAGE's overall shape (flap layout, dust ears, glue tab position, lock features) against EVERY tile in the REFERENCE GRID.
5. Return the FIVE most visually-similar reference types in ranked order.

## Output
Return STRICT JSON only, no prose, no markdown fences:
{
  "H": number | null,
  "horizontalLeft": number | null,
  "horizontalRight": number | null,
  "candidates": [string, string, string, string, string],
  "notes": "short note on label readings and why these candidates"
}
Every value in candidates MUST be an exact label visible in the REFERENCE GRID.
horizontalLeft is the horizontal label nearest the LEFT side of the image (closer to the glue tab). horizontalRight is the one further right.`

const REFINE_SYSTEM_PROMPT = `You are picking the SINGLE best matching carton type for a dieline image.

You will receive:
  1. USER IMAGE — the dieline the user uploaded.
  2. CANDIDATE THUMBNAILS — N labeled 2D keyline thumbnails of candidate types drawn with identical reference dimensions.

## How to compare (work through each step IN ORDER, do not skip)

Step 1 — TUCK FLAP DIRECTION (most discriminating feature)
Look at the top and bottom of the central panel strip in the USER IMAGE. Find the small rectangular tuck flaps.
  • REVERSE TUCK (ReverseTuckIn, ReverseTuckAndTongue): the TOP tuck flap is on the OPPOSITE SIDE of the panel strip from the BOTTOM tuck flap. They point in opposite directions (one extends up from the left half of the strip, the other extends down from the right half — or vice versa).
  • STRAIGHT TUCK (StandardStraightTuckIn, StandardStraightTuckInNested, StandardStraightTuckInHang, etc.): the TOP and BOTTOM tuck flaps are on the SAME SIDE — both extend from the same panels (both above the front panel, or both above the back panel).
  Eliminate any candidate whose tuck direction disagrees with the USER IMAGE.

Step 2 — HANGING / SLOT FEATURES
Check for hanging-tab cutouts (small rectangular or shaped slots) at the top of the dieline:
  • If the USER IMAGE has a hanging tab/slot → prefer types with "Hang" in the name.
  • If the USER IMAGE has NO hanging tab → eliminate candidates with "Hang" in the name.

Step 3 — BOTTOM CONSTRUCTION
  • Crash-lock cartons (CrashLockWithPasting, CrashLockWithoutPasting, CrashLockBottomTuckEndFoldingCarton): the bottom flaps are large interlocking trapezoidal shapes, not simple rectangles.
  • Auto-bottom / web-locking: distinctive angled cuts.
  • Plain tuck-in: simple rectangular bottom flap.

Step 4 — GLUE TAB & SPECIAL FEATURES
  • Glue/pasting tab (PF) is the narrow strip on the FAR LEFT of every flat layout. Its presence is universal — not discriminating.
  • Pizza / Cake / Gadget / FourCorner / SixCorner box types have distinctive non-rectangular outer shapes — only pick these if the USER IMAGE has clearly unusual geometry.

## After working through the steps
Pick the SINGLE candidate that survives all eliminations. If two candidates tie, prefer the simpler one (e.g. ReverseTuckIn over a "Nested" or "Tongue" variant unless those features are clearly present).

Return STRICT JSON only:
{
  "contentType": string,
  "confidence": "high" | "medium" | "low",
  "reason": "one short sentence citing the tuck direction + any other discriminating feature you used"
}
contentType MUST be one of the candidate labels exactly.`

function triageUserPrompt(types: string[]): string {
  return `The REFERENCE GRID contains these types (read the labels under each tile):
${types.map(t => `- ${t}`).join('\n')}

Extract L, W, H from the USER IMAGE labels, then return the 5 most visually-similar reference types.`
}

function refineUserPrompt(candidates: string[]): string {
  return `Candidate types to choose from (in the thumbnails, in order):
${candidates.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Pick the single best visual match for the USER IMAGE.`
}

/* ───────────────────── File helpers ───────────────────── */

async function fileToBase64(file: File): Promise<{ data: string; mediaType: string }> {
  const buf = await file.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)))
  }
  return { data: btoa(binary), mediaType: file.type || 'image/png' }
}

function dataUrlToBase64(dataUrl: string): { data: string; mediaType: string } {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!m) throw new Error('Invalid data URL')
  return { mediaType: m[1], data: m[2] }
}

function parseJsonLoose(text: string): any {
  const trimmed = (text || '').trim()
  try { return JSON.parse(trimmed) } catch {}
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) {
    try { return JSON.parse(fence[1].trim()) } catch {}
  }
  const match = trimmed.match(/\{[\s\S]*\}/)
  if (match) {
    try { return JSON.parse(match[0]) } catch {}
  }
  throw new Error(`Model did not return valid JSON. Raw: ${trimmed.slice(0, 200)}`)
}

function fuzzyMatchType(raw: string | null, allowed: string[]): string | null {
  if (!raw) return null
  const exact = allowed.find(a => a === raw)
  if (exact) return exact
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const target = norm(raw)
  return allowed.find(a => norm(a) === target) || null
}

/* ───────────────────── Backend dispatch ───────────────────── */

interface VisionImage {
  /** Pure base64 (no data: prefix). */
  base64: string
  mediaType: string
  /** Optional caption — backend prepends this to the image as a text block. */
  caption?: string
}

interface BackendCallParams {
  images: VisionImage[]
  systemPrompt: string
  userPrompt: string
  session: any
}

async function callBackendVision(p: BackendCallParams): Promise<any> {
  const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL_NEW
  if (!baseURL) throw new Error('NEXT_PUBLIC_API_BASE_URL_NEW is not set in env')

  const resp = await APIClient.post<any>(
    '/api/vision/extract-dieline',
    {
      images: p.images,
      systemPrompt: p.systemPrompt,
      userPrompt: p.userPrompt,
    },
    p.session,
    baseURL,
  )

  if (!resp.success) throw new Error(resp.error || 'Backend vision call failed')
  // Backend returns the model's raw text in resp.data.rawText so we can parse JSON ourselves.
  const rawText = (resp.data && (resp.data.rawText || resp.data.RawText)) || ''
  if (!rawText) throw new Error('Backend returned no model text')
  return parseJsonLoose(rawText)
}

/* ───────────────────── Claude direct dispatch (browser-direct) ───────────────────── */

async function callClaudeVision(p: BackendCallParams & { apiKey: string }): Promise<any> {
  const content: any[] = []
  for (const img of p.images) {
    if (img.caption) content.push({ type: 'text', text: img.caption })
    content.push({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.base64 } })
  }
  content.push({ type: 'text', text: p.userPrompt })

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': p.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: p.systemPrompt,
      messages: [{ role: 'user', content }],
    }),
  })
  if (!resp.ok) {
    const errText = await resp.text()
    throw new Error(`Claude API ${resp.status}: ${errText.slice(0, 300)}`)
  }
  const json = await resp.json()
  const text = json?.content?.[0]?.text
  if (!text) throw new Error('Claude returned no text content')
  return parseJsonLoose(text)
}

async function callVision(p: BackendCallParams, req: ExtractRequest): Promise<any> {
  if (req.provider === 'claude') {
    if (!req.apiKey) throw new Error('Claude API key required for browser-direct mode')
    return callClaudeVision({ ...p, apiKey: req.apiKey })
  }
  return callBackendVision(p)
}

/* ───────────────────── Two-pass orchestration ───────────────────── */

async function extractTwoPass(req: ExtractRequest, grid: ReferenceGrid): Promise<ExtractedSpecs> {
  const userImgRaw = await fileToBase64(req.file)
  const gridImgRaw = dataUrlToBase64(grid.dataUrl)
  const userImg: VisionImage = { base64: userImgRaw.data, mediaType: userImgRaw.mediaType }
  const gridImg: VisionImage = { base64: gridImgRaw.data, mediaType: gridImgRaw.mediaType }

  // Pass 1 — triage: user image + reference grid → top-5 candidates + L/W/H
  const triage = await callVision({
    images: [
      { ...userImg, caption: 'USER IMAGE — the dieline to extract specs from:' },
      { ...gridImg, caption: 'REFERENCE GRID — all known types, labeled. Match against these:' },
    ],
    systemPrompt: TRIAGE_SYSTEM_PROMPT,
    userPrompt: triageUserPrompt(req.contentTypes),
    session: req.session,
  }, req)

  const rawCandidates: string[] = Array.isArray(triage.candidates) ? triage.candidates : []
  // Snap each candidate string to a real allow-list entry; drop anything we can't match.
  const candidates = rawCandidates
    .map(c => fuzzyMatchType(typeof c === 'string' ? c : null, req.contentTypes))
    .filter((c): c is string => !!c)

  // Assign L/W from the horizontal labels by position. Convention from the
  // keyline formulas (PF → L → W → L → W): the leftmost horizontal panel
  // after the glue tab is L (front face); the next one is W (side wall).
  // If the model returns horizontalLeft/horizontalRight, use them; otherwise
  // fall back to legacy L/W keys for backwards compat with old prompts.
  const horizontalLeft = numOrNull(triage.horizontalLeft)
  const horizontalRight = numOrNull(triage.horizontalRight)
  const L = horizontalLeft != null ? horizontalLeft : numOrNull(triage.L)
  const W = horizontalRight != null ? horizontalRight : numOrNull(triage.W)

  // If triage gave us nothing usable, return what we have without a final type.
  if (candidates.length === 0) {
    return {
      L,
      W,
      H: numOrNull(triage.H),
      contentType: null,
      notes: (triage.notes || '') + ' [no usable candidates from triage]',
      candidates: [],
    }
  }

  // Pass 2 — refine: user image + only the candidate thumbnails
  const candidateThumbs: VisionImage[] = candidates.map((c, i) => {
    const dataUrl = grid.thumbs[c]
    if (!dataUrl) return null
    const { data, mediaType } = dataUrlToBase64(dataUrl)
    return { base64: data, mediaType, caption: `Candidate ${i + 1}: ${c}` } as VisionImage
  }).filter((x): x is VisionImage => !!x)

  let finalType: string | null = candidates[0]  // fallback if pass 2 fails
  let confidence = 'low'
  let reason = ''
  try {
    const refine = await callVision({
      images: [
        { ...userImg, caption: 'USER IMAGE — pick which candidate visually matches:' },
        ...candidateThumbs,
      ],
      systemPrompt: REFINE_SYSTEM_PROMPT,
      userPrompt: refineUserPrompt(candidates),
      session: req.session,
    }, req)
    const picked = fuzzyMatchType(typeof refine.contentType === 'string' ? refine.contentType : null, candidates)
    if (picked) finalType = picked
    if (typeof refine.confidence === 'string') confidence = refine.confidence
    if (typeof refine.reason === 'string') reason = refine.reason
  } catch (e: any) {
    // Pass 2 failure shouldn't kill the whole extraction — fall back to triage's #1.
    reason = `Pass 2 failed: ${e?.message || e}. Using triage top candidate.`
  }

  const triageNotes = typeof triage.notes === 'string' ? triage.notes : ''
  const combinedNotes = [triageNotes, reason && `[match ${confidence}] ${reason}`]
    .filter(Boolean).join(' · ')

  return {
    L,
    W,
    H: numOrNull(triage.H),
    contentType: finalType,
    notes: combinedNotes || undefined,
    candidates,
  }
}

function numOrNull(v: any): number | null {
  if (v === null || v === undefined) return null
  const n = typeof v === 'string' ? parseFloat(v) : Number(v)
  return Number.isFinite(n) ? n : null
}

/* ───────────────────── Public entry ───────────────────── */

export async function extractDielineSpecs(req: ExtractRequest): Promise<ExtractedSpecs> {
  if (!req.file) throw new Error('No image provided')
  if (!req.contentTypes?.length) throw new Error('contentTypes allow-list is empty')
  if (!req.session) throw new Error('Session is required (used for keyline fetch and backend call)')

  // Build (or hit cache for) the reference grid. This is the slow path on first run.
  const grid = await getReferenceGrid(req.contentTypes, req.grain || 'With Grain', req.session)
  return extractTwoPass(req, grid)
}

/** Re-export so the UI can offer a "rebuild reference grid" button. */
export { clearReferenceGridCache } from './reference-grid'
