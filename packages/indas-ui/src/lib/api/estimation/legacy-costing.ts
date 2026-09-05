// Legacy Costing Integration (Estimation module)
// First consumer of the generic module integration proxy — see
// src/lib/api/integration/proxy.ts. All API-specific details (URL template,
// credentials) live in IntegrationConfig rows under IntegrationCode='LegacyCosting',
// owned by the Estimation module (ModuleName='/costing/estimation').

import { callIntegrationProxyAPI } from '../integration/proxy'

export const LEGACY_COSTING_CODE = 'LegacyCosting'

/**
 * Row shape returned by the external legacy software — passed through as-is.
 * All numerics arrive as strings; `rate` is absent on some rows; `job_date`
 * can be "NaN/NaN/NaN".
 */
export interface LegacyCostingJob {
  job_no: string
  job_date: string | null
  job_design: string | null
  customer_name: string | null
  product_name: string | null
  product_code: string | null
  VARNISH: string | null
  leaf: string | null
  emboss: string | null
  braille: string | null
  lamination: string | null
  qty: string | null
  rate?: string | null
  actul_h: string | null
  actul_w: string | null
  actul_l: string | null
  UPS: string | null
  GSM: string | null
  dieno: string | null
  dsignstyl: string | null
  cutsz_l: string | null
  cutsz_w: string | null
  board: string | null
}

export interface LegacyCostingResult {
  success: boolean
  rows: LegacyCostingJob[]
  /** True when the API responded but had no matching record (not a failure). */
  notFound?: boolean
  /** The API's own message (e.g. "Job not found") when notFound. */
  message?: string
  error?: string
}

/**
 * Unwrap the legacy costing response. The upstream API can return:
 *   • an array of jobs                              → rows
 *   • { data: [...] }                               → rows
 *   • { success:false, message:"Job not found" }    → NOT-FOUND (empty, friendly)
 *   • a proxy-level 404 / "not found" error string  → NOT-FOUND
 * "Not found" is a valid empty result, NOT a failure — surface it as notFound
 * with the API's own message so the UI shows a friendly note, not a raw error.
 */
function toResult(result: { success: boolean; payload: any; error?: string }): LegacyCostingResult {
  if (!result.success) {
    const err = String(result.error || '')
    if (/\b404\b|not\s*found/i.test(err)) {
      return { success: true, rows: [], notFound: true, message: 'Job not found' }
    }
    return { success: false, rows: [], error: err || 'Request failed' }
  }
  const payload = result.payload
  // Array of jobs.
  if (Array.isArray(payload)) return { success: true, rows: payload, notFound: payload.length === 0 }
  if (payload && typeof payload === 'object') {
    // The API's own { success:false, message } not-found body.
    if (payload.success === false) {
      return { success: true, rows: [], notFound: true, message: String(payload.message || 'Job not found') }
    }
    if (Array.isArray(payload.data)) {
      return { success: true, rows: payload.data, notFound: payload.data.length === 0 }
    }
  }
  return { success: false, rows: [], error: 'Unexpected response from legacy costing API' }
}

export async function getLegacyCostingByJobCardAPI(
  jobCard: string,
  session: any
): Promise<LegacyCostingResult> {
  return toResult(await callIntegrationProxyAPI(LEGACY_COSTING_CODE, { jobCard }, session))
}

export async function getLegacyCostingBySizeAPI(
  l: number,
  w: number,
  h: number,
  session: any
): Promise<LegacyCostingResult> {
  return toResult(await callIntegrationProxyAPI(LEGACY_COSTING_CODE, { l, w, h }, session))
}
