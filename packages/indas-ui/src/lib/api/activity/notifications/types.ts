/**
 * Notification Types
 */

export type NotificationType = 'Info' | 'Success' | 'Warning' | 'Error' | 'Approval' | 'System'

export type NotificationModule = 'Estimation' | 'Enquiry' | 'Quotation' | 'Approval' | 'User' | 'System'

export type NotificationPriority = 'Low' | 'Normal' | 'High' | 'Urgent'

export type NotificationCategory = 'Pending' | 'Escalation' | 'Update'

/**
 * Notification request for creating new notifications
 * Maps to NotificationController.NotificationRequest
 */
export interface NotificationRequest {
  title: string
  message?: string
  type?: NotificationType
  module?: NotificationModule
  priority?: NotificationPriority
  targetUserId?: number
  targetUserName?: string
  documentName?: string
  documentId?: number
  documentNo?: string
  actionUrl?: string
  metadata?: Record<string, any>
  category?: NotificationCategory
}

/**
 * Notification response — camelCase frontend format
 * Used by components (useNotifications hook, top-header dropdown, etc.)
 */
export interface NotificationResponse {
  notificationId: number
  title: string
  message?: string
  type: NotificationType
  module?: NotificationModule
  priority: NotificationPriority
  category: NotificationCategory
  UserID?: number
  UserName?: string
  documentName?: string
  DocumentID?: number
  DocumentNo?: string
  actionUrl?: string
  isRead: boolean
  readAt?: string
  CreatedDate?: string
  CreatedBy?: number
  CompanyID?: number
  ProductionUnitID?: number
  metadata?: Record<string, any>
  // Legacy compat — used by existing UI code
  createdAt: string
}

/**
 * Backend notification response — matches DB column names exactly
 * Columns returned by sp_GetNotifications (no aliases)
 *
 * DB Table: [dbo].[Notifications]
 * NotificationID  BIGINT IDENTITY
 * Title           NVARCHAR(255)
 * Message         NVARCHAR(MAX)
 * Type            NVARCHAR(50)
 * Module          NVARCHAR(50)
 * Priority        NVARCHAR(20)
 * UserID          INT              -- target user
 * UserName        NVARCHAR(100)
 * DocumentName    NVARCHAR(50)
 * DocumentID      INT
 * ActionUrl       NVARCHAR(500)
 * IsRead          BIT
 * ReadAt          DATETIME
 * CreatedDate     DATETIME
 * CreatedBy       INT
 * CompanyID       INT
 * ProductionUnitID INT
 * IsDeleted       BIT
 * Metadata        NVARCHAR(MAX)
 */
export interface BackendNotificationResponse {
  NotificationID: number
  Title: string
  Message?: string
  Type: string
  Module?: string
  Priority: string
  UserID?: number
  UserName?: string
  DocumentName?: string
  DocumentID?: number
  DocumentNo?: string
  ActionUrl?: string
  IsRead: boolean
  ReadAt?: string
  CreatedDate: string
  CreatedBy?: number
  CompanyID?: number
  ProductionUnitID?: number
  Metadata?: string
  Category?: string
}

/**
 * Notification filters for fetching
 */
export interface NotificationFilters {
  limit?: number
  unreadOnly?: boolean
  type?: NotificationType
  module?: NotificationModule
  priority?: NotificationPriority
  category?: NotificationCategory
}

/**
 * Convert backend response (PascalCase DB columns) to frontend format
 */
export function fromBackendNotification(backend: BackendNotificationResponse): NotificationResponse {
  let metadata: Record<string, any> | undefined
  if (backend.Metadata) {
    try {
      metadata = JSON.parse(backend.Metadata)
    } catch {
      metadata = undefined
    }
  }

  return {
    notificationId: backend.NotificationID,
    title: backend.Title,
    message: backend.Message,
    type: backend.Type as NotificationType,
    module: backend.Module as NotificationModule | undefined,
    priority: backend.Priority as NotificationPriority,
    category: backend.Category as NotificationCategory,
    UserID: backend.UserID,
    UserName: backend.UserName,
    documentName: backend.DocumentName,
    DocumentID: backend.DocumentID,
    DocumentNo: backend.DocumentNo,
    actionUrl: backend.ActionUrl,
    isRead: backend.IsRead,
    readAt: backend.ReadAt,
    CreatedDate: backend.CreatedDate,
    CreatedBy: backend.CreatedBy,
    CompanyID: backend.CompanyID,
    ProductionUnitID: backend.ProductionUnitID,
    metadata,
    // Legacy compat — UI code reads createdAt
    createdAt: backend.CreatedDate
  }
}

/**
 * Convert frontend request to backend format (for POST /api/notifications)
 */
export function toBackendNotificationRequest(request: NotificationRequest): Record<string, any> {
  return {
    Title: request.title,
    Message: request.message,
    Type: request.type,
    Module: request.module,
    Priority: request.priority,
    TargetUserID: request.targetUserId,
    TargetUserName: request.targetUserName,
    DocumentName: request.documentName,
    DocumentID: request.documentId,
    DocumentNo: request.documentNo,
    ActionUrl: request.actionUrl,
    Metadata: request.metadata,
    Category: request.category
  }
}
