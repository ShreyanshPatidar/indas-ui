// Estimation Machines API
// Handles machine grid data for estimation

import APIClient from '../core/client'
import type { APIResponse, MachineData } from '../core/types'

/**
 * Get machine grid data
 * @param sessionData - Session data containing user and company info
 * @returns Promise with machine data array
 */
export async function getMachineGridAPI(sessionData?: any): Promise<APIResponse<MachineData[]>> {
  try {
    const endpoint = 'api/planwindow/machigrid'
    const response = await APIClient.get<MachineData[]>(endpoint, sessionData)
    return response
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch machine grid: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
