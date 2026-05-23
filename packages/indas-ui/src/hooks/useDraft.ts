/**
 * useDraft Hook - Milestone Based
 *
 * React hook for milestone-based draft management.
 * User manually saves at important points (milestones) during estimation.
 *
 * Usage:
 * ```typescript
 * const {
 *   saveDraft,
 *   loadDraft,
 *   deleteDraft,
 *   listDrafts,
 *   drafts,
 *   lastSaved,
 *   isSaving
 * } = useDraft('ESTIMATION', currentEstimationState)
 * ```
 */

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { DraftAPI } from '@/lib/api/draft'
import type { Draft, DraftMetadata } from '@/types/draft'

export interface UseDraftReturn {
  /** Manually save a draft at a milestone */
  saveDraft: (draftName: string, documentId?: string | null, documentName?: string | null, remark?: string) => Promise<boolean>

  /** Load a draft by ID */
  loadDraft: (draftId: number) => Promise<any | null>

  /** Delete a draft */
  deleteDraft: (draftId: number) => Promise<boolean>

  /** Rename a draft */
  renameDraft: (draftId: number, newName: string) => Promise<boolean>

  /** List all drafts */
  listDrafts: () => Promise<void>

  /** Array of available drafts */
  drafts: DraftMetadata[]

  /** Whether drafts are being loaded */
  isLoadingDrafts: boolean

  /** Last saved timestamp */
  lastSaved: Date | null

  /** Whether a save operation is in progress */
  isSaving: boolean

  /** Current draft ID (if loaded from draft) */
  currentDraftId: number | null
}

/**
 * useDraft Hook - Milestone Based
 */
export function useDraft(
  module: string,
  currentState: any
): UseDraftReturn {
  const { data: session } = useSession()

  // State
  const [drafts, setDrafts] = useState<DraftMetadata[]>([])
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [currentDraftId, setCurrentDraftId] = useState<number | null>(null)
  const [currentDraftDocumentId, setCurrentDraftDocumentId] = useState<string | null>(null)

  /**
   * Save a draft (milestone-based)
   */
  const saveDraft = useCallback(
    async (draftName: string, documentId?: string | null, documentName?: string | null, remark?: string): Promise<boolean> => {
      if (!session) return false

      setIsSaving(true)

      try {
        // Smart draft ID logic:
        // Only use currentDraftId if the document ID matches (same quote)
        // If document ID changed, create a NEW draft instead of updating old one
        const shouldUpdateExistingDraft =
          currentDraftId &&
          currentDraftDocumentId === documentId

        const draftIdToUse = shouldUpdateExistingDraft ? currentDraftId : null

        const response = await DraftAPI.saveDraft(
          draftName,
          currentState,
          module,
          documentId || null,
          documentName || null,
          draftIdToUse, // Only update if same document
          session,
          remark
        )

        if (response.success && response.data) {
          setLastSaved(new Date())
          setCurrentDraftId(response.data.draftId)
          setCurrentDraftDocumentId(documentId || null) // Track which quote this draft belongs to
          return true
        } else {
          console.error('❌ [DRAFT] Save failed - API response:', response.error || 'No error message')
          return false
        }
      } catch (error) {
        console.error('❌ [DRAFT] Save exception:', error)
        return false
      } finally {
        setIsSaving(false)
      }
    },
    [session, currentState, module, currentDraftId, currentDraftDocumentId]
  )

  /**
   * Load a draft
   */
  const loadDraft = useCallback(
    async (draftId: number): Promise<any | null> => {
      if (!session) return null

      try {
        const response = await DraftAPI.loadDraft(draftId, session)

        if (response.success && response.data) {
          setCurrentDraftId(draftId)
          setLastSaved(new Date(response.data.lastSaved))

          // Extract documentId from draftData to track which quote this draft belongs to
          const documentId = response.data.draftData?.quoteNumber || null
          setCurrentDraftDocumentId(documentId)

          return response.data.draftData
        } else {
          return null
        }
      } catch (error) {
        return null
      }
    },
    [session]
  )

  /**
   * Delete a draft
   */
  const deleteDraft = useCallback(
    async (draftId: number): Promise<boolean> => {
      if (!session) return false

      try {
        const response = await DraftAPI.deleteDraft(draftId, session)

        if (response.success) {
          await listDrafts()
          return true
        } else {
          return false
        }
      } catch (error) {
        return false
      }
    },
    [session]
  )

  /**
   * Rename a draft
   */
  const renameDraft = useCallback(
    async (draftId: number, newName: string): Promise<boolean> => {
      if (!session) return false

      try {
        const response = await DraftAPI.renameDraft(draftId, newName, session)

        if (response.success) {
          await listDrafts()
          return true
        } else {
          return false
        }
      } catch (error) {
        return false
      }
    },
    [session]
  )

  /**
   * List all drafts for current module
   */
  const listDrafts = useCallback(async (): Promise<void> => {
    if (!session) return

    setIsLoadingDrafts(true)

    try {
      const response = await DraftAPI.listDrafts(module, session)

      if (response.success && response.data) {
        setDrafts(response.data)
      } else {
        setDrafts([])
      }
    } catch (error) {
      setDrafts([])
    } finally {
      setIsLoadingDrafts(false)
    }
  }, [session, module])

  /**
   * Load drafts on mount
   */
  useEffect(() => {
    if (session) {
      listDrafts()
    }
  }, [session, listDrafts])

  return {
    saveDraft,
    loadDraft,
    deleteDraft,
    renameDraft,
    listDrafts,
    drafts,
    isLoadingDrafts,
    lastSaved,
    isSaving,
    currentDraftId
  }
}
