/**
 * Audit Log Trigger Helpers
 *
 * Fire-and-forget functions that log business actions after events.
 * These NEVER block the calling flow — errors are silently swallowed.
 *
 * Usage:
 *   import { logQuotationApproved, logMasterCrud } from '@/lib/api/activity/audit/send'
 *   logQuotationApproved({ bookingNo: 'BK-001', ... }, session)
 */

import { AuditModule, AuditAction } from '@/types/audit'

/**
 * Resolve the current page's ModuleDisplayName from the navigation cache in localStorage.
 * Falls back to the enum value if no match is found.
 */
function resolveModuleDisplayName(enumValue: string): string {
  try {
    if (typeof window === 'undefined') return enumValue
    const pathname = window.location.pathname

    // Find the navigation cache key (navigation_{companyId}_{userId})
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith('navigation_') || key.endsWith('_time')) continue
      const cached = localStorage.getItem(key)
      if (!cached) continue
      const groups = JSON.parse(cached)
      for (const group of groups) {
        for (const mod of group.modules || []) {
          const modPath = mod.ModuleName?.startsWith('/') ? mod.ModuleName : `/${(mod.ModuleName || '').toLowerCase().trim().replace(/\s+/g, '-')}`
          if (pathname.startsWith(modPath)) return mod.ModuleDisplayName || enumValue
          for (const child of mod.children || []) {
            const childPath = child.ModuleName?.startsWith('/') ? child.ModuleName : `/${(child.ModuleName || '').toLowerCase().trim().replace(/\s+/g, '-')}`
            if (pathname.startsWith(childPath)) return child.ModuleDisplayName || enumValue
          }
        }
      }
      break // Only check first matching cache entry
    }
  } catch { /* silent */ }
  return enumValue
}

/**
 * Fire-and-forget: POST directly to backend with all required headers.
 * Bypasses APIClient to avoid config/init issues — audit must never block.
 */
function fireAudit(
  fields: {
    module: string
    action: string
    documentName: string
    documentId?: number
    metadata?: Record<string, any>
    comments?: string
  },
  session: any
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ''
    const companyId = (session?.user?.CompanyID || session?.user?.companyID || '0').toString()
    const userId = (session?.user?.UserID || session?.user?.userID || '0').toString()
    const productionUnitId = (session?.user?.ProductionUnitID || session?.user?.productionUnitID || '0').toString()
    const fYear = (session?.user?.FYear || session?.user?.fYear || '').toString()
    const companyUsername = session?.user?.companyUsername || ''
    const companyPassword = session?.user?.companyPassword || ''
    let basicAuth = ''
    if (companyUsername && companyPassword) {
      try {
        basicAuth = 'Basic ' + btoa(unescape(encodeURIComponent(`${companyUsername}:${companyPassword}`)))
      } catch {
        basicAuth = ''
      }
    }

    const body = JSON.stringify({
      Event: 'BUSINESS_ACTION',
      Username: session?.user?.UserName || '',
      UserID: userId,
      CompanyID: companyId,
      UserAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      Success: true,
      Module: resolveModuleDisplayName(fields.module),
      Action: fields.action,
      DocumentName: fields.documentName,
      DocumentID: fields.documentId?.toString(),
      Comments: fields.comments,
      Metadata: fields.metadata && Object.keys(fields.metadata).length > 0 ? fields.metadata : undefined,
    })

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'CompanyID': companyId,
      'UserID': userId,
      'ProductionUnitID': productionUnitId,
      'FYear': fYear,
    }
    if (basicAuth) headers['Authorization'] = basicAuth

    fetch(`${baseUrl}/api/auditlog`, { method: 'POST', headers, body }).catch(() => {
      // Silent — audit failure must never break business flows
    })
  } catch {
    // Silent
  }
}

// ─── Estimation ──────────────────────────────────────────────────────────

interface EstimationParams {
  bookingNo?: string
  bookingId?: string | number
  jobName?: string
  clientName?: string
  actorUserName: string
}

export function logEstimationCreated(params: EstimationParams, session: any) {
  fireAudit({
    module: AuditModule.ESTIMATION,
    action: AuditAction.CREATE,
    documentName: 'Estimation',
    documentId: params.bookingId ? Number(params.bookingId) : undefined,
    metadata: { bookingNo: params.bookingNo, jobName: params.jobName, clientName: params.clientName },
    comments: `Created estimation ${params.bookingNo || ''} — ${params.jobName || ''}`
  }, session)
}

export function logEstimationUpdated(params: EstimationParams & { changes?: string }, session: any) {
  fireAudit({
    module: AuditModule.ESTIMATION,
    action: AuditAction.UPDATE,
    documentName: 'Estimation',
    documentId: params.bookingId ? Number(params.bookingId) : undefined,
    metadata: { bookingNo: params.bookingNo, jobName: params.jobName, clientName: params.clientName, changes: params.changes },
    comments: `Updated estimation ${params.bookingNo || ''}`
  }, session)
}

export function logEstimationDeleted(params: EstimationParams, session: any) {
  fireAudit({
    module: AuditModule.ESTIMATION,
    action: AuditAction.DELETE,
    documentName: 'Estimation',
    documentId: params.bookingId ? Number(params.bookingId) : undefined,
    metadata: { bookingNo: params.bookingNo, jobName: params.jobName, clientName: params.clientName },
    comments: `Deleted estimation ${params.bookingNo || ''}`
  }, session)
}

// ─── Planning ────────────────────────────────────────────────────────────

interface PlanningParams {
  bookingNo?: string
  bookingId?: string | number
  columnId?: number
  machineName?: string
  actorUserName: string
}

export function logPlanningApplied(params: PlanningParams, session: any) {
  fireAudit({
    module: AuditModule.PLANNING,
    action: AuditAction.APPLY_PLANNING,
    documentName: 'Planning',
    documentId: params.bookingId ? Number(params.bookingId) : undefined,
    metadata: { bookingNo: params.bookingNo, columnId: params.columnId, machineName: params.machineName },
    comments: `Applied planning for ${params.bookingNo || ''} col ${params.columnId || ''}`
  }, session)
}

export function logPlanningCleared(params: PlanningParams, session: any) {
  fireAudit({
    module: AuditModule.PLANNING,
    action: AuditAction.CLEAR_PLANNING,
    documentName: 'Planning',
    documentId: params.bookingId ? Number(params.bookingId) : undefined,
    metadata: { bookingNo: params.bookingNo, columnId: params.columnId },
    comments: `Cleared planning for ${params.bookingNo || ''} col ${params.columnId || ''}`
  }, session)
}

// ─── Material Costing ────────────────────────────────────────────────────

interface MaterialCostingParams {
  bookingNo?: string
  bookingId?: string | number
  columnId?: number
  materialCount?: number
  actorUserName: string
}

export function logMaterialCostingSaved(params: MaterialCostingParams, session: any) {
  fireAudit({
    module: AuditModule.MATERIAL,
    action: AuditAction.UPDATE,
    documentName: 'MaterialCosting',
    documentId: params.bookingId ? Number(params.bookingId) : undefined,
    metadata: { bookingNo: params.bookingNo, columnId: params.columnId, materialCount: params.materialCount },
    comments: `Saved material costing for ${params.bookingNo || ''} col ${params.columnId || ''} (${params.materialCount || 0} materials)`
  }, session)
}

// ─── Quotation / Approval ────────────────────────────────────────────────

interface QuotationParams {
  bookingNo: string
  bookingId: string | number
  actorUserName: string
  remarks?: string
}

export function logQuotationSaved(params: QuotationParams, session: any) {
  fireAudit({
    module: AuditModule.QUOTATION,
    action: AuditAction.CREATE,
    documentName: 'Quotation',
    documentId: Number(params.bookingId),
    metadata: { bookingNo: params.bookingNo, remarks: params.remarks },
    comments: `Saved quotation ${params.bookingNo}`
  }, session)
}

export function logQuotationApproved(params: QuotationParams, session: any) {
  fireAudit({
    module: AuditModule.APPROVAL,
    action: AuditAction.APPROVE,
    documentName: 'Quotation',
    documentId: Number(params.bookingId),
    metadata: { bookingNo: params.bookingNo, remarks: params.remarks },
    comments: `Approved quotation ${params.bookingNo}${params.remarks ? ` — ${params.remarks}` : ''}`
  }, session)
}

export function logQuotationRejected(params: QuotationParams, session: any) {
  fireAudit({
    module: AuditModule.APPROVAL,
    action: AuditAction.REJECT,
    documentName: 'Quotation',
    documentId: Number(params.bookingId),
    metadata: { bookingNo: params.bookingNo, remarks: params.remarks },
    comments: `Rejected quotation ${params.bookingNo}${params.remarks ? ` — ${params.remarks}` : ''}`
  }, session)
}

export function logQuotationDeleted(params: QuotationParams, session: any) {
  fireAudit({
    module: AuditModule.QUOTATION,
    action: AuditAction.DELETE,
    documentName: 'Quotation',
    documentId: Number(params.bookingId),
    metadata: { bookingNo: params.bookingNo },
    comments: `Deleted quotation ${params.bookingNo}`
  }, session)
}

// ─── Enquiry ─────────────────────────────────────────────────────────────

interface EnquiryParams {
  enquiryId: number
  enquiryNo: string
  jobName?: string
  clientName?: string
  actorUserName: string
}

export function logEnquiryCreated(params: EnquiryParams, session: any) {
  fireAudit({
    module: 'Enquiry',
    action: AuditAction.CREATE,
    documentName: 'Enquiry',
    documentId: params.enquiryId,
    metadata: { enquiryNo: params.enquiryNo, jobName: params.jobName, clientName: params.clientName },
    comments: `Created enquiry ${params.enquiryNo} — ${params.jobName || ''}`
  }, session)
}

export function logEnquiryUpdated(params: EnquiryParams, session: any) {
  fireAudit({
    module: 'Enquiry',
    action: AuditAction.UPDATE,
    documentName: 'Enquiry',
    documentId: params.enquiryId,
    metadata: { enquiryNo: params.enquiryNo, jobName: params.jobName, clientName: params.clientName },
    comments: `Updated enquiry ${params.enquiryNo}`
  }, session)
}

export function logEnquiryDeleted(params: EnquiryParams, session: any) {
  fireAudit({
    module: 'Enquiry',
    action: AuditAction.DELETE,
    documentName: 'Enquiry',
    documentId: params.enquiryId,
    metadata: { enquiryNo: params.enquiryNo },
    comments: `Deleted enquiry ${params.enquiryNo}`
  }, session)
}

export function logEnquiryConverted(params: EnquiryParams, session: any) {
  fireAudit({
    module: 'Enquiry',
    action: AuditAction.EXPORT,
    documentName: 'Enquiry',
    documentId: params.enquiryId,
    metadata: { enquiryNo: params.enquiryNo, jobName: params.jobName, clientName: params.clientName },
    comments: `Converted enquiry ${params.enquiryNo} to estimation`
  }, session)
}

// ─── Master Data CRUD ────────────────────────────────────────────────────

interface MasterCrudParams {
  masterType: string
  action: 'create' | 'update' | 'delete'
  documentId?: number
  entityName?: string
  entityCode?: string
  actorUserName: string
}

export function logMasterCrud(params: MasterCrudParams, session: any) {
  const actionMap: Record<string, AuditAction> = {
    create: AuditAction.CREATE,
    update: AuditAction.UPDATE,
    delete: AuditAction.DELETE
  }
  const verb = params.action === 'create' ? 'Created' : params.action === 'update' ? 'Updated' : 'Deleted'

  fireAudit({
    module: AuditModule.MASTER_DATA,
    action: actionMap[params.action],
    documentName: params.masterType,
    documentId: params.documentId,
    metadata: { masterType: params.masterType, entityName: params.entityName, entityCode: params.entityCode },
    comments: `${verb} ${params.masterType}: ${params.entityName || params.entityCode || params.documentId || ''}`
  }, session)
}

// ─── Process Selection ───────────────────────────────────────────────────

interface ProcessParams {
  bookingNo?: string
  bookingId?: string | number
  processName: string
  processId: number
  actorUserName: string
}

export function logProcessSelected(params: ProcessParams, session: any) {
  fireAudit({
    module: AuditModule.PROCESS,
    action: AuditAction.SELECT_PROCESS,
    documentName: 'Process',
    documentId: params.processId,
    metadata: { bookingNo: params.bookingNo, processName: params.processName },
    comments: `Selected process "${params.processName}" for ${params.bookingNo || ''}`
  }, session)
}

// ─── Price Approval ──────────────────────────────────────────────────────

interface PriceApprovalParams {
  bookingNo: string
  bookingId: string | number
  quotedCost?: number
  finalCost?: number
  actorUserName: string
  remarks?: string
}

export function logPriceApprovalSaved(params: PriceApprovalParams, session: any) {
  fireAudit({
    module: AuditModule.APPROVAL,
    action: AuditAction.CREATE,
    documentName: 'PriceApproval',
    documentId: Number(params.bookingId),
    metadata: { bookingNo: params.bookingNo, quotedCost: params.quotedCost, finalCost: params.finalCost, remarks: params.remarks },
    comments: `Price approval saved for ${params.bookingNo}`
  }, session)
}

export function logPriceApprovalDeleted(params: { bookingNo: string; bookingId: string | number; actorUserName: string }, session: any) {
  fireAudit({
    module: AuditModule.APPROVAL,
    action: AuditAction.DELETE,
    documentName: 'PriceApproval',
    documentId: Number(params.bookingId),
    metadata: { bookingNo: params.bookingNo },
    comments: `Price approval deleted for ${params.bookingNo}`
  }, session)
}

// ─── Settings ────────────────────────────────────────────────────────────

export function logSettingsChanged(params: { settingName: string; oldValue?: any; newValue?: any; actorUserName: string }, session: any) {
  fireAudit({
    module: AuditModule.SETTINGS,
    action: AuditAction.UPDATE,
    documentName: 'Settings',
    metadata: { settingName: params.settingName, oldValue: params.oldValue, newValue: params.newValue },
    comments: `Changed setting: ${params.settingName}`
  }, session)
}

// ─── Grid Costing ───────────────────────────────────────────────────────

export function logGridCostingImported(params: { rowCount: number; actorUserName: string }, session: any) {
  fireAudit({
    module: 'Grid Costing',
    action: AuditAction.IMPORT,
    documentName: 'Grid Costing',
    metadata: { rowCount: params.rowCount },
    comments: `Imported ${params.rowCount} grid costing rows`
  }, session)
}

export function logGridCostingSaved(params: { actorUserName: string; rowCount?: number }, session: any) {
  fireAudit({
    module: 'Grid Costing',
    action: AuditAction.UPDATE,
    documentName: 'Grid Costing',
    metadata: { rowCount: params.rowCount },
    comments: `Saved grid costing (${params.rowCount || 0} rows)`
  }, session)
}

// ─── Rate Enquiry ───────────────────────────────────────────────────────

export function logRateEnquiryCreated(params: { requestNumber?: string; actorUserName: string }, session: any) {
  fireAudit({
    module: 'Rate Enquiry',
    action: AuditAction.CREATE,
    documentName: 'Rate Enquiry',
    metadata: { requestNumber: params.requestNumber },
    comments: `Created rate enquiry ${params.requestNumber || ''}`
  }, session)
}

export function logRateProvided(params: { requestId: number; requestNumber?: string; actorUserName: string }, session: any) {
  fireAudit({
    module: 'Rate Enquiry',
    action: AuditAction.UPDATE,
    documentName: 'Rate Enquiry',
    documentId: params.requestId,
    metadata: { requestNumber: params.requestNumber },
    comments: `Provided rate for ${params.requestNumber || params.requestId}`
  }, session)
}

// ─── Company Master ─────────────────────────────────────────────────────

export function logCompanyCrud(params: { entityType: string; action: 'create' | 'update' | 'delete'; entityName?: string; documentId?: number; actorUserName: string }, session: any) {
  const actionMap: Record<string, AuditAction> = { create: AuditAction.CREATE, update: AuditAction.UPDATE, delete: AuditAction.DELETE }
  const verb = params.action === 'create' ? 'Created' : params.action === 'update' ? 'Updated' : 'Deleted'
  fireAudit({
    module: 'Company',
    action: actionMap[params.action],
    documentName: params.entityType,
    documentId: params.documentId,
    metadata: { entityType: params.entityType, entityName: params.entityName },
    comments: `${verb} ${params.entityType}: ${params.entityName || params.documentId || ''}`
  }, session)
}

// ─── Rate Settings ──────────────────────────────────────────────────────

export function logRateSettingsUpdated(params: { settingType: string; itemCount?: number; actorUserName: string }, session: any) {
  fireAudit({
    module: 'Rate Settings',
    action: AuditAction.UPDATE,
    documentName: params.settingType,
    metadata: { settingType: params.settingType, itemCount: params.itemCount },
    comments: `Updated ${params.settingType} (${params.itemCount || 0} items)`
  }, session)
}

export function logRateSettingsImported(params: { settingType: string; itemCount?: number; actorUserName: string }, session: any) {
  fireAudit({
    module: 'Rate Settings',
    action: AuditAction.IMPORT,
    documentName: params.settingType,
    metadata: { settingType: params.settingType, itemCount: params.itemCount },
    comments: `Imported ${params.settingType} (${params.itemCount || 0} items)`
  }, session)
}

// ─── Quotation Mail ─────────────────────────────────────────────────────

export function logQuotationMailSent(params: { bookingNo: string; bookingId: string | number; emailTo: string; actorUserName: string }, session: any) {
  fireAudit({
    module: AuditModule.QUOTATION,
    action: AuditAction.PRINT,
    documentName: 'Quotation Mail',
    documentId: Number(params.bookingId),
    metadata: { bookingNo: params.bookingNo, emailTo: params.emailTo },
    comments: `Sent quotation mail ${params.bookingNo} to ${params.emailTo}`
  }, session)
}
