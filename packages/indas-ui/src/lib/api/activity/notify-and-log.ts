/**
 * notifyAndLog — the standard one-call helper for module actions.
 *
 * Every create / update / delete / approve / etc. action in any module should
 * call this so the app consistently:
 *   1. writes an audit log (via logAction), and
 *   2. fires an in-app notification to the relevant user (via NotificationsAPI).
 *
 * Both are fire-and-forget — failures never block the business flow.
 *
 * Usage:
 *   import { notifyAndLog } from '@/lib/api/activity/notify-and-log'
 *
 *   notifyAndLog({
 *     module: AuditModule.QUOTATION,
 *     action: AuditAction.APPROVE,
 *     documentName: bookingNo,
 *     documentId: bookingId,
 *     // notification (optional — omit to only audit-log):
 *     notify: {
 *       targetUserId: requesterId,
 *       title: 'Quotation approved',
 *       message: `${actor} approved ${bookingNo}`,
 *       type: 'Success',
 *       module: 'Quotation',
 *       actionUrl: '/costing/quote-panel',
 *     },
 *   }, session)
 */

import { logAction } from './audit/send'
import { NotificationsAPI } from './notifications/notifications'
import type {
  NotificationType,
  NotificationModule,
  NotificationPriority,
  NotificationCategory,
} from './notifications/types'

export interface NotifyAndLogParams {
  // ── Audit (always logged) ──
  module: string
  action: string
  documentName: string
  documentId?: number
  comments?: string
  metadata?: Record<string, any>

  // ── Notification (only fired when `notify.targetUserId` is set) ──
  notify?: {
    targetUserId: number
    title: string
    message?: string
    type?: NotificationType
    module?: NotificationModule
    category?: NotificationCategory
    priority?: NotificationPriority
    documentNo?: string
    actionUrl?: string
  }
}

export function notifyAndLog(params: NotifyAndLogParams, session: any): void {
  // 1. Audit log — always.
  logAction(
    {
      module: params.module,
      action: params.action,
      documentName: params.documentName,
      documentId: params.documentId,
      comments: params.comments,
      metadata: params.metadata,
    },
    session
  )

  // 2. In-app notification — only when a target user is given, and never to self.
  const n = params.notify
  const selfId = Number(session?.user?.UserID || session?.user?.userID || 0)
  if (n && n.targetUserId && n.targetUserId !== selfId) {
    NotificationsAPI.create(
      {
        title: n.title,
        message: n.message,
        type: n.type || 'Info',
        module: n.module,
        category: n.category,
        priority: n.priority || 'Normal',
        targetUserId: n.targetUserId,
        documentNo: n.documentNo,
        documentId: params.documentId,
        actionUrl: n.actionUrl,
      },
      session
    ).catch(() => { /* silent — notifications must never block */ })
  }
}
