/**
 * Builds a composite "reference grid" image of all content-type keylines so
 * the LLM can pick by visual match against ground truth rather than guessing
 * from training-data memory.
 *
 * Strategy:
 *   1. Fetch keyline-coordinate rows for every content type in parallel
 *   2. Evaluate each row's formulas with a fixed reference Dims so panel
 *      proportions are comparable across types
 *   3. Render each type's segments to an offscreen canvas tile
 *   4. Pack the tiles into one labeled grid PNG
 *
 * Caching:
 *   - The grid is deterministic given (types[], referenceDims). We hash those
 *     and store the resulting PNG (+ tile metadata) in IndexedDB.
 *   - Stale entries are auto-evicted when the hash changes (e.g. user adds a
 *     new content type).
 *
 * The cached grid is reused across every Extract call — generated once per
 * type-list change, never recomputed unnecessarily.
 */

import { rowsToSegments, type Dims, type KeylineRow, type Segment } from '@/app/(main)/costing/estimation/components/keyline3D'
import { PlanWindowAPI } from '@/lib/api/estimation/planning'

// Reference dimensions chosen so L, W, H are all visually distinct on every
// type's panel layout. Don't change these without bumping the cache key.
const REFERENCE_DIMS: Dims = {
  L: 200, W: 100, H: 150,
  OF: 30, PF: 12, BF: 30, FH: 25, TH: 20,
}

const TILE_SIZE = 400        // each thumbnail is TILE_SIZE × TILE_SIZE px — bigger so flap-tuck direction is visible
const LABEL_HEIGHT = 28      // pixels for the type name underneath
const GRID_COLS = 6          // columns in the composite
const TILE_PADDING = 8       // pixels between tiles

const IDB_NAME = 'vision-reference-cache'
const IDB_STORE = 'grids'

export interface TileMeta {
  type: string
  col: number
  row: number
  /** Top-left pixel coordinates in the composite. */
  x: number
  y: number
}

export interface ReferenceGrid {
  /** PNG composite as a data URL (`data:image/png;base64,...`). */
  dataUrl: string
  /** base64 portion only — what gets sent to the vision API. */
  base64: string
  /** Per-type position metadata so callers know where each type lives in the grid. */
  tiles: TileMeta[]
  /** Per-type rendered PNG (data URL) so we can also send individual thumbnails in pass 2. */
  thumbs: Record<string, string>
  /** Cache hash this was built under. */
  hash: string
}

/* ───────────────────────── IndexedDB helpers ───────────────────────── */

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbGet(key: string): Promise<ReferenceGrid | null> {
  try {
    const db = await openDb()
    return await new Promise<ReferenceGrid | null>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly')
      const req = tx.objectStore(IDB_STORE).get(key)
      req.onsuccess = () => resolve((req.result as ReferenceGrid) || null)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}

async function idbSet(key: string, value: ReferenceGrid): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      tx.objectStore(IDB_STORE).put(value, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // Best-effort caching — if IndexedDB fails (private mode etc.) we just regenerate next time.
  }
}

/* ───────────────────────── Hash (cache key) ───────────────────────── */

async function hashInputs(types: string[], dims: Dims): Promise<string> {
  // Tile config is part of the cache key so changes invalidate stale grids
  // automatically without needing a manual "clear cache" action.
  const payload = JSON.stringify({
    types: [...types].sort(),
    dims,
    tile: { size: TILE_SIZE, label: LABEL_HEIGHT, cols: GRID_COLS, pad: TILE_PADDING },
  })
  const buf = new TextEncoder().encode(payload)
  const digest = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16)
}

/* ───────────────────────── Tile renderer ───────────────────────── */

function renderTileToCanvas(segments: Segment[], label: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = TILE_SIZE
  canvas.height = TILE_SIZE + LABEL_HEIGHT
  const ctx = canvas.getContext('2d')!

  // White background so the LLM sees high contrast.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Label at the bottom — type name, monospace, dark.
  ctx.fillStyle = '#111111'
  ctx.font = 'bold 11px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, TILE_SIZE / 2, TILE_SIZE + LABEL_HEIGHT / 2, TILE_SIZE - 4)

  if (segments.length === 0) {
    ctx.fillStyle = '#999999'
    ctx.font = '12px sans-serif'
    ctx.fillText('(no keyline)', TILE_SIZE / 2, TILE_SIZE / 2)
    return canvas
  }

  // Compute bbox of all segment endpoints so we can scale-to-fit.
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const s of segments) {
    minX = Math.min(minX, s.x1, s.x2); minY = Math.min(minY, s.y1, s.y2)
    maxX = Math.max(maxX, s.x1, s.x2); maxY = Math.max(maxY, s.y1, s.y2)
  }
  const w = maxX - minX, h = maxY - minY
  if (w <= 0 || h <= 0) return canvas

  const pad = 8
  const scale = Math.min((TILE_SIZE - 2 * pad) / w, (TILE_SIZE - 2 * pad) / h)
  const offsetX = (TILE_SIZE - w * scale) / 2 - minX * scale
  const offsetY = (TILE_SIZE - h * scale) / 2 - minY * scale

  const tx = (x: number) => x * scale + offsetX
  const ty = (y: number) => y * scale + offsetY

  ctx.lineWidth = 1.2
  for (const s of segments) {
    const isCurve = s.shape === 'Curve'
    const isCircle = s.shape === 'Circle'
    ctx.strokeStyle = isCurve || isCircle ? '#dc2626' : (s.isDashed ? '#2563eb' : '#111111')
    ctx.setLineDash(s.isDashed ? [4, 3] : [])

    ctx.beginPath()
    if (isCurve) {
      ctx.moveTo(tx(s.x1), ty(s.y1))
      ctx.quadraticCurveTo(tx(s.x1), ty(s.y2), tx(s.x2), ty(s.y2))
    } else if (isCircle) {
      const r = Math.sqrt((s.x2 - s.x1) ** 2 + (s.y2 - s.y1) ** 2) / 2 * scale
      ctx.moveTo(tx(s.x1), ty(s.y1))
      ctx.arc(tx((s.x1 + s.x2) / 2), ty((s.y1 + s.y2) / 2), r, 0, Math.PI * 2)
    } else {
      ctx.moveTo(tx(s.x1), ty(s.y1))
      ctx.lineTo(tx(s.x2), ty(s.y2))
    }
    ctx.stroke()
  }

  return canvas
}

/* ───────────────────────── Composite assembler ───────────────────────── */

function compositeTiles(tiles: { type: string; canvas: HTMLCanvasElement }[]): {
  canvas: HTMLCanvasElement
  meta: TileMeta[]
} {
  const rows = Math.ceil(tiles.length / GRID_COLS)
  const tileTotalH = TILE_SIZE + LABEL_HEIGHT
  const compW = GRID_COLS * TILE_SIZE + (GRID_COLS + 1) * TILE_PADDING
  const compH = rows * tileTotalH + (rows + 1) * TILE_PADDING

  const canvas = document.createElement('canvas')
  canvas.width = compW
  canvas.height = compH
  const ctx = canvas.getContext('2d')!

  // Light background so cell boundaries don't visually merge.
  ctx.fillStyle = '#f3f4f6'
  ctx.fillRect(0, 0, compW, compH)

  const meta: TileMeta[] = []
  tiles.forEach((t, i) => {
    const col = i % GRID_COLS
    const row = Math.floor(i / GRID_COLS)
    const x = TILE_PADDING + col * (TILE_SIZE + TILE_PADDING)
    const y = TILE_PADDING + row * (tileTotalH + TILE_PADDING)
    // White card under each tile so the label area has contrast.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x, y, TILE_SIZE, tileTotalH)
    ctx.drawImage(t.canvas, x, y)
    meta.push({ type: t.type, col, row, x, y })
  })

  return { canvas, meta }
}

/* ───────────────────────── Public API ───────────────────────── */

/**
 * Get a reference grid for the given content types, building it if necessary.
 * Fetches all keyline rows in parallel and renders the composite client-side.
 *
 * @param types  Content type names (from the page's CONTENT_TYPE_OPTIONS)
 * @param grain  Grain orientation for the keyline fetch (usually 'With Grain')
 * @param session  NextAuth session for the keyline API calls
 */
export async function getReferenceGrid(
  types: string[],
  grain: string,
  session: any,
): Promise<ReferenceGrid> {
  const hash = await hashInputs(types, REFERENCE_DIMS)

  const cached = await idbGet(hash)
  if (cached) return cached

  // Fetch all types in parallel — individual failures don't abort the build.
  const fetched = await Promise.all(
    types.map(async type => {
      try {
        const resp = await PlanWindowAPI.getKeylineCoordinates(type, grain, session)
        if (resp.success && Array.isArray(resp.data) && resp.data.length > 0) {
          return { type, rows: resp.data as KeylineRow[] }
        }
        return { type, rows: [] as KeylineRow[] }
      } catch {
        return { type, rows: [] as KeylineRow[] }
      }
    }),
  )

  // Render every type's tile; capture individual thumbs for pass-2 use.
  const tileCanvases: { type: string; canvas: HTMLCanvasElement }[] = []
  const thumbs: Record<string, string> = {}
  for (const { type, rows } of fetched) {
    let segments: Segment[] = []
    try { segments = rowsToSegments(rows, REFERENCE_DIMS) } catch { /* leave empty */ }
    const tile = renderTileToCanvas(segments, type)
    tileCanvases.push({ type, canvas: tile })
    thumbs[type] = tile.toDataURL('image/png')
  }

  const { canvas: comp, meta } = compositeTiles(tileCanvases)
  const dataUrl = comp.toDataURL('image/png')
  const base64 = dataUrl.split(',', 2)[1] || ''

  const grid: ReferenceGrid = { dataUrl, base64, tiles: meta, thumbs, hash }
  await idbSet(hash, grid)
  return grid
}

/** Invalidate any cached grids — useful for a manual "rebuild reference" UI button. */
export async function clearReferenceGridCache(): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      tx.objectStore(IDB_STORE).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    /* ignore */
  }
}
