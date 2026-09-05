// Machine Master API
// Handles machine-related operations

import APIClient from '../core/client'
import type { APIResponse } from '../core/types'

/**
 * Full Machine Master data from /api/machinemaster/machinemaster endpoint
 */
export interface MachineMaster {
  MachineCode: string | null
  RefMachineCode: string
  ProductionUnitName: string
  ProductionUnitID: number
  MachineId: number
  MachineName: string
  MinimumSheet: number
  Gripper: number
  MaxLength: number
  MaxWidth: number
  MinLength: number
  MinWidth: number
  MaxPrintL: number
  MaxPrintW: number
  MinPrintL: number
  MinPrintW: number
  Colors: number
  MakeReadyCharges: number | null
  MakeReadyWastageSheet: number | null
  DepartmentID: number
  MachineType: string
  MakeReadyTime: number
  MakeReadyPerHourCost: number
  ElectricConsumption: number
  PrintingMargin: number | null
  WebCutOffSize: number | null
  MinReelSize: number | null
  MaxReelSize: number | null
  MachineSpeed: number
  LabourCharges: number | null
  WebCutOffSizeMin: number | null
  ChargesType: string
  RoundofImpressionsWith: number
  IsPerfectaMachine: boolean | null
  IsVariableCutOff: boolean
  IsSpecialMachine: boolean | null
  IsPlanningMachine: boolean | null
  BasicPrintingCharges: number | null
  JobChangeOverTime: number | null
  PlateLength: number
  PlateWidth: number
  OtherCharges: number | null
  WastageType: string
  WastageCalculationOn: string
  PerHourCost: number
  ElectricConsumptionUnitPerMinute: number | null
  DepartmentName: string
  MinRollWidth: number | null
  MaxRollWidth: number | null
  MinCircumference: number | null
  MaxCircumference: number | null
  MakeReadyWastageRunningMeter: number | null
  AvgBreakDownTime: number | null
  AvgBreakDownRunningMeters: number | null
  MachineWidth: number | null
  AverageRollChangeWastage: number | null
  AverageRollLength: number | null
  SpeedRunningMeters: number
  RollChangeTime: number | null
  BranchID: number
  BranchName: string
  SpeedUnit: string
  PlateCharges: number
  PlateChargesType: string | null
  PerHourCostingParameter: string
  MakeReadyTimeMode: string
  ProductionUnitID1: number
  ProductionUnitName1: string
  CompanyName: string
  CompanyID: number
  MachineGroupID?: number | null
  MachineGroupName?: string | null
  IsAllProductionUnit?: boolean
}

/**
 * Simplified Machine data for dropdown/planning
 */
export interface MachineMasterData {
  MachineID: number
  DepartmentID: number
  MachineName: string
  MachineSpeed: number
  ProcessID: number
  MakeReadyTime: number
  JobChangeOverTime: number
  MakeReadyPerHourCost: number
  MachinePerHourCost: number
  PerHourCost?: number // Alias for MachinePerHourCost from some API endpoints
  IsDefaultMachine: boolean
  SpeedUnit: string
  MakeReadyTimeMode: string
  PerHourCostingParameter: string | null
}

export interface MachineOption {
  value: number
  label: string
  machineData: MachineMasterData
}

/**
 * Machine Type from /api/machinemaster/getmachinetype endpoint
 */
export interface MachineType {
  MachineTypeName: string
  MachineMasterDisplayFieldsName: string
}

/**
 * Department from /api/machinemaster/getselectdepartment endpoint
 */
export interface Department {
  DepartmentID: number
  DepartmentName: string
}

/**
 * Production Unit from /api/machinemaster/getmachineproductionunitlist endpoint
 */
export interface ProductionUnit {
  ProductionUnitID: number
  ProductionUnitName: string
}

/**
 * Machine Group from /api/machinemaster/machinegroups endpoint
 * MachineGroupMaster table — ProductionUnitID is optional on save
 */
export interface MachineGroup {
  MachineGroupID: number
  MachineGroupName: string
  ProductionUnitID?: number | null
}

/**
 * Machine Slab data from /api/machinemaster/existslab/{MachineID} endpoint
 */
export interface MachineSlab {
  RunningMeterRangeFrom: number
  RunningMeterRangeTo: number
  ProcessWastagepercentage: number
  SheetRangeFrom: number
  SheetRangeTo: number
  MachineSpeed: number
  Rate: number
  PlateCharges: number
  PSPlateCharges: number
  CTCPPlateCharges: number
  Wastage: number
  SpecialColorFrontCharges: number
  SpecialColorBackCharges: number
  PaperGroup: string
  SizeW: number
  SizeL: number
  MinCharges: number
}

/**
 * Default dropdown options for Machine Master form
 */
export const MachineDropdownDefaults = {
  speedUnit: [
    { value: 'IMPRESSION', label: 'IMPRESSION' },
    { value: 'RMT', label: 'RMT' }
  ],

  wastageType: [
    { value: 'Sheets', label: 'Sheets' },
    { value: 'Meter', label: 'Meter' },
    { value: 'Percentage', label: 'Percentage' }
  ],

  typeOfCharges: [
    { value: 'Impressions', label: 'Impressions' },
    { value: 'Impressions/1000', label: 'Impressions/1000' },
    { value: 'Impressions/color', label: 'Impressions/color' },
    { value: 'Impressions/1000/Color', label: 'Impressions/1000/Color' }
  ],

  wastageCalculationOn: [
    { value: 'Per Color', label: 'Per Color' },
    { value: 'Flat', label: 'Flat' }
  ],

  // For Printing Department (ID=100)
  makeReadyTimeModeForPrinting: [
    { value: 'Per Color', label: 'Per Color' },
    { value: 'Flat', label: 'Flat' }
  ],

  // For Non-Printing Department
  makeReadyTimeModeForNonPrinting: [
    { value: 'Flat', label: 'Flat' }
  ],

  // Legacy alias - use the specific ones above
  makeReadyTimeMode: [
    { value: 'Per Color', label: 'Per Color' },
    { value: 'Flat', label: 'Flat' }
  ],

  plateChargesType: [
    { value: 'Rate/Plate', label: 'Rate/Plate' },
    { value: 'Rate/Sq.CM', label: 'Rate/Sq.CM' },
    { value: 'Rate/Sq.Inch', label: 'Rate/Sq.Inch' },
    { value: 'Rate/Sq.Mtr', label: 'Rate/Sq.Mtr' }
  ],

  // All Per Hour Costing Parameter options (for non-printing or when no machine type selected)
  perHourCostingParameter: [
    { value: 'Actual Sheets', label: 'Actual Sheets' },
    { value: 'Actual Sheets + Make Ready Sheets', label: 'Actual Sheets + Make Ready Sheets' },
    { value: 'Actual Sheets + Wastage Sheets', label: 'Actual Sheets + Wastage Sheets' },
    { value: 'Actual Sheets + Make Ready Sheets + Wastage Sheets', label: 'Actual Sheets + Make Ready Sheets + Wastage Sheets' },
    { value: 'Actual Running Meter', label: 'Actual Running Meter' },
    { value: 'Actual Running Meter + Make Ready Running Meter', label: 'Actual Running Meter + Make Ready Running Meter' },
    { value: 'Actual Running Meter + Wastage Running Meter', label: 'Actual Running Meter + Wastage Running Meter' },
    { value: 'Actual Running Meter + Make Ready Running Meter + Wastage Running Meter', label: 'Actual Running Meter + Make Ready Running Meter + Wastage Running Meter' },
    { value: 'Order Quantity', label: 'Order Quantity' },
    { value: 'Final Qty', label: 'Final Qty' },
    { value: 'Printing Impresions', label: 'Printing Impresions' }
  ]
}

/**
 * Get Per Hour Costing Parameter options based on Machine Type (for Printing Department only)
 * Returns different options based on the selected machine type
 */
export function getPerHourCostingOptionsForMachineType(machineType: string): { value: string; label: string }[] {
  const upperType = (machineType || '').toUpperCase()

  // Sheet-based machine types
  if (upperType === 'SHEETFED OFFSET' || upperType === 'DIGITAL' ||
      upperType === 'REEL TO SHEET CUTTING' || upperType === 'CORRUGATION' ||
      upperType === 'CORRUGATION FLEXO PRINTER') {
    return [
      { value: 'Actual Sheets', label: 'Actual Sheets' },
      { value: 'Actual Sheets + Make Ready Sheets', label: 'Actual Sheets + Make Ready Sheets' },
      { value: 'Actual Sheets + Wastage Sheets', label: 'Actual Sheets + Wastage Sheets' },
      { value: 'Actual Sheets + Make Ready Sheets + Wastage Sheets', label: 'Actual Sheets + Make Ready Sheets + Wastage Sheets' },
      { value: 'Order Quantity', label: 'Order Quantity' },
      { value: 'Final Qty', label: 'Final Qty' },
      { value: 'Printing Impresions', label: 'Printing Impresions' }
    ]
  }

  // Web Offset - similar to sheetfed but without Order Qty and Final Qty
  if (upperType === 'WEB OFFSET') {
    return [
      { value: 'Actual Sheets', label: 'Actual Sheets' },
      { value: 'Actual Sheets + Make Ready Sheets', label: 'Actual Sheets + Make Ready Sheets' },
      { value: 'Actual Sheets + Wastage Sheets', label: 'Actual Sheets + Wastage Sheets' },
      { value: 'Actual Sheets + Make Ready Sheets + Wastage Sheets', label: 'Actual Sheets + Make Ready Sheets + Wastage Sheets' },
      { value: 'Printing Impresions', label: 'Printing Impresions' }
    ]
  }

  // Flexo - Running Meter based, without Final Qty
  if (upperType === 'FLEXO') {
    return [
      { value: 'Actual Running Meter', label: 'Actual Running Meter' },
      { value: 'Actual Running Meter + Make Ready Running Meter', label: 'Actual Running Meter + Make Ready Running Meter' },
      { value: 'Actual Running Meter + Wastage Running Meter', label: 'Actual Running Meter + Wastage Running Meter' },
      { value: 'Actual Running Meter + Make Ready Running Meter + Wastage Running Meter', label: 'Actual Running Meter + Make Ready Running Meter + Wastage Running Meter' },
      { value: 'Order Quantity', label: 'Order Quantity' }
    ]
  }

  // Large Format, Roto Gravure, Dry Web Offset - Running Meter based with Final Qty
  if (upperType === 'LARGE FORMAT' || upperType === 'ROTO GRAVURE' || upperType === 'DRY WEB OFFSET') {
    return [
      { value: 'Actual Running Meter', label: 'Actual Running Meter' },
      { value: 'Actual Running Meter + Make Ready Running Meter', label: 'Actual Running Meter + Make Ready Running Meter' },
      { value: 'Actual Running Meter + Wastage Running Meter', label: 'Actual Running Meter + Wastage Running Meter' },
      { value: 'Actual Running Meter + Make Ready Running Meter + Wastage Running Meter', label: 'Actual Running Meter + Make Ready Running Meter + Wastage Running Meter' },
      { value: 'Order Quantity', label: 'Order Quantity' },
      { value: 'Final Qty', label: 'Final Qty' }
    ]
  }

  // Default - return all options
  return MachineDropdownDefaults.perHourCostingParameter
}

export function transformMachineMaster(machine: MachineMaster): any {
  return {
    id: machine.MachineId?.toString() || '0',
    machineCode: machine.MachineCode || `MM${String(machine.MachineId || 0).padStart(5, '0')}`,
    machineName: machine.MachineName || '',
    machineType: machine.MachineType || '',
    refMachineCode: machine.RefMachineCode || '',
    departmentName: machine.DepartmentName || '',
    gripper: machine.Gripper || 0,
    maxLength: machine.MaxLength || 0,
    maxWidth: machine.MaxWidth || 0,
    minLength: machine.MinLength || 0,
    minWidth: machine.MinWidth || 0,
    maxPrintL: machine.MaxPrintL || 0,
    maxPrintW: machine.MaxPrintW || 0,
    minPrintL: machine.MinPrintL || 0,
    minPrintW: machine.MinPrintW || 0,
    perHourCost: machine.PerHourCost || 0,
    color: machine.Colors?.toString() || '0',
    underDepartment: machine.DepartmentName || '',
    printingMargin: machine.PrintingMargin || 0,
    speedUnit: machine.SpeedUnit || '',
    colors: machine.Colors?.toString() || '0',
    makeReadyWastageSheet: machine.MakeReadyWastageSheet || 0,
    makeReadyCharges: machine.MakeReadyCharges || 0,
    makeReadyTime: machine.MakeReadyTime || 0,
    makeReadyTimeMode: machine.MakeReadyTimeMode || '',
    makeReadyChargesPerHr: machine.MakeReadyPerHourCost || 0,
    jobChangeOverTime: machine.JobChangeOverTime || 0,
    speedImpressions: machine.MachineSpeed || 0,
    electricConsumption: machine.ElectricConsumption || 0,
    costPerHour: machine.PerHourCost || 0,
    isPlanningMachine: machine.IsPlanningMachine || false,
    minPrintingImpr: machine.MinimumSheet || 0,
    basicPrintingCharged: machine.BasicPrintingCharges || 0,
    roundOfImpressions: machine.RoundofImpressionsWith || 0,
    typeOfCharges: machine.ChargesType || '',
    isPerfectaMachine: machine.IsPerfectaMachine || false,
    isVariableCutOff: machine.IsVariableCutOff || false,
    isSpecialMachine: machine.IsSpecialMachine || false,
    wastageType: machine.WastageType || '',
    wastageCalculationOn: machine.WastageCalculationOn || '',
    branch: machine.BranchName || '',
    productionUnit: machine.ProductionUnitName || '',
    refMachineCode2: machine.RefMachineCode || '',
    perHourCostingParameter: machine.PerHourCostingParameter || '',
    machineGroupID: machine.MachineGroupID != null ? machine.MachineGroupID.toString() : '',
    machineGroupName: machine.MachineGroupName || '',
    isAllProductionUnit: machine.IsAllProductionUnit === true || (machine.IsAllProductionUnit as any) === 1,
    maxReelSize: machine.MaxReelSize || 0,
    minReelSize: machine.MinReelSize || 0,
    webCutOffSize: machine.WebCutOffSize || 0,
    webCutOffSizeMin: machine.WebCutOffSizeMin || 0,
    minRollWidth: machine.MinRollWidth || 0,
    maxRollWidth: machine.MaxRollWidth || 0,
    minCircumference: machine.MinCircumference || 0,
    maxCircumference: machine.MaxCircumference || 0,
    plateWidth: machine.PlateWidth || 0,
    plateLength: machine.PlateLength || 0,
    plateCharges: machine.PlateCharges || 0,
    plateChargesType: machine.PlateChargesType || '',
    avgBreakDownMeter: machine.AvgBreakDownRunningMeters || 0,
    avgBreakDownTime: machine.AvgBreakDownTime || 0,
    machineWidth: machine.MachineWidth || 0,
    avgRollLength: machine.AverageRollLength || 0,
    avgRollChangeWastage: machine.AverageRollChangeWastage || 0,
    rollChangeOverTime: machine.RollChangeTime || 0,
    isPinned: false,
    isFavorited: false,
    isArchived: false,
  }
}

/**
 * Machine API class
 */
export class MachineAPI {
  /**
   * Get all machines from Machine Master
   * Endpoint: /api/machinemaster/machinemaster
   * Method: GET
   * Auth: Basic Authentication
   */
  static async getMachineMaster(sessionData?: any): Promise<APIResponse<MachineMaster[]>> {
    try {
      const response = await APIClient.get<MachineMaster[]>('/api/machinemaster/machinemaster', sessionData)
      return response
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch machine master data'
      }
    }
  }

  // Fetch one machine, transformed to the row shape MachineMasterModal expects for edit mode.
  static async getMachineForEdit(machineId: number | string, sessionData?: any): Promise<APIResponse<any>> {
    try {
      const response = await this.getMachineMaster(sessionData)
      if (!response.success || !response.data) {
        return { success: false, error: response.error || 'Failed to fetch machine' }
      }
      const idStr = String(machineId)
      const match = response.data.find(m => String(m.MachineId) === idStr)
      if (!match) return { success: false, error: 'Machine not found' }
      return { success: true, data: transformMachineMaster(match) }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch machine' }
    }
  }

  /**
   * Get all machines (for planning/estimation)
   */
  static async getAllMachines(sessionData?: any): Promise<APIResponse<MachineMasterData[]>> {
    try {
      const response = await APIClient.get<MachineMasterData[]>('api/planwindow/getallmachines', sessionData)
      return response
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch machines'
      }
    }
  }

  /**
   * Get machine types for dropdown
   * Endpoint: /api/machinemaster/getmachinetype
   * Method: GET
   * Auth: Basic Authentication
   */
  static async getMachineTypes(sessionData?: any): Promise<APIResponse<MachineType[]>> {
    try {
      const response = await APIClient.get<MachineType[]>('/api/machinemaster/getmachinetype', sessionData)
      return response
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch machine types'
      }
    }
  }

  /**
   * Get departments for dropdown
   * Endpoint: /api/machinemaster/getselectdepartment
   * Method: GET
   * Auth: Basic Authentication
   */
  static async getDepartments(sessionData?: any): Promise<APIResponse<Department[]>> {
    try {
      const response = await APIClient.get<Department[]>('/api/machinemaster/getselectdepartment', sessionData)
      return response
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch departments'
      }
    }
  }

  /**
   * Get production units for dropdown
   * Endpoint: /api/machinemaster/getmachineproductionunitlist
   * Method: GET
   * Auth: Basic Authentication
   */
  static async getProductionUnits(sessionData?: any): Promise<APIResponse<ProductionUnit[]>> {
    try {
      const response = await APIClient.get<ProductionUnit[]>('/api/machinemaster/getmachineproductionunitlist', sessionData)
      return response
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch production units'
      }
    }
  }

  /**
   * Get existing slabs for a machine
   * Endpoint: /api/machinemaster/existslab/{MachineID}
   * Method: GET
   * Auth: Basic Authentication
   */
  static async getExistingSlabs(machineId: string | number, sessionData?: any): Promise<APIResponse<MachineSlab[]>> {
    try {
      const response = await APIClient.get<MachineSlab[]>(`/api/machinemaster/existslab/${machineId}`, sessionData)
      return response
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch machine slabs'
      }
    }
  }

  static async getCoatingRates(machineId: string | number, sessionData?: any): Promise<APIResponse<any[]>> {
    try {
      const response = await APIClient.get<any[]>(`/api/machinemaster/GetMachineOnlineCoatingRates?MID=${machineId}`, sessionData)
      return response
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch coating rates'
      }
    }
  }

  /**
   * Transform machine data to dropdown options
   */
  static transformToOptions(machines: MachineMasterData[], currencySymbol = ''): MachineOption[] {
    return machines.map(machine => ({
      value: machine.MachineID || 0,
      label: `${machine.MachineName || 'Unknown Machine'} (${machine.MachineSpeed || 0} ${machine.SpeedUnit || ''}) - ${currencySymbol}${machine.MachinePerHourCost || 0}/hr`,
      machineData: machine
    }))
  }

  /**
   * Transform machine types to dropdown options
   */
  static transformMachineTypesToOptions(types: MachineType[]) {
    return types.map(type => ({
      value: type.MachineTypeName,
      label: type.MachineTypeName
    }))
  }

  /**
   * Transform departments to dropdown options
   */
  static transformDepartmentsToOptions(departments: Department[]) {
    return departments.map(dept => ({
      value: dept.DepartmentID.toString(),
      label: dept.DepartmentName
    }))
  }

  /**
   * Transform production units to dropdown options
   */
  static transformProductionUnitsToOptions(units: ProductionUnit[]) {
    return units.map(unit => ({
      value: unit.ProductionUnitID.toString(),
      label: unit.ProductionUnitName
    }))
  }

  /**
   * Get next machine code for new machine creation
   * Endpoint: /api/machinemaster/getmachinecode
   * Method: GET
   * Auth: Basic Authentication
   * Response: "MM00001" (string format)
   */
  static async getMachineCode(sessionData?: any): Promise<APIResponse<string>> {
    try {
      const response = await APIClient.get<string>('/api/machinemaster/getmachinecode', sessionData)
      return response
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch machine code'
      }
    }
  }

  /**
   * Save new machine
   * Endpoint: /api/machinemaster/savemachinemasterdata
   * Method: POST
   * Auth: Basic Authentication
   * Body: {
   *   CostingMachineData: any[]
   *   ObjMachineSlab: any[]
   *   CoatingRates: any[]
   *   MachineName: string
   *   MachineID?: number (for save operation)
   *   CostingDataGroupAllocation?: [{ ItemSubGroupID: number }]
   *   GridRow?: string (comma-separated IDs like "-2,-4")
   * }
   */
  static async saveMachine(
    data: {
      CostingMachineData: any[]
      ObjMachineSlab: any[]
      CoatingRates: any[]
      MachineName: string
      MachineID?: number
      CostingDataGroupAllocation?: { ItemSubGroupID: number }[]
      GridRow?: string
    },
    sessionData?: any
  ): Promise<APIResponse<string>> {
    try {
      const response = await APIClient.post<string>('/api/machinemaster/savemachinemasterdata', data, sessionData)
      return response
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save machine'
      }
    }
  }

  /**
   * Update existing machine
   * Endpoint: /api/machinemaster/updatemachinemaster
   * Method: POST
   * Auth: Basic Authentication
   * Body: {
   *   CostingMachineData: any[]
   *   ObjMachineSlab: any[]
   *   CoatingRates: any[]
   *   MachineName: string
   *   MachineID: number
   *   CostingDataGroupAllocation: [{ ItemSubGroupID: number }]
   *   GridRow: string (comma-separated IDs like "-2,-4")
   * }
   */
  static async updateMachine(
    data: {
      CostingMachineData: any[]
      ObjMachineSlab: any[]
      CoatingRates: any[]
      MachineName: string
      MachineID?: number
      CostingDataGroupAllocation?: { ItemSubGroupID: number }[]
      GridRow?: string
    },
    sessionData?: any
  ): Promise<APIResponse<string>> {
    try {
      const response = await APIClient.post<string>('/api/machinemaster/updatemachinemaster', data, sessionData)
      return response
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update machine'
      }
    }
  }

  /**
   * Delete machine
   * Endpoint: /api/machinemaster/deletemachinemaster
   * Method: POST
   * Auth: Basic Authentication
   */
  static async deleteMachine(machineId: string | number, sessionData?: any): Promise<APIResponse<string>> {
    try {
      const response = await APIClient.post<string>(
        '/api/machinemaster/deletemachinemaster',
        { VMachineID: machineId.toString() },
        sessionData
      )
      return response
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete machine'
      }
    }
  }

  /**
   * Get material group grid for allocation
   * Endpoint: /api/machinemaster/GroupGrid
   * Method: GET
   * Auth: Basic Authentication
   * Response: [{ ItemSubGroupID: number, ItemSubGroupName: string }]
   */
  static async getGroupGrid(sessionData?: any): Promise<APIResponse<{ ItemSubGroupID: number; ItemSubGroupName: string }[]>> {
    try {
      const response = await APIClient.get<{ ItemSubGroupID: number; ItemSubGroupName: string }[]>(
        '/api/machinemaster/GroupGrid',
        sessionData
      )
      return response
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch material groups'
      }
    }
  }

  /**
   * Get existing material group allocations for a machine
   * Endpoint: /api/machinemaster/ExistGroupID?MachineID={id}
   * Method: GET
   * Auth: Basic Authentication
   * Response: [{ MachineID: number, ItemSubGroupID: number, IsDefault: boolean, CompanyID: number }]
   */
  static async getExistGroupID(machineId: string | number, sessionData?: any): Promise<APIResponse<{ MachineID: number; ItemSubGroupID: number; IsDefault: boolean; CompanyID: number }[]>> {
    try {
      const response = await APIClient.get<{ MachineID: number; ItemSubGroupID: number; IsDefault: boolean; CompanyID: number }[]>(
        `/api/machinemaster/ExistGroupID?MachineID=${machineId}`,
        sessionData
      )
      return response
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch existing allocations'
      }
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  // MACHINE GROUP MASTER — CRUD
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Get all machine groups for the current company/fyear
   * Endpoint: GET /api/machinemaster/machinegroups
   */
  static async getMachineGroups(sessionData?: any): Promise<APIResponse<MachineGroup[]>> {
    try {
      return await APIClient.get<MachineGroup[]>('/api/machinemaster/machinegroups', sessionData)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch machine groups'
      }
    }
  }

  /**
   * Save a new machine group
   * Endpoint: POST /api/machinemaster/savemachinegroup
   * Body: { MachineGroupName, ProductionUnitID? }
   * Response: "Success" | "Exist" (duplicate name)
   */
  static async saveMachineGroup(
    data: { MachineGroupName: string; ProductionUnitID?: number | null },
    sessionData?: any
  ): Promise<APIResponse<string>> {
    try {
      return await APIClient.post<string>('/api/machinemaster/savemachinegroup', data, sessionData)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save machine group'
      }
    }
  }

  /**
   * Update an existing machine group
   * Endpoint: POST /api/machinemaster/updatemachinegroup
   * Body: { MachineGroupID, MachineGroupName, ProductionUnitID? }
   * Response: "Success" | "Exist"
   */
  static async updateMachineGroup(
    data: { MachineGroupID: number; MachineGroupName: string; ProductionUnitID?: number | null },
    sessionData?: any
  ): Promise<APIResponse<string>> {
    try {
      return await APIClient.post<string>('/api/machinemaster/updatemachinegroup', data, sessionData)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update machine group'
      }
    }
  }

  /**
   * Soft-delete a machine group (sets IsDeletedTransaction = 1)
   * Endpoint: POST /api/machinemaster/deletemachinegroup
   * Body: { MachineGroupID }
   */
  static async deleteMachineGroup(
    machineGroupId: number,
    sessionData?: any
  ): Promise<APIResponse<string>> {
    try {
      return await APIClient.post<string>(
        '/api/machinemaster/deletemachinegroup',
        { MachineGroupID: machineGroupId },
        sessionData
      )
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete machine group'
      }
    }
  }

  /**
   * Transform MachineGroup[] into Dropdown options
   */
  static transformMachineGroupsToOptions(groups: MachineGroup[]): { value: string; label: string }[] {
    return (groups || []).map(g => ({
      value: g.MachineGroupID.toString(),
      label: g.MachineGroupName
    }))
  }
}