// Rate Enquiry API — matches new single-table RateEnquiry schema

import APIClient from '../core/client'
import type { APIResponse } from '../core/types'


// ============================================================
//  Types — match DB columns + JOINed fields from controller
// ============================================================

export interface RateQueryItem {
  RequestId: number
  RequestNumber: string
  UserID: number
  RequestorName?: string
  RequestorEmail?: string
  Department?: string
  RequestMessage: string
  RequestData?: string      // JSON string: item details
  AssignedToUserId?: number
  AssignedToEmail?: string
  AssignedToName?: string
  EscalationData?: string   // JSON string: { level, responsibleId, responsibleName, responsibleEmail, escalatedAt, slaHours }
  ResponseData?: string     // JSON string: { rate, providedBy, providedByName, respondedAt, remarks }
  Status: string            // Pending | InProgress | Completed | Cancelled
  CreatedAt?: string
  UpdatedAt?: string
}

// Parsed JSON helpers
export interface ParsedEscalation {
  level: number
  responsibleId: number
  responsibleName: string
  responsibleEmail: string
  escalatedAt?: string
  slaHours: number
}

export interface ParsedResponse {
  rate: string
  providedBy: number
  providedByName: string
  respondedAt: string
  remarks: string
}

// ============================================================
//  API Class
// ============================================================

export class RateEnquiryAPI {

  // ── Rate Requests ─────────────────────────────────────────

  static async createRateRequest(
    data: {
      UserID: number
      Department?: string
      RequestMessage: string
      RequestData?: string        // JSON string of item details
      AssignedToUserId?: number
      AssignedToEmail?: string
      SLAHours?: number
    },
    session: any
  ): Promise<APIResponse> {
    return APIClient.post('api/RateEnquiry/rate-request/create', data, session)
  }

  static async provideRate(requestId: number, userId: number, rate: string, remarks?: string, session?: any): Promise<APIResponse> {
    return APIClient.post('api/RateEnquiry/rate-request/provide-rate', { RequestId: requestId, UserId: userId, Rate: rate, Remarks: remarks }, session)
  }

  static async getAllRateRequests(
    session: any,
    filters?: { status?: string }
  ): Promise<APIResponse<RateQueryItem[]>> {
    const params = new URLSearchParams()
    if (filters?.status) params.set('status', filters.status)
    const qs = params.toString()
    return APIClient.get(`api/RateEnquiry/rate-request/all${qs ? `?${qs}` : ''}`, session)
  }

  static async getRateRequestById(id: number, session: any): Promise<APIResponse<RateQueryItem>> {
    return APIClient.get(`api/RateEnquiry/rate-request/${id}`, session)
  }

  static async getUserRateRequests(userId: number, session: any, status?: string): Promise<APIResponse<RateQueryItem[]>> {
    const qs = status ? `?status=${encodeURIComponent(status)}` : ''
    return APIClient.get(`api/RateEnquiry/rate-request/user/${userId}${qs}`, session)
  }

  static async escalateRequest(requestId: number, session: any): Promise<APIResponse> {
    return APIClient.post('api/RateEnquiry/rate-request/escalate', { RequestId: requestId }, session)
  }

  // ── Email ─────────────────────────────────────────────────

  static async sendEmail(data: { ToEmail: string; ToName?: string; Subject: string; Body: string; CcEmails?: string[] }, session: any): Promise<APIResponse> {
    return APIClient.post('api/RateEnquiry/mail/send', data, session)
  }

  static async sendRateRequestEmail(data: { ToEmail: string; ToName?: string; RequestNumber?: string; RequestMessage?: string; ItemName?: string; ActionLink?: string }, session: any): Promise<APIResponse> {
    return APIClient.post('api/RateEnquiry/mail/send-rate-request', data, session)
  }

  static async sendRateProvidedEmail(data: { ToEmail: string; ToName?: string; RequestNumber?: string; Rate?: string; RateProviderName?: string }, session: any): Promise<APIResponse> {
    return APIClient.post('api/RateEnquiry/mail/send-rate-provided', data, session)
  }
}

// JSON parsing helpers
export function parseEscalationData(json?: string): ParsedEscalation | null {
  if (!json) return null
  try { return JSON.parse(json) } catch { return null }
}

export function parseResponseData(json?: string): ParsedResponse | null {
  if (!json) return null
  try { return JSON.parse(json) } catch { return null }
}
