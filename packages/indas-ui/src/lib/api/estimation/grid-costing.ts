// Grid Costing API
// Uses direct fetch for file upload (multipart/form-data)
// Uses APIClient for JSON endpoints (save/load)

import APIClient, { handleSessionExpired } from '../core/client'
import { buildAPIURL } from '../core/config'
import type { APIResponse } from '../core/types'

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
  sheetSizeL?: string
  sheetSizeW?: string
  noOfUps: string
  opening: string
  pasting: string
  bottom: string
  bottomFlapPer?: string
  tongueHeight?: string
  flapHeight?: string
  corrugation: string
  paperQuality: PaperQualityDto[]
  frontColors: string
  backColors: string
  specialFrontColor?: string
  specialBackColor?: string
  machine: string
  asPerBid: string
  variants: string
  variablePrinting: string
  wastageType: string
  materials: Record<string, string>
  revisedMOQ: string
  remark: string
  /**
   * Process matrix from the import template: header (process name) → cell value
   * (Yes/No). A process applies to this job when its value is Yes/1/true.
   * Resolved to selectedProcesses on map.
   */
  processMatrix?: Record<string, string>
  /**
   * Material matrix from the import template: header "Process :: Material" →
   * cell value (Yes/No). A material is pre-ticked under its process when the
   * value is Yes/1/true. Resolved to selectedProcesses[].Items on map.
   */
  materialMatrix?: Record<string, string>
  /**
   * Corrugation spec from the import template: ply count + ONE shared flute spec
   * + ONE shared liner spec (top sheet = the main paper). The page expands this
   * into the full alternating ply array → CorrugationPlyData JSON at cost time.
   */
  corrugationSpec?: CorrugationSpecDto
  remarks: TransformerRemarkDto[]
}

/** Shared corrugation spec: ply count + one flute + one liner spec. */
export interface CorrugationSpecDto {
  noOfPly: number
  flute: { fluteName: string; quality: string; gsm: number; bf: number }
  liner: { quality: string; gsm: number; bf: number }
}

export interface PaperQualityDto {
  type: string
  board: string
  gsm: string
  mill: string
  rate: string
  finish?: string
  brand?: string
  bf?: string
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

    const url = buildAPIURL('/api/grid-costing/import')
    if (!url) {
      return { success: false, error: 'API configuration not set. Please configure the API connection.' }
    }

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
  return APIClient.post('/api/grid-costing/save', payload, session)
}

// ─── Load list: JSON via APIClient ────────────────────────────────────

export async function getGridCostingList(
  session: any
): Promise<APIResponse<any[]>> {
  return APIClient.get('/api/grid-costing', session)
}

// ─── Load by ID: JSON via APIClient ───────────────────────────────────

export async function getGridCostingById(
  id: number,
  session: any
): Promise<APIResponse<any>> {
  return APIClient.get(`/api/grid-costing/${id}`, session)
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
  return APIClient.post('/api/grid-costing/calculate', { payload }, session)
}

/** Calculate costing for multiple rows in parallel (backend batches up to 10 concurrent) */
export async function calculateGridCostingBatch(
  rows: Record<string, any>[],
  session: any
): Promise<APIResponse<BatchResultItem[]>> {
  return APIClient.post('/api/grid-costing/calculate-batch', { rows }, session)
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
  NoOfUps: number
  WastagePercent?: number
  CutSize?: string
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
  ProcessCosts?: BulkCostingProcessCost[]
  // Raw amounts (NOT per-1000); grid scales by TypeOfCost using CostQuantity.
  PlateAmount?: number
  PrintingAmount?: number
  MakeReadyAmount?: number
  CostQuantity?: number
  // Printing impression detail from the winning plan row (same source as
  // estimation's Cost Breakdown "Printing Imp'n" row). Raw values, not scaled.
  ImpressionsToBeCharged?: number
  PrintingRate?: number
  /** Rate per plate from the winning plan row. */
  PlateRate?: number
  // Costing Rates (ShivOffset detail-costing sheet), both per 1000:
  // FirstRate = grand total w/ development charges; SecondRate = TotalCost per 1000.
  FirstRate?: number
  SecondRate?: number
}

// Per-process cost from the costing result (TblOperations), pivoted into one grid
// column per process when the company config opts into "ProcessBreakup".
export interface BulkCostingProcessCost {
  ProcessID: number
  ProcessName: string
  DepartmentID: number
  ProcessCost: number
  /** Process rate from TblOperations (first non-zero row). */
  Rate?: number
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

// ─── Preview (full per-job detail) ────────────────────────────────────
// Returns the complete Shirin_Job result blob for each job (paginated), used
// to render the full estimation cost-breakdown for a single job on demand.

export interface BulkCostingPreviewRow {
  JobIndex: number
  Status: 'Success' | 'Error'
  /** Full Shirin_Job result — TblPlanning, TblOperations, CostingData, etc. */
  Result?: Record<string, any>
  Error?: string
}

export interface BulkCostingPreviewResponse {
  page: number
  pageSize: number
  total: number
  rows: BulkCostingPreviewRow[]
}

export async function getBulkCostingPreview(
  jobId: string,
  session: any,
  page = 1,
  pageSize = 20,
): Promise<APIResponse<BulkCostingPreviewResponse>> {
  return APIClient.get(
    `api/BulkCosting/${jobId}/preview?page=${page}&pageSize=${pageSize}`,
    session,
  )
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
  return APIClient.post('/api/grid-costing/validate-batch', { rows }, session)
}

/** Delete a saved grid costing session */
export async function deleteGridCosting(
  id: number,
  session: any
): Promise<APIResponse<{ Message: string }>> {
  return APIClient.post('/api/grid-costing/delete', { sessionID: id }, session)
}
