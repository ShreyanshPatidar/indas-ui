// Freight API
// Handles freight-related operations for estimation module

import APIClient from '../core/client'
import type { APIResponse } from '../core/types'

export interface FreightLocation {
  ProductionUnitID: number
  State: string
  Location: string
  /** Full-truck rate per kg (sheet: FLAT → Truck Load). */
  FreightRate: number
  /** Part-load rate per kg (sheet: FLAT → Part Load). */
  PartLoadKgRate?: number
  /** Part-load flat amount (sheet: Formed → Part Load). */
  FreightPerShipper?: number
  Truck1Rate?: number
  Truck2Rate?: number
  Truck3Rate?: number
  Truck4Rate?: number
  Truck5Rate?: number
}

export interface TruckRateSlot {
  /** 'Truck1'..'Truck5' — which TruckNRate column on FreightRateMaster */
  Slot: string
  /** ContainerMaster row (Category='Truck') this slot holds rates for */
  ContainerID: number
  ContainerName: string
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

/**
 * Per-plant mapping of FreightRateMaster TruckNRate columns to trucks
 * (ERPParameterSetting, ParameterType='TruckRateColumnMapping')
 */
export async function getTruckRateMapping(
  productionUnitId: number,
  session: any
): Promise<APIResponse<TruckRateSlot[]>> {
  return APIClient.get<TruckRateSlot[]>(
    `/api/planwindow/freight/truck-mapping?productionUnitId=${productionUnitId}`,
    session
  )
}
