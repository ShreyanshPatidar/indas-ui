// User Master API
// Handles all user master operations

import APIClient from '../core/client'
import type { APIResponse } from '../core/types'

/**
 * User Master data from API response
 */
export interface UserMasterData {
  UserID: number
  UserName: string
  LoginUserName: string
  Password: string
  ContactNo: string
  UnderUserID: number
  Designation: string
  DepartmentID: number
  EmailID: string
  Country: string
  State: string
  City: string
  smtpUserName: string
  smtpUserPassword: string
  smtpServer: string
  smtpServerPort: string
  smtpAuthenticate: string
  smtpUseSSL: string
  Details: string
  IsCreateUser: boolean
  IsExtraPaperIssue: boolean
  IsUserCannotViewCostingDetail: boolean
  IsHidden: boolean
  IsAdmin: boolean
  IsTwoFactorEnabled: boolean
  ISChooseAnotherPaper: boolean
  IsEditableProductionDate: boolean
  ProfilePicHref: string | null
  SignPicHref: string | null
  UserWiseOperatorsIDStr: string
  EmailMessage: string
  HeaderText: string
  FooterText: string
  POEmailMessage: string | null
  POHeaderText: string | null
  POFooterText: string | null
  IsCreateDirectInvoice: boolean
  ExportHeaderText: string | null
  ExportFooterText: string | null
  IsModifyScheduleProcess: boolean
  IsDeleteProductionEntry: boolean
  IsSaveEditClosedJobProcess: boolean
  AllowDuplicatePONoInSO: boolean
  AcceptSOLessThanEstimatedQty: boolean
  CanDeleteQuotation: boolean
  CanReviseQuotation: boolean
  CanCopyQuotation: boolean
  CanPrintQuotation: boolean
  CanReviewQuotation: boolean
  CanSendQuotationForSO: boolean
  CanRejectQuotation: boolean
  CanCheckEstimatedJobDetails: boolean
  CanCheckEstimatedDetailCosting: boolean
  CanAssignEnquiry: boolean
  CanChangePODate: boolean
  CanEditPOQuantityAndRate: boolean
  CanEditProductionDate: boolean
  CanPackMoreThanSOQty: boolean
  CanCreateDirectPacking: boolean
  CanEditApprovedCostInPriceApproval: boolean
  InvoiceEmailMessage: string | null
  InvoiceHeaderText: string | null
  InvoiceFooterText: string | null
  InvoiceExportHeaderText: string | null
  InvoiceExportFooterText: string | null
  IsUpdateOutSourceInvoiceQuantity: boolean
  BranchName: string
  BranchID: number
  ProductionUnitName: string
  ProductionUnitID: number
  CanEditMaterialCostParameter: boolean
  CanAddAdditionalProcessesInPWO: boolean
  CanIReplanthePWOorProductCatalog: boolean
  IsInvoiceBlockFeatureRequired: boolean
  CanUpdateSODetails: boolean
  CanReceiveExcessMaterial: boolean
  CanAccessMultipleBranchData: boolean
  AllowAccessTallyInterface: boolean
  IsUserViewOtherQuotation: boolean
  CanEditRateInSO: boolean
  CanAccessMultipleProductionUnitData: boolean
  CanAccessMultipleBranchData1: boolean
  RoleID: number
  TenantID: string | null
  ClientID: string | null
  ClientSecret: string | null
  MailboxAddress: string | null
  SenderEmail: string | null
}

/**
 * Under User option for dropdown
 */
export interface UnderUserOption {
  UserID: number
  UserName: string
}

/**
 * Employee Allocation option for dropdown
 */
export interface EmployeeAllocationOption {
  LedgerID: number
  LedgerName: string
}

/**
 * Designation option for dropdown
 */
export interface DesignationOption {
  Designation: string
}

/**
 * Role option for dropdown
 */
export interface RoleOption {
  RoleID: number
  RoleName: string
  RoleDescription: string
  IsActive: boolean
}

/**
 * Production Unit option for dropdown
 */
export interface ProductionUnitOption {
  ProductionUnitID: number
  ProductionUnitName: string
}

/**
 * Branch option for dropdown
 */
export interface BranchOption {
  BranchID: number
  BranchName: string
}

/**
 * Segment/Division option for dropdown
 */
export interface SegmentOption {
  SegmentID: number
  SegmentName: string
  SegmentCode: string
  UserID: number | null
  Sel: number
}

/**
 * City option for dropdown
 */
export interface CityOption {
  City: string
}

/**
 * State option for dropdown
 */
export interface StateOption {
  State: string
}

/**
 * Country option for dropdown
 */
export interface CountryOption {
  Country: string
}

/**
 * Module authentication/authorization data
 */
export interface ModuleAuthenticationData {
  SetGroupIndex: number
  ModuleID: number
  ModuleHeadDisplayOrder: number
  ModuleHeadName: string
  ModuleName: string
  ModuleDisplayName: string
  CanView: number
  CanSave: number
  CanEdit: number
  CanDelete: number
  CanExport: number
  CanPrint: number
  SectionCount: number
  Role: string
}

/**
 * Production Unit Authentication Data
 */
export interface ProductionUnitAuthenticationData {
  ProductionUnitID: number
  CompanyName: string
  ProductionUnitName: string
  CanView: number
  CanCRUDOperations: number
}

/**
 * Submodule Authentication Data
 */
export interface SubmoduleAuthenticationData {
  ModuleName: string
  ModuleID: number
  ModuleType: string
  CanView: number
  CanSave: number
  CanEdit: number
  CanDelete: number
  CanExport: number
  CanPrint?: number
}

/**
 * User Master API class
 */
export class UserMasterAPI {
  /**
   * Get all users from the database
   */
  static async getUsers(sessionData?: any): Promise<APIResponse<UserMasterData[]>> {
    return APIClient.get('api/othermaster/getuser', sessionData)
  }

  /**
   * Get under user options for dropdown
   */
  static async getUnderUsers(sessionData?: any): Promise<APIResponse<UnderUserOption[]>> {
    return APIClient.get('api/othermaster/underuser', sessionData)
  }

  /**
   * Get employee allocation options for dropdown
   */
  static async getEmployeeAllocationList(sessionData?: any): Promise<APIResponse<EmployeeAllocationOption[]>> {
    return APIClient.get('api/othermaster/useroperatorslist', sessionData)
  }

  /**
   * Get designation options for dropdown
   */
  static async getDesignations(sessionData?: any): Promise<APIResponse<DesignationOption[]>> {
    return APIClient.get('api/othermaster/userdesignation', sessionData)
  }

  /**
   * Get role options for dropdown
   */
  static async getRoles(sessionData?: any): Promise<APIResponse<RoleOption[]>> {
    return APIClient.get('api/othermaster/getroles', sessionData)
  }

  /**
   * Get production unit options for dropdown
   */
  static async getProductionUnits(sessionData?: any): Promise<APIResponse<ProductionUnitOption[]>> {
    return APIClient.get('api/othermaster/GetProductionUnitList', sessionData)
  }

  /**
   * Get branch options for dropdown
   */
  static async getBranches(sessionData?: any): Promise<APIResponse<BranchOption[]>> {
    return APIClient.get('api/othermaster/GetBranch', sessionData)
  }

  /**
   * Get segment/division options for dropdown
   */
  static async getSegments(userId: number, sessionData?: any): Promise<APIResponse<SegmentOption[]>> {
    return APIClient.get(`api/othermaster/showSegmentData?ID=${userId}`, sessionData)
  }

  /**
   * Get city options for dropdown
   */
  static async getCities(sessionData?: any): Promise<APIResponse<CityOption[]>> {
    return APIClient.get('api/othermaster/getcity', sessionData)
  }

  /**
   * Get state options for dropdown
   */
  static async getStates(sessionData?: any): Promise<APIResponse<StateOption[]>> {
    return APIClient.get('api/othermaster/getstate', sessionData)
  }

  /**
   * Get country options for dropdown
   */
  static async getCountries(sessionData?: any): Promise<APIResponse<CountryOption[]>> {
    return APIClient.get('api/othermaster/getcountry', sessionData)
  }

  /**
   * Get all forms/modules for authorization
   */
  static async getAllForms(sessionData?: any): Promise<APIResponse<ModuleAuthenticationData[]>> {
    return APIClient.get('api/userauthentication/GetAllForm', sessionData)
  }

  /**
   * Save user data (create or update)
   */
  static async saveUserData(saveData: UserSaveRequest, sessionData?: any): Promise<APIResponse> {
    return APIClient.post('api/othermaster/saveuserdata', saveData, sessionData)
  }

  /**
   * Update user master data (for specific updates like blocking)
   */
  static async updateUserMasterData(updateData: any, sessionData?: any): Promise<APIResponse> {
    return APIClient.post('api/othermaster/updateusermasterdata', updateData, sessionData)
  }

  /**
   * Create a new user (legacy - use saveUserData instead)
   */
  static async createUser(userData: Partial<UserMasterData>, sessionData?: any): Promise<APIResponse> {
    return APIClient.post('api/othermaster/createuser', userData, sessionData)
  }

  /**
   * Update an existing user (legacy - use saveUserData instead)
   */
  static async updateUser(userId: number, userData: Partial<UserMasterData>, sessionData?: any): Promise<APIResponse> {
    return APIClient.put(`api/othermaster/updateuser/${userId}`, userData, sessionData)
  }

  /**
   * Delete a user
   */
  static async deleteUser(userId: number, sessionData?: any): Promise<APIResponse> {
    return APIClient.post(`api/othermaster/deleteusermaster?Userid=${userId}`, {}, sessionData)
  }

  /**
   * Get a single user by ID
   */
  static async getUser(userId: number, sessionData?: any): Promise<APIResponse<UserMasterData>> {
    return APIClient.get(`api/othermaster/getuser/${userId}`, sessionData)
  }

  /**
   * Get user module permissions (sub-menu data)
   */
  static async getUserModulePermissions(userId: number, sessionData?: any): Promise<APIResponse<UserModulePermission[]>> {
    return APIClient.get(`api/othermaster/showdata?id=${userId}`, sessionData)
  }

  /**
   * Get user production unit permissions
   */
  static async getUserProductionUnitPermissions(userId: number, sessionData?: any): Promise<APIResponse<ProductionUnitAuthenticationData[]>> {
    return APIClient.get(`api/userauthentication/showpructionunitdata?Userid=${userId}`, sessionData)
  }

  /**
   * Get submodule authentication data for a user
   */
  static async getSubmoduleAuthenticationData(userId: number, sessionData?: any): Promise<APIResponse<SubmoduleAuthenticationData[]>> {
    return APIClient.get(`api/userauthentication/getsubmenudata?UserId=${userId}`, sessionData)
  }

  /**
   * Update user password
   */
  static async updatePassword(data: UpdatePasswordRequest, sessionData?: any): Promise<APIResponse> {
    return APIClient.post('api/othermaster/updatepassword', data, sessionData)
  }

  /**
   * Update user basic info (profile)
   */
  static async updateUserInfo(data: UpdateUserInfoRequest, sessionData?: any): Promise<APIResponse> {
    return APIClient.post('api/othermaster/updateuserinfo', data, sessionData)
  }
}

/**
 * User Save Request structure
 */
export interface UserSaveRequest {
  CostingDataUserMaster: Array<{
    UserID?: number
    UserName: string
    LoginUserName: string
    Password: string
    ContactNo: string
    UnderUserID: number
    Designation: string
    EmailID: string
    Country: string
    BranchID: number
    ProductionUnitID: number
    State: string
    City: string
    smtpUserName?: string
    smtpUserPassword?: string
    smtpServer?: string
    smtpServerPort?: string
    smtpAuthenticate?: string
    smtpUseSSL?: string
    Details: string
    ProfilePicHref?: string
    SignPicHref?: string
    UserWiseOperatorsIDStr?: string
    EmailMessage?: string
    HeaderText?: string
    FooterText?: string
    ExportHeaderText?: string
    ExportFooterText?: string
    InvoiceEmailMessage?: string
    InvoiceHeaderText?: string
    InvoiceFooterText?: string
    InvoiceExportHeaderText?: string
    InvoiceExportFooterText?: string
    POEmailMessage?: string
    POHeaderText?: string
    POFooterText?: string
    IsCreateDirectInvoice?: boolean
    IsUpdateOutSourceInvoiceQuantity?: boolean
    AllowAccessTallyInterface?: boolean
    AllowDuplicatePONoInSO?: boolean
    AcceptSOLessThanEstimatedQty?: boolean
    CanDeleteQuotation?: boolean
    CanReviseQuotation?: boolean
    CanCopyQuotation?: boolean
    CanPrintQuotation?: boolean
    CanReviewQuotation?: boolean
    CanSendQuotationForSO?: boolean
    CanRejectQuotation?: boolean
    CanCheckEstimatedDetailCosting?: boolean
    CanAssignEnquiry?: boolean
    CanCheckEstimatedJobDetails?: boolean
    CanChangePODate?: boolean
    CanEditPOQuantityAndRate?: boolean
    CanEditProductionDate?: boolean
    CanPackMoreThanSOQty?: boolean
    CanCreateDirectPacking?: boolean
    CanEditApprovedCostInPriceApproval?: boolean
    CanEditRateInSO?: boolean
    CanChangeClientOnSO?: boolean
    IsExtraPaperIssue?: boolean
    CanAccessMultipleBranchData?: boolean
    CanAccessMultipleProductionUnitData?: boolean
    CanUpdateSODetails?: boolean
    CanAddAdditionalProcessesInPWO?: boolean
    CanEditMaterialCostParameter?: boolean
    CanIReplanthePWOorProductCatalog?: boolean
    IsInvoiceBlockFeatureRequired?: boolean
    IsAdmin?: boolean
    IsTwoFactorEnabled?: boolean
    ISChooseAnotherPaper?: boolean
    IsUserViewOtherQuotation?: boolean
    IsUserCannotViewCostingDetail?: boolean
    IsSaveEditClosedJobProcess?: boolean
    IsDeleteProductionEntry?: boolean
    IsModifyScheduleProcess?: boolean
    CanReceiveExcessMaterial?: boolean
    IsChallanBlockFeatureRequired?: boolean
  }>
  OperatorAllocation?: Array<{
    OperatorID: number
    OperatorName: string
  }>
  SegmentUserDataAllocation?: Array<{
    SegmentID: number
    SegmentName: string
  }>
  ProductionUnitAllocation?: Array<{
    ProductionUnitID: number
    CompanyName: string
    ProductionUnitName: string
    CanView: number
    CanCRUDOperations: number
  }>
  SaveFlag: boolean
  Userid: string
  LoginUserName: string
  UserModuleAuthentication: Array<{
    ModuleID: number
    ModuleName: string
    Role: string
    CanView: boolean
    CanSave: boolean
    CanEdit: boolean
    CanDelete: boolean
    CanExport: boolean
    CanPrint: boolean
    CanCancel: boolean
  }>
  UserSubModuleAuthentication?: Array<{
    ItemGroupID?: number
    LedgerGroupID?: number
    ModuleName: string
    CanView: boolean
    CanSave: boolean
    CanEdit: boolean
    CanDelete: boolean
    CanExport: boolean
  }>
}

/**
 * Update Password Request
 */
export interface UpdatePasswordRequest {
  UserID: number
  CurrentPassword: string
  NewPassword: string
}

/**
 * Update User Info Request
 */
export interface UpdateUserInfoRequest {
  UserName: string
  LoginUserName: string
  EmailID: string
  ContactNo: string
  UserPhoto?: string
  UserSignature?: string
  smtpUserName?: string
  smtpUserPassword?: string
  smtpServer?: string
  smtpServerPort?: string
}

/**
 * User Module Permission data from API
 */
export interface UserModulePermission {
  SetGroupIndex: number
  ModuleID: number
  ModuleHeadDisplayOrder: number
  ModuleHeadName: string
  ModuleName: string
  ModuleDisplayName: string
  CanView: boolean
  CanSave: boolean
  CanEdit: boolean
  CanDelete: boolean
  CanPrint: boolean
  CanExport: boolean
  CanCancel: boolean
  Role: string
  SectionCount: number
}
