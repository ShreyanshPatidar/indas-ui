/**
 * Notification Trigger Helpers
 *
 * Fire-and-forget functions that send notifications after business events.
 * These NEVER block the calling flow — errors are silently swallowed.
 *
 * Usage:
 *   import { notifyApprovalStatusChanged, notifyEnquiryConverted } from '@/lib/api/activity/notifications/send'
 *   // After successful API response:
 *   notifyApprovalStatusChanged({ ... }, session)
 */

import { NotificationsAPI } from './notifications'
import type { NotificationRequest, NotificationCategory, NotificationType, NotificationPriority } from './types'

/**
 * Fire-and-forget: send a notification without blocking the caller.
 * Uses the default APIClient base URL (api.indusanalytics.co.in).
 */
function fireNotification(request: NotificationRequest, session: any) {
  NotificationsAPI.create(request, session).catch(() => {
    // Silent — notification failure must never break business flows
  })
}

// ─── Approval Flow ───────────────────────────────────────────────────────

interface ApprovalNotificationParams {
  action: 'Approve' | 'Reject' | 'Rework' | 'Pending'
  bookingNo: string
  bookingId: string | number
  /** The user who performed the action */
  actorUserName: string
  /** The user who created/owns the quotation (receives notification) */
  targetUserId?: number
  targetUserName?: string
  remarks?: string
}

const APPROVAL_ACTION_MAP: Record<string, {
  title: (bkNo: string, actor: string) => string
  message: (bkNo: string, remarks?: string) => string
  type: NotificationType
  category: NotificationCategory
  priority: NotificationPriority
}> = {
  Approve: {
    title: (bkNo, actor) => `Quotation ${bkNo} Approved`,
    message: (bkNo, remarks) =>
      `Quotation ${bkNo} has been internally approved${remarks ? `. Remarks: ${remarks}` : ''}`,
    type: 'Approval',
    category: 'Update',
    priority: 'Normal'
  },
  Reject: {
    title: (bkNo, actor) => `Quotation ${bkNo} Rejected`,
    message: (bkNo, remarks) =>
      `Quotation ${bkNo} has been rejected${remarks ? `. Reason: ${remarks}` : ''}`,
    type: 'Warning',
    category: 'Escalation',
    priority: 'High'
  },
  Rework: {
    title: (bkNo, actor) => `Quotation ${bkNo} — Rework Required`,
    message: (bkNo, remarks) =>
      `Quotation ${bkNo} requires rework${remarks ? `. Remarks: ${remarks}` : ''}`,
    type: 'Warning',
    category: 'Pending',
    priority: 'High'
  },
  Pending: {
    title: (bkNo, actor) => `Quotation ${bkNo} — Approval Needed`,
    message: (bkNo, remarks) =>
      `Quotation ${bkNo} has been sent for internal approval${remarks ? `. Remarks: ${remarks}` : ''}`,
    type: 'Approval',
    category: 'Pending',
    priority: 'Urgent'
  }
}

export function notifyApprovalStatusChanged(params: ApprovalNotificationParams, session: any) {
  const config = APPROVAL_ACTION_MAP[params.action]
  if (!config) return

  const request: NotificationRequest = {
    title: config.title(params.bookingNo, params.actorUserName),
    message: config.message(params.bookingNo, params.remarks),
    type: config.type,
    module: 'Quotation',
    priority: config.priority,
    category: config.category,
    targetUserId: params.targetUserId,
    targetUserName: params.targetUserName,
    documentName: 'Quotation',
    documentId: typeof params.bookingId === 'string' ? parseInt(params.bookingId) || undefined : params.bookingId,
    documentNo: params.bookingNo,
    actionUrl: `/costing/quote-panel`
  }

  fireNotification(request, session)
}

// ─── Cost Approval (Price Approval) ──────────────────────────────────────

interface CostApprovedParams {
  approvalNo: string
  bookingNo: string
  clientName?: string
  jobName?: string
  actorUserName: string
  targetUserId?: number
}

export function notifyCostApproved(params: CostApprovedParams, session: any) {
  const clientPart = params.clientName ? ` for ${params.clientName}` : ''
  const jobPart = params.jobName ? ` (${params.jobName})` : ''

  fireNotification({
    title: `Price Approval ${params.approvalNo} Saved`,
    message: `Price approval ${params.approvalNo}${jobPart}${clientPart} has been approved by ${params.actorUserName}`,
    type: 'Success',
    module: 'Approval',
    priority: 'Normal',
    category: 'Update',
    targetUserId: params.targetUserId,
    documentName: 'Price Approval',
    documentNo: params.approvalNo,
    actionUrl: `/costing/price-approval`
  }, session)
}

// ─── Enquiry → Quotation Conversion ─────────────────────────────────────

interface EnquiryConversionParams {
  enquiryNo: string
  enquiryId: number
  bookingNo?: string
  jobName?: string
  /** Who converted it */
  actorUserName: string
  /** Who should be notified (e.g. enquiry creator, sales person) */
  targetUserId?: number
  targetUserName?: string
}

export function notifyEnquiryConverted(params: EnquiryConversionParams, session: any) {
  const quotePart = params.bookingNo ? ` → Quotation ${params.bookingNo}` : ''
  const jobPart = params.jobName ? ` (${params.jobName})` : ''

  const request: NotificationRequest = {
    title: `Enquiry ${params.enquiryNo} Converted${quotePart}`,
    message: `Enquiry ${params.enquiryNo}${jobPart} has been converted to a quotation by ${params.actorUserName}`,
    type: 'Success',
    module: 'Enquiry',
    priority: 'Normal',
    category: 'Update',
    targetUserId: params.targetUserId,
    targetUserName: params.targetUserName,
    documentName: 'Enquiry',
    documentId: params.enquiryId,
    documentNo: params.enquiryNo,
    actionUrl: `/costing/estimation`
  }

  fireNotification(request, session)
}

// ─── Quotation Saved (New / Clone) ───────────────────────────────────────

interface QuotationSavedParams {
  bookingNo: string
  jobName?: string
  clientName?: string
  mode: 'new' | 'clone'
  actorUserName: string
  targetUserId?: number
}

export function notifyQuotationSaved(params: QuotationSavedParams, session: any) {
  const action = params.mode === 'clone' ? 'Cloned' : 'Created'
  const clientPart = params.clientName ? ` for ${params.clientName}` : ''

  fireNotification({
    title: `Quotation ${params.bookingNo} ${action}`,
    message: `Quotation ${params.bookingNo}${clientPart} has been ${action.toLowerCase()} by ${params.actorUserName}`,
    type: 'Success',
    module: 'Quotation',
    priority: 'Normal',
    category: 'Update',
    targetUserId: params.targetUserId,
    documentName: 'Quotation',
    documentNo: params.bookingNo,
    actionUrl: `/costing/quote-panel`
  }, session)
}

// ─── Quotation Mail Sent ─────────────────────────────────────────────────

interface QuotationMailSentParams {
  bookingNo: string
  clientName?: string
  jobName?: string
  actorUserName: string
  targetUserId?: number
}

export function notifyQuotationMailSent(params: QuotationMailSentParams, session: any) {
  const clientPart = params.clientName ? ` to ${params.clientName}` : ''

  fireNotification({
    title: `Quotation ${params.bookingNo} Sent${clientPart}`,
    message: `Quotation ${params.bookingNo} has been emailed${clientPart} by ${params.actorUserName}`,
    type: 'Info',
    module: 'Quotation',
    priority: 'Normal',
    category: 'Update',
    targetUserId: params.targetUserId,
    documentName: 'Quotation',
    documentNo: params.bookingNo,
    actionUrl: `/costing/quote-panel`
  }, session)
}

// ─── Quotation Deleted ───────────────────────────────────────────────────

interface QuotationDeletedParams {
  quoteNo: string
  jobName?: string
  actorUserName: string
  targetUserId?: number
}

export function notifyQuotationDeleted(params: QuotationDeletedParams, session: any) {
  fireNotification({
    title: `Quotation ${params.quoteNo} Deleted`,
    message: `Quotation ${params.quoteNo}${params.jobName ? ` (${params.jobName})` : ''} was deleted by ${params.actorUserName}`,
    type: 'Warning',
    module: 'Quotation',
    priority: 'Normal',
    category: 'Update',
    targetUserId: params.targetUserId,
    documentName: 'Quotation',
    documentNo: params.quoteNo,
    actionUrl: `/costing/quote-panel`
  }, session)
}

// ─── Enquiry Created ─────────────────────────────────────────────────────

interface EnquiryCreatedParams {
  enquiryNo: string
  jobName?: string
  clientName?: string
  actorUserName: string
  targetUserId?: number
}

export function notifyEnquiryCreated(params: EnquiryCreatedParams, session: any) {
  const clientPart = params.clientName ? ` from ${params.clientName}` : ''

  fireNotification({
    title: `New Enquiry ${params.enquiryNo}`,
    message: `Enquiry ${params.enquiryNo}${clientPart}${params.jobName ? ` — ${params.jobName}` : ''} created by ${params.actorUserName}`,
    type: 'Info',
    module: 'Enquiry',
    priority: 'Normal',
    category: 'Update',
    targetUserId: params.targetUserId,
    documentName: 'Enquiry',
    documentNo: params.enquiryNo,
    actionUrl: `/enquiry/sales`
  }, session)
}

// ─── Enquiry Assigned ────────────────────────────────────────────────────

interface EnquiryAssignedParams {
  enquiryId: number
  enquiryNo?: string
  assignedToUserId: number
  assignedToUserName: string
  actorUserName: string
}

export function notifyEnquiryAssigned(params: EnquiryAssignedParams, session: any) {
  fireNotification({
    title: `Enquiry${params.enquiryNo ? ` ${params.enquiryNo}` : ''} Assigned to You`,
    message: `You have been assigned an enquiry by ${params.actorUserName}`,
    type: 'Approval',
    module: 'Enquiry',
    priority: 'High',
    category: 'Pending',
    targetUserId: params.assignedToUserId,
    targetUserName: params.assignedToUserName,
    documentName: 'Enquiry',
    documentId: params.enquiryId,
    documentNo: params.enquiryNo,
    actionUrl: `/enquiry/sales`
  }, session)
}

// ─── Enquiry Updated ────────────────────────────────────────────────────

interface EnquiryUpdatedParams {
  enquiryNo: string
  jobName?: string
  clientName?: string
  actorUserName: string
  targetUserId?: number
}

export function notifyEnquiryUpdated(params: EnquiryUpdatedParams, session: any) {
  const clientPart = params.clientName ? ` from ${params.clientName}` : ''

  fireNotification({
    title: `Enquiry ${params.enquiryNo} Updated`,
    message: `Enquiry ${params.enquiryNo}${clientPart}${params.jobName ? ` — ${params.jobName}` : ''} updated by ${params.actorUserName}`,
    type: 'Info',
    module: 'Enquiry',
    priority: 'Normal',
    category: 'Update',
    targetUserId: params.targetUserId,
    documentName: 'Enquiry',
    documentNo: params.enquiryNo,
    actionUrl: `/enquiry/sales`
  }, session)
}

// ─── Enquiry Deleted ────────────────────────────────────────────────────

interface EnquiryDeletedParams {
  enquiryNo: string
  jobName?: string
  actorUserName: string
  targetUserId?: number
}

export function notifyEnquiryDeleted(params: EnquiryDeletedParams, session: any) {
  fireNotification({
    title: `Enquiry ${params.enquiryNo} Deleted`,
    message: `Enquiry ${params.enquiryNo}${params.jobName ? ` (${params.jobName})` : ''} was deleted by ${params.actorUserName}`,
    type: 'Warning',
    module: 'Enquiry',
    priority: 'Normal',
    category: 'Update',
    targetUserId: params.targetUserId,
    documentName: 'Enquiry',
    documentNo: params.enquiryNo,
    actionUrl: `/enquiry/sales`
  }, session)
}

// ─── User CRUD ──────────────────────────────────────────────────────────

interface UserCrudParams {
  action: 'Created' | 'Updated' | 'Deleted'
  userName: string
  loginUserName?: string
  actorUserName: string
  targetUserId?: number
}

export function notifyUserCrud(params: UserCrudParams, session: any) {
  fireNotification({
    title: `User ${params.userName} ${params.action}`,
    message: `User ${params.userName}${params.loginUserName ? ` (${params.loginUserName})` : ''} has been ${params.action.toLowerCase()} by ${params.actorUserName}`,
    type: params.action === 'Deleted' ? 'Warning' : 'Info',
    module: 'User',
    priority: 'Normal',
    category: 'Update',
    targetUserId: params.targetUserId,
    documentName: 'User',
    actionUrl: `/master/user`
  }, session)
}

// ─── Password Changed ───────────────────────────────────────────────────

interface PasswordChangedParams {
  actorUserName: string
  targetUserId?: number
}

export function notifyPasswordChanged(params: PasswordChangedParams, session: any) {
  fireNotification({
    title: 'Password Changed',
    message: `Password has been changed by ${params.actorUserName}`,
    type: 'Warning',
    module: 'User',
    priority: 'High',
    category: 'Escalation',
    targetUserId: params.targetUserId,
    documentName: 'User',
    actionUrl: `/settings`
  }, session)
}

// ─── Master CRUD (Machine, Process, Item, etc.) ─────────────────────────

interface MasterCrudParams {
  action: 'Created' | 'Updated' | 'Deleted'
  masterType: 'Machine' | 'Process' | 'Item' | 'Ledger' | 'Category'
  name: string
  code?: string
  actorUserName: string
  targetUserId?: number
}

export function notifyMasterCrud(params: MasterCrudParams, session: any) {
  const codePart = params.code ? ` (${params.code})` : ''

  fireNotification({
    title: `${params.masterType} ${params.name} ${params.action}`,
    message: `${params.masterType} ${params.name}${codePart} has been ${params.action.toLowerCase()} by ${params.actorUserName}`,
    type: params.action === 'Deleted' ? 'Warning' : 'Info',
    module: 'System',
    priority: 'Normal',
    category: 'Update',
    targetUserId: params.targetUserId,
    documentName: params.masterType,
    actionUrl: `/master/${params.masterType.toLowerCase()}`
  }, session)
}
