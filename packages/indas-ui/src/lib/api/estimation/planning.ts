// Planning APIs
// Handles plan window and load operations for estimation

import APIClient from '../core/client'
import type { APIResponse } from '../core/types'

/**
 * Load Operations API class
 */
export class LoadOperationsAPI {
  /**
   * Load operations list for a given DomainType
   * @param domainType - Domain type (e.g., 'Offset', 'Digital', 'Flexo')
   * @param sessionData - Session data
   */
  static async loadOperations(
    domainType: string,
    sessionData?: any
  ): Promise<APIResponse> {
    const endpoint = `api/planwindow/LoadOperations/${domainType}`

    try {
      const response = await APIClient.get(endpoint, sessionData)
      return response
    } catch (error) {
      return {
        success: false,
        error: `LoadOperations API failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}

/**
 * Plan Window API
 * API calls for calculating operations based on machine planning data
 */
export class PlanWindowAPI {
  /**
   * Calculate operation costs for selected processes
   * @param requestBody - Request body containing planning data and process IDs
   * @param isDefault - Whether to fetch default processes (true) or calculate for selected processes (false)
   * @param category - Content domain type/category
   * @param content - Content name
   */
  static async calculateOperation(
    requestBody: Partial<{
      Full_Sheets: number
      Actual_Sheets: number
      Make_Ready_Sheets_Total: number
      Wastage_Sheets: number
      Process_Wastage_Sheets: number
      Cut_L: number
      Cut_H: number
      Cut_H_L: number
      Cut_L_H: number
      Req_Running_Mtr: number
      Total_Running_Mtr: number
      Total_Paper_In_KG: number
      Total_Ups: number
      No_Of_Sets: number
      Total_Colors: number
      Plate_Qty: number
      Final_Quantity: number
      Gbl_Order_Quantity: number
      Gbl_Job_L: number
      Gbl_Job_H: number
      Gbl_Job_W: number
      Gbl_Sheet_L: number
      Gbl_Sheet_W: number
      Gbl_Machine_ID: number
      Gbl_Machine_Name: string
      Machine_Speed: number
      Make_Ready_Time: number
      Job_Change_Over_Time: number
      Gbl_Content_Domain_Type: string
      GblOperId: string
      Printing_Impressions: number
      Make_Readies: number
    }>,
    options?: {
      isDefault?: boolean
      category?: string
      content?: string
    },
    sessionData?: any
  ): Promise<APIResponse> {
    // Build query parameters
    const queryParams: string[] = []

    if (options?.isDefault !== undefined) {
      queryParams.push(`Isdefault=${options.isDefault}`)
    }

    if (options?.category) {
      queryParams.push(`category=${encodeURIComponent(options.category)}`)
    }

    if (options?.content) {
      queryParams.push(`content=${encodeURIComponent(options.content)}`)
    }

    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : ''
    const endpoint = `api/planwindow/CalculateOperation${queryString}`

    const response = await APIClient.post(endpoint, requestBody, sessionData)

    return response
  }

  /**
   * Get all machines
   */
  static async getAllMachines(sessionData?: any): Promise<APIResponse> {
    return APIClient.get('api/planwindow/getallmachines', sessionData)
  }

  /**
   * Get material group cost formula settings for a specific sub-item group and plant
   * @param itemSubGroupID - The sub-item group ID
   * @param plantID - The plant ID
   */
  static async getMaterialGroupCostFormulaSetting(itemSubGroupID: number, plantID: number, sessionData?: any): Promise<APIResponse> {
    const endpoint = `api/planwindow/GetMaterialGroupCostFormulaSetting/${itemSubGroupID}/${plantID}`
    return APIClient.get(endpoint, sessionData)
  }

  /**
   * Get keyline coordinates for die-cut patterns
   * @param contentType - The orientation/product type (e.g., "StandardStraightTuckIn", "ReverseTuckAndTongue")
   * @param grain - Grain direction (e.g., "With Grain", "Across Grain")
   */
  static async getKeylineCoordinates(contentType: string, grain: string, sessionData?: any): Promise<APIResponse> {
    // URL encode parameters to handle spaces and special characters
    const encodedContentType = encodeURIComponent(contentType)
    const encodedGrain = encodeURIComponent(grain)

    return APIClient.get(`api/planwindow/keylinecoordinates/${encodedContentType}/${encodedGrain}`, sessionData)
  }

  /**
   * Get auto-generated quote number
   * @param sessionData - Session data for authentication
   * @returns Promise with quote number string (e.g., "10711")
   */
  static async getQuoteNo(sessionData?: any): Promise<APIResponse<string>> {
    const endpoint = 'api/planwindow/getquoteno'


    try {
      const response = await APIClient.get<string>(endpoint, sessionData)


      return response
    } catch (error) {
      console.error('❌ [QUOTE_NO] Error:', error)
      return {
        success: false,
        error: `Get Quote No API failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Get type of charges calculation formulas and operation slabs
   * Called after LoadOperations to get formula definitions and rate slabs
   * @param sessionData - Session data for authentication
   * @returns Promise with TypeOfCharges array and LoadOperationSlabsDetails array
   */
  static async getTypeOfCharges(sessionData?: any): Promise<APIResponse> {
    const endpoint = 'api/planwindow/GetTypeOfCharges'


    try {
      const response = await APIClient.get(endpoint, sessionData)

      return response
    } catch (error) {
      console.error('❌ [GET_TYPE_OF_CHARGES] Error:', error)
      return {
        success: false,
        error: `GetTypeOfCharges API failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Get client list with credit days
   * @param sessionData - Session data for authentication
   * @returns Promise with array of clients including LedgerName, LedgerId, and CreditDays
   */
  static async getSbClient(sessionData?: any): Promise<APIResponse<SbClient[]>> {
    const endpoint = 'api/planwindow/GetSbClient'

    try {
      const response = await APIClient.get<SbClient[]>(endpoint, sessionData)
      return response
    } catch (error) {
      console.error('❌ [API ERROR] GetSbClient Error:', error)
      return {
        success: false,
        error: `GetSbClient API failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Shirin Job Master - Main planning calculation endpoint
   * Generates machine plans with comprehensive planning data
   *
   * Legacy reference: plan.txt line 236-237
   * Endpoint: POST /api/planwindow/ShirinJobMaster
   *
   * @param request - Job size, operations, and rates (PlateRate, PaperRate, MakeReadyRate, CoatingRate)
   * @param sessionData - Session data for authentication
   * @returns Promise with planning results (TblPlanning, TblOperations, TblBookForms)
   */
  static async shirinJobMaster(
    request: ShirinJobMasterRequest,
    sessionData?: any
  ): Promise<APIResponse<ShirinJobMasterResponse>> {
    const endpoint = 'api/planwindow/ShirinJobMaster'

    try {
      const response = await APIClient.post<ShirinJobMasterResponse>(
        endpoint,
        request,
        sessionData
      )
      return response
    } catch (error) {
      return {
        success: false,
        error: `ShirinJobMaster API failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}

/**
 * Get machine allocated item list
 * @param machineId - Machine ID
 * @param sessionData - Session data
 * @param filters - Optional filters: categoryID, processID, contentType, rateTier
 */
export async function getMachineAllocatedItemList(
  machineId: number,
  sessionData?: any,
  filters?: { categoryID?: number; processID?: number; contentType?: string; rateTier?: 'L1' | 'L2' }
): Promise<APIResponse<MachineAllocatedItem[]>> {
  try {
    const params = new URLSearchParams()
    if (filters?.categoryID) params.append('categoryID', String(filters.categoryID))
    if (filters?.processID) params.append('processID', String(filters.processID))
    if (filters?.contentType) params.append('contentType', filters.contentType)
    if (filters?.rateTier === 'L2') params.append('rateTier', 'L2')
    const qs = params.toString()
    const endpoint = `api/planwindow/GetMachineAllocatedItemList/${machineId}${qs ? `?${qs}` : ''}`
    const response = await APIClient.get<MachineAllocatedItem[]>(endpoint, sessionData)
    return response
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch machine allocated items: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get process-allocated items (no machine involvement). Used by EnquiryMaterialModal
 * where the user picks materials per (category, content, process) without ever
 * selecting a machine. Backend joins across all machines allocated to the process
 * and dedupes by ItemID; IsDefault is collapsed (true if any machine flags it).
 */
export async function getProcessAllocatedItemList(
  filters: { categoryID: number; contentID: number; processID: number },
  sessionData?: any
): Promise<APIResponse<MachineAllocatedItem[]>> {
  try {
    const params = new URLSearchParams()
    params.append('CategoryID', String(filters.categoryID))
    params.append('ContentID', String(filters.contentID))
    params.append('ProcessID', String(filters.processID))
    const endpoint = `api/planwindow/GetProcessAllocatedItemList?${params.toString()}`
    return await APIClient.get<MachineAllocatedItem[]>(endpoint, sessionData)
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch process allocated items: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/** One material/item allocated to a process (from ProcessAllocatedMaterialMaster). */
export interface ProcessWiseMaterial {
  ProcessID: number
  ProcessName: string
  ItemID: number
  ItemName: string
  ItemGroupID: number
  ItemGroupName: string
  ItemSubGroupID: number
  ItemSubGroupName: string
  EstimationRate?: number
  PurchaseRate?: number
}

/**
 * Get ALL materials/items allocated to one or more processes (by ProcessID only,
 * no category/content/machine needed). Returns the actual allocated items — not
 * just material sub-group names. `processIds` are joined comma-separated for the
 * IN(...) clause, so one call covers every chosen process.
 */
export async function getProcessWiseMaterials(
  processIds: number[],
  sessionData?: any
): Promise<APIResponse<ProcessWiseMaterial[]>> {
  try {
    const ids = processIds.filter(n => Number(n) > 0).join(',')
    if (!ids) return { success: true, data: [] }
    const endpoint = `api/planwindow/processmaterials/${encodeURIComponent(ids)}`
    return await APIClient.get<ProcessWiseMaterial[]>(endpoint, sessionData)
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch process-wise materials: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * SbClient interface for GetSbClient API
 */
export interface SbClient {
  LedgerName: string
  LedgerId: number
  CreditDays: number
}

/**
 * Machine allocated item interface
 */
export interface MachineAllocatedItem {
  MachineID: number
  ItemGroupID: number
  ItemGroupNameID: number
  ItemSubGroupID: number
  ItemGroupName: string
  ItemSubGroupName: string
  ItemID: number
  ItemName: string
  SizeL: number
  SizeW: number
  SizeH: number
  Thickness: number
  Density: number
  GSM: number
  Caliper: number
  ReleaseGSM: number
  AdhesiveGSM: number
  StockUnit: string
  EstimationUnit: string
  PhysicalStock: number
  Rate?: number // API returns this
  EstimationRate: number
  PurchaseUnit: string
  PurchaseRate: number
}

/**
 * Winding Direction interface
 */
export interface WindingDirection {
  WindingDirectionID: number
  Direction: string
  Image: string // Base64 string
}

/**
 * Thickness interface
 */
export interface ThicknessOption {
  Thickness: number
}

/**
 * Label Type interface
 */
export interface LabelType {
  LabelType: string
}

/**
 * Pouch Style interface
 */
export interface PouchStyle {
  LabelType: string
  WtPerPieceGram: number
}

/**
 * Punching Type interface
 */
export interface PunchingType {
  PunchingType: string
}

/**
 * Get Winding Directions by domain type
 * @param contentDomainType - The content domain type (FLEXO, ROTOGRAVURE, etc.)
 * @param sessionData - Session data for authentication
 * @returns Promise with winding direction options
 */
export async function getWindingDirections(
  contentDomainType: string,
  sessionData?: any
): Promise<APIResponse<WindingDirection[]>> {
  try {
    const endpoint = `api/planwindow/windingdirection/${contentDomainType}`
    const response = await APIClient.get<WindingDirection[]>(endpoint, sessionData)

    if (response.success && response.data) {
      if (!Array.isArray(response.data)) {
        const errorMessage = typeof response.data === 'string'
          ? response.data
          : 'API returned invalid data format'

        return {
          success: false,
          error: errorMessage,
          data: []
        }
      }
    }

    return response
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch winding directions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: []
    }
  }
}

/**
 * Get Thickness options
 * @param contentType - Content type (e.g., "FLEXO")
 * @param quality - Item quality (e.g., "Shrink Sleeve")
 * @param gsm - GSM value (e.g., "54")
 * @param sessionData - Session data for authentication
 * @returns Promise with thickness options
 */
export async function getThicknessOptions(
  contentType: string,
  quality: string,
  gsm: string | number,
  sessionData?: any
): Promise<APIResponse<ThicknessOption[]>> {
  try {
    const endpoint = `api/planwindow/thickness?contenttype=${encodeURIComponent(contentType)}&quality=${encodeURIComponent(quality)}&gsm=${encodeURIComponent(gsm)}`
    const response = await APIClient.get<ThicknessOption[]>(endpoint, sessionData)

    if (response.success && response.data) {
      if (!Array.isArray(response.data)) {
        const errorMessage = typeof response.data === 'string'
          ? response.data
          : 'API returned invalid data format'

        return {
          success: false,
          error: errorMessage,
          data: []
        }
      }
    }

    return response
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch thickness options: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: []
    }
  }
}

/**
 * Get Label Type options (Static data for FLEXO)
 * @returns Label type options
 */
export function getLabelTypes(): LabelType[] {
  return [
    { LabelType: "Front" },
    { LabelType: "Back" },
    { LabelType: "Top" },
    { LabelType: "Bottom" },
    { LabelType: "Neck" },
    { LabelType: "Flat Label" },
    { LabelType: "Single" },
    { LabelType: "Set" }
  ]
}

/**
 * Get Pouch Style options (Static data for ROTOGRAVURE)
 * @returns Pouch style options
 */
export function getPouchStyles(): PouchStyle[] {
  return [
    { LabelType: "Stand-Up Pouch", WtPerPieceGram: 0 },
    { LabelType: "K-Seal Pouch", WtPerPieceGram: 0 },
    { LabelType: "Three-Side Seal Pouch", WtPerPieceGram: 0 },
    { LabelType: "Four-Side Seal Pouch", WtPerPieceGram: 0 },
    { LabelType: "Single-Use Sachet", WtPerPieceGram: 0 },
    { LabelType: "Side Gusset Pouch", WtPerPieceGram: 0 },
    { LabelType: "Bottom Gusset Pouch", WtPerPieceGram: 0 },
    { LabelType: "Spouted Pouch", WtPerPieceGram: 10 },
    { LabelType: "Retort Pouch", WtPerPieceGram: 0 },
    { LabelType: "Zipper Pouch", WtPerPieceGram: 5 },
    { LabelType: "Pillow Pouch", WtPerPieceGram: 0 },
    { LabelType: "Quad-Seal Pouch", WtPerPieceGram: 0 },
    { LabelType: "Shaped Pouch", WtPerPieceGram: 0 },
    { LabelType: "Flat-Bottom Pouch", WtPerPieceGram: 0 },
    { LabelType: "Vacuum Pouch", WtPerPieceGram: 0 },
    { LabelType: "Slider Pouch", WtPerPieceGram: 0 }
  ]
}

/**
 * Get Punching Type options (Static data)
 * @returns Punching type options
 */
export function getPunchingTypes(): PunchingType[] {
  return [
    { PunchingType: "None" },
    { PunchingType: "Threding" },
    { PunchingType: "Hole Punching" }
  ]
}

/**
 * Get Finished Format options (Static data for FLEXO)
 * @returns Finished format options
 */
export function getFinishedFormats(): string[] {
  return [
    "Sheet Form",
    "Roll Form",
    "Fan Fold",
    "Cut Label",
    "Pcs Or Unit"
  ]
}

/**
 * ========================================
 * Shirin Job Master Types
 * ========================================
 */

/**
 * Job Size Object Interface
 * Represents all job parameters for planning calculation
 */
export interface JobSizeObject {
  CutSize: string
  PlanContentType: string
  UpsL: number
  UpsH: number
  MachineId: number
  PlanContQty: number
  JobNoOfPages: number
  PlanPrintingStyle: string
  PlanFColor: number
  PlanBColor: number
  PlanSpeFColor: string
  PlanSpeBColor: string
  PlanWastageType: string
  PlanWastageValue: number
  PlanPrintingGrain: string
  ItemPlanQuality: string
  ItemPlanGsm: number | string
  ItemPlanMill: string
  ItemPlanFinish: string
  PlanPlateType: string
  PlanType: string
  PaperID: number
  PlanOnlineCoating?: string
  PaperGroup: string
  GripperSide: string
  PlanGripper: number
  OperId: string
  PlanContDomainType: string
  PlanPlateBearer: number
  PlanStandardACGap: number
  PlanStandardARGap: number
  SizeHeight: number
  SizeWidth: number
  PaperSize: string
  AcrossGap: number
  AroundGap: number
  CylinderToolID: number
  Planlabeltype?: string
  Planwindingdirection?: number | string
  Planfinishedformat?: string
  Plandietype?: string
  PlanPcsPerRoll?: number
  PlanCoreInnerDia?: number
  PlanCoreOuterDia?: number
  EstimationQuantityUnit: string
  FeedValue: number
  SizeLength: number
  SizeOpenflap?: number
  SizePastingflap?: number
  SizeBottomflap?: number
  ItemPlanThickness: number | string
  SizeCenterSeal?: number
  SizeSideSeal?: number
  SizeTopSeal?: number
  SizeBottomGusset?: number
  PlanMakeReadyWastage?: number
  CategoryID: number
  BookSpine?: number
  BookHinge?: number
  BookCoverTurnIn?: number
  BookExtension?: number
  BookLoops?: number
  PlanOtherMaterialGSM?: number
  PlanOtherMaterialGSMSettingJSON?: string
  MaterialWetGSMConfigJSON?: string
  PlanPunchingType?: string
  ChkBackToBackPastingRequired?: boolean
  SizeZipperLength?: number
  ZipperWeightPerMeter?: number
  JobSizeInputUnit?: string
  PlateQty?: number
  LedgerID?: number
}

/**
 * Shirin Job Master Request Interface
 */
export interface ShirinJobMasterRequest {
  ObjJobSize: any // Job size object - accepts all fields from mapPlanningDataToAPI()
  ObjOpr: any // Operations object
  // Rate overrides are optional. FPaM omits them on tier mismatch so the
  // backend returns rates at the active RateTier (inside ObjJobSize).
  PlateRate?: number
  PaperRate?: number
  MakeReadyRate?: number
  CoatingRate?: number
}

/**
 * Shirin Job Master Response - TblPlanning
 */
export interface TblPlanningItem {
  MachinePlanningID?: number
  CutSize: string
  PaperSize: string
  UpsL: number
  UpsW: number
  TotalUps: number
  ActualSheets: number
  WastageSheets: number
  FullSheets: number
  TotalPaperWeightInKg: number
  PaperRate?: number
  PaperCost?: number
  PlateQty?: number
  PlateRate?: number
  PlateCost?: number
  MakeReadyRate?: number
  MakeReadyAmount?: number
  PrintingStyle: string
  GrainDirection: string
  MachineID: number
  MachineName: string
  MachineGroupName?: string
  MachineSpeed?: number
  MakeReadyTime?: number
  // Roll-based fields
  FeedValue?: number
  RequiredRunningMeter?: number
  WastageRunningMeter?: number
  TotalRequiredRunningMeter?: number
  TotalRequiredSquareMeter?: number
  ExpectedExecutionTime?: number
  FinalQuantityInPcs?: number
  // Corrugation
  CorrugationAmount?: number
  // Additional fields
  [key: string]: any
}

/**
 * Shirin Job Master Response - TblOperations
 */
export interface TblOperationsItem {
  ProcessID: number
  ProcessName: string
  Rate: number
  Amount: number
  TypeofCharges: string
  AdvanceCalculate?: string
  ProcessFlatWastageValue: number
  ProcessWastagePercentage: number
  MachineCost: number
  MaterialCost: number
  Remarks?: string
  DepartmentID: number
  MachineID?: number
  RateFactor?: string
  // Advanced calculation fields
  SizeL?: number
  SizeW?: number
  Pieces?: number
  NoOfStitch?: number
  NoOfFolds?: number
  NoOfLoops?: number
  NoOfColors?: number
  NoOfPass?: number
  PerHourCalculationQuantity?: number
  Quantity?: number
  SizeToBeConsidered?: string
  AdditionalWeight?: number
  NoOfForms?: number
  // Cost breakdown
  setupCost?: number
  ExecutionCost?: number
  processCost?: number
  wastageCost?: number
  toolCost?: number
  totalCost?: number
  [key: string]: any
}

/**
 * Shirin Job Master Response - TblBookForms
 */
export interface TblBookFormsItem {
  Forms: number
  Pages: number
  FormPlanType: string
  SlabRate: number
  [key: string]: any
}

/**
 * Shirin Job Master Response
 */
export interface ShirinJobMasterResponse {
  TblPlanning: TblPlanningItem[]
  TblOperations?: TblOperationsItem[]
  TblBookForms?: TblBookFormsItem[]
  [key: string]: any
}

/**
 * Calculate Flap Dimensions Request
 */
export interface CalculateFlapDimensionsRequest {
  length: number
  width: number
  height: number
  contentType: string
  isCorrugated: boolean
}

/**
 * Calculate Flap Dimensions Response
 */
export interface CalculateFlapDimensionsResponse {
  success: boolean
  contentType: string
  isCorrugated: boolean
  dimensions: {
    length: number
    width: number
    height: number
  }
  values: Record<string, number>
}

/**
 * Calculate flap dimensions for 3D content types
 * @param request - Dimensions and content info
 * @param sessionData - Session data
 */
export async function calculateFlapDimensions(
  request: CalculateFlapDimensionsRequest,
  sessionData?: any
): Promise<APIResponse<CalculateFlapDimensionsResponse>> {
  try {
    const endpoint = 'api/planwindow/calculate-flap-dimensions'
    const response = await APIClient.post<CalculateFlapDimensionsResponse>(endpoint, request, sessionData)
    return response
  } catch (error) {
    return {
      success: false,
      error: `Failed to calculate flap dimensions: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

