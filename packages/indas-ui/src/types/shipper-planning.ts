/**
 * Shipper Planning Types
 * Aligned with ShipperPlanningController.cs (updated 26/02/2026)
 */

// Shipper Plan Data — maps to SP_ShipperSuggestion
export interface ShipperPlan {
  ShipperID: number
  ShipperName: string
  ItemID?: number | null
  SizeL: number
  SizeW: number
  SizeH: number
  PackX: number
  PackY: number
  PackZ: number
  QtyPerShipper: number
  EmptyCartonWt: number
  PerBoxWt: number
  ShipperWeightPerPack: number
  TotalWtOfAllShippers: number
  CBM: number
  CBF: number
  TotalShipperQtyReq: number     // mapped from TotalShippersRequired
  BoxUtilizationPct: number
  ShippingRate: number            // mapped from ShippingRatePerCBM
  ShippingCost: number
  ShipperRate: number
  ShipperCost: number
  Capacity: number
  // Pallet fields — null when no PalletID in request
  PalletType?: string | null
  PalletLength?: number | null
  PalletWidth?: number | null
  PalletTi?: number | null
  PalletHi?: number | null
  PalletTotalBoxesPerPallet?: number | null
  PalletLoadedLength?: number | null
  PalletLoadedWidth?: number | null
  PalletLoadedHeight?: number | null
  PalletTotalWeight?: number | null
  PalletAreaEfficiency?: number | null
  // UI-only fields
  ItemGroupID?: number
  ItemGroupName?: string
  isClientSpec?: boolean
  prodDims?: {
    l: number
    w: number
    h: number
  }
}

// Container Plan Data — maps to SP_ContainerOption
export interface ContainerPlan {
  ContainerID: number
  ContainerName: string
  LengthMM: number
  WidthMM: number
  HeightMM: number
  LengthFT: number
  WidthFT: number
  HeightFT: number
  BoxInLength: number
  BoxInWidth: number
  BoxInHeight: number
  TotalCarton: number
  TotalContainers: number
  TotalContainerWt: number
  MaxWeight: number
  TotalCBM: number
  TotalCBF: number
  UtilizationPercentage: number
  LastContainerUtilizationPct: number
  RemainingLengthMM: number
  RemainingWidthMM: number
  RemainingHeightMM: number
  BoxDirection: string
  // Pallet-mode fields — null when no Pallet in request
  PalletsPerContainer?: number | null
  TotalPalletsRequired?: number | null
  BoxesPerPallet?: number | null
  ShippingRatePerCBM?: number
}

// Pallet Master Data — maps to SP_PalletMasterRecord
export interface PalletData {
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
  ProductionUnitID?: number
}

// Pallet Plan Result (frontend-computed Ti-Hi)
export interface PalletPlan {
  PalletID?: number
  PalletName: string
  PalletDimensions?: string
  BoxesPerLayer: number
  Layers: number
  TotalBoxes: number
  LoadedDim: string
  LoadedWeight: number
  Efficiency: number
  PalletRate?: number
  isRotatedBase?: boolean
  allowInterlock?: boolean
  colsA?: number
  rowsA?: number
  colsB?: number
  rowsB?: number
  box?: {
    L: number
    W: number
    H: number
    Wt: number
  }
}

// Shipper Calculation Request — matches SP_ShipperPlanningRequest
export interface ShipperCalculationRequest {
  Product: {
    ProductLength: number
    ProductWidth: number
    ProductHeight: number
    ProductWt: number
  }
  Constraints: {
    MinShipperLength: number
    MaxShipperLength: number
    MinShipperWidth: number
    MaxShipperWidth: number
    MinShipperHeight: number
    MaxShipperHeight: number
    MinWeightKg: number
    MaxWeightKg: number
  }
  TotalQuantity: number
  PalletID?: number | null
  ShipperFromMaster?: boolean
  NoOfPly?: number
  GapMM?: number   // backend field (mm) — frontend uses Tol.% separately
  QtyPerBundle?: number
}

// Container Calculation Request — matches SP_ContainerPlanningRequest
export interface ContainerCalculationRequest {
  Shipper: {
    SizeL: number
    SizeW: number
    SizeH: number
    TotalWtOfAllShippers: number
    TotalShippersRequired: number
    CBM: number
    CBF: number
  }
  Pallet?: {
    PalletType: string
    PalletLength: number
    PalletWidth: number
    PalletTi: number
    PalletHi: number
    PalletTotalBoxesPerPallet: number
    PalletLoadedLength: number
    PalletLoadedWidth: number
    PalletLoadedHeight: number
    PalletTotalWeight: number
    PalletAreaEfficiency: number
  } | null
}

// Shipper Master Record — maps to SP_ShipperMasterRecord
export interface ShipperMasterRecord {
  ItemID: number
  ItemCode: string
  ItemName: string
  ItemDescription?: string
  SizeL: number
  SizeW: number
  SizeH: number
}

// Container Master Record — maps to SP_ContainerMasterRecord
export interface ContainerMasterRecord {
  ContainerID: number
  ContainerName: string
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
  ShippingRatePerCBM: number
  CompanyID: number
  ProductionUnitID?: number
}

// Shipper Content Data
export interface ShipperContent {
  PlanContName: string
  SizeLength: number
  SizeWidth: number
  SizeHeight: number
  JobNoOfPages: number
  ItemPlanQuality: string
  ItemPlanGsm: number
  ProductWt: number
  PlanContQty: number
  SizeOpenflap?: number
  SizeBottomflap?: number
  JobTongHeight?: number
  PlanContentType?: number
}

// Box Grid Data
export interface BoxGridRow {
  Name: string
  [key: string]: string | number
}

// Global Shipper Object (for saving)
export interface ShipperObject {
  JobQuantity: number
  MachineID: number
  ItemID: number
  TransID: number
  SizeL: number
  SizeW: number
  SizeH: number
  ItemGroupID?: number
  EmptyCartonWt: number
  Capacity: number
  EstimatedQuantity: number
  QtyPerShipper: number
  EstimatedRate: number
  EstimatedCost: number
  CBM: number
  CBF: number
  PackX: number
  PackY: number
  PackZ: number
  TotalWtOfAllShippers: number
  ShipperWeightPerPack: number
  PerBoxWt: number
  TotalWt: number
  ShippingRate: number
  ShippingCost: number
  NoOfPly: number
  ContainerID: number
  BoxInLength: number
  BoxInWidth: number
  BoxInHeight: number
  TotalCarton: number
  TotalContainers: number
  TotalCBM: number
  TotalCBF: number
  TotalContainerWt: number
  BoxDirection: string
  ProductLength: number
  ProductWidth: number
  ProductHeight: number
  ProductWt: number
}

// 3D Visualization Data
export interface Box3DData {
  l: number
  w: number
  h: number
}

export interface Stacking3DData {
  l: number
  w: number
  h: number
}

export interface Suggestion3DData {
  originalBox: Box3DData
  stacking: Stacking3DData
  itemOrientation: Box3DData
}
