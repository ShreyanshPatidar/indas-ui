/**
 * useApproval Hook
 *
 * React hook for managing approval workflows.
 * Handles requesting, approving, rejecting, and escalating approvals.
 *
 * Usage:
 * ```typescript
 * const {
 *   requestApproval,
 *   approveQuotation,
 *   rejectQuotation,
 *   escalateQuotation,
 *   withdrawApproval,
 *   getApprovalChain,
 *   pendingApprovals,
 *   isLoading
 * } = useApproval()
 * ```
 */

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { ApprovalAPI } from '@/lib/api/approval'
import type { ApprovalWorkflow, ApprovalChain } from '@/types/approval'

export interface UseApprovalReturn {
  /** Request approval for an entity */
  requestApproval: (
    entityType: string,
    entityId: number,
    comments?: string,
    metadata?: Record<string, any>
  ) => Promise<boolean>

  /** Approve a quotation/entity */
  approveQuotation: (
    approvalId: number,
    comments?: string
  ) => Promise<boolean>

  /** Reject a quotation/entity */
  rejectQuotation: (
    approvalId: number,
    comments?: string
  ) => Promise<boolean>

  /** Escalate approval to another user */
  escalateQuotation: (
    approvalId: number,
    toUserId: number,
    reason?: string
  ) => Promise<boolean>

  /** Withdraw an approval request */
  withdrawApproval: (
    approvalId: number,
    reason?: string
  ) => Promise<boolean>

  /** Get approval chain for an entity */
  getApprovalChain: (
    entityType: string,
    entityId: number
  ) => Promise<ApprovalChain | null>

  /** Refresh pending approvals */
  refreshPendingApprovals: () => Promise<void>

  /** List of pending approvals for current user */
  pendingApprovals: ApprovalWorkflow[]

  /** Whether an operation is in progress */
  isLoading: boolean

  /** Whether pending approvals are being loaded */
  isLoadingPending: boolean
}

/**
 * useApproval Hook
 */
export function useApproval(): UseApprovalReturn {
  const { data: session } = useSession()

  // State
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalWorkflow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPending, setIsLoadingPending] = useState(false)

  /**
   * Request approval for an entity
   */
  const requestApproval = useCallback(
    async (
      entityType: string,
      entityId: number,
      comments?: string,
      metadata?: Record<string, any>
    ): Promise<boolean> => {
      if (!session) {
        return false
      }

      setIsLoading(true)

      try {
        const response = await ApprovalAPI.requestApproval(
          entityType,
          entityId,
          comments,
          metadata,
          session
        )

        if (response.success) {
          return true
        } else {
          console.error('❌ [useApproval] Failed to request approval:', response.error)
          return false
        }
      } catch (error) {
        console.error('❌ [useApproval] Error requesting approval:', error)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [session]
  )

  /**
   * Approve a quotation/entity
   */
  const approveQuotation = useCallback(
    async (
      approvalId: number,
      comments?: string
    ): Promise<boolean> => {
      if (!session) {
        return false
      }

      setIsLoading(true)

      try {
        const response = await ApprovalAPI.approve(approvalId, comments, session)

        if (response.success) {
          // Refresh pending approvals
          await refreshPendingApprovals()
          return true
        } else {
          console.error('❌ [useApproval] Failed to approve:', response.error)
          return false
        }
      } catch (error) {
        console.error('❌ [useApproval] Error approving:', error)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [session]
  )

  /**
   * Reject a quotation/entity
   */
  const rejectQuotation = useCallback(
    async (
      approvalId: number,
      comments?: string
    ): Promise<boolean> => {
      if (!session) {
        return false
      }

      setIsLoading(true)

      try {
        const response = await ApprovalAPI.reject(approvalId, comments, session)

        if (response.success) {
          // Refresh pending approvals
          await refreshPendingApprovals()
          return true
        } else {
          console.error('❌ [useApproval] Failed to reject:', response.error)
          return false
        }
      } catch (error) {
        console.error('❌ [useApproval] Error rejecting:', error)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [session]
  )

  /**
   * Escalate approval to another user
   */
  const escalateQuotation = useCallback(
    async (
      approvalId: number,
      toUserId: number,
      reason?: string
    ): Promise<boolean> => {
      if (!session) {
        return false
      }

      setIsLoading(true)

      try {
        const response = await ApprovalAPI.escalate(
          approvalId,
          toUserId,
          reason,
          session
        )

        if (response.success) {
          // Refresh pending approvals
          await refreshPendingApprovals()
          return true
        } else {
          console.error('❌ [useApproval] Failed to escalate:', response.error)
          return false
        }
      } catch (error) {
        console.error('❌ [useApproval] Error escalating:', error)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [session]
  )

  /**
   * Withdraw an approval request
   */
  const withdrawApproval = useCallback(
    async (
      approvalId: number,
      reason?: string
    ): Promise<boolean> => {
      if (!session) {
        return false
      }

      setIsLoading(true)

      try {
        const response = await ApprovalAPI.withdraw(approvalId, reason, session)

        if (response.success) {
          // Refresh pending approvals
          await refreshPendingApprovals()
          return true
        } else {
          console.error('❌ [useApproval] Failed to withdraw:', response.error)
          return false
        }
      } catch (error) {
        console.error('❌ [useApproval] Error withdrawing:', error)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [session]
  )

  /**
   * Get approval chain for an entity
   */
  const getApprovalChain = useCallback(
    async (
      entityType: string,
      entityId: number
    ): Promise<ApprovalChain | null> => {
      if (!session) {
        return null
      }

      try {
        const response = await ApprovalAPI.getApprovalChain(
          entityType,
          entityId,
          session
        )

        if (response.success && response.data) {
          return response.data
        } else {
          console.error('❌ [useApproval] Failed to get approval chain:', response.error)
          return null
        }
      } catch (error) {
        console.error('❌ [useApproval] Error getting approval chain:', error)
        return null
      }
    },
    [session]
  )

  /**
   * Refresh pending approvals
   */
  const refreshPendingApprovals = useCallback(async (): Promise<void> => {
    if (!session) {
      return
    }

    setIsLoadingPending(true)

    try {
      const response = await ApprovalAPI.getPendingApprovals(session)

      if (response.success && response.data) {
        setPendingApprovals(response.data)
      } else {
        // Silently fail if endpoint doesn't exist (404)
        if (response.error && response.error.includes('No HTTP resource was found')) {
          // Backend endpoint not implemented yet - use empty array
          setPendingApprovals([])
        } else {
          console.error('❌ [useApproval] Failed to get pending approvals:', response.error)
          setPendingApprovals([])
        }
      }
    } catch (error) {
      // Silently fail if endpoint doesn't exist
      setPendingApprovals([])
    } finally {
      setIsLoadingPending(false)
    }
  }, [session])

  /**
   * Load pending approvals on mount and when session changes
   */
  useEffect(() => {
    if (session) {
      refreshPendingApprovals()
    }
  }, [session, refreshPendingApprovals])

  return {
    requestApproval,
    approveQuotation,
    rejectQuotation,
    escalateQuotation,
    withdrawApproval,
    getApprovalChain,
    refreshPendingApprovals,
    pendingApprovals,
    isLoading,
    isLoadingPending
  }
}
