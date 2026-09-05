// Quotation Save API
// Handles saving quotation data to the backend

import APIClient from '../core/client'
import type { APIResponse } from '../core/types'

/**
 * TblBooking Data Structure
 */
export interface TblBookingData {
  JobName: string
  LedgerID: number
  PlantID: number // Form-selected PlantID (sent in payload)
  ProductCode: string
  ArtWorkCode: string
  RefProductMasterCode: string
  ExpectedCompletionDays: number
  CategoryID: number
  EnquiryID: number
  Remark: string
  BookingRemark: string
  IsEstimate: number
  ClientName: string
  OrderQuantity: number
  EstimationUnit: string
  TypeOfCost: string
  FinalCost: number
  QuotedCost: number
  QuoteType: string
  ConsigneeID: number
  ProductHSNID: number
  CurrencySymbol: string
  ConversionValue: number | null
  ExportCurrencySymbol?: string | null
  ParentBookingID: number
  ShipperID: number
  SalesEmployeeID: number
  SalesType: string // Sales Type: Export, Domestic, or Deemed Export
  IsQuotedRateTaxInclusive: boolean
  AnnualQuantity: number // Annual quantity for cost calculations
  Source: string // Source of the quotation (always 'Estimo' when created from this app)
}

/**
 * Complete Save Quotation Payload Structure
 */
export interface SaveQuotationPayload {
  TblBooking: TblBookingData
  TblPlanning: any[]
  TblOperations: any[]
  TblContentForms: any[]
  CostingData: Record<string, any>[]
  FlagSave: string
  BookingNo: number | string
  ObjShippers: Record<string, any>
  ArrObjAttc: any[]
  Tblonetimecharges: any[]
  TblCorrugationPlyDetails: any[]
  TblAllocatedMaterials: any[]
  TblMaterialCostParams: any[]
  TblContentSpecData: any[]
  TblAllocatedMaterialLayers: any[]
  TblDeliverySpecData: { State: string; Location: string; FreightRate: string; Quantity?: string }[]
}

/**
 * Save quotation data to the backend
 *
 * @param payload - Complete quotation data payload
 * @param session - User session data
 * @returns API response with success/error status
 */
export async function saveQuotationAPI(
  payload: SaveQuotationPayload,
  session: any
): Promise<APIResponse<any>> {
  try {
    const response = await APIClient.post(
      '/api/planwindow/saveQuotationData',
      payload,
      session
    )

    if (!response.success) {
      console.error('❌ Failed to save quotation:', response.error)
    }

    return response
  } catch (error) {
    console.error('❌ Exception saving quotation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save quotation'
    }
  }
}

/**
 * Upload files for quotation attachments
 * Uses multipart/form-data to upload actual file binaries
 *
 * @param files - Array of File objects to upload
 * @param quoteNumber - Quote number for file naming prefix (e.g., "14.1")
 * @param session - User session data
 * @returns API response with uploaded file info
 */
export async function uploadQuotationFilesAPI(
  files: File[],
  quoteNumber: string,
  session: any
): Promise<APIResponse<any>> {
  try {
    if (!files || files.length === 0) {
      return { success: true, data: [] }
    }

    const formData = new FormData()

    // Append each file with prefixed name (spaces replaced with underscores)
    files.forEach((file) => {
      const sanitizedFileName = file.name.replace(/\s/g, '_')
      const prefixedName = quoteNumber ? `QN_${quoteNumber}_${sanitizedFileName}` : sanitizedFileName
      // Create a new file with the prefixed name
      const renamedFile = new File([file], prefixedName, { type: file.type })
      formData.append('file', renamedFile)
    })

    // Get auth headers from session
    const companyUsername = session?.user?.companyUsername
    const companyPassword = session?.user?.companyPassword
    const authHeader = companyUsername && companyPassword
      ? `Basic ${btoa(`${companyUsername}:${companyPassword}`)}`
      : ''

    const companyId = session?.user?.CompanyID || session?.user?.companyID
    const userId = session?.user?.UserID || session?.user?.userID
    const productionUnitId = session?.productionUnitId || session?.user?.ProductionUnitID || session?.user?.productionUnitID
    const fYear = session?.fYear || session?.user?.FYear || session?.user?.fYear

    const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || ''
    const typeParam = quoteNumber ? `QN_${quoteNumber}` : ''

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
    console.error('❌ Exception uploading files:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload files'
    }
  }
}

/**
 * Quotation Save API exports
 */
export const QuotationSaveAPI = {
  save: saveQuotationAPI,
  uploadFiles: uploadQuotationFilesAPI
}
