// Shared API types and interfaces

/**
 * Standard API response wrapper
 */
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  status?: number
  responseHeaders?: Record<string, string>
  aborted?: boolean
}

/**
 * API configuration interface
 */
export interface APIConfig {
  baseURL: string
  username: string
  password: string
  timeout?: number
}

/**
 * Category interface
 */
export interface Category {
  CategoryID?: number // For estimation
  CategoryId?: number // For enquiry
  CategoryName: string
  CategoryDisplayName?: string
  SegmentID?: number
  SegmentName?: string
}

/**
 * Client interface
 */
export interface Client {
  ClientID: number
  ClientName: string
  LedgerId?: number
  LedgerName?: string
  ClientAddress?: string
  ClientPhone?: string
  ClientEmail?: string
  IsLead?: boolean // true = Lead, false = Client
  SalesPersonID?: number // Backend: LedgerMaster.RefSalesRepresentativeID. 0 = no assignment.
  CreditDays?: number // Backend: LedgerMaster.CreditDays. Used to auto-fill payment terms.
}

/**
 * Sales Person interface
 */
export interface SalesPerson {
  SalesPersonID: number
  SalesPersonName: string
  EmployeeID?: number
  EmployeeName?: string
  SalesPersonEmail?: string
  SalesPersonPhone?: string
}

/**
 * Quality interface for estimation
 */
export interface Quality {
  QualityID: number
  Quality: string // API uses 'Quality' not 'QualityName'
  QualityName?: string
  QualityDescription?: string
}

/**
 * GSM (Grams per Square Meter) data interface
 */
export interface GSMData {
  GSMID: number
  GSM: number // API uses 'GSM' not 'GSMValue'
  GSMValue?: number
  GSMDescription?: string
}

/**
 * Mill data interface
 */
export interface MillData {
  MillID: number
  Mill: string // API uses 'Mill' not 'MillName'
  MillName?: string
  MillLocation?: string
}

/**
 * Finish data interface
 */
export interface FinishData {
  FinishID: number
  Finish: string // API uses 'Finish' not 'FinishName'
  FinishName?: string
  FinishDescription?: string
}

/**
 * Board Brand data interface
 */
export interface BoardBrandData {
  BoardBrand: string
}

/**
 * Coating data interface
 */
export interface CoatingData {
  CoatingID: number
  CoatingName: string
  CoatingType?: string
}

/**
 * Machine data interface
 */
export interface MachineData {
  MachineID: number
  MachineName: string
  DepartmentName?: string
  MachineType?: string
  MachineSpeed?: number
  MachinePerHourCost?: number
}

/**
 * Login request interface
 */
export interface LoginRequest {
  username: string
  password: string
}

/**
 * User data interface
 */
export interface UserData {
  UserID: string
  UserName: string
  FYear: string
  CompanyID: string
  BranchID: string
  CompanyName: string
  ProductionUnitID: string
  IsAdmin: boolean
  APIIntegrationRequired?: string
  APIBaseURL?: string
  APIAuthenticationURL?: string
  HomePage?: string
  IsGstApplicable?: boolean
  IsVatApplicable?: boolean
  DefaultTaxLedgerTypeName?: string
  IsEinvoiceApplicable?: boolean
  CurrencyHeadName?: string
  CurrencyChildName?: string
  CurrencyCode?: string
  CurrencySymboliconRef?: string
  TaxApplicableBranchWise?: boolean
  EstimationRoundOffDecimalPlace?: number
  PurchaseRoundOffDecimalPlace?: number
  InvoiceRoundOffDecimalPlace?: number
  CostEstimationMethodType?: string
  OTPVerificationFeatureEnabled?: boolean
  EmailID?: string
  // Role
  RoleID?: number
  RoleName?: string
  // SMTP Settings
  smtpUserName?: string
  smtpUserPassword?: string
  smtpServer?: string
  smtpServerPort?: string
  smtpAuthenticate?: string
  smtpUseSSL?: string
}

/**
 * Login response interface
 */
export interface LoginResponse {
  success: boolean
  user?: UserData
  message?: string
  token?: string
}
