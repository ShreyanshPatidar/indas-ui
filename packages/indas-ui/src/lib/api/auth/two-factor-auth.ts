/**
 * Trusted IP API for 2FA
 * Simple CRUD: getlist, save, delete + checkip helper
 */

import APIClient from '@/lib/api/core/client'

// Types
export interface TrustedIP {
  TrustedIPID: number
  CompanyID: number
  IPAddress: string
  Description: string | null
  IsActive: boolean
  CreatedBy: number
  CreatedDate: string
}

/**
 * Get all trusted IPs for company
 * GET api/security/trustedip/getlist
 */
export async function getTrustedIPs(session?: any): Promise<TrustedIP[]> {
  try {
    const response = await APIClient.get('api/security/trustedip/getlist', session)
    return response.data || []
  } catch (error) {
    return []
  }
}

/**
 * Save trusted IP (insert or update)
 * POST api/security/trustedip/save
 */
export async function saveTrustedIP(
  data: {
    TrustedIPID?: number
    CompanyID: number
    IPAddress: string
    Description: string
    CreatedBy: number
  },
  session?: any
): Promise<{ success: boolean; message: string; TrustedIPID?: number }> {
  try {
    const response = await APIClient.post(
      'api/security/trustedip/save',
      {
        TrustedIPID: data.TrustedIPID || 0,
        CompanyID: data.CompanyID,
        IPAddress: data.IPAddress,
        Description: data.Description,
        CreatedBy: data.CreatedBy
      },
      session
    )
    return {
      success: response.success,
      message: response.data?.Message || response.message || '',
      TrustedIPID: response.data?.TrustedIPID
    }
  } catch (error) {
    return { success: false, message: 'Failed to save trusted IP' }
  }
}

/**
 * Delete trusted IP
 * POST api/security/trustedip/delete?id=1
 */
export async function deleteTrustedIP(
  id: number,
  session?: any
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await APIClient.post(`api/security/trustedip/delete?id=${id}`, {}, session)
    return {
      success: response.success,
      message: response.data?.Message || response.message || ''
    }
  } catch (error) {
    return { success: false, message: 'Failed to delete trusted IP' }
  }
}

/**
 * Check if current IP is trusted
 * GET api/security/trustedip/checkip
 */
export async function checkTrustedIP(
  session?: any
): Promise<{ IsTrusted: boolean; IPAddress: string; Message: string }> {
  try {
    const response = await APIClient.get('api/security/trustedip/checkip', session)
    return response.data || { IsTrusted: false, IPAddress: 'Unknown', Message: 'Failed to check' }
  } catch (error) {
    return { IsTrusted: false, IPAddress: 'Unknown', Message: 'Failed to check' }
  }
}

/**
 * Get current IP address
 * GET api/security/trustedip/myip
 */
export async function getMyIP(session?: any): Promise<string> {
  try {
    const response = await APIClient.get('api/security/trustedip/myip', session)
    return response.data?.IPAddress || 'Unknown'
  } catch (error) {
    return 'Unknown'
  }
}
