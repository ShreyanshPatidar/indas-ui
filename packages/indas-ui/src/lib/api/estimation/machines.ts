// Estimation Machines API
// Handles machine grid data for estimation

import APIClient from '../core/client'
import type { APIResponse, MachineData, CompatMachineData } from '../core/types'

/**
 * Get machine grid data filtered by Production Unit.
 *
 * The frontend always selects a Production Unit before opening any machine flow,
 * so this argument is required. The backend scopes machines to MM.ProductionUnitID.
 *
 * @param sessionData - Session data containing user and company info
 * @param productionUnitId - The selected Production Unit (number or numeric string)
 */
export async function getMachineGridAPI(
  sessionData: any,
  productionUnitId: number | string
): Promise<APIResponse<MachineData[]>> {
  try {
    const idNum = Number(productionUnitId)
    if (!Number.isFinite(idNum) || idNum <= 0) {
      return {
        success: false,
        error: 'getMachineGridAPI: productionUnitId is required and must be > 0'
      }
    }
    const endpoint = `api/planwindow/machigrid?ProductionUnitID=${idNum}`
    const response = await APIClient.get<MachineData[]>(endpoint, sessionData)
    return response
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch machine grid: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Job spec for a compatibility query — the FIXED inputs that don't change across units.
 */
export interface CompatMachineArgs {
  productionUnitId: number | string
  domainType: string          // OFFSET | FLEXO | ROTOGRAVURE | ...
  jobSheetL: number
  jobSheetW: number
  jobWebWidth?: number
  requiredColors: number
  paperGroup?: string
}

/**
 * Get machines on a target production unit with a server-computed compatibility verdict for
 * a given job spec. Backend mirrors the planner's fit/colors/group rules. Used to decide
 * whether a planned content can be re-costed on another unit. (Production Unit Re-Costing.)
 *
 * @param sessionData - pass a plant-overridden session (targetSession) to scope correctly
 * @param args - the frozen job spec (sheet/web dims, required colors, paper group, domain)
 */
export async function getCompatibleMachinesAPI(
  sessionData: any,
  args: CompatMachineArgs
): Promise<APIResponse<CompatMachineData[]>> {
  try {
    const idNum = Number(args.productionUnitId)
    if (!Number.isFinite(idNum) || idNum <= 0) {
      return { success: false, error: 'getCompatibleMachinesAPI: productionUnitId is required and must be > 0' }
    }
    const params = new URLSearchParams({
      ProductionUnitID: String(idNum),
      domainType: args.domainType || 'OFFSET',
      jobSheetL: String(args.jobSheetL || 0),
      jobSheetW: String(args.jobSheetW || 0),
      jobWebWidth: String(args.jobWebWidth || 0),
      requiredColors: String(args.requiredColors || 0),
      paperGroup: args.paperGroup || '',
    })
    const endpoint = `api/planwindow/compatiblemachines?${params.toString()}`
    const response = await APIClient.get<CompatMachineData[]>(endpoint, sessionData)
    return response
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch compatible machines: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
