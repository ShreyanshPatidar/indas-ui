/**
 * Draft Management API Client - Milestone Based
 *
 * Handles milestone-based saving and loading of estimation drafts.
 * All draft data stored securely in SQL Server database (NOT localStorage).
 * Matches Postman collection endpoints.
 */

import APIClient from '../core/client'
import type { APIResponse } from '../core/types'
import type {
  Draft,
  DraftMetadata
} from '@/types/draft'

/**
 * Draft API - Matches Postman Collection
 * Base URL: /api/draftsystem
 */
class DraftAPI {
  /**
   * Save a draft (milestone-based)
   * POST /api/draftsystem/save
   */
  static async saveDraft(
    draftName: string,
    draftData: any,
    module: string,
    documentId: string | null,
    documentName: string | null,
    draftId: number | null,
    session: any,
    remark?: string
  ): Promise<APIResponse<{ draftId: number; lastSaved: string }>> {
    try {
      const requestBody: any = {
        UserID: session?.user?.UserID || session?.user?.userID || 0,
        CompanyID: session?.user?.CompanyID || session?.user?.companyID || 0,
        Module: module,
        DraftName: draftName || 'Untitled Draft',
        DraftData: typeof draftData === 'string' ? draftData : JSON.stringify(draftData),
        DocumentID: documentId || '',
        DocumentName: documentName || '',
        Remark: remark || '',
        IsAutoSave: false,
        RetentionDays: 30
      }

      // Include DraftID if updating existing draft
      if (draftId) {
        requestBody.DraftID = draftId
      }

      const response = await APIClient.post<{ success: boolean; data: { draftId: number; lastSaved: string } }>(
        '/api/draftsystem/save',
        requestBody,
        session,
      )

      if (response.success && response.data?.data) {
        return {
          success: true,
          data: response.data.data
        }
      }

      return {
        success: false,
        error: response.error || 'Failed to save draft'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Load a specific draft
   * GET /api/draftsystem/load/{draftId}
   */
  static async loadDraft(
    draftId: number,
    session: any
  ): Promise<APIResponse<Draft>> {
    try {
      const response = await APIClient.get<{ success: boolean; data: any }>(
        `/api/draftsystem/load/${draftId}`,
        session,
      )

      if (response.success && response.data?.data) {
        const backendData = response.data.data

        // Get date values (try both naming conventions)
        const lastSavedRaw = backendData.LastSaved || backendData.lastSaved || backendData.UpdatedAt || backendData.updatedAt || backendData.CreatedAt || backendData.createdAt
        const expiresAtRaw = backendData.ExpiresAt || backendData.expiresAt
        const createdAtRaw = backendData.CreatedAt || backendData.createdAt

        // Parse dates with error handling
        let lastSaved: string
        try {
          if (lastSavedRaw) {
            const date = new Date(lastSavedRaw)
            lastSaved = !isNaN(date.getTime()) ? date.toISOString() : new Date().toISOString()
          } else {
            lastSaved = new Date().toISOString()
          }
        } catch {
          lastSaved = new Date().toISOString()
        }

        let expiresAt: string
        try {
          if (expiresAtRaw) {
            const date = new Date(expiresAtRaw)
            expiresAt = !isNaN(date.getTime()) ? date.toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          } else {
            expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        } catch {
          expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }

        let createdAt: string
        try {
          if (createdAtRaw) {
            const date = new Date(createdAtRaw)
            createdAt = !isNaN(date.getTime()) ? date.toISOString() : new Date().toISOString()
          } else {
            createdAt = new Date().toISOString()
          }
        } catch {
          createdAt = new Date().toISOString()
        }

        // Transform PascalCase (C# backend) to camelCase (frontend)
        const transformedData: Draft = {
          draftId: backendData.DraftID || backendData.draftId,
          userId: backendData.UserID || backendData.userId,
          companyId: backendData.CompanyID || backendData.companyId,
          module: backendData.Module || backendData.module,
          draftName: backendData.DraftName || backendData.draftName,
          draftData: (() => {
            const raw = backendData.DraftData || backendData.draftData
            if (typeof raw === 'string') {
              try { return JSON.parse(raw) } catch { return raw }
            }
            return raw
          })(),
          isAutoSave: backendData.IsAutoSave || backendData.isAutoSave || false,
          lastSaved,
          expiresAt,
          createdAt
        }

        return {
          success: true,
          data: transformedData
        }
      }

      return {
        success: false,
        error: response.error || 'Failed to load draft'
      }
    } catch (error) {
      console.error('❌ [Draft API] Error loading draft:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * List all drafts for current user and module
   * GET /api/draftsystem/list
   */
  static async listDrafts(
    module: string,
    session: any
  ): Promise<APIResponse<DraftMetadata[]>> {
    try {
      const response = await APIClient.get<{ success: boolean; data: any[] }>(
        `/api/draftsystem/list?module=${encodeURIComponent(module)}`,
        session,
      )

      if (response.success && response.data?.data) {
        // Transform PascalCase (C# backend) to camelCase (frontend)
        const transformedData: DraftMetadata[] = response.data.data.map((item: any) => {
          // Get date values (try both naming conventions)
          const lastSavedRaw = item.LastSaved || item.lastSaved || item.UpdatedAt || item.updatedAt || item.CreatedAt || item.createdAt
          const expiresAtRaw = item.ExpiresAt || item.expiresAt

          // Parse date - try multiple formats
          let lastSaved: string
          try {
            if (lastSavedRaw) {
              const date = new Date(lastSavedRaw)
              lastSaved = !isNaN(date.getTime()) ? date.toISOString() : new Date().toISOString()
            } else {
              lastSaved = new Date().toISOString()
            }
          } catch {
            lastSaved = new Date().toISOString()
          }

          let expiresAt: string
          try {
            if (expiresAtRaw) {
              const date = new Date(expiresAtRaw)
              expiresAt = !isNaN(date.getTime()) ? date.toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            } else {
              expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }
          } catch {
            expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }

          return {
            draftId: item.DraftID || item.draftId,
            draftName: item.DraftName || item.draftName,
            module: item.Module || item.module,
            isAutoSave: item.IsAutoSave || item.isAutoSave || false,
            lastSaved,
            expiresAt,
            previewData: item.PreviewData || item.previewData || {}
          }
        })

        return {
          success: true,
          data: transformedData
        }
      }

      return {
        success: false,
        error: response.error || 'Failed to list drafts'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Delete a draft
   * DELETE /api/draftsystem/{draftId}
   */
  static async deleteDraft(
    draftId: number,
    session: any
  ): Promise<APIResponse<{ message: string }>> {
    try {
      const response = await APIClient.delete<{ success: boolean; message: string }>(
        `/api/draftsystem/${draftId}`,
        session,
      )

      if (response.success) {
        return {
          success: true,
          data: { message: response.data?.message || 'Draft deleted successfully' }
        }
      }

      return {
        success: false,
        error: response.error || 'Failed to delete draft'
      }
    } catch (error) {
      console.error('❌ [Draft API] Error deleting draft:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Rename a draft
   * PUT /api/draftsystem/rename/{draftId}
   */
  static async renameDraft(
    draftId: number,
    newName: string,
    session: any
  ): Promise<APIResponse<{ draftId: number; draftName: string }>> {
    try {
      const requestBody = {
        DraftName: newName
      }

      const response = await APIClient.put<{
        success: boolean
        message?: string
        error?: string
      }>(`/api/draftsystem/rename/${draftId}`, requestBody, session)

      if (response.success) {
        return {
          success: true,
          data: { draftId, draftName: newName }
        }
      }

      return {
        success: false,
        error: response.error || 'Failed to rename draft'
      }
    } catch (error) {
      console.error('❌ [Draft API] Error renaming draft:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

export default DraftAPI
