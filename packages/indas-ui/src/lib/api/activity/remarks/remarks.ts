/**
 * Remark Intelligence API client (remarkData)
 *
 * One row per document (Module + DocumentID); full trail in Metadata JSON.
 * See docs/superpowers/specs/2026-06-05-remark-intelligence-design.md
 */

import APIClient from '../../core/client'
import type { APIResponse } from '../../core/types'

export interface RemarkFile {
  name: string
  url: string
}

export interface RemarkEntry {
  seq: number
  stage: string
  status: string
  text: string
  by: number | null
  byName: string
  at: string
  edited?: boolean
  editedAt?: string
  files?: RemarkFile[]
}

export interface RemarkRow {
  RemarkID: number
  DocumentID: string
  DocumentName?: string
  DocumentNo?: string
  Module?: string
  ActionUrl?: string
  Stage?: string
  Status?: string
  LastRemark?: string
  LastRemarkBy?: number
  LastRemarkDate?: string
  RemarkCount?: number
  remarks: RemarkEntry[]
}

export interface RemarkSavePayload {
  Module: string
  DocumentID: string | number
  DocumentIDName?: string
  DocumentName?: string
  DocumentNo?: string
  ActionUrl?: string
  stage: string
  status?: string
  text: string
  files?: RemarkFile[]
}

export interface RemarkSummary {
  DocumentID: string
  Stage?: string
  Status?: string
  LastRemark?: string
  LastRemarkBy?: number
  LastRemarkDate?: string
  RemarkCount?: number
}

// Backend sometimes returns multi-encoded JSON strings — unwrap up to 3 times.
function parseList(data: any): any[] {
  let v = data
  for (let i = 0; i < 3 && typeof v === 'string'; i++) {
    try { v = JSON.parse(v) } catch { return [] }
  }
  return Array.isArray(v) ? v : []
}

export class RemarkIntelligenceAPI {
  // Full trail for one document, or null if none yet.
  static async getRemarkData(module: string, documentId: string | number, session: any): Promise<APIResponse<RemarkRow | null>> {
    try {
      const res = await APIClient.get(`/api/remarks?module=${encodeURIComponent(module)}&documentID=${encodeURIComponent(String(documentId))}`, session)
      const rows = parseList(res.data)
      if (rows.length === 0) return { success: true, data: null }
      const row = rows[0]
      let remarks: RemarkEntry[] = []
      let meta: any = row.Metadata
      for (let i = 0; i < 3 && typeof meta === 'string'; i++) {
        try { meta = JSON.parse(meta) } catch { meta = null; break }
      }
      if (meta && Array.isArray(meta.remarks)) remarks = meta.remarks
      return { success: true, data: { ...row, remarks } }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to load remarks' }
    }
  }

  // All remark entries for a booking, consolidated across every module/stage
  // (enquiry, quotation, revisions) — threaded by BookingNo. Returns a flat,
  // chronologically-ordered trail with each entry tagged by its source module.
  static async getRemarkDataByBooking(bookingNo: string | number, session: any, enquiry?: { enquiryNo?: string | number; enquiryID?: string | number }): Promise<APIResponse<RemarkEntry[]>> {
    try {
      const params = new URLSearchParams({ bookingNo: String(bookingNo ?? '') })
      if (enquiry?.enquiryNo) params.set('enquiryNo', String(enquiry.enquiryNo))
      if (enquiry?.enquiryID) params.set('enquiryID', String(enquiry.enquiryID))
      const res = await APIClient.get(`/api/remarks/bybooking?${params.toString()}`, session)
      const rows = parseList(res.data) as RemarkRow[]
      // Canonical stage name per source module (overrides per-entry stage so the
      // trail reads consistently — "Estimation", "Sales Enquiry", etc.).
      const stageForModule = (mod?: string, docName?: string): string => {
        const m = (mod || '').toLowerCase()
        if (m === 'enquiry' || m.includes('/enquiry')) return 'Enquiry Remark'
        if (m === 'quotation' || m.includes('quote-panel') || m.includes('/costing/estimation')) return 'Estimation Remark'
        return docName || mod || ''
      }
      const all: RemarkEntry[] = []
      for (const row of rows) {
        let meta: any = (row as any).Metadata
        for (let i = 0; i < 3 && typeof meta === 'string'; i++) {
          try { meta = JSON.parse(meta) } catch { meta = null; break }
        }
        if (meta && Array.isArray(meta.remarks)) {
          const stage = stageForModule(row.Module, row.DocumentName)
          for (const e of meta.remarks as RemarkEntry[]) {
            all.push({ ...e, stage })
          }
        }
      }
      all.sort((a, b) => (a.at || '').localeCompare(b.at || ''))
      return { success: true, data: all.map((e, i) => ({ ...e, seq: i + 1 })) }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to load remarks' }
    }
  }

  // Latest-only summaries for a list of documents, one call.
  static async getRemarkDataBatch(module: string, documentIds: Array<string | number>, session: any): Promise<APIResponse<Record<string, RemarkSummary>>> {
    try {
      const res = await APIClient.post('/api/remarks/batch', { Module: module, DocumentIDs: documentIds.map(String) }, session)
      const rows = parseList(res.data) as RemarkSummary[]
      const map: Record<string, RemarkSummary> = {}
      for (const r of rows) map[String(r.DocumentID)] = r
      return { success: true, data: map }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to load remarks' }
    }
  }

  // Append a remark (or create the trail). Server computes seq/by/byName/at.
  static async saveRemarkData(payload: RemarkSavePayload, session: any): Promise<APIResponse<string>> {
    try {
      const res = await APIClient.post<string>('/api/remarks', { ...payload, DocumentID: String(payload.DocumentID) }, session)
      const data = typeof res.data === 'string' ? res.data : ''
      if (!res.success || data.toLowerCase().startsWith('fail')) {
        return { success: false, error: res.error || data || 'Failed to save remark' }
      }
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to save remark' }
    }
  }

  // Save attachment rows to the universal store (JobBookingAttachments), keyed by Module + DocumentID.
  static async saveAttachments(payload: { Module: string; DocumentID: string | number; DocumentName?: string; DocumentIDName?: string; files: RemarkFile[] }, session: any): Promise<APIResponse<string>> {
    try {
      const res = await APIClient.post<string>('/api/remarks/attachments', { ...payload, DocumentID: String(payload.DocumentID) }, session)
      const data = typeof res.data === 'string' ? res.data : ''
      if (!res.success || data.toLowerCase().startsWith('fail')) {
        return { success: false, error: res.error || data || 'Failed to save attachments' }
      }
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to save attachments' }
    }
  }

  // List saved attachment rows for a document.
  static async getAttachments(module: string, documentId: string | number, session: any): Promise<APIResponse<Array<{ AttachementID: number; FileName: string; FilePath: string; FileExtension: string }>>> {
    try {
      const res = await APIClient.get(`/api/remarks/attachments?module=${encodeURIComponent(module)}&documentID=${encodeURIComponent(String(documentId))}`, session)
      const rows = parseList(res.data)
      return { success: true, data: rows as Array<{ AttachementID: number; FileName: string; FilePath: string; FileExtension: string }> }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to load attachments' }
    }
  }

  // Edit the last trail entry (server enforces: last entry, author, < 2h).
  static async editRemarkData(module: string, documentId: string | number, seq: number, text: string, session: any): Promise<APIResponse<string>> {
    try {
      const res = await APIClient.post<string>('/api/remarks/edit', { Module: module, DocumentID: String(documentId), seq, text }, session)
      const data = typeof res.data === 'string' ? res.data : ''
      if (!res.success || data.toLowerCase().startsWith('fail')) {
        return { success: false, error: res.error || data || 'Failed to edit remark' }
      }
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to edit remark' }
    }
  }

  // Delete the last trail entry (same guards as edit).
  static async deleteRemarkData(module: string, documentId: string | number, seq: number, session: any): Promise<APIResponse<string>> {
    try {
      const res = await APIClient.post<string>('/api/remarks/delete', { Module: module, DocumentID: String(documentId), seq }, session)
      const data = typeof res.data === 'string' ? res.data : ''
      if (!res.success || data.toLowerCase().startsWith('fail')) {
        return { success: false, error: res.error || data || 'Failed to delete remark' }
      }
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete remark' }
    }
  }
}
