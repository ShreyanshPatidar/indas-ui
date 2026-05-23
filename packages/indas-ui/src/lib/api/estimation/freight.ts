// Freight API
// Handles freight-related operations for estimation module

import APIClient from '../core/client'
import type { APIResponse } from '../core/types'

export interface FreightLocation {
  ProductionUnitID: number
  State: string
  Location: string
  FreightRate: number
}

/**
 * Get all freight locations with rates
 * @param productionUnitId - Production Unit ID from dropdown (not from session)
 */
export async function getFreightLocations(
  productionUnitId: number,
  session: any
): Promise<APIResponse<FreightLocation[]>> {
  return APIClient.get<FreightLocation[]>(
    `/api/planwindow/freight/locations?productionUnitId=${productionUnitId}`,
    session
  )
}
