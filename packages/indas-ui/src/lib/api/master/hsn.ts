// HSN Master API
// Handles HSN (Harmonized System of Nomenclature) related operations

import APIClient from '../core/client'
import type { APIResponse } from '../core/types'

export interface HSNGroup {
  ProductHSNID: number
  ProductHSNName: string
  ProductCategory: string
  GSTTaxPercentage: number
  CGSTTaxPercentage: number
  SGSTTaxPercentage: number
  IGSTTaxPercentage: number
  ExciseTaxPercentage: number | null
  MinimumExciseAmount: number
}

export interface HSNOption {
  value: number
  label: string
  description?: string
  hsnData: HSNGroup
}

/**
 * HSN API Service
 * Handles all HSN-related API operations
 */
export class HSNAPI {
  /**
   * Get all HSN groups
   */
  static async getHSNGroups(sessionData?: any): Promise<APIResponse<HSNGroup[]>> {
    try {
      const response = await APIClient.get<HSNGroup[]>('api/planwindow/getproducthsngroups', sessionData)

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          status: response.status
        }
      }

      return {
        success: false,
        error: response.error || 'Failed to fetch HSN groups',
        status: response.status
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 500
      }
    }
  }

  /**
   * Transform HSN groups to dropdown options
   */
  static transformToOptions(hsnGroups: HSNGroup[]): HSNOption[] {
    return hsnGroups.map(hsn => ({
      value: hsn.ProductHSNID,
      label: hsn.ProductHSNName,
      description: `GST: ${hsn.GSTTaxPercentage}%`,
      hsnData: hsn
    }))
  }

  /**
   * Get HSN group by ID
   */
  static getHSNById(hsnGroups: HSNGroup[], id: number): HSNGroup | undefined {
    return hsnGroups.find(hsn => hsn.ProductHSNID === id)
  }
}
