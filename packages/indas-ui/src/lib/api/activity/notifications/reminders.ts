/**
 * Reminders API Client
 *
 * Shared reminder + escalation across modules. Reminders are stored as
 * Notifications rows (Category='Reminder' / 'Escalation', keyed Module +
 * DocumentID), so state is derived rather than duplicated in another table.
 *
 * Flow: the raiser sends up to two manual reminders; if the assignee still
 * has not responded 24h after the second, the server sweep escalates to the
 * assignee's manager (UserMaster.UnderUserID).
 */

import APIClient from '../../core/client'
import type { APIResponse } from '../../core/types'

/** Modules the reminder system knows about (see ModuleMap in ReminderController). */
export type ReminderModule = 'RateEnquiry' | 'Costing'

export interface ReminderStatus {
  module: ReminderModule
  documentId: number
  documentNo: string
  reminderCount: number
  maxReminders: number
  remaining: number
  lastReminderAt: string | null
  escalated: boolean
  escalatesAt: string | null
  isOpen: boolean
  assignedToUserId: number
  /** True only for the raiser, while open, with reminders left and someone assigned. */
  canRemind: boolean
}

class RemindersAPI {
  static async getStatus(
    module: ReminderModule,
    documentId: number,
    session?: any
  ): Promise<APIResponse<ReminderStatus>> {
    return APIClient.get(`api/notifications/reminder/status/${module}/${documentId}`, session)
  }

  static async send(
    module: ReminderModule,
    documentId: number,
    session?: any
  ): Promise<APIResponse> {
    return APIClient.post('api/notifications/reminder/send', { Module: module, DocumentID: documentId }, session)
  }

  static async escalate(
    module: ReminderModule,
    documentId: number,
    session?: any
  ): Promise<APIResponse> {
    return APIClient.post('api/notifications/reminder/escalate', { Module: module, DocumentID: documentId }, session)
  }
}

export default RemindersAPI
