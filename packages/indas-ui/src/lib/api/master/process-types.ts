// Process Master Types
// TypeScript definitions for Process Master data structures

/**
 * Process Detail Master - Main process configuration
 */
export interface CostingDataProcessDetailMaster {
  ProcessID?: number
  ToolRequired?: number
  ProcessName: string
  DisplayProcessName?: string
  DepartmentID?: number
  TypeofCharges?: string
  SizeToBeConsidered?: string
  PrePress?: string
  StartUnit?: string
  EndUnit?: string
  UnitConversion?: number
  MinimumCharges?: string
  SetupCharges?: string
  IsDisplay?: boolean
  IsEditToBeProduceQty?: boolean
  Rate?: string
  ProcessProductionType?: string
  ProcessPurpose?: string
  IsOnlineProcess?: boolean
  IsExcludeFromProfit?: boolean | number
  IsFabricationWastageCal?: boolean
  ProcessModuleType?: string
  MinimumQuantityToBeCharged?: number
  ProcessFlatWastageValue?: number
  ProcessWastagePercentage?: number
  ProcessCategory?: string
  PerHourCostingParameter?: string
  ChargeApplyOnSheets?: string
  DryingTime?: number
  ProductionTolerancePercentage?: number
  // Legacy fields (for backward compatibility)
  ProcessCode?: string
  ProcessTypeID?: number
  ProcessTypeName?: string
  ChargeType?: string
  Unit?: string
  HSN_SAC_Code?: string
  ShortName?: string
  Description?: string
  IsActive?: boolean
  CreatedBy?: number
  CreatedDate?: string
  ModifiedBy?: number
  ModifiedDate?: string
}

/**
 * Machine Allocation - Links processes to machines
 */
export interface CostingDataMachinAllocation {
  ProcessID?: number
  MachineID: number
  MachineSpeed?: number
  MakeReadyTime?: number
  JobChangeOverTime?: number
  IsDefaultMachine?: number
  // Legacy fields (for backward compatibility)
  MachineName?: string
  MachineCode?: string
  IsDefault?: boolean
  Priority?: number
  CreatedBy?: number
  CreatedDate?: string
}

/**
 * Content Allocation - Links processes to content types
 */
export interface CostingDataContentAllocation {
  ContentID: string
  // Legacy fields (for backward compatibility)
  ProcessID?: number
  ContentName?: string
  ContentCode?: string
  IsDefault?: boolean
  Priority?: number
  CreatedBy?: number
  CreatedDate?: string
}

/**
 * Slab Configuration - Defines pricing slabs for processes
 */
export interface CostingDataSlab {
  FromQty: number
  ToQty: number
  StartUnit?: string
  RateFactor?: string
  Rate: number
  MinimumCharges?: number
  IsLocked?: boolean
  // Legacy fields (for backward compatibility)
  ProcessID?: number
  SlabID?: number
  FromValue?: number
  ToValue?: number
  ChargeValue?: number
  ChargeType?: string
  Unit?: string
  IsActive?: boolean
  CreatedBy?: number
  CreatedDate?: string
  ModifiedBy?: number
  ModifiedDate?: string
}

/**
 * Process Inspection Parameter - Quality control parameters
 */
export interface CostingProcessInspectionParameter {
  DepartmentID: number
  SequenceNo: number
  ParameterName: string
  StandardValue: string
  InputFieldType: string   // "Text Field" | "Combo Field"
  FieldDataType: string    // "Text" | "Numeric" | "Decimal"
  DefaultValue: string
}

/**
 * Line Clearance Parameter - Production line clearance requirements
 */
export interface CostingLineClearanceParameter {
  DepartmentID: number
  SequenceNo: number
  ParameterName: string
  StandardValue: string
  InputFieldType: string   // "Text Field" | "Combo Field"
  FieldDataType: string    // "Text" | "Numeric" | "Decimal"
  DefaultValue: string
}

/**
 * Process Tool Group Data - Tool group allocations
 */
export interface ProcessToolGroupData {
  ToolGroupID: number
  // Legacy fields (for backward compatibility)
  ProcessID?: number
  ToolGroupName?: string
  ToolGroupCode?: string
  Quantity?: number
  IsRequired?: boolean
  CreatedBy?: number
  CreatedDate?: string
}

/**
 * Material Allocation - Links processes to material groups
 */
export interface CostingDataMaterialAllocation {
  ItemID: number
  // Legacy fields (for backward compatibility)
  ProcessID?: number
  MaterialGroupID?: number
  MaterialGroupName?: string
  MaterialGroupCode?: string
  Quantity?: number
  Unit?: string
  IsRequired?: boolean
  CreatedBy?: number
  CreatedDate?: string
}

/**
 * Complete Process Master Save Request Body
 */
export interface SaveProcessMasterDataRequest {
  CostingDataProcessDetailMaster: CostingDataProcessDetailMaster[]
  CostingDataMachinAllocation: CostingDataMachinAllocation[]
  CostingDataContentAllocation: CostingDataContentAllocation[]
  CostingDataSlab: CostingDataSlab[]
  ProcessName: string
  finalStringContent: string
  CostingProcessInspectionParameter: CostingProcessInspectionParameter[]
  CostingLineClearanceParameter: CostingLineClearanceParameter[]
  ProcessToolGroupData: ProcessToolGroupData[]
  AllocattedMachineID: string
  CostingDataMaterialAllocation: CostingDataMaterialAllocation[]
}

/**
 * Save Process Master Data Response
 */
export interface SaveProcessMasterDataResponse {
  success: boolean
  message: string
  data?: any
}
