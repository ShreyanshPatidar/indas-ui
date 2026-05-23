// Quotation API
// Handles all quotation/quote panel operations

import APIClient from '../core/client'
import { buildAPIURL, getBasicAuthHeader } from '../core/config'
import type { APIResponse } from '../core/types'

/**
 * Quotation API class
 * Manages quotation operations for the Quote Panel
 */
export class QuotationAPI {
  /**
   * Get booking data (Quote Panel data)
   * @param filters - Filter parameters
   * @param sessionData - Session data (REQUIRED for authentication)
   */
  static async getBookingData(
    filters?: {
      ApprovalType?: string // "Internal", "External", "" (all)
      FilterSTR?: string // "All", "NewQuotes", "PendingForApproval", "IsInternalApproved", "IsRework", "IsCancelled", "IsMailSent", "PendingForPriceApproval", "JobApproved"
      FromDate?: string // Format: DD/MM/YYYY
      ToDate?: string // Format: DD/MM/YYYY
    },
    sessionData?: any
  ): Promise<APIResponse> {
    const requestBody = {
      ApprovalType: filters?.ApprovalType || '',
      FilterSTR: filters?.FilterSTR || 'All',
      FromDate: filters?.FromDate || '01/01/2020',
      ToDate: filters?.ToDate || '31/12/2030',
    }

    const response = await APIClient.post('api/planwindow/getbookingdata', requestBody, sessionData)

    return response
  }

  /**
   * Get all quotations with optional filters
   * @param filters - Optional filter parameters
   * @param sessionData - Session data (REQUIRED for authentication)
   */
  static async getAllQuotations(
    filters?: {
      dateFrom?: string // Format: YYYY-MM-DD
      dateTo?: string // Format: YYYY-MM-DD
      status?: string
      searchQuery?: string
    },
    sessionData?: any
  ): Promise<APIResponse> {
    // Build query string
    const params = new URLSearchParams()
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom)
    if (filters?.dateTo) params.append('dateTo', filters.dateTo)
    if (filters?.status && filters.status !== 'All Quotes') {
      params.append('status', filters.status)
    }
    if (filters?.searchQuery) params.append('search', filters.searchQuery)

    const queryString = params.toString()
    const endpoint = queryString
      ? `api/quotation/getallquotations?${queryString}`
      : 'api/quotation/getallquotations'

    return APIClient.get(endpoint, sessionData)
  }

  /**
   * Get a single quotation by ID
   * @param quotationId - The quotation ID
   * @param sessionData - Session data (REQUIRED)
   */
  static async getQuotation(
    quotationId: number,
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.get(`api/quotation/getquotation/${quotationId}`, sessionData)
  }

  /**
   * Update internal approval status for a quotation
   * @param params - Status update parameters
   * @param params.type - Type of approval update ('internalapproved')
   * @param params.status - New status ('Approve', 'Reject', 'Rework', 'Pending')
   * @param params.remarks - Remarks for the status change
   * @param params.BKID - Booking ID (quotation ID)
   * @param params.BKNo - Booking number (quote number)
   * @param params.InternalApprovedUserID - User ID who is approving
   * @param sessionData - Session data (REQUIRED)
   */
  static async updateInternalApprovalStatus(
    params: {
      type?: string
      status: 'Approve' | 'Reject' | 'Rework' | 'Pending' | 'PendingHOD' | 'PendingVH' | 'ReworkHOD' | 'ReworkVH' | 'RejectHOD' | 'RejectVH'
      remarks: string
      BKID: string | number
      BKNo: string
      InternalApprovedUserID: string | number
    },
    sessionData?: any
  ): Promise<APIResponse> {
    const requestBody = {
      type: params.type || 'internalapproved',
      status: params.status,
      remarks: params.remarks,
      BKID: String(params.BKID),
      BKNo: params.BKNo,
      InternalApprovedUserID: String(params.InternalApprovedUserID)
    }

    const response = await APIClient.post(
      'api/planwindow/internalapprovalupdatestatus',
      requestBody,
      sessionData
    )

    return response
  }

  /**
   * Update quotation status (legacy method - kept for backward compatibility)
   * @deprecated Use updateInternalApprovalStatus instead
   * @param quotationId - The quotation ID
   * @param newStatus - New status value
   * @param remarks - Optional remarks for the status change
   * @param sessionData - Session data (REQUIRED)
   */
  static async updateQuotationStatus(
    quotationId: number,
    newStatus: string,
    remarks?: string,
    sessionData?: any
  ): Promise<APIResponse> {
    const requestBody = {
      QuotationID: quotationId,
      Status: newStatus,
      Remarks: remarks || ''
    }

    return APIClient.post(
      'api/quotation/updatestatus',
      requestBody,
      sessionData
    )
  }

  /**
   * Delete a quotation
   * @param quotationId - The quotation ID
   * @param sessionData - Session data (REQUIRED)
   */
  static async deleteQuotation(
    quotationId: number,
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.post(
      `api/planwindow/DeleteQuotation/${quotationId}`,
      {},
      sessionData
    )
  }

  /**
   * Get the rich quotation list (header + paper details from primary plan row).
   * Endpoint: GET /api/planwindow/quotationList
   * Returns up to `top` rows; capped at 5000 server-side.
   */
  static async getQuotationList(
    sessionData?: any,
    options?: { fromDate?: string; toDate?: string; bookingId?: number; ledgerId?: number; top?: number }
  ): Promise<APIResponse> {
    const params = new URLSearchParams()
    if (options?.fromDate) params.set('fromDate', options.fromDate)
    if (options?.toDate) params.set('toDate', options.toDate)
    if (options?.bookingId) params.set('bookingId', String(options.bookingId))
    if (options?.ledgerId) params.set('ledgerId', String(options.ledgerId))
    if (options?.top) params.set('top', String(options.top))
    const qs = params.toString()
    return APIClient.get(`api/planwindow/quotationList${qs ? `?${qs}` : ''}`, sessionData)
  }

  /**
   * Get detail costing for a quotation
   * Returns 6 datasets: PlanType, DetailCostingName, QuoteCorrugationDetail,
   * QuoteCorrugationDetail1, DetailCostingQuantity, ViweQuantity, MaterialDetails1
   * @param bookingId - The booking ID
   * @param sessionData - Session data (REQUIRED)
   */
  static async getDetailCosting(
    bookingId: number,
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.get(
      `api/planwindowreport/detailcosting/${bookingId}`,
      sessionData
    )
  }

  /**
   * Fetch the FastReport Detail Costing PDF as a blob and open in new tab.
   * Calls the local .NET 10 backend (DetailsCostingController).
   * Uses fetch with full auth headers (Basic Auth + session headers).
   * @param bookingId - The booking ID
   * @param sessionData - Session data (REQUIRED)
   * @returns blob URL string on success, null on failure
   */
  static async fetchDetailCostingPdf(
    bookingId: number,
    sessionData?: any,
    template?: string | null
  ): Promise<{ success: boolean; blobUrl?: string; error?: string }> {
    const params = new URLSearchParams({ BN: String(bookingId) })
    const safeTemplate = (template || '').trim()
    if (safeTemplate) params.set('Template', safeTemplate)
    return QuotationAPI._fetchPdfBlob(
      `api/planwindowreport/detailcosting/pdf?${params.toString()}`,
      'GET', null, sessionData
    )
  }

  /**
   * Fetch the FastReport Costing Summary Details PDF as a blob.
   * Calls the local .NET 10 backend (DetailsSummeryCostingController).
   * @param bookingId - The booking ID
   * @param sessionData - Session data (REQUIRED)
   */
  static async fetchCostingSummaryDetailsPdf(
    bookingId: number,
    sessionData?: any
  ): Promise<{ success: boolean; blobUrl?: string; error?: string }> {
    const params = new URLSearchParams({ BN: String(bookingId) })
    return QuotationAPI._fetchPdfBlob(
      `api/planwindowreport/costingsummarydetails/pdf?${params.toString()}`,
      'GET', null, sessionData
    )
  }

  /**
   * Fetch Quote Mail PDF via FastReport (POST)
   * Accepts user-overridable fields (postal name, header/footer text, etc.)
   * Returns a blob URL for display in iframe or conversion to base64 for email.
   */
  static async fetchQuoteMailPdf(
    bookingId: number,
    params: {
      mailingName?: string
      attention?: string
      mailingAddress?: string
      quoteBy?: string
      designation?: string
      currencySymbol?: string
      conversionValue?: string
      isExportQuotation?: boolean
      headerText?: string
      footerText?: string
      processes?: string
      hideContentDetails?: boolean
      hideMaterialDetails?: boolean
      showSignature?: boolean
    },
    sessionData?: any
  ): Promise<{ success: boolean; blobUrl?: string; blob?: Blob; error?: string }> {
    const body = {
      BookingID: bookingId,
      MailingName: params.mailingName ?? '',
      Attention: params.attention ?? '',
      MailingAddress: params.mailingAddress ?? '',
      QuoteBy: params.quoteBy ?? '',
      Designation: params.designation ?? '',
      CurrencySymbol: params.currencySymbol ?? '',
      ConversionValue: params.conversionValue ?? '1',
      IsExportQuotation: params.isExportQuotation ?? false,
      HeaderText: params.headerText ?? '',
      FooterText: params.footerText ?? '',
      Processes: params.processes ?? '',
      HideContentDetails: params.hideContentDetails ?? false,
      HideMaterialDetails: params.hideMaterialDetails ?? false,
      ShowSignature: params.showSignature ?? false,
    }

    return QuotationAPI._fetchPdfBlob(
      'api/planwindowreport/quotemailpdf',
      'POST', body, sessionData
    )
  }

  /**
   * Shared helper: fetch a PDF blob from the standard API base URL.
   * Uses raw fetch (APIClient doesn't support blob responses).
   */
  private static async _fetchPdfBlob(
    endpoint: string,
    method: 'GET' | 'POST',
    body: any | null,
    sessionData?: any
  ): Promise<{ success: boolean; blobUrl?: string; blob?: Blob; error?: string }> {
    const url = buildAPIURL(endpoint)
    if (!url) return { success: false, error: 'API not configured' }

    const authHeader = getBasicAuthHeader()
    const user = sessionData?.user
    const companyId = user?.CompanyID || user?.companyID
    const userId = user?.UserID || user?.userID
    const productionUnitId = sessionData?.productionUnitId || user?.ProductionUnitID || user?.productionUnitID
    const fYear = sessionData?.fYear || user?.FYear || user?.fYear

    const headers: Record<string, string> = {
      ...(authHeader ? { 'Authorization': authHeader } : {}),
      ...(companyId ? { 'CompanyID': String(companyId) } : {}),
      ...(userId ? { 'UserID': String(userId) } : {}),
      ...(productionUnitId ? { 'ProductionUnitID': String(productionUnitId) } : {}),
      ...(fYear ? { 'FYear': String(fYear) } : {}),
    }

    const fetchOpts: RequestInit = { method, headers, signal: AbortSignal.timeout(120000) }
    if (method === 'POST' && body) {
      headers['Content-Type'] = 'application/json'
      fetchOpts.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, fetchOpts)
      if (!response.ok) {
        const errText = await response.text().catch(() => '')
        return { success: false, error: errText || `HTTP ${response.status}` }
      }
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      return { success: true, blobUrl, blob }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to fetch PDF' }
    }
  }

  /**
   * Get Quote Mail data — dedicated API with salesperson fallback
   * Returns TblQuotes (booking+mail details) and TblQuoteQties (qty+cost)
   */
  static async getMailQuoteData(
    bookingId: number,
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.get(
      `api/planwindow/GetMailQuoteData/${bookingId}`,
      sessionData
    )
  }

  /**
   * Get costing summary for a quotation
   * @param quotationId - The quotation ID
   * @param sessionData - Session data (REQUIRED)
   */
  static async getCostingSummary(
    quotationId: number,
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.get(
      `api/quotation/costingsummary/${quotationId}`,
      sessionData
    )
  }

  /**
   * Get detail costing for multiple quotations
   * Used for bulk printing or export
   * @param quotationIds - Array of quotation IDs
   * @param sessionData - Session data (REQUIRED)
   */
  static async getBulkDetailCosting(
    quotationIds: number[],
    sessionData?: any
  ): Promise<APIResponse> {
    const requestBody = {
      QuotationIDs: quotationIds
    }

    return APIClient.post(
      'api/quotation/bulkdetailcosting',
      requestBody,
      sessionData
    )
  }

  /**
   * Get costing summary for multiple quotations
   * Used for bulk printing or export
   * @param quotationIds - Array of quotation IDs
   * @param sessionData - Session data (REQUIRED)
   */
  static async getBulkCostingSummary(
    quotationIds: number[],
    sessionData?: any
  ): Promise<APIResponse> {
    const requestBody = {
      QuotationIDs: quotationIds
    }

    return APIClient.post(
      'api/quotation/bulkcostingsummary',
      requestBody,
      sessionData
    )
  }

  /**
   * Export quotations to Excel/PDF
   * @param quotationIds - Array of quotation IDs to export
   * @param format - Export format ('excel' | 'pdf')
   * @param sessionData - Session data (REQUIRED)
   */
  static async exportQuotations(
    quotationIds: number[],
    format: 'excel' | 'pdf' = 'excel',
    sessionData?: any
  ): Promise<APIResponse> {
    const requestBody = {
      QuotationIDs: quotationIds,
      Format: format
    }

    return APIClient.post(
      'api/quotation/export',
      requestBody,
      sessionData
    )
  }

  // ─── Cost Approval (Price Approval) APIs ───

  private static get priceApprovalBase(): string {
    return process.env.NEXT_PUBLIC_API_BASE_URL || ''
  }

  /**
   * Get the next approval number for a new price approval
   * Returns format: "A/{FYear}/{sequence:D4}" (e.g., "A/2025-2026/0001")
   */
  static async getPriceApprovalEnquiryNo(
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.post(
      'api/PriceApproval/PriceApprovalEnquiryNo',
      {},
      sessionData,
      QuotationAPI.priceApprovalBase
    )
  }

  /**
   * Get company configurations for price approval
   * Returns permissions, currency settings, cost estimation method, etc.
   */
  static async getCompanyConfigurations(
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.post(
      'api/PriceApproval/GetCompanyConfigurations',
      {},
      sessionData,
      QuotationAPI.priceApprovalBase
    )
  }

  /**
   * Get user permissions for Price Approval (CanView, CanSave, CanEdit, CanDelete)
   */
  static async getPriceApprovalUserPermissions(
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.post(
      'api/PriceApproval/GetUserPermissions',
      {},
      sessionData,
      QuotationAPI.priceApprovalBase
    )
  }

  /**
   * Load quotes pending for price approval (not yet approved/booked)
   * Returns JobBooking records with IsSendForPriceApproval=1
   */
  static async getPriceApprovalQuoteLoad(
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.post(
      'api/PriceApproval/PriceApprovalQuoteLoad',
      {},
      sessionData,
      QuotationAPI.priceApprovalBase
    )
  }

  /**
   * Get ALL active quotes for price approval (no IsSendForPriceApproval filter)
   * Used for the Pending tab on the standalone Price Approval page
   */
  static async getPriceApprovalAllActiveQuoteLoad(
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.post(
      'api/PriceApproval/PriceApprovalAllActiveQuoteLoad',
      {},
      sessionData,
      QuotationAPI.priceApprovalBase
    )
  }

  /**
   * Get all approved price records (showlist)
   * Returns existing price approvals from JobApprovedCost
   */
  static async getPriceApprovalShowlist(
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.post(
      'api/PriceApproval/PriceApprovalShowlist',
      {},
      sessionData,
      QuotationAPI.priceApprovalBase
    )
  }

  /**
   * Load all data needed for the approval window.
   * Calls CheckPriceApprovalWithSameBookingID to determine Flag,
   * then GridDataForApprovalWindow + PriceApprovalEnquiryNo in parallel.
   * Returns: { isUpdate, approvalNo, existingApproval, costingRows }
   */
  static async loadApprovalWindow(
    bookingId: number,
    sessionData?: any
  ): Promise<APIResponse> {
    try {
      // Step 1: Check if an existing approval exists for this booking
      const checkRes = await QuotationAPI.checkPriceApprovalWithSameBookingID(bookingId, sessionData)

      let isUpdate = false
      let existingApproval: any = null

      if (checkRes.success && checkRes.data) {
        const checkData = checkRes.data
        // "0" or empty = no existing approval → Flag "false" (new)
        // Otherwise returns existing approval data → Flag "true" (update)
        if (checkData !== '0' && checkData !== 0) {
          // If the existing approval has the same BookingID, it's an update
          const existing = Array.isArray(checkData) ? checkData[0] : checkData
          if (existing?.BookingID === bookingId) {
            isUpdate = true
          } else if (existing?.BookingID) {
            existingApproval = existing
          }
        }
      }

      const flag = isUpdate ? 'true' : 'false'

      // Step 2: Fetch grid data and approval number in parallel
      const [gridRes, enquiryRes] = await Promise.all([
        QuotationAPI.getGridDataForApprovalWindow(bookingId, flag, sessionData),
        QuotationAPI.getPriceApprovalEnquiryNo(sessionData),
      ])

      if (!gridRes.success) {
        return gridRes // Return the error as-is
      }

      const approvalNo = isUpdate
        ? '' // Update mode uses existing approval number from showlist
        : (enquiryRes.success ? enquiryRes.data : '')

      return {
        success: true,
        data: {
          isUpdate,
          approvalNo,
          existingApproval,
          costingRows: gridRes.data,
        },
      } as APIResponse
    } catch (error: any) {
      return { success: false, data: null, error: error.message } as APIResponse
    }
  }

  /**
   * Get costing grid data for the approval window
   * @param bookingId - The booking ID
   * @param flag - "false" for new/pending, "true" for existing approval
   */
  static async getGridDataForApprovalWindow(
    bookingId: number,
    flag: string,
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.post(
      'api/PriceApproval/GridDataForApprovalWindow',
      { BookingID: bookingId, Flag: flag },
      sessionData,
      QuotationAPI.priceApprovalBase
    )
  }

  /**
   * Check if a parent booking already has a non-blocked price approval
   * Returns approval data or "0" if none
   */
  static async checkPriceApprovalWithSameBookingID(
    bookingId: number,
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.post(
      'api/PriceApproval/CheckPriceApprovalWithSameBookingID',
      { BookingID: bookingId },
      sessionData,
      QuotationAPI.priceApprovalBase
    )
  }

  /**
   * Block old price approval and transfer ProductMaster to new booking
   */
  static async blockPriceApprovalWithSameBookingID(
    bookingId: number,
    bookingIdNew: number,
    bookingNo: string,
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.post(
      'api/PriceApproval/BlockPriceApprovalWithSameBookingID',
      { BookingID: bookingId, BookingIDN: bookingIdNew, BookingNo: bookingNo },
      sessionData,
      QuotationAPI.priceApprovalBase
    )
  }

  /**
   * Save or update price approval data
   * @param paData - The approval data object
   * @param bookingId - The booking ID
   * @param flag - "false" for insert (new), "true" for update
   */
  static async savePriceApprovalData(
    paData: Record<string, any>,
    bookingId: number,
    flag: string,
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.post(
      'api/PriceApproval/SavePriceApprovalData',
      { PAData: paData, BKID: bookingId, Flag: flag },
      sessionData,
      QuotationAPI.priceApprovalBase
    )
  }

  /**
   * Soft-delete a price approval and reset IsApproved=0 on JobBooking
   * Returns "Success", "false" (linked records exist), or error
   */
  static async deletePriceApproval(
    bookingId: number,
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.post(
      'api/PriceApproval/DeletePriceApproval',
      { BookingID: bookingId },
      sessionData,
      QuotationAPI.priceApprovalBase
    )
  }

  /**
   * Get comment data for price approval
   */
  static async getCommentData(
    params: {
      bookingIDs?: string
      productMasterIDs?: string
      salesOrderNo?: string
      priceApprovalNo?: string
      moduleName: string
    },
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.post(
      'api/PriceApproval/GetCommentData',
      {
        bookingIDs: params.bookingIDs || '',
        productMasterIDs: params.productMasterIDs || '',
        salesOrderNo: params.salesOrderNo || '',
        priceApprovalNo: params.priceApprovalNo || '',
        moduleName: params.moduleName
      },
      sessionData,
      QuotationAPI.priceApprovalBase
    )
  }

  /**
   * Save comment data for price approval
   */
  static async saveCommentData(
    params: {
      commentDetail: Record<string, any>
      salesOrderNo?: string
      priceApprovalNo?: string
      moduleName: string
    },
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.post(
      'api/PriceApproval/SaveCommentData',
      {
        jsonObjectCommentDetail: params.commentDetail,
        salesOrderNo: params.salesOrderNo || '',
        priceApprovalNo: params.priceApprovalNo || '',
        moduleName: params.moduleName
      },
      sessionData,
      QuotationAPI.priceApprovalBase
    )
  }

  // ─── Client (External) Approval APIs ───

  /**
   * Send quotation for client/price approval
   * Sets IsSendForPriceApproval=1 on JobBooking
   * @param bookingId - The booking ID (can be comma-separated for bulk)
   */
  static async updateSendForApproval(
    bookingId: string | number,
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.post(
      `api/planwindow/UpdateSendForApproval/${bookingId}`,
      {},
      sessionData
    )
  }

  /**
   * Unsend quotation from client/price approval
   * Sets IsSendForPriceApproval=0 on JobBooking
   * @param bookingId - The booking ID (can be comma-separated for bulk)
   */
  static async updateUnSendForApproval(
    bookingId: string | number,
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.post(
      `api/planwindow/UpdateUnSendForApproval/${bookingId}`,
      {},
      sessionData
    )
  }

  /**
   * Update quotation status directly (simple Status field update)
   * Used for client-side approve/reject workflow
   * @param bookingId - The booking ID
   * @param status - New status string
   */
  static async updateQuoteStatus(
    bookingId: string | number,
    status: string,
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.post(
      'api/planwindow/updateqoutestatus',
      { BookingID: String(bookingId), Status: status },
      sessionData
    )
  }

  /**
   * Generate Quote Revision with a target price
   * Creates a new revision of the quotation, adjusting profit % so the final
   * quoted cost matches the target. Used by the "User" role for quick revisions
   * without opening the full estimation page.
   * Endpoint: POST /api/planwindow/generatequoterevision
   * @param bookingId - The booking ID of the quote to revise
   * @param targetedCost - The target price the user wants the new quote to match
   * @param typeOfCost - The TypeOfCost from the quotation (Unit Cost / Cost/100 / Cost/1000)
   * @param status - The current quotation Status (from backend)
   */
  static async generateQuoteRevision(
    bookingId: string | number,
    targetedCosts: { PlanContQty: number; TargetedCost: number }[],
    typeOfCost: string,
    status: string,
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.post(
      'api/planwindow/generatequoterevision',
      { BookingID: Number(bookingId), TargetedCosts: targetedCosts, TypeOfCost: typeOfCost, Status: status },
      sessionData
    )
  }

}
