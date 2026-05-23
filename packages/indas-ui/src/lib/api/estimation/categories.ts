// Estimation Categories API
// Handles categories, clients, and sales persons for estimation

import APIClient from '../core/client'
import type { APIResponse, Category, Client, SalesPerson } from '../core/types'

/**
 * Get all categories
 * @param sessionData - Session data containing user and company info
 * @returns Promise with categories array
 */
export async function getCategoriesAPI(sessionData?: any): Promise<APIResponse<Category[]>> {
  try {
    const endpoint = 'api/planwindow/GetSbCategory'
    const response = await APIClient.get<Category[]>(endpoint, sessionData)
    return response
  } catch (error) {
    console.error('❌ [getCategoriesAPI] Caught error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch categories'
    }
  }
}

/**
 * Get all clients
 * @param sessionData - Session data containing user and company info
 * @returns Promise with clients array
 */
export async function getClientsAPI(sessionData?: any): Promise<APIResponse<Client[]>> {
  try {
    const endpoint = 'api/planwindow/GetSbClient'
    const response = await APIClient.get<Client[]>(endpoint, sessionData)
    return response
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch clients'
    }
  }
}

/**
 * Get all sales persons
 * @param sessionData - Session data containing user and company info
 * @returns Promise with sales persons array
 */
export async function getSalesPersonsAPI(sessionData?: any): Promise<APIResponse<SalesPerson[]>> {
  try {
    const endpoint = 'api/planwindow/getsbsalesperson'
    const response = await APIClient.get<SalesPerson[]>(endpoint, sessionData)
    return response
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch sales persons'
    }
  }
}

/**
 * Get the salesperson assigned to a specific client (LedgerMaster.RefSalesRepresentativeID).
 * Returns { EmployeeID, EmployeeName } when the client has an assignment,
 * or null when there is no assignment (caller should keep the existing list).
 */
export async function getSalesPersonForClientAPI(
  ledgerId: number,
  sessionData?: any
): Promise<APIResponse<{ EmployeeID: number; EmployeeName: string } | null>> {
  try {
    const endpoint = `api/planwindow/getsbsalespersondata/${ledgerId}`
    const response = await APIClient.get<unknown>(endpoint, sessionData)
    if (!response.success) {
      return { success: false, error: response.error || 'Failed to fetch salesperson for client' }
    }

    // Backend body is a (possibly double-encoded) JSON string, or the literal "500" on error.
    let rows: any[] = []
    const raw = response.data
    if (typeof raw === 'string') {
      if (raw.trim() === '500' || raw.trim() === '"500"') return { success: true, data: null }
      try {
        const once = JSON.parse(raw)
        rows = typeof once === 'string' ? JSON.parse(once) : once
      } catch { rows = [] }
    } else if (Array.isArray(raw)) {
      rows = raw
    }

    if (!Array.isArray(rows) || rows.length === 0) return { success: true, data: null }

    // Auto-pick discriminator: a single row with LedgerID > 0 means the client has an assigned salesperson.
    // Anything else is the fallback list — treat as "no assignment".
    if (rows.length === 1 && Number(rows[0].LedgerID) > 0) {
      return { success: true, data: { EmployeeID: Number(rows[0].EmployeeID), EmployeeName: String(rows[0].EmployeeName || '') } }
    }
    return { success: true, data: null }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch salesperson for client'
    }
  }
}
