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
}
