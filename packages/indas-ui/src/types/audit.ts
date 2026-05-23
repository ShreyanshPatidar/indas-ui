/**
 * Audit Logging Types
 *
 * Enums + backend request/response types.
 * No intermediate "BusinessAuditLog" — callers build BackendAuditLogRequest directly.
 */

export enum AuditModule {
  ESTIMATION = 'Estimation',
  QUOTATION = 'Quotation',
  MASTER_DATA = 'Master Data',
  PLANNING = 'Planning',
  PROCESS = 'Process',
  MATERIAL = 'Material',
  MACHINE = 'Machine',
  APPROVAL = 'Approval',
  USER_MANAGEMENT = 'User Management',
  SETTINGS = 'Settings'
}

export enum AuditAction {
  CREATE = 'Create',
  READ = 'Read',
  UPDATE = 'Update',
  DELETE = 'Delete',
  EXPORT = 'Export',
  IMPORT = 'Import',
  PRINT = 'Print',
  DUPLICATE = 'Duplicate',
  APPROVE = 'Approve',
  REJECT = 'Reject',
  ESCALATE = 'Escalate',
  DELEGATE = 'Delegate',
  REQUEST_APPROVAL = 'Request Approval',
  WITHDRAW_APPROVAL = 'Withdraw Approval',
  APPLY_PLANNING = 'Apply Planning',
  MODIFY_PLANNING = 'Modify Planning',
  CLEAR_PLANNING = 'Clear Planning',
  ADD_CONTENT = 'Add Content',
  REMOVE_CONTENT = 'Remove Content',
  MODIFY_CONTENT = 'Modify Content',
  SELECT_PROCESS = 'Select Process',
  DESELECT_PROCESS = 'Deselect Process',
  MODIFY_PROCESS = 'Modify Process'
}

/**
 * POST /api/auditlog request body
 */
export interface BackendAuditLogRequest {
  Event: string
  Username?: string
  UserID?: string
  CompanyID?: string
  IPAddress?: string
  UserAgent?: string
  Success?: boolean
  ErrorMessage?: string
  Metadata?: Record<string, any>
  Module?: string
  Action?: string
  DocumentName?: string
  DocumentID?: string
  Comments?: string
}

/**
 * GET /api/auditlog/recent response row
 */
export interface BackendAuditLogResponse {
  AuditLogID: number
  Timestamp: Date | string
  Event: string
  Username?: string
  UserID?: string
  CompanyID?: string
  IPAddress?: string
  UserAgent?: string
  Success?: boolean
  ErrorMessage?: string
  Metadata?: string
  Module?: string
  Action?: string
  DocumentName?: string
  DocumentID?: string
  Comments?: string
  DisplayTime?: string
  DisplayEvent?: string
  Browser?: string
}
