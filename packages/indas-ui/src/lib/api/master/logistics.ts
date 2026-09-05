// Logistics Master API
// Container / Truck, Pallet, Port and Freight Rate maintenance.
//
// Reads reuse the endpoints Shipper Planning already calls, so both surfaces
// always agree on what a container or pallet looks like. Writes go to the
// LogisticsMaster controller. Save/update/delete return the bare strings
// "Success" | "Exist" | "Error: ..." — callers must inspect the payload, since
// the backend answers 200 even for failures.

import APIClient from '../core/client'
import type { APIResponse } from '../core/types'

/** Trucks are ContainerMaster rows; Category is what separates the two tabs. */
export type ContainerCategory = 'Container' | 'Truck'

export interface LogisticsContainer {
  ContainerID: number
  ContainerName: string
  Category: ContainerCategory
  LengthMM: number
  WidthMM: number
  HeightMM: number
  LengthCM: number
  WidthCM: number
  HeightCM: number
  LengthFT: number
  WidthFT: number
  HeightFT: number
  MaxWeight: number
  ShippingRatePerCBM?: number
  CompanyID?: number
  ProductionUnitID?: number | null
}

export interface LogisticsPallet {
  PalletID: number
  PalletName: string
  LengthMM: number
  WidthMM: number
  TareHeightMM: number
  MaxLoadedHeightMM: number
  TareWeightKG: number
  MaxLoadWeightKG: number
  PalletRate: number
  IsActive?: boolean
  CompanyID?: number
  ProductionUnitID?: number | null
}

export interface LogisticsPort {
  PortID: number
  PortName: string
  PortCode: string
  StateCode?: string
  RatePerCBM: number
  ProductionUnitID?: number | null
}

export interface FreightRateRow {
  FreightRateID: number
  ProductionUnitID?: number
  ProductionUnitName?: string
  State: string
  Location: string
  FreightRate: number
  Truck1Rate?: number
  Truck2Rate?: number
  Truck3Rate?: number
  Truck4Rate?: number
  Truck5Rate?: number
  // Part-load rates: the freight-cost modal's 2x2 reads these (kg-basis part load,
  // flat per-shipper part load) alongside FreightRate (full-truck /kg) and TruckNRate.
  PartLoadKgRate?: number
  FreightPerShipper?: number
}

/**
 * Which truck each FreightRateMaster TruckNRate column holds, per plant.
 * Slot is 'Truck1'..'Truck5'; ContainerName is what the grid shows as the
 * column header ("7.5 MT" rather than "Truck1Rate").
 */
export interface TruckRateSlot {
  Slot: string
  ContainerID: number
  ContainerName: string
}

const SHIPPER_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || undefined

/**
 * Reads are plant-scoped through the session, not a query string — the shipper
 * masters/* endpoints take ProductionUnitID from HttpContext. Pass a session
 * carrying the tab's selected plant via `productionUnitId` (lowercase 'd').
 */
export function withPlant(session: any, productionUnitId?: number | null): any {
  if (!productionUnitId || productionUnitId <= 0) return session
  return { ...session, productionUnitId }
}

export class LogisticsContainerAPI {
  /** Every ContainerMaster row for the plant — both containers and trucks. */
  static async getAll(sessionData?: any): Promise<APIResponse<LogisticsContainer[]>> {
    return APIClient.get<LogisticsContainer[]>(
      '/api/ShipperPlanning/masters/containers',
      sessionData,
      SHIPPER_BASE,
    )
  }

  static async save(data: Partial<LogisticsContainer>, sessionData?: any): Promise<APIResponse<string>> {
    return APIClient.post<string>('api/logisticsmaster/container', data, sessionData)
  }

  static async update(data: Partial<LogisticsContainer>, sessionData?: any): Promise<APIResponse<string>> {
    return APIClient.post<string>('api/logisticsmaster/container/update', data, sessionData)
  }

  static async remove(containerId: number, sessionData?: any): Promise<APIResponse<string>> {
    return APIClient.post<string>(
      `api/logisticsmaster/container/delete?containerId=${containerId}`,
      {},
      sessionData,
    )
  }
}

export class LogisticsPalletAPI {
  static async getAll(sessionData?: any): Promise<APIResponse<LogisticsPallet[]>> {
    return APIClient.get<LogisticsPallet[]>(
      '/api/ShipperPlanning/masters/pallets',
      sessionData,
      SHIPPER_BASE,
    )
  }

  static async save(data: Partial<LogisticsPallet>, sessionData?: any): Promise<APIResponse<string>> {
    return APIClient.post<string>('api/logisticsmaster/pallet', data, sessionData)
  }

  static async update(data: Partial<LogisticsPallet>, sessionData?: any): Promise<APIResponse<string>> {
    return APIClient.post<string>('api/logisticsmaster/pallet/update', data, sessionData)
  }

  static async remove(palletId: number, sessionData?: any): Promise<APIResponse<string>> {
    return APIClient.post<string>(
      `api/logisticsmaster/pallet/delete?palletId=${palletId}`,
      {},
      sessionData,
    )
  }
}

export class LogisticsPortAPI {
  static async getAll(sessionData?: any): Promise<APIResponse<LogisticsPort[]>> {
    return APIClient.get<LogisticsPort[]>(
      '/api/ShipperPlanning/masters/ports',
      sessionData,
      SHIPPER_BASE,
    )
  }

  static async save(data: Partial<LogisticsPort>, sessionData?: any): Promise<APIResponse<string>> {
    return APIClient.post<string>('api/logisticsmaster/port', data, sessionData)
  }

  static async update(data: Partial<LogisticsPort>, sessionData?: any): Promise<APIResponse<string>> {
    return APIClient.post<string>('api/logisticsmaster/port/update', data, sessionData)
  }

  static async remove(portId: number, sessionData?: any): Promise<APIResponse<string>> {
    return APIClient.post<string>(
      `api/logisticsmaster/port/delete?portId=${portId}`,
      {},
      sessionData,
    )
  }
}

export class FreightRateAPI {
  /** Locations + rates for one plant. productionUnitId is a required query param here. */
  static async getLocations(
    productionUnitId: number,
    sessionData?: any,
  ): Promise<APIResponse<FreightRateRow[]>> {
    return APIClient.get<FreightRateRow[]>(
      `/api/planwindow/freight/locations?productionUnitId=${productionUnitId}`,
      sessionData,
    )
  }

  /** Column headers for the truck rate slots. Unmapped slots are omitted. */
  static async getTruckMapping(
    productionUnitId: number,
    sessionData?: any,
  ): Promise<APIResponse<TruckRateSlot[]>> {
    return APIClient.get<TruckRateSlot[]>(
      `/api/planwindow/freight/truck-mapping?productionUnitId=${productionUnitId}`,
      sessionData,
    )
  }

  /** Bulk save of edited rows only. All-or-nothing: the backend wraps it in a transaction. */
  static async saveRates(
    productionUnitId: number,
    rows: Partial<FreightRateRow>[],
    sessionData?: any,
  ): Promise<APIResponse<string>> {
    return APIClient.post<string>(
      'api/logisticsmaster/freight/save',
      { ProductionUnitID: productionUnitId, Rows: rows },
      sessionData,
    )
  }

  static async removeLocation(freightRateId: number, sessionData?: any): Promise<APIResponse<string>> {
    return APIClient.post<string>(
      `api/logisticsmaster/freight/delete?freightRateId=${freightRateId}`,
      {},
      sessionData,
    )
  }

  /**
   * Point a rate column at a truck. Pass containerId 0 to clear the slot.
   * Rejected with an error string when the column already holds rates —
   * remapping would silently reassign every existing rate to a different truck.
   */
  static async saveTruckMapping(
    slot: string,
    containerId: number,
    productionUnitId: number,
    sessionData?: any,
  ): Promise<APIResponse<string>> {
    return APIClient.post<string>(
      'api/logisticsmaster/freight/truck-mapping',
      { Slot: slot, ContainerID: containerId, ProductionUnitID: productionUnitId },
      sessionData,
    )
  }
}

/**
 * The backend answers 200 with a bare status string. Normalise that into a
 * result the modals can branch on without repeating the sniff everywhere.
 */
export function readSaveResult(response: APIResponse<any>): {
  ok: boolean
  duplicate: boolean
  message: string
} {
  if (!response.success) {
    return { ok: false, duplicate: false, message: response.error || 'Request failed' }
  }

  const raw = typeof response.data === 'string' ? response.data.trim() : ''
  const lowered = raw.toLowerCase()

  if (lowered === 'exist') {
    return { ok: false, duplicate: true, message: 'A record with this name already exists' }
  }
  if (lowered.startsWith('error') || lowered.includes('not authorized') || lowered.includes('failed')) {
    return { ok: false, duplicate: false, message: raw.replace(/^error:\s*/i, '') }
  }
  return { ok: true, duplicate: false, message: raw || 'Success' }
}
