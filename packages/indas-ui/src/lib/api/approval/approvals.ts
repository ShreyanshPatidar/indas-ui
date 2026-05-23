/**
 * Approval Workflow API Client
 *
 * Handles multi-level approval workflows for quotations, master data changes, etc.
 */

import APIClient from '../core/client'
import type { APIResponse } from '../core/types'
import type {
  ApprovalWorkflow,
  ApprovalChain,
  RequestApprovalRequest,
  RequestApprovalResponse,
  ProcessApprovalRequest,
  ProcessApprovalResponse,
  EscalateApprovalRequest,
  EscalateApprovalResponse,
  PendingApprovalsResponse,
  ApprovalChainResponse
} from '@/types/approval'

/**
 * Approval API
 */
class ApprovalAPI {
  /**
   * Request approval for an entity
   */
  static async requestApproval(
    entityType: string,
    entityId: number,
    comments: string | undefined,
    metadata: Record<string, any> | undefined,
    session: any
  ): Promise<APIResponse<{ approvalId: number; approvalLevel: number; approverId?: number; requestedAt: string }>> {
    try {
      const requestBody: RequestApprovalRequest & { UserID: string; CompanyID: string } = {
        UserID: session?.user?.UserID?.toString() || '',
        CompanyID: session?.user?.CompanyID?.toString() || '',
        EntityType: entityType,
        EntityID: entityId,
        Comments: comments,
        Metadata: metadata
      }

      const response = await APIClient.post<RequestApprovalResponse>(
        '/api/approval/request',
        requestBody,
        session
      )

      if (response.success && response.data?.data) {
        return {
          success: true,
          data: response.data.data
        }
      }

      return {
        success: false,
        error: response.error || 'Failed to request approval'
      }
    } catch (error) {
      console.error('❌ [Approval API] Error requesting approval:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Approve a request
   */
  static async approve(
    approvalId: number,
    comments: string | undefined,
    session: any
  ): Promise<APIResponse<{ approvalId: number; status: string; nextLevel?: number; nextApproverId?: number; isComplete: boolean }>> {
    try {
      const requestBody: ProcessApprovalRequest & { UserID: string } = {
        UserID: session?.user?.UserID?.toString() || '',
        ApprovalID: approvalId,
        Action: 'APPROVE',
        Comments: comments
      }

      const response = await APIClient.post<ProcessApprovalResponse>(
        '/api/approval/process',
        requestBody,
        session
      )

      if (response.success && response.data?.data) {
        return {
          success: true,
          data: response.data.data
        }
      }

      return {
        success: false,
        error: response.error || 'Failed to approve request'
      }
    } catch (error) {
      console.error('❌ [Approval API] Error approving request:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Reject a request
   */
  static async reject(
    approvalId: number,
    comments: string | undefined,
    session: any
  ): Promise<APIResponse<{ approvalId: number; status: string; isComplete: boolean }>> {
    try {
      const requestBody: ProcessApprovalRequest & { UserID: string } = {
        UserID: session?.user?.UserID?.toString() || '',
        ApprovalID: approvalId,
        Action: 'REJECT',
        Comments: comments
      }

      const response = await APIClient.post<ProcessApprovalResponse>(
        '/api/approval/process',
        requestBody,
        session
      )

      if (response.success && response.data?.data) {
        return {
          success: true,
          data: response.data.data
        }
      }

      return {
        success: false,
        error: response.error || 'Failed to reject request'
      }
    } catch (error) {
      console.error('❌ [Approval API] Error rejecting request:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Escalate approval to another user
   */
  static async escalate(
    approvalId: number,
    toUserId: number,
    reason: string | undefined,
    session: any
  ): Promise<APIResponse<{ approvalId: number; newApproverId: number; escalatedAt: string }>> {
    try {
      const requestBody: EscalateApprovalRequest & { UserID: string } = {
        UserID: session?.user?.UserID?.toString() || '',
        ApprovalID: approvalId,
        ToUserID: toUserId,
        Reason: reason || ''
      }

      const response = await APIClient.post<EscalateApprovalResponse>(
        '/api/approval/escalate',
        requestBody,
        session
      )

      if (response.success && response.data?.data) {
        return {
          success: true,
          data: response.data.data
        }
      }

      return {
        success: false,
        error: response.error || 'Failed to escalate approval'
      }
    } catch (error) {
      console.error('❌ [Approval API] Error escalating approval:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get pending approvals for current user.
   *
   * Backend endpoint /api/approval/pending does not exist yet. Returning an
   * empty list short-circuits the 60s fetch timeout that was firing on every
   * estimation page load. Un-stub once the backend controller ships.
   */
  static async getPendingApprovals(
    _session: any
  ): Promise<APIResponse<ApprovalWorkflow[]>> {
    return { success: true, data: [] }
  }

  /**
   * Get approval chain for an entity (full history)
   */
  static async getApprovalChain(
    entityType: string,
    entityId: number,
    session: any
  ): Promise<APIResponse<ApprovalChain>> {
    try {
      const companyId = session?.user?.CompanyID?.toString() || ''

      const response = await APIClient.get<ApprovalChainResponse>(
        `/api/approval/chain/${entityType}/${entityId}?companyId=${companyId}`,
        session
      )

      if (response.success && response.data?.data) {
        return {
          success: true,
          data: response.data.data
        }
      }

      return {
        success: false,
        error: response.error || 'Failed to get approval chain'
      }
    } catch (error) {
      console.error('❌ [Approval API] Error getting approval chain:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Withdraw an approval request
   */
  static async withdraw(
    approvalId: number,
    reason: string | undefined,
    session: any
  ): Promise<APIResponse<{ message: string }>> {
    try {
      const requestBody = {
        UserID: session?.user?.UserID?.toString() || '',
        ApprovalID: approvalId,
        Reason: reason
      }

      const response = await APIClient.post<{
        success: boolean
        message?: string
        error?: string
      }>('/api/approval/withdraw', requestBody, session)

      if (response.success) {
        return {
          success: true,
          data: { message: response.data?.message || 'Approval withdrawn successfully' }
        }
      }

      return {
        success: false,
        error: response.error || 'Failed to withdraw approval'
      }
    } catch (error) {
      console.error('❌ [Approval API] Error withdrawing approval:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

export default ApprovalAPI
