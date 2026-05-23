/**
 * Wastage API Module
 *
 * Handles wastage type retrieval and slab calculations for estimation
 */

import APIClient from '@/lib/api/core/client'

// ============================================================================
// Types
// ============================================================================

export interface WastageType {
  WastageType: string
}

export interface WastageTypeSlab {
  ID: number
  WastageCode: string
  WastageType: string
  WastagePer: number
  WastagePerFluted: number
  IsCorrugated: number // 0 = Corrugation button disabled, 1 = Corrugation button enabled
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get all available wastage types
 *
 * @param session - Session data containing auth credentials and company context
 * @returns Array of wastage types
 *
 * @example
 * const wastageTypes = await getAllWastageTypes(session)
 * // Returns: [{ WastageType: "PLDP" }, { WastageType: "PUVDP" }, ...]
 */
export async function getAllWastageTypes(session: any) {
  const response = await APIClient.get<WastageType[]>(
    '/api/planwindow/getallwastagetypes',
    session
  )
  return response
}

/**
 * Get wastage type slab data for specific actual sheet count and wastage type
 *
 * @param actualSheet - The actual sheet count
 * @param wastageType - The wastage type (e.g., "PVDP", "PUVDP", "PLDP")
 * @param session - Session data containing auth credentials and company context
 * @returns Array of wastage slab data
 *
 * @example
 * const slabs = await getWastageTypeSlab(1000, "PUVDP", session)
 * // Returns: [{ ID: 8, WastageCode: "PUVDP1", WastageType: "PUVDP", WastagePer: 44 }]
 */
export async function getWastageTypeSlab(
  actualSheet: number,
  wastageType: string,
  session: any
) {
  const response = await APIClient.get<WastageTypeSlab[]>(
    `/api/planwindow/getwastagetypeslab/${actualSheet}/${wastageType}`,
    session
  )
  return response
}
