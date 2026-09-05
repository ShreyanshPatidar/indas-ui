/**
 * Activity API Module
 * Exports audit logs, email, and notifications functionality
 */

// Audit logs
export { AuditAPI, BusinessAuditAPI } from './audit'
export * from './audit/send'

// Remarks (remark intelligence / trail)
export { RemarkIntelligenceAPI } from './remarks'
export type { RemarkEntry, RemarkRow, RemarkSavePayload, RemarkSummary } from './remarks'

// Email
export * from './email'

// Notifications
export { NotificationsAPI } from './notifications'
export {
  notifyApprovalStatusChanged,
  notifyEnquiryConverted,
  notifyQuotationSaved,
  notifyQuotationMailSent,
  notifyQuotationDeleted,
  notifyEnquiryCreated,
  notifyEnquiryAssigned,
  notifyEnquiryUpdated,
  notifyEnquiryDeleted,
  notifyUserCrud,
  notifyPasswordChanged,
  notifyMasterCrud
} from './notifications'
export type {
  NotificationRequest,
  NotificationResponse,
  NotificationFilters,
  NotificationType,
  NotificationModule,
  NotificationPriority,
  NotificationCategory
} from './notifications'
