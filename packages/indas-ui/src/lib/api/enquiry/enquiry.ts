// Enquiry API
// Handles enquiry-related API calls

import APIClient from '../core/client'
import type { APIResponse } from '../core/types'

export type EnquiryStatusAction = 'LOAD' | 'RELEASE' | 'ASSIGN' | 'UNASSIGN'

export interface EnquiryStatusResponse {
  IsAllowed: boolean
  Action: 'LOAD' | 'ASSIGN' | null
  ActionUserId?: number
  ActionUserName?: string
  ActionTime?: string
  Message?: string
}

/**
 * Enquiry data interface based on API response
 */
export interface EnquiryItem {
  Fyear: string
  UserName: string
  SegmentID: number
  SegmentName: string
  Mobile: string | null
  ConcernPersonID: number | null
  Status: string
  FileName: string
  CategoryID: number
  CategoryName: string
  ProductCode: string
  ExpectCompletion: number
  Quantity: string
  EstimationUnit: string
  Remark: string
  LedgerID: number
  ClientName: string
  IsLead?: boolean | number | string // Lead indicator (API returns boolean true/false)
  EmployeeID: number
  JobName: string
  EnquiryID: number
  EnquiryDate: string
  LedgerID1: number
  EnquiryID1: number
  EnquiryNo: string
  CompanyID: number
  EnquiryDate1: string
  SalesRepresentative: string
  TypeOfJob: string
  TypeOfPrinting: string
  EnquiryType: string
  SalesType: string
  Source?: string // Source of enquiry (optional)
  ProductionUnitID: number // Legacy field (from API, may still exist)
  ProductionUnitName: string
  CompanyName: string
  // Additional fields that may or may not be in API response (optional)
  EnquiryRefNo?: string
  AnnualQuantity?: number | string
  SupplyLocation?: string
  PaymentTerms?: string
  UnitCost?: number | string
  IsDetailed?: number | boolean
  PlantID?: number // Form-selected PlantID (new field)
}

/**
 * Request parameters for getMshowlistdata
 */
export interface GetEnquiriesRequest {
  FromDate: string // Format: "YYYY-MM-DD HH:mm:ss.SSS"
  ToDate: string // Format: "YYYY-MM-DD HH:mm:ss.SSS"
  ApplydateFilter: string // "True" or "False"
  RadioValue: string // "All" or other status values
}

/**
 * Default process item from GetCategoryContentWiseDefaultProcesses API
 */
export interface DefaultProcessItem {
  CategoryID: number
  ContentID: number
  ContentName: string
  ProcessID: number
  ProcessName: string
  PrePress: string
  TypeofCharges: string
  SizeToBeConsidered: string
  Rate: number
  MinimumCharges: number | null
  SetupCharges: number | null
  IsDisplay: boolean
  IsOnlineProcess: boolean | null
  ChargeApplyOnSheets: boolean | null
  DisplayProcessName: string
  Amount: number
  RateFactor: string
  AddRow: string
  MakeReadyTime: number
  MachineID: number
  MachineSpeed: number
  JobChangeOverTime: number
  MakeReadyPerHourCost: number
  MachinePerHourCost: number
  ExecutionTime: number
  TotalExecutionTime: number
  MakeReadyMachineCost: number
  ExecutionCost: number
  MachineCost: number
  MaterialCost: number
  MachineName: string
  DepartmentID: number
  DepartmentSequenceNo: number
  ProcessFlatWastageValue: number
  ProcessWastagePercentage: number
  ProcessProductionType: string
  PerHourCostingParameter: string
}

/**
 * Enquiry API class
 */
export class EnquiryAPI {
  /**
   * Get all enquiries with filters
   * @param request - Filter parameters
   * @param sessionData - Session data for authentication
   * @returns Promise with enquiry items array
   */
  static async getEnquiries(
    request: GetEnquiriesRequest,
    sessionData?: any
  ): Promise<APIResponse<EnquiryItem[]>> {
    try {
      const endpoint = 'api/enquiry/getmshowlistdata'
      const response = await APIClient.post<EnquiryItem[]>(endpoint, request, sessionData)

      // Validate that data is actually an array
      if (response.success && response.data) {
        if (!Array.isArray(response.data)) {
          console.error('❌ Enquiry API returned non-array data')
          return {
            success: false,
            error: 'API returned invalid data format (expected array)',
            data: []
          }
        }
      }

      return response
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch enquiries: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: []
      }
    }
  }

  /**
   * Get next enquiry number
   * @param sessionData - Session data for authentication
   * @returns Promise with enquiry number string (e.g., "EQ00528")
   */
  static async getEnquiryNo(sessionData?: any): Promise<APIResponse<string>> {
    try {
      const endpoint = 'api/enquiry/getenquiryno'
      const response = await APIClient.get<string>(endpoint, sessionData)

      return response
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch enquiry number: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: ''
      }
    }
  }

  /**
   * Get allowed processes for enquiry
   * @param sessionData - Session data for authentication
   * @returns Promise with allowed processes array
   */
  static async getAllowedProcesses(sessionData?: any): Promise<APIResponse<any[]>> {
    try {
      const endpoint = 'api/enquiry/editprocessgrid'
      const response = await APIClient.get<any[]>(endpoint, sessionData)
      return response
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch allowed processes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: []
      }
    }
  }

  /**
   * Get categories for enquiry (with segment/division info)
   * @param sessionData - Session data for authentication
   * @returns Promise with categories array including SegmentName (division)
   */
  static async getEnquiryCategories(sessionData?: any): Promise<APIResponse<any[]>> {
    try {
      const endpoint = 'api/enquiry/getsbcategory'
      const response = await APIClient.get<any[]>(endpoint, sessionData)
      return response
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch enquiry categories: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: []
      }
    }
  }

  /**
   * Save basic enquiry
   * @param enquiryData - Array with single enquiry object
   * @param sessionData - Session data for authentication
   * @returns Promise with success message
   */
  static async saveBasicEnquiry(enquiryData: any[], sessionData?: any): Promise<APIResponse<string>> {
    try {
      const endpoint = 'api/enquiry/saveeqdata'
      const response = await APIClient.post<string>(endpoint, enquiryData, sessionData)
      return response
    } catch (error) {
      return {
        success: false,
        error: `Failed to save basic enquiry: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Save detailed enquiry with multiple data sections
   * @param detailedData - Object containing MainData, DetailsData, ProcessData, etc.
   * @param sessionData - Session data for authentication
   * @returns Promise with success message
   */
  static async saveDetailedEnquiry(detailedData: any, sessionData?: any): Promise<APIResponse<string>> {
    try {
      const endpoint = 'api/enquiry/SaveMultipleEnquiry'
      const response = await APIClient.post<string>(endpoint, detailedData, sessionData)
      return response
    } catch (error) {
      console.error('❌ [ENQUIRY] Save detailed enquiry failed:', error)
      return {
        success: false,
        error: `Failed to save detailed enquiry: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Update basic enquiry
   * @param enquiryData - Array with single enquiry object
   * @param sessionData - Session data for authentication
   * @returns Promise with success message
   */
  static async updateBasicEnquiry(enquiryData: any[], sessionData?: any): Promise<APIResponse<string>> {
    try {
      const endpoint = 'api/enquiry/updateeqdata'
      const response = await APIClient.post<string>(endpoint, enquiryData, sessionData)
      return response
    } catch (error) {
      return {
        success: false,
        error: `Failed to update basic enquiry: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Update detailed enquiry with multiple data sections
   * @param detailedData - Object containing MainData, DetailsData, ProcessData, EnquiryID, etc.
   * @param sessionData - Session data for authentication
   * @returns Promise with success message
   */
  static async updateDetailedEnquiry(detailedData: any, sessionData?: any): Promise<APIResponse<string>> {
    try {
      const endpoint = 'api/enquiry/updatmultipleenquiry'
      const response = await APIClient.post<string>(endpoint, detailedData, sessionData)
      return response
    } catch (error) {
      console.error('❌ [ENQUIRY] Update detailed enquiry failed:', error)
      return {
        success: false,
        error: `Failed to update detailed enquiry: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Delete basic enquiry
   * @param enquiryId - Enquiry ID to delete
   * @param sessionData - Session data for authentication
   * @returns Promise with success message
   */
  static async deleteBasicEnquiry(enquiryId: number, sessionData?: any): Promise<APIResponse<string>> {
    try {
      const endpoint = `api/enquiry/deleteeq/${enquiryId}`
      const response = await APIClient.post<string>(endpoint, undefined, sessionData)
      return response
    } catch (error) {
      console.error('❌ [ENQUIRY] Delete basic enquiry failed:', error)
      return {
        success: false,
        error: `Failed to delete basic enquiry: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Delete detailed enquiry
   * @param enquiryId - Enquiry ID to delete
   * @param sessionData - Session data for authentication
   * @returns Promise with success message
   */
  static async deleteDetailedEnquiry(enquiryId: number, sessionData?: any): Promise<APIResponse<string>> {
    try {
      const endpoint = `api/enquiry/DeleteMultiEQ/${enquiryId}`
      const response = await APIClient.post<string>(endpoint, undefined, sessionData)
      return response
    } catch (error) {
      console.error('❌ [ENQUIRY] Delete detailed enquiry failed:', error)
      return {
        success: false,
        error: `Failed to delete detailed enquiry: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Get pending enquiries for Load Enquiry modal
   * @param sessionData - Session data for authentication
   * @returns Promise with pending enquiry items array
   */
  static async getPendingEnquiries(sessionData?: any): Promise<APIResponse<any[]>> {
    try {
      const endpoint = 'api/planwindow/GetPendingEnquiryData'
      const response = await APIClient.get<any[]>(endpoint, sessionData)
      return response
    } catch (error) {
      console.error('❌ [ENQUIRY] Get pending enquiries failed:', error)
      return {
        success: false,
        error: `Failed to get pending enquiries: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: []
      }
    }
  }

  /**
   * Get enquiry content data (contents, processes, layers)
   * @param enquiryId - Enquiry ID
   * @param sessionData - Session data for authentication
   * @returns Promise with enquiry content data
   */
  static async getEnquiryContentData(enquiryId: number, sessionData?: any): Promise<APIResponse<any>> {
    try {
      const endpoint = `api/planwindow/GetEnquiryContentData/${enquiryId}`
      const response = await APIClient.get<any>(endpoint, sessionData)
      return response
    } catch (error) {
      console.error('❌ [ENQUIRY] Get enquiry content data failed:', error)
      return {
        success: false,
        error: `Failed to get enquiry content data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: null
      }
    }
  }

  /**
   * Get concern persons for a customer/ledger
   * @param ledgerId - Customer/Ledger ID
   * @param sessionData - Session data for authentication
   * @returns Promise with concern persons array [{ConcernPersonID, Name, Mobile}]
   */
  static async getConcernPersons(ledgerId: number, sessionData?: any): Promise<APIResponse<any[]>> {
    try {
      const endpoint = `api/enquiry/getconcernperson/${ledgerId}`
      const response = await APIClient.get<any[]>(endpoint, sessionData)
      return response
    } catch (error) {
      console.error('❌ [ENQUIRY] Get concern persons failed:', error)
      console.error('❌ [ENQUIRY] Error details:', { message: error instanceof Error ? error.message : 'Unknown error', error })
      return {
        success: false,
        error: `Failed to get concern persons: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: []
      }
    }
  }

  /**
   * Get default processes for a category and content type
   * @param categoryId - Category ID
   * @param contentType - Content type (e.g., "ReverseTuckIn")
   * @param sessionData - Session data for authentication
   * @returns Promise with default processes array
   */
  static async getCategoryContentDefaultProcesses(
    categoryId: number,
    contentType: string,
    sessionData?: any
  ): Promise<APIResponse<DefaultProcessItem[]>> {
    try {
      const endpoint = `api/planwindow/GetCategoryContentWiseDefaultProcesses/${categoryId}/${contentType}`
      const response = await APIClient.get<DefaultProcessItem[]>(endpoint, sessionData)
      return response
    } catch (error) {
      console.error('❌ [ENQUIRY] Get default processes failed:', error)
      return {
        success: false,
        error: `Failed to get default processes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: []
      }
    }
  }

  /**
   * Helper to format date for API
   * @param date - JavaScript Date object
   * @returns Formatted string "YYYY-MM-DD HH:mm:ss.SSS"
   */
  static formatDateForAPI(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`
  }

  /**
   * Helper to format date for display (DD MMM YYYY format)
   * @param dateString - Date string from form (YYYY-MM-DD)
   * @returns Formatted string "DD MMM YYYY" (e.g., "29 Oct 2025")
   */
  static formatDateForDisplay(dateString: string): string {
    const date = new Date(dateString)
    const day = date.getDate()
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
  }

  /**
   * Lock enquiry when loading (LOAD action)
   * @param enquiryId - Enquiry ID to lock
   * @param userId - User ID attempting to lock
   * @param sessionData - Session data for authentication
   * @returns Promise with lock status response
   */
  static async lockEnquiry(
    enquiryId: number,
    userId: number,
    sessionData?: any
  ): Promise<APIResponse<EnquiryStatusResponse>> {
    try {
      const endpoint = 'api/enquiry/updatestatusforload'
      const request = {
        EnquiryId: enquiryId,
        UserId: userId,
        Action: 'LOAD'
      }
      const response = await APIClient.post<EnquiryStatusResponse>(endpoint, request, sessionData)
      return response
    } catch (error) {
      return {
        success: false,
        error: `Failed to lock enquiry: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: {
          IsAllowed: false,
          Action: null,
          Message: 'Failed to lock enquiry'
        }
      }
    }
  }

  /**
   * Release/Unlock enquiry when closing (RELEASE action)
   * @param enquiryId - Enquiry ID to release
   * @param userId - User ID releasing the lock
   * @param sessionData - Session data for authentication
   * @returns Promise with release status response
   */
  static async unlockEnquiry(
    enquiryId: number,
    userId: number,
    sessionData?: any
  ): Promise<APIResponse<any>> {
    try {
      const endpoint = 'api/enquiry/updatestatusforload'
      const request = {
        EnquiryId: enquiryId,
        UserId: userId,
        Action: 'RELEASE'
      }
      const response = await APIClient.post<any>(endpoint, request, sessionData)
      return response
    } catch (error) {
      return {
        success: false,
        error: `Failed to unlock enquiry: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Get list of users for enquiry assignment
   * @param sessionData - Session data for authentication
   * @returns Promise with user list array [{UserID, UserName}]
   */
  static async getUsersForAssignment(sessionData?: any): Promise<APIResponse<{ UserID: number; UserName: string }[]>> {
    try {
      const endpoint = 'api/planwindow/getuserlistforassignenquiry'
      const response = await APIClient.get<{ UserID: number; UserName: string }[]>(endpoint, sessionData)
      return response
    } catch (error) {
      return {
        success: false,
        error: `Failed to get users for assignment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: []
      }
    }
  }

  /**
   * Update enquiry status for load/release
   * @param enquiryId - Enquiry ID
   * @param userId - User ID
   * @param action - Action: 'LOAD' or 'RELEASE'
   * @param sessionData - Session data for authentication
   * @returns Promise with response
   */
  static async updateEnquiryStatus(
    enquiryId: number,
    userId: number,
    action: EnquiryStatusAction,
    sessionData?: any
  ): Promise<APIResponse<EnquiryStatusResponse>> {
    try {
      const endpoint = 'api/enquiry/updatestatusforload'
      const request = {
        EnquiryId: enquiryId,
        UserId: userId,
        Action: action
      }
      const response = await APIClient.post<EnquiryStatusResponse>(endpoint, request, sessionData)
      return response
    } catch (error) {
      return {
        success: false,
        error: `Failed to ${action.toLowerCase()} enquiry: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Set enquiry decision: bounce back to sales as "Incomplete Info" or "Rejected"
   * with a required remark for the costing team's records.
   */
  static async setEnquiryDecision(
    enquiryId: number,
    userId: number,
    decision: 'IncompleteInfo' | 'Rejected',
    remark: string,
    sessionData?: any
  ): Promise<APIResponse<{ Success: boolean; Status?: string; StatusRemark?: string; Message?: string }>> {
    try {
      const endpoint = 'api/enquiry/setdecision'
      const request = {
        EnquiryId: enquiryId,
        UserId: userId,
        Decision: decision,
        Remark: remark
      }
      const response = await APIClient.post<{ Success: boolean; Status?: string; StatusRemark?: string; Message?: string }>(endpoint, request, sessionData)
      return response
    } catch (error) {
      return {
        success: false,
        error: `Failed to set enquiry decision: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Upload files for enquiry attachments
   * Uses the same upload API as quotation (/api/planwindow/upload-multiple-files)
   *
   * @param files - Array of File objects to upload
   * @param enquiryNo - Enquiry number for file naming prefix (e.g., "EQ00528")
   * @param sessionData - Session data for authentication
   * @returns API response with uploaded file info
   */
  static async uploadEnquiryFiles(
    files: File[],
    enquiryNo: string,
    sessionData?: any
  ): Promise<APIResponse<any>> {
    try {
      if (!files || files.length === 0) {
        return { success: true, data: [] }
      }

      const formData = new FormData()

      // Append each file with sanitized name (enquiryNo already contains EQ prefix)
      files.forEach((file) => {
        // Replace spaces with underscores only (matching quotation pattern)
        const sanitizedFileName = file.name.replace(/\s/g, '_')
        const prefixedName = enquiryNo ? `${enquiryNo}_${sanitizedFileName}` : sanitizedFileName
        // Create a new file with the prefixed name
        const renamedFile = new File([file], prefixedName, { type: file.type })
        formData.append('file', renamedFile)
      })

      // Get auth headers from session
      const companyUsername = sessionData?.user?.companyUsername
      const companyPassword = sessionData?.user?.companyPassword
      const authHeader = companyUsername && companyPassword
        ? `Basic ${btoa(`${companyUsername}:${companyPassword}`)}`
        : ''

      const companyId = sessionData?.user?.CompanyID || sessionData?.user?.companyID
      const userId = sessionData?.user?.UserID || sessionData?.user?.userID
      const productionUnitId = sessionData?.productionUnitId || sessionData?.user?.ProductionUnitID || sessionData?.user?.productionUnitID
      const fYear = sessionData?.fYear || sessionData?.user?.FYear || sessionData?.user?.fYear

      const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || ''
      const typeParam = enquiryNo ? `${enquiryNo}` : ''

      // Use same endpoint as quotation upload
      const response = await fetch(`${baseURL}/api/planwindow/upload-multiple-files?type=${encodeURIComponent(typeParam)}`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'CompanyID': companyId?.toString() || '',
          'UserID': userId?.toString() || '',
          'ProductionUnitID': productionUnitId?.toString() || '',
          'FYear': fYear || ''
        },
        body: formData
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `File upload failed: ${response.status} - ${errorText}`
        }
      }

      const data = await response.json()
      return {
        success: true,
        data
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to upload enquiry files: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}


/**
 * Type of Job options
 */
export const TYPE_OF_JOB_OPTIONS = [
  { value: 'New', label: 'New' },
  { value: 'Repeat', label: 'Repeat' },
  { value: 'Sample', label: 'Sample' }
]

/**
 * Type of Printing options
 */
export const TYPE_OF_PRINTING_OPTIONS = [
  { value: 'Offset', label: 'Offset' },
  { value: 'Digital', label: 'Digital' },
  { value: 'Screen', label: 'Screen' },
  { value: 'Flexo', label: 'Flexo' }
]

/**
 * UOM (Unit of Measurement) options
 */
export const UOM_OPTIONS = [
  { value: 'PCS', label: 'PCS' },
  { value: 'KG', label: 'KG' },
  { value: 'PKT', label: 'PKT' }
]
