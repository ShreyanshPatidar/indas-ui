/**
 * Shipper Planning API Client
 * Aligned with ShipperPlanningController.cs (updated 26/02/2026)
 */

import APIClient from '@/lib/api/core/client'
import type { APIResponse } from '@/lib/api/core/types'
import type {
  ShipperPlan,
  ContainerPlan,
  PalletData,
  ShipperMasterRecord,
  ShipperCalculationRequest,
  ContainerCalculationRequest,
} from '@/types/shipper-planning'


const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || undefined

/**
 * Map SP_ShipperSuggestion (flat) → ShipperPlan.
 * Backend returns flat JSON array from Ok(suggestions).
 */
function mapShipperSuggestion(s: any): ShipperPlan {
  return {
    ShipperID: s.ShipperID ?? 0,
    ShipperName: s.ShipperName ?? '',
    ItemID: s.ItemID ?? null,
    SizeL: s.SizeL ?? 0,
    SizeW: s.SizeW ?? 0,
    SizeH: s.SizeH ?? 0,
    PackX: s.PackX ?? 0,
    PackY: s.PackY ?? 0,
    PackZ: s.PackZ ?? 0,
    QtyPerShipper: s.QtyPerShipper ?? 0,
    EmptyCartonWt: s.EmptyCartonWt ?? 0,
    PerBoxWt: s.PerBoxWt ?? 0,
    ShipperWeightPerPack: s.ShipperWeightPerPack ?? 0,
    TotalWtOfAllShippers: s.TotalWtOfAllShippers ?? 0,
    CBM: s.CBM ?? 0,
    CBF: s.CBF ?? 0,
    TotalShipperQtyReq: s.TotalShippersRequired ?? 0,
    BoxUtilizationPct: s.BoxUtilizationPct ?? 0,
    ShippingRate: s.ShippingRatePerCBM ?? 0,
    ShippingCost: s.ShippingCost ?? 0,
    ShipperRate: s.ShipperRate ?? 0,
    ShipperCost: s.ShipperCost ?? 0,
    Capacity: s.QtyPerShipper ?? 0,
    // Pallet fields (null when no PalletID)
    PalletType: s.PalletType ?? null,
    PalletLength: s.PalletLength ?? null,
    PalletWidth: s.PalletWidth ?? null,
    PalletTi: s.PalletTi ?? null,
    PalletHi: s.PalletHi ?? null,
    PalletTotalBoxesPerPallet: s.PalletTotalBoxesPerPallet ?? null,
    PalletLoadedLength: s.PalletLoadedLength ?? null,
    PalletLoadedWidth: s.PalletLoadedWidth ?? null,
    PalletLoadedHeight: s.PalletLoadedHeight ?? null,
    PalletTotalWeight: s.PalletTotalWeight ?? null,
    PalletAreaEfficiency: s.PalletAreaEfficiency ?? null,
  }
}

/**
 * Calculate shipper plans — POST /api/ShipperPlanning/shipper/calculate
 * Response is a flat JSON array of SP_ShipperSuggestion.
 */
export async function calculateShipperPlan(
  request: ShipperCalculationRequest,
  session: any
): Promise<APIResponse<ShipperPlan[]>> {
  try {
    const response = await APIClient.post(
      '/api/ShipperPlanning/shipper/calculate',
      request,
      session,
      BASE_URL,
    )
    if (response.success) {
      // Controller returns Ok(suggestions) — flat array
      // Also handle legacy wrapper { Suggestions: [...] } for safety
      const raw: any[] = Array.isArray(response.data)
        ? response.data
        : Array.isArray((response.data as any)?.Suggestions)
          ? (response.data as any).Suggestions
          : []
      return { success: true, data: raw.map(mapShipperSuggestion) }
    }
    return response
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Calculate container plans — POST /api/ShipperPlanning/container/calculate
 * Response is a flat JSON array of SP_ContainerOption.
 */
export async function calculateContainerPlanning(
  request: ContainerCalculationRequest,
  session: any
): Promise<APIResponse<ContainerPlan[]>> {
  try {
    const response = await APIClient.post(
      '/api/ShipperPlanning/container/calculate',
      request,
      session,
      BASE_URL,
    )
    if (response.success) {
      const raw: any[] = Array.isArray(response.data)
        ? response.data
        : Array.isArray((response.data as any)?.Containers)
          ? (response.data as any).Containers
          : []
      return { success: true, data: raw as ContainerPlan[] }
    }
    return response
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Load container master data — GET /api/ShipperPlanning/masters/containers
 */
export async function loadContainerMasters(
  session: any
): Promise<APIResponse<any[]>> {
  try {
    const response = await APIClient.get('/api/ShipperPlanning/masters/containers', session, BASE_URL)
    if (response.success && Array.isArray(response.data)) {
      return { success: true, data: response.data }
    }
    return response
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Load pallet master data — GET /api/ShipperPlanning/masters/pallets
 */
export async function loadPalletMasters(
  session: any
): Promise<APIResponse<PalletData[]>> {
  try {
    const response = await APIClient.get('/api/ShipperPlanning/masters/pallets', session, BASE_URL)
    if (response.success && Array.isArray(response.data)) {
      return { success: true, data: response.data as PalletData[] }
    }
    return response
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Port master record from PortMaster table
 */
export interface PortMasterRecord {
  PortID: number
  PortName: string
  PortCode: string
  RatePerCBM: number
}

/**
 * Load port master data — GET /api/ShipperPlanning/masters/ports
 */
export async function loadPortMasters(
  session: any
): Promise<APIResponse<PortMasterRecord[]>> {
  try {
    const response = await APIClient.get('/api/ShipperPlanning/masters/ports', session, BASE_URL)
    if (response.success && Array.isArray(response.data)) {
      return { success: true, data: response.data as PortMasterRecord[] }
    }
    return response
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Load standard shipper sizes from Item Master — GET /api/ShipperPlanning/masters/shippers
 * Returns boxes where ItemGroupID = 7.
 */
export async function loadShipperMasters(
  session: any
): Promise<APIResponse<ShipperMasterRecord[]>> {
  try {
    const response = await APIClient.get('/api/ShipperPlanning/masters/shippers', session, BASE_URL)
    if (response.success && Array.isArray(response.data)) {
      return { success: true, data: response.data as ShipperMasterRecord[] }
    }
    return response
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Paper caliper master response — GET /api/ShipperPlanning/paper/caliper
 */
export interface PaperCaliperResponse {
  Caliper: number       // mm, always > 0 when present
  Unit: 'mm'
  Source: string        // e.g. "ItemMaster"
  LastUpdated: string | null
  Quality: string
  GSM: number
  Mill: string
  Finish: string
}

/**
 * Lookup board caliper for a paper spec.
 *
 * Returns { success: true, data: null } when no master row matches — the
 * caller should fall back to the GSM heuristic. HTTP status is always 200;
 * branch on `success === false` for bad requests and `data === null` for
 * "no match".
 */
export async function getPaperCaliper(
  filters: { quality: string; gsm: number; mill: string; finish: string },
  session: any,
): Promise<APIResponse<PaperCaliperResponse | null>> {
  try {
    const params = new URLSearchParams({
      quality: filters.quality,
      gsm: String(filters.gsm),
      mill: filters.mill,
      finish: filters.finish,
    })
    const response = await APIClient.get<PaperCaliperResponse | null>(
      `/api/ShipperPlanning/paper/caliper?${params.toString()}`,
      session,
      BASE_URL,
    )
    return response
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
