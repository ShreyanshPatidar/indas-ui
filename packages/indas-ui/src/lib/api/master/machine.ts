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
}