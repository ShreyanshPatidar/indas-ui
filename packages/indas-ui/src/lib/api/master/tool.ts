/**
 * Tool/Die Master API
 * Handles die search and tool management operations
 */

import APIClient from '@/lib/api/core/client'
import { handleAPIResponse } from '@/lib/api'
import type { Session } from 'next-auth'

export interface DieSearchParams {
  length: number
  lengthTolerance: number
  width: number
  widthTolerance: number
  height: number
  heightTolerance: number
}

export interface DieData {
  ToolID: number
  ToolCode: string
  ToolName: string
  ToolDescription: string
  LedgerName: string
  SizeL: number
  SizeW: number
  SizeH: number
  UpsL: number
  UpsW: number
  TotalUps: number
  Manufecturer: string
}

/**
 * Search for dies based on dimensions and tolerance
 * Endpoint: POST /api/planwindow/GetDieMaster
 */
export async function searchDies(
  params: DieSearchParams,
  session: Session | null
): Promise<{ success: boolean; data?: DieData[]; error?: string }> {
  try {
    if (!session) {
      return { success: false, error: 'No active session' }
    }

    const response = await APIClient.post<DieData[]>(
      'api/planwindow/GetDieMaster',
      {
        L: params.length,
        L1: params.lengthTolerance,
        W: params.width,
        W1: params.widthTolerance,
        H: params.height,
        H1: params.heightTolerance
      },
      session
    )

    // API returns array directly, not wrapped in an object
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data
      }
    } else {
      return {
        success: false,
        error: response.error || 'Failed to search dies'
      }
    }
  } catch (error) {
    console.error('Error searching dies:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search dies'
    }
  }
}

/**
 * Get all available dies/tools
 */
export async function getAllDies(
  session: Session | null
): Promise<{ success: boolean; data?: DieData[]; error?: string }> {
  try {
    if (!session) {
      return { success: false, error: 'No active session' }
    }

    // TODO: Replace with actual API endpoint
    const response = await APIClient.get<DieData[]>('api/toolmaster/getalldies', session)

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data
      }
    } else {
      return {
        success: false,
        error: response.error || 'Failed to fetch dies'
      }
    }
  } catch (error) {
    console.error('Error fetching all dies:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dies'
    }
  }
}

export const ToolMasterAPI = {
  searchDies,
  getAllDies
}
