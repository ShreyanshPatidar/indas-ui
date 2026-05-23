// Grid Costing API
// Uses direct fetch for file upload (multipart/form-data)
// Uses APIClient for JSON endpoints (save/load)

import APIClient, { handleSessionExpired } from '../core/client'
import type { APIResponse } from '../core/types'

const getBaseURL = () =>
  process.env.NEXT_PUBLIC_API_BASE_URL_NEW || ''

// ─── Types (match backend JSON — Newtonsoft camelCase serialization) ───

export interface GridCostingImportResult {
  rows: GridCostingRowDto[]
  materialColumns: MaterialColumnDto[]
  remarks: TransformerRemarkDto[]
  unmappedHeaders: string[]
  totalRowsParsed: number
  headerRowIndex: number
  // Parser debug info — shows how each column was matched
  mappedHeaders: Record<string, string>   // raw header → "fieldName (alias|smart)"
  ignoredHeaders: string[]                // calculated field headers that were skipped
  // Full column map for mapping review UI
  columnMap: ColumnMappingDto[]
}

export interface ColumnMappingDto {
  colIndex: number
  rawHeader: string
  /** field | paperQuality | material | ignored | unmapped */
  classification: string
  /** Assigned field name (e.g. "clientName") or null */
  fieldName: string | null
  /** How matched: "alias" | "smart" | "data" | "user" | null */
  matchMethod: string | null
  /** For paperQuality columns only: 0 = Board, 1 = Kraft, 2 = Liner */
  pqGroupIndex?: number
  /** Sample values from first few data rows */
  sampleValues: string[]
}

export interface GridCostingRowDto {
  // Input fields only — calculated fields (Board Kgs, PKR, PSR, etc.)
  // are computed by estimation APIs on the frontend, not parsed from Excel.
  srNo: number
  status: string
  projectNo: string
  quoteBookingId: string
  productionUnit: string
  salesPerson: string
  clientName: string
  consignee: string
  deliveryLocation: string
  category: string
  contentType: string
  jobName: string
  quantity: string
  annualQuantity: string
  length: string
  width: string
  height: string
  noOfUps: string
  opening: string
  pasting: string
  bottom: string
  corrugation: string
  paperQuality: PaperQualityDto[]
  frontColors: string
  backColors: string
  machine: string
  asPerBid: string
  variants: string
  variablePrinting: string
  wastageType: string
  materials: Record<string, string>
  revisedMOQ: string
  remark: string
  remarks: TransformerRemarkDto[]
}

export interface PaperQualityDto {
  type: string
  board: string
  gsm: string
  mill: string
  rate: string
}

export interface MaterialColumnDto {
  id: string
  name: string
  rate: string
}

export interface TransformerRemarkDto {
  field: string
  message: string
  severity: string
}

// ─── Import: file upload via direct fetch ─────────────────────────────

export async function importGridCostingExcel(
  file: File,
  session: any
): Promise<APIResponse<GridCostingImportResult>> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const baseURL = getBaseURL()
    const url = `${baseURL}/api/grid-costing/import`

    // Build auth headers (same as APIClient)
    const headers: Record<string, string> = {}

    const companyUsername = session?.user?.companyUsername
    const companyPassword = session?.user?.companyPassword
    if (companyUsername && companyPassword) {
      headers['Authorization'] = `Basic ${btoa(`${companyUsername}:${companyPassword}`)}`
    }

    const companyId = session?.user?.CompanyID || session?.user?.companyID
    if (companyId) headers['CompanyID'] = companyId.toString()

    const userId = session?.user?.UserID || session?.user?.userID
    if (userId) headers['UserID'] = userId.toString()

    const productionUnitId = session?.productionUnitId ||
      session?.user?.ProductionUnitID || session?.user?.productionUnitID
    if (productionUnitId) headers['ProductionUnitID'] = productionUnitId.toString()

    const fYear = session?.fYear || session?.user?.FYear || session?.user?.fYear
    if (fYear) headers['FYear'] = fYear

    // No Content-Type — browser sets multipart/form-data with boundary
    // 120s timeout for large Excel files
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      signal: AbortSignal.timeout(120000),
    })

    if (!response.ok) {
      const errorText = await response.text()
      if (response.status === 401 || errorText?.toLowerCase().includes('session not found')) {
        handleSessionExpired()
        return { success: false, error: 'Session expired. Redirecting to login...', status: response.status }
      }
      return { success: false, error: errorText || `Import failed: ${response.status}`, status: response.status }
    }

    const data = await response.json()

    // Backend may return { error: "..." } on validation failure
    if (data.error) {
      return { success: false, error: data.error }
    }

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import Excel file',
    }
  }
}

// ─── Save: JSON via APIClient ─────────────────────────────────────────

export async function saveGridCosting(
  payload: { Rows: any[]; MaterialColumns: any[]; Name?: string },
  session: any
): Promise<APIResponse<{ Message: string; GridCostingID: number; RowCount: number }>> {
  const baseURL = getBaseURL()
  return APIClient.post('/api/grid-costing/save', payload, session, baseURL)
}

// ─── Load list: JSON via APIClient ────────────────────────────────────

export async function getGridCostingList(
  session: any
): Promise<APIResponse<any[]>> {
  const baseURL = getBaseURL()
  return APIClient.get('/api/grid-costing', session, baseURL)
}

// ─── Load by ID: JSON via APIClient ───────────────────────────────────

export async function getGridCostingById(
  id: number,
  session: any
): Promise<APIResponse<any>> {
  const baseURL = getBaseURL()
  return APIClient.get(`/api/grid-costing/${id}`, session, baseURL)
}

// ─── Calculate ────────────────────────────────────────────────────────

export interface GridCostResult {
  sheetSize: string
  noOfUps: number
  noOfSheets: number
  boardKgs: number
  boardRatePerKg: number
  boardValue: number
  exWorks: number
  pkr: number
  psr: number
  totalRMC: number
  rmcPercent: number
  conversionCost: number
  freight: number
  fob: number
  kraftLinerValue: number
  error?: string
}

export interface BatchResultItem {
  rowIndex: number
  result: GridCostResult | null
}

/** Calculate costing for a single row — payload must match Shirin_Job input shape */
export async function calculateGridCosting(
  payload: Record<string, any>,
  session: any
): Promise<APIResponse<GridCostResult>> {
  const baseURL = getBaseURL()
  return APIClient.post('/api/grid-costing/calculate', { payload }, session, baseURL)
}

/** Calculate costing for multiple rows in parallel (backend batches up to 10 concurrent) */
export async function calculateGridCostingBatch(
  rows: Record<string, any>[],
  session: any
): Promise<APIResponse<BatchResultItem[]>> {
  const baseURL = getBaseURL()
  return APIClient.post('/api/grid-costing/calculate-batch', { rows }, session, baseURL)
}

// ─── BulkShirinJob API (planwindow) ──────────────────────────────────

/** Full result tables from BulkShirinJob — cached per row for later save */
export interface BulkShirinJobResult {
  TblBooking: Record<string, any>[]
  TblPlanning: Record<string, any>[]
  TblOperations: Record<string, any>[]
  TblAllocatedMaterials: Record<string, any>[]
  TblMaterialCostParams: Record<string, any>[]
  TblContentSpecData: Record<string, any>[]
  CostingData: Record<string, any>[]
  TblDeliverySpecData: Record<string, any>[]
  TblCorrugationPlyDetails: Record<string, any>[]
}

/** Response item from BulkShirinJob */
export interface BulkShirinJobResultItem {
  JobIndex: number
  Status: 'Success' | 'Error'
  Result?: BulkShirinJobResult
  Error?: string
}

/** Process entry for BulkShirinJob (Case 2 — with materials) */
export interface BulkShirinJobProcess {
  ProcessID: number
  MachineID: number
  Items: { ItemSubGroupID: number; ItemID: number; Rate?: number }[]
}

/** Calculate costing for multiple jobs via BulkShirinJob (planwindow) */
export async function bulkShirinJob(
  jobs: Record<string, any>[],
  session: any
): Promise<APIResponse<BulkShirinJobResultItem[]>> {
  return APIClient.post('api/planwindow/BulkShirinJob', jobs, session)
}

// ─── Bulk Costing API (api/BulkCosting) ──────────────────────────────

export interface BulkCostingStartResponse {
  jobId: string
  status: string
  jobCount: number
}

export interface BulkCostingSummaryRow {
  JobIndex: number
  JobName: string
  Status: 'Success' | 'Error'
  Error: string | null
  BoardKgs: number
  BoardRatePerKg: number
  BoardValue: number
  KraftLinerValue: number
  ExWorks: number
  Profit: number
  Freight: number
  FOB: number
  SheetSize: string
  NoOfSheets: number
  TotalRMC: number
  RMCPercent: number
  ConversionCost: number
  PSR: number
  PKRBefore: number
  PKRAfter: number
  ExistingBefore: number
  ExistingAfter: number
  PriceIncPercent: number
  TotalPriceDcr: number
  RevisedRate: number
  PercentOfDiff: number
}

export interface BulkCostingStatusResponse {
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'saved'
  progress: number
  jobCount: number
  successCount: number
  errorCount: number
  summary?: BulkCostingSummaryRow[]
  errorMessage?: string
}

export async function startBulkCosting(
  jobs: Record<string, any>[],
  session: any,
): Promise<APIResponse<BulkCostingStartResponse>> {
  return APIClient.post('api/BulkCosting/start', jobs, session)
}

export async function getBulkCostingStatus(
  jobId: string,
  session: any,
): Promise<APIResponse<BulkCostingStatusResponse>> {
  return APIClient.get(`api/BulkCosting/${jobId}/status`, session)
}

export interface BulkCostingCombinationItem {
  ItemSubGroupID: number
  ItemSubGroupName?: string
  ItemID: number
  ItemName?: string
  EstimationRate?: number
}

export interface BulkCostingCombinationProcess {
  ProcessID: number
  ProcessName?: string
  MachineID: number
  MachineName?: string
  Items: BulkCostingCombinationItem[]
}

export interface BulkCostingCombinationResponse {
  CategoryID: number
  Processes: BulkCostingCombinationProcess[]
}

export async function getBulkCostingCategoryCombination(
  categoryId: number,
  contentId: number,
  session: any,
  rateTier: 'L1' | 'L2' = 'L1',
): Promise<APIResponse<BulkCostingCombinationResponse>> {
  const tierQuery = rateTier === 'L2' ? '?rateTier=L2' : ''
  return APIClient.get(
    `api/BulkCosting/category/${categoryId}/content/${contentId}/combination${tierQuery}`,
    session,
  )
}

// ─── Async Save Pipeline ──────────────────────────────────────────────
// Saving 150 jobs synchronously was timing out. Save is now async: POST
// /save enqueues a background batch and returns a saveBatchId immediately.
// Frontend polls GET /save/{saveBatchId}/status until completed or failed.

export interface BulkCostingSaveSubmitResponse {
  saveBatchId: string
  status: 'queued'
  totalJobs: number
}

export interface BulkCostingSaveError {
  jobIndex: number
  error: string
}

export interface BulkCostingSaveStatusResponse {
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  totalJobs: number
  savedCount: number
  skippedCount: number
  bookingIds?: (number | string)[]
  errors?: BulkCostingSaveError[]
  errorMessage?: string
  costingJobId: string
}

/**
 * Enqueue an async save batch for a completed bulk-costing job. Returns
 * immediately with a saveBatchId. Use getBulkCostingSaveStatus to poll.
 * Empty body = save all; { jobIndexes: [...] } = save selected jobs only.
 */
export async function saveBulkCosting(
  jobId: string,
  session: any,
  jobIndexes?: number[],
): Promise<APIResponse<BulkCostingSaveSubmitResponse>> {
  const body = jobIndexes && jobIndexes.length > 0 ? { jobIndexes } : {}
  return APIClient.post(`api/BulkCosting/${jobId}/save`, body, session)
}

export async function getBulkCostingSaveStatus(
  saveBatchId: string,
  session: any,
): Promise<APIResponse<BulkCostingSaveStatusResponse>> {
  return APIClient.get(`api/BulkCosting/save/${saveBatchId}/status`, session)
}

// ─── Validate Batch ──────────────────────────────────────────────────

export interface ValidateBatchRowInput {
  rowIndex: number
  customer: string
  category: string
  salesPerson: string
  productionUnit: string
  machine: string
  contentType: string
}

export interface ValidateBatchResolvedIds {
  customer: string
  category: string
  salesPerson: string
  productionUnit: string
  machine: string
  contentName: string
}

export interface ValidateBatchRowResult {
  rowIndex: number
  valid: boolean
  ids: ValidateBatchResolvedIds
  errors: string[]
}

export interface ValidateBatchResponse {
  rows: ValidateBatchRowResult[]
}

/**
 * Validate + resolve import rows in a single round-trip.
 * The backend loads master tables once (filtered by CompanyID) and resolves
 * name → ID in-memory. Returns per-row validity + resolved IDs + error list.
 */
export async function validateBatchAPI(
  rows: ValidateBatchRowInput[],
  session: any,
): Promise<APIResponse<ValidateBatchResponse>> {
  const baseURL = getBaseURL()
  return APIClient.post('/api/grid-costing/validate-batch', { rows }, session, baseURL)
}

/** Delete a saved grid costing session */
export async function deleteGridCosting(
  id: number,
  session: any
): Promise<APIResponse<{ Message: string }>> {
  const baseURL = getBaseURL()
  return APIClient.post('/api/grid-costing/delete', { sessionID: id }, session, baseURL)
}
