// Global Master Module Types

export interface BaseMasterItem {
  id: string | number
  isPinned?: boolean
  isFavorited?: boolean
  isArchived?: boolean
  isProtected?: boolean
}

export interface MasterModalProps<T extends BaseMasterItem> {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<T>) => void
  editingItem?: T | null
  title?: string
}

export interface MasterPageProps<T extends BaseMasterItem> {
  data: T[]
  onAdd: () => void
  onEdit: (item: T) => void
  onDelete: (item: T) => void
  onDuplicate: (item: T) => void
  loading?: boolean
  title: string
}

export interface MasterCRUDHandlers<T extends BaseMasterItem> {
  handleAdd: () => void
  handleEdit: (item: T) => void
  handleDelete: (item: T) => void
  handleDuplicate: (item: T) => void
  handleSave: (data: Partial<T>) => void
  handlePin: (item: T, pinned: boolean) => void
  handleFavorite: (item: T, favorited: boolean) => void
  handleArchive: (item: T) => void
  handleRestore: (item: T) => void
}

// Specific Master Item Types
export interface ProcessMasterItem extends BaseMasterItem {
  ProcessID: number
  DisplayProcessName: string
  TypeofCharges: string
  SizeToBeConsidered: string
  MinimumCharges: number
  SetupCharges: number
  IsDisplay: boolean
  ToolRequired: string
  DepartmentName: string
  StartUnit: string
  EndUnit: string
  UnitConversion: string
  PrePress: string
  ProcessName: string
  DepartmentID: number
  AllocattedMachineID: number
  AllocatedContentID: number
  ChargeApplyOnSheets: string
  Rate: number
  MinimumQuantityToBeCharged?: number
  ProcessModuleType: string
  IsOnlineProcess: boolean
  ProcessCategory: string
  DisplayName?: string
  PerHourCostingParameter?: string
  MakeSetupCharges?: number
  ProcessWastePercent?: number
  ProcessWasteFlat?: number
  ProcessPurpose?: string
  IsEditToBeProduceQty?: boolean
  IsFabricationWastageCal?: boolean
  DryingTime?: number
  ProductionTolerancePercentage?: number
  ProcessProductionType?: string
  Slabs?: any[]
  AllocatedMachines?: any[]
  AllocatedToolGroups?: any[]
  AllocatedMaterialGroups?: any[]
}

export interface MachineMasterItem extends BaseMasterItem {
  machineCode: string
  machineName: string
  machineType: string
  refMachineCode: string
  departmentName: string
  gripper: number
  maxLength: number
  maxWidth: number
  minLength: number
  minWidth: number
  maxPrintL: number
  maxPrintW: number
  minPrintL: number
  minPrintW: number
  perHourCost: number
  color: string
  underDepartment: string
  printingMargin: number
  speedUnit: string
  colors: string
  makeReadyWastageSheet: number
  makeReadyCharges: number
  makeReadyTime: number
  makeReadyTimeMode: string
  makeReadyChargesPerHr: number
  jobChangeOverTime: number
  speedImpressions: number
  electricConsumption: number
  costPerHour: number
  isPlanningMachine: boolean
  minPrintingImpr: number
  basicPrintingCharged: number
  roundOfImpressions: number
  typeOfCharges: string
  isPerfectaMachine: boolean
  isVariableCutOff: boolean
  isSpecialMachine: boolean
  wastageType: string
  wastageCalculationOn: string
  branch: string
  productionUnit: string
}

export interface UserMasterItem extends BaseMasterItem {
  userId: string
  userName: string
  email: string
  department: string
  role: string
  status: 'Active' | 'Inactive'
  lastLogin: string
  createdDate: string
}

// Master Module Configuration
export interface MasterModuleConfig {
  name: string
  title: string
  apiEndpoints: {
    getAll: string
    create: string
    update: string
    delete: string
  }
  permissions: {
    canCreate: boolean
    canEdit: boolean
    canDelete: boolean
    canArchive: boolean
  }
}

// Column Configuration Types
export interface MasterColumnConfig<T> {
  enablePin?: boolean
  enableFavorite?: boolean
  enableArchive?: boolean
  enableExport?: boolean
  enableCopy?: boolean
  primaryActions?: string[]
  maxVisibleActions?: number
  customColumns?: any[]
}