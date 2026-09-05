// Estimation Qualities API
// Handles quality, GSM, mill, finish, and coating data for estimation

import APIClient from '../core/client'
import type { APIResponse, Quality, GSMData, MillData, FinishData, CoatingData, BoardBrandData } from '../core/types'

/**
 * Get qualities by content type
 * @param contentType - The content type to filter by
 * @param sessionData - Session data containing user and company info
 * @returns Promise with qualities array
 */
/**
 * Get matched raw-material rate (L1 + L2) for the Raw Material card.
 * Backend resolves the item group dynamically from contentType (Paper/Reel/Board/etc),
 * so this works for any group. Returns matched item rows.
 */
export async function getMaterialRateAPI(
  filters: { contentType: string; quality: string; gsm: string; mill?: string; bf?: string; boardBrand?: string; finish?: string; plant?: string },
  sessionData?: any
): Promise<APIResponse> {
  const p = new URLSearchParams({
    contenttype: filters.contentType || '',
    quality: filters.quality || '',
    gsm: filters.gsm || '',
    mill: filters.mill || '',
    bf: filters.bf || '',
    boardbrand: filters.boardBrand || '',
    finish: filters.finish || '',
    plant: filters.plant || '',
  })
  return APIClient.get(`api/planwindow/material-rate?${p.toString()}`, sessionData)
}

export async function getQualitiesAPI(
  contentType: string,
  sessionData?: any
): Promise<APIResponse<Quality[]>> {
  try {
    const endpoint = `api/planwindow/quality/${encodeURIComponent(contentType)}`
    const response = await APIClient.get<Quality[]>(endpoint, sessionData)
    return response
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch qualities: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get GSM (Grams per Square Meter) options
 * @param contentType - The content type
 * @param quality - The quality name
 * @param thickness - Optional thickness value (defaults to '0')
 * @param sessionData - Session data containing user and company info
 * @returns Promise with GSM data array
 */
export async function getGSMAPI(
  contentType: string,
  quality: string,
  thickness?: string,
  sessionData?: any
): Promise<APIResponse<GSMData[]>> {
  try {
    // Only use "0" when no thickness value is provided (undefined/null/empty)
    // If thickness has an actual value (including "0"), use that value
    const thicknessValue = (thickness !== undefined && thickness !== null && thickness.trim() !== '') ? thickness : '0'

    // Query string, not path segments: qualities like "Polycoated (335+15) Gsm"
    // encode to %2B, which IIS rejects as double-escaping in a path.
    const endpoint = `api/planwindow/gsm?contenttype=${encodeURIComponent(contentType)}&quality=${encodeURIComponent(quality)}&thickness=${encodeURIComponent(thicknessValue)}`

    const response = await APIClient.get<GSMData[]>(endpoint, sessionData)
    return response
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch GSM data: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get Mill options
 * @param contentType - The content type
 * @param quality - The quality name
 * @param gsm - The GSM value
 * @param thickness - Optional thickness value (defaults to '0')
 * @param sessionData - Session data containing user and company info
 * @returns Promise with mill data array
 */
export async function getMillAPI(
  contentType: string,
  quality: string,
  gsm: string,
  thickness?: string,
  sessionData?: any
): Promise<APIResponse<MillData[]>> {
  try {
    // Only use "0" when no thickness value is provided (undefined/null/empty)
    // If thickness has an actual value (including "0"), use that value
    const thicknessValue = (thickness !== undefined && thickness !== null && thickness.trim() !== '') ? thickness : '0'

    const endpoint = `api/planwindow/mill?contenttype=${encodeURIComponent(contentType)}&quality=${encodeURIComponent(quality)}&gsm=${encodeURIComponent(gsm)}&thickness=${encodeURIComponent(thicknessValue)}`

    const response = await APIClient.get<MillData[]>(endpoint, sessionData)
    return response
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch mill data: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get Finish options
 * @param quality - The quality name
 * @param gsm - The GSM value
 * @param mill - The mill name
 * @param sessionData - Session data containing user and company info
 * @returns Promise with finish data array
 */
export async function getFinishAPI(
  quality: string,
  gsm: string,
  mill: string,
  sessionData?: any
): Promise<APIResponse<FinishData[]>> {
  try {
    const endpoint = `api/planwindow/finish?quality=${encodeURIComponent(quality)}&gsm=${encodeURIComponent(gsm)}&mill=${encodeURIComponent(mill)}`
    const response = await APIClient.get<FinishData[]>(endpoint, sessionData)
    return response
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch finish data: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * One distinct paper combination — drives the import-template paper cascade.
 */
export interface PaperCombinationRow {
  Quality: string
  GSM: string
  Mill: string
  Finish: string
  Brand: string
}

/**
 * Get the FULL flat paper combination table in one call (Quality / GSM / Mill /
 * Finish / Brand). Used to build the Grid Costing import template's dependent
 * paper dropdowns without thousands of per-combination requests.
 */
export async function getPaperCombinationsAPI(
  sessionData?: any
): Promise<APIResponse<PaperCombinationRow[]>> {
  try {
    return await APIClient.get<PaperCombinationRow[]>('api/planwindow/papercombinations', sessionData)
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch paper combinations: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Get Coating options
 * @param sessionData - Session data containing user and company info
 * @returns Promise with coating data array
 */
export async function getCoatingAPI(sessionData?: any): Promise<APIResponse<CoatingData[]>> {
  try {
    const endpoint = 'api/planwindow/GetCoating'
    const response = await APIClient.get<CoatingData[]>(endpoint, sessionData)
    return response
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch coating data: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * BF (Burst Factor) data interface
 */
export interface BFData {
  BF: number
}

/**
 * Get BF (Burst Factor) options
 * @param quality - The quality name
 * @param gsm - The GSM value
 * @param mill - Optional mill name
 * @param sessionData - Session data containing user and company info
 * @returns Promise with BF data array
 */
export async function getBFAPI(
  quality: string,
  gsm: string,
  mill?: string,
  sessionData?: any
): Promise<APIResponse<BFData[]>> {
  try {
    let endpoint = `api/planwindow/getbf?quality=${encodeURIComponent(quality)}&gsm=${encodeURIComponent(gsm)}`
    if (mill) {
      endpoint += `&mill=${encodeURIComponent(mill)}`
    }
    const response = await APIClient.get<BFData[]>(endpoint, sessionData)
    return response
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch BF data: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Certification type data interface
 */
export interface CertificationType {
  ParameterType: string
  ParameterName: string
  ParameterValue: string
}

/**
 * Get Certification Types (FSC, PEFC, NONE, etc.)
 * @param sessionData - Session data containing user and company info
 * @returns Promise with certification types array
 */
export async function getCertificationTypesAPI(
  sessionData?: any
): Promise<APIResponse<CertificationType[]>> {
  try {
    const response = await APIClient.get<CertificationType[]>('api/othermaster/GetCertificationType', sessionData)
    return response
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch certification types: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Quote default values keyed by ParameterName (backend ParameterType = 'Quote Defaults')
 */
export interface QuoteDefaults {
  'Overhead Percentage'?: number | null
  'Profit Percentage'?: number | null
  'Packing Percentage'?: number | null
  'Misc Percentage'?: number | null
  'Factor Percentage'?: number | null
  'Tax Percentage'?: number | null
  'Discount Percentage'?: number | null
  'Freight Rate'?: number | null
  'Credit Interest Percentage'?: number | null
  'Insurance Percentage'?: number | null
}

/**
 * Get default values for cost-table fields (Overhead/Profit/Packing/etc.)
 * Endpoint returns an object keyed by ParameterName with parsed decimal values (or null).
 */
export async function getQuoteDefaultsAPI(
  sessionData?: any
): Promise<APIResponse<QuoteDefaults>> {
  try {
    const response = await APIClient.get<QuoteDefaults>('api/planwindow/particulars-defaults', sessionData)
    return response
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch quote defaults: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get Board Brand options filtered by content type, quality, GSM, mill, and finish
 * Pass "all" for any param to skip that filter
 * Route: boardbrand/{contenttype}/{quality}/{gsm}/{mill}/{finish}
 */
export async function getBoardBrandAPI(
  contentType: string,
  quality: string,
  gsm: string,
  mill: string,
  finish: string,
  sessionData?: any
): Promise<APIResponse<BoardBrandData[]>> {
  try {
    // Default every segment to 'all' so a missing ContentDomainType doesn't produce a
    // broken `boardbrand//all/...` URL — Board Brand must still load without a content type.
    const ct = contentType || 'all'
    const q = quality || 'all'
    const g = gsm || 'all'
    const m = mill || 'all'
    const f = finish || 'all'
    const endpoint = `api/planwindow/boardbrand?contenttype=${encodeURIComponent(ct)}&quality=${encodeURIComponent(q)}&gsm=${encodeURIComponent(g)}&mill=${encodeURIComponent(m)}&finish=${encodeURIComponent(f)}`
    const response = await APIClient.get<BoardBrandData[]>(endpoint, sessionData)
    return response
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch board brand data: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
