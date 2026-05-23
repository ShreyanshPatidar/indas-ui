/**
 * useBusinessAudit Hook
 *
 * React hook for logging business actions.
 *
 * Usage:
 * ```typescript
 * const { logAction, isLogging } = useBusinessAudit()
 * await logAction('CREATE', 'ESTIMATION', {
 *   documentName: 'Quotation',
 *   documentId: 123,
 * })
 * ```
 */

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { BusinessAuditAPI } from '@/lib/api/activity/audit'
import type { AuditModule, AuditAction } from '@/types/audit'

export function useBusinessAudit() {
  const { data: session } = useSession()
  const [isLogging, setIsLogging] = useState(false)

  const logAction = useCallback(
    async (
      action: AuditAction,
      module: AuditModule,
      details: {
        documentName: string
        documentId?: number
        comments?: string
        metadata?: Record<string, any>
      }
    ): Promise<boolean> => {
      if (!session) return false

      setIsLogging(true)
      try {
        const response = await BusinessAuditAPI.logAction({
          Event: 'BUSINESS_ACTION',
          Username: (session.user as any)?.UserName || session.user?.name || 'Unknown',
          UserID: ((session.user as any)?.UserID || 0).toString(),
          CompanyID: ((session.user as any)?.CompanyID || 0).toString(),
          UserAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          Success: true,
          Module: module,
          Action: action,
          DocumentName: details.documentName,
          DocumentID: details.documentId?.toString(),
          Comments: details.comments,
          Metadata: details.metadata,
        }, session)

        return response.success
      } catch {
        return false
      } finally {
        setIsLogging(false)
      }
    },
    [session]
  )

  return { logAction, isLogging }
}
