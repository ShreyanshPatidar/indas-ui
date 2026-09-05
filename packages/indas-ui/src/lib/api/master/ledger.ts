// Ledger Master API
// Handles all ledger master operations

import APIClient from '../core/client'
import type { APIResponse } from '../core/types'

/**
 * Master Group interface for masterlist endpoint response
 */
export interface LedgerMasterGroup {
  LedgerGroupID: number
  LedgerGroupName: string
  LedgerGroupNameDisplay: string
  LedgerGroupNameID: number
  GridColumnName: string
  GridColumnHide: string
}

/**
 * Ledger Master API class
 */
export class LedgerMasterAPI {
  /**
   * Get all ledgers from the database (without filtering by group)
   * Endpoint: GET /api/ledgermaster/ledgermaster
   * Returns all ledgers across all groups
   * Note: Usually you want to use getGridData() instead to get ledgers for a specific group
   */
  static async getLedgers(sessionData?: any): Promise<APIResponse> {
    try {
      const response = await APIClient.get('api/ledgermaster/ledgermaster', sessionData)
      return response
    } catch (error) {
      console.error('❌ [LEDGER_API] getLedgers error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch all ledgers'
      }
    }
  }

  /**
   * Create a new ledger (alternative create endpoint)
   * Endpoint: POST /api/ledgermaster/ledgermaster
   * Alternative to saveLedger() - different endpoint but same functionality
   * Request body: Ledger data object
   * Response: Success message or error
   */
  static async createLedger(ledgerData: any, sessionData?: any): Promise<APIResponse> {
    try {
      const response = await APIClient.post('api/ledgermaster/ledgermaster', ledgerData, sessionData)
      return response
    } catch (error) {
      console.error('❌ [LEDGER_API] createLedger error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create ledger'
      }
    }
  }

  /**
   * Save a new ledger (preferred create endpoint)
   * Endpoint: POST /api/ledgermaster/save
   * Uses POST method with specific request body format
   * Request body format:
   * {
   *   CostingDataLedgerMaster: [{ ...ledgerFields }],
   *   LedgerGroupID: number,
   *   LedgerRefCode: string
   * }
   * Response format: "Success"
   */
  static async saveLedger(
    ledgerData: {
      CostingDataLedgerMaster: any[]
      LedgerGroupID: number
      LedgerRefCode: string
    },
    sessionData?: any
  ): Promise<APIResponse<string>> {
    try {
      const response = await APIClient.post<string>('api/ledgermaster/save', ledgerData, sessionData)
      return response
    } catch (error) {
      console.error('❌ [LEDGER_API] saveLedger error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save ledger'
      }
    }
  }

  /**
   * Update an existing ledger
   * Endpoint: POST /api/ledgermaster/update
   * Uses POST method with specific request body format
   * Request body format:
   * {
   *   CostingDataLedgerMaster: [{ ...ledgerFields }],
   *   LedgerID: string,
   *   UnderGroupID: string,
   *   LedgerRefCode: string
   * }
   * Response format: "Success"
   */
  static async updateLedger(
    ledgerId: string,
    ledgerData: {
      CostingDataLedgerMaster: any[]
      LedgerID: string
      UnderGroupID: string
      LedgerRefCode: string
    },
    sessionData?: any
  ): Promise<APIResponse<string>> {
    try {
      const response = await APIClient.post<string>('api/ledgermaster/update', ledgerData, sessionData)
      return response
    } catch (error) {
      console.error('❌ [LEDGER_API] updateLedger error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update ledger'
      }
    }
  }

  /**
   * Delete a ledger
   * Endpoint: POST /api/ledgermaster/deleteledger
   * Response format: "Success"
   */
  static async deleteLedger(ledgerId: number, ledgerGroupId: number, sessionData?: any): Promise<APIResponse<string>> {
    try {
      const response = await APIClient.post<string>(`api/ledgermaster/deleteledger?ledgerID=${ledgerId}&ledgergroupID=${ledgerGroupId}`, {}, sessionData)
      return response
    } catch (error) {
      console.error('❌ [LEDGER_API] deleteLedger error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete ledger'
      }
    }
  }

  /**
   * Mark a pending lead bundle (Customer hub row) as sent to Finance for approval.
   * Endpoint: POST /api/ledgermaster/send-for-approval
   */
  static async sendForApproval(ledgerId: number, sessionData?: any): Promise<APIResponse<string>> {
    try {
      return await APIClient.post<string>(`api/ledgermaster/send-for-approval?ledgerID=${ledgerId}`, {}, sessionData)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send for approval'
      }
    }
  }

  /**
   * Get finance onboarding-score inputs for a customer/lead from their latest booking.
   * Endpoint: GET /api/ledgermaster/onboarding-score-data/{ledgerID}
   * Returns: { BookingID, CreditDays, AnnualQuantity, OrderQuantity, GrandTotal, FinalCost,
   *            ProfitPercentage, TotalUps, TotalWeight, PSR, PKR, AnnualRevenueLacs }
   */
  /**
   * List a customer's bookings (BookingID + a label) for the finance approval booking picker.
   * Endpoint: GET /api/ledgermaster/customer-bookings/{ledgerID}
   */
  static async getCustomerBookings(ledgerId: number, sessionData?: any): Promise<APIResponse> {
    try {
      return await APIClient.get(`api/ledgermaster/customer-bookings/${ledgerId}`, sessionData)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch customer bookings'
      }
    }
  }

  static async getOnboardingScoreData(ledgerId: number, sessionData?: any, bookingId?: number): Promise<APIResponse> {
    try {
      const query = bookingId != null ? `?bookingID=${bookingId}` : ''
      return await APIClient.get(`api/ledgermaster/onboarding-score-data/${ledgerId}${query}`, sessionData)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch onboarding score data'
      }
    }
  }

  /**
   * Approve a lead bundle: flips IsLead 1->0 on the Customer + linked Parent + Consignee(s).
   * Endpoint: POST /api/ledgermaster/approve-lead
   */
  static async approveLead(ledgerId: number, sessionData?: any): Promise<APIResponse<string>> {
    try {
      return await APIClient.post<string>(`api/ledgermaster/approve-lead?ledgerID=${ledgerId}`, {}, sessionData)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to approve lead'
      }
    }
  }

  /**
   * Vertical Head approval: advances a lead to the Finance queue by setting IsHeadApproved=1.
   * Does NOT touch IsLead. Endpoint: POST /api/ledgermaster/vh-approve-lead
   */
  static async vhApproveLead(ledgerId: number, sessionData?: any): Promise<APIResponse<string>> {
    try {
      return await APIClient.post<string>(`api/ledgermaster/vh-approve-lead?ledgerID=${ledgerId}`, {}, sessionData)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to VH-approve lead'
      }
    }
  }

  /**
   * Reject a lead bundle (Finance declines): clears SentForApproval so it returns to the
   * sales user's drafts. IsLead stays 1.
   * Endpoint: POST /api/ledgermaster/reject-lead
   */
  static async rejectLead(ledgerId: number, sessionData?: any): Promise<APIResponse<string>> {
    try {
      return await APIClient.post<string>(`api/ledgermaster/reject-lead?ledgerID=${ledgerId}`, {}, sessionData)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reject lead'
      }
    }
  }

  /**
   * Get a single ledger by ID
   * Endpoint: GET /api/ledgermaster/ledgermaster/{ledgerId}
   * Returns full ledger details for the specified ID
   */
  static async getLedger(ledgerId: string, sessionData?: any): Promise<APIResponse> {
    try {
      const response = await APIClient.get(`api/ledgermaster/ledgermaster/${ledgerId}`, sessionData)
      return response
    } catch (error) {
      console.error('❌ [LEDGER_API] getLedger error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch ledger details'
      }
    }
  }

  /**
   * Get master groups with grid column configuration
   * Endpoint: GET /api/ledgermaster/masterlist
   * Returns array of ledger master groups with grid configuration
   */
  static async getMasterGroups(sessionData?: any): Promise<APIResponse<LedgerMasterGroup[]>> {
    try {
      const response = await APIClient.get<LedgerMasterGroup[]>('api/ledgermaster/masterlist', sessionData)
      return response
    } catch (error) {
      console.error('❌ [LEDGER_API] getMasterGroups error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch master groups'
      }
    }
  }

  /**
   * Get master fields configuration for creating/editing ledgers
   * Endpoint: GET /api/ledgermaster/getmasterfields/{masterID}
   * Returns form field configuration for the specified master group
   */
  static async getMasterFields(masterID: number, sessionData?: any): Promise<APIResponse> {
    try {
      const response = await APIClient.get(`api/ledgermaster/getmasterfields/${masterID}`, sessionData)
      return response
    } catch (error) {
      console.error('❌ [LEDGER_API] getMasterFields error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch master fields'
      }
    }
  }

  /**
   * Get grid data for a specific master group
   * Endpoint: GET /api/ledgermaster/grid/{masterID}
   * Returns all ledger records for the specified master group
   */
  static async getGridData(masterID: number, sessionData?: any): Promise<APIResponse> {
    try {
      const response = await APIClient.get(`api/ledgermaster/grid/${masterID}`, sessionData)
      return response
    } catch (error) {
      console.error('❌ [LEDGER_API] getGridData error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch grid data'
      }
    }
  }

  /**
   * Load selectbox options for multiple fields
   * Endpoint: POST /api/ledgermaster/selectboxload
   * Request body: Array of field definitions
   * Returns dropdown options for specified fields
   */
  static async loadSelectBoxOptions(
    fields: Array<{ FieldID: string; FieldName: string }>,
    sessionData?: any
  ): Promise<APIResponse> {
    try {
      const response = await APIClient.post('api/ledgermaster/selectboxload', fields, sessionData)
      return response
    } catch (error) {
      console.error('❌ [LEDGER_API] loadSelectBoxOptions error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load selectbox options'
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // KAM Customer Shift endpoints
  // ─────────────────────────────────────────────────────────────

  /**
   * Get all salespersons (ledger group 24).
   * Endpoint: GET /api/ledgermaster/sales-persons
   */
  static async getSalesPersons(sessionData?: any): Promise<APIResponse> {
    try {
      return await APIClient.get('api/ledgermaster/sales-persons', sessionData)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch sales persons'
      }
    }
  }

  /**
   * Get customers currently assigned to a salesperson.
   * Endpoint: GET /api/ledgermaster/customers-by-salesperson/{salesPersonLedgerId}
   */
  static async getCustomersBySalesPerson(
    salesPersonLedgerId: number,
    sessionData?: any
  ): Promise<APIResponse> {
    try {
      return await APIClient.get(
        `api/ledgermaster/customers-by-salesperson/${salesPersonLedgerId}`,
        sessionData
      )
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch customers'
      }
    }
  }

  /**
   * Bulk reassign customers from one or more KAMs to one or more new KAMs.
   * Admin-only on the server; non-admin gets 403.
   * Endpoint: POST /api/ledgermaster/reassign-salesperson
   */
  static async reassignSalesPerson(
    payload: {
      Assignments: Array<{
        LedgerID: number
        NewSalesPersonLedgerID: number
        ExpectedOldSalesPersonID: number
      }>
      Reason?: string
    },
    sessionData?: any
  ): Promise<APIResponse> {
    try {
      return await APIClient.post(
        'api/ledgermaster/reassign-salesperson',
        payload,
        sessionData
      )
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reassign customers'
      }
    }
  }

  static async getConcernPersons(ledgerId: number, sessionData?: any): Promise<APIResponse<any[]>> {
    try {
      return await APIClient.get<any[]>(`api/ledgermaster/concern-persons/${ledgerId}`, sessionData)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch concern persons',
        data: []
      }
    }
  }

  static async saveConcernPersons(
    ledgerId: number,
    persons: Array<{ Name: string; Mobile: string; Email: string; Designation: string; IsPrimaryConcernPerson: number }>,
    sessionData?: any
  ): Promise<APIResponse<string>> {
    try {
      return await APIClient.post<string>('api/ledgermaster/save-concern-person-data', {
        LedgerID: ledgerId,
        CostingDataSlab: persons,
        CostingDataSlabUpdate: []
      }, sessionData)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save concern persons'
      }
    }
  }

  static async deleteAllConcernPersons(ledgerId: number, sessionData?: any): Promise<APIResponse<string>> {
    try {
      return await APIClient.post<string>('api/ledgermaster/delete-concern-person-data', {
        LedgerID: ledgerId
      }, sessionData)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete concern persons'
      }
    }
  }
}
