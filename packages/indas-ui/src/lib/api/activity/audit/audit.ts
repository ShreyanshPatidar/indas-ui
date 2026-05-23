/**
 * Audit API Client
 *
 * logAction: POST /api/auditlog — fire-and-forget business/security event logging
 * getStats: GET /api/auditlog/stats — dashboard statistics
 *
 * The audit logs page fetches directly via APIClient — no wrapper needed.
 */

import APIClient from '../../core/client'
import type { APIResponse } from '../../core/types'
import type { BackendAuditLogRequest } from '@/types/audit'

class AuditAPI {
  /**
   * Log an audit event (business action or security event)
   */
  static async logAction(
    request: BackendAuditLogRequest,
    session: any
  ): Promise<APIResponse<{ auditLogId: number }>> {
    try {
      const response = await APIClient.post<{
        success: boolean
        auditLogId: number
        message: string
      }>('/api/auditlog', request, session)

      if (response.success && response.data) {
        return { success: true, data: { auditLogId: response.data.auditLogId } }
      }

      return { success: false, error: response.error || 'Failed to log audit event' }
    } catch (error) {
      // Silent — audit failure must never break business flows
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Get audit log statistics
   */
  static async getStats(
    startDate?: string,
    session?: any
  ): Promise<APIResponse<{
    TotalLogs: number
    LoginSuccesses: number
    LoginFailures: number
    Logouts: number
    RateLimitExceeded: number
    UnauthorizedAccess: number
    UniqueUsers: number
    UniqueIPAddresses: number
    BusinessActions: number
  }>> {
    try {
      const queryParams = new URLSearchParams()
      if (startDate) queryParams.append('startDate', startDate)

      return await APIClient.get(`/api/auditlog/stats?${queryParams.toString()}`, session)
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

export default AuditAPI
export { AuditAPI, AuditAPI as BusinessAuditAPI }
