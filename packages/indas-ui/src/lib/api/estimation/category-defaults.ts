/**
 * Category Default Configuration API
 *
 * API to fetch default values for margins, trimmings, and other parameters
 * based on selected category
 */

import { Session } from 'next-auth'
import APIClient from '@/lib/api/core/client'

/**
 * Category Default Configuration Response
 */
export interface CategoryDefaultConfig {
  CategoryID: number
  MinimumAroundGap: number
  MaximumAroundGap: number
  DefaultAroundGap: number
  MinimumAcrossGap: number
  MaximumAcrossGap: number
  DefaultAcrossGap: number
  MinimumPlateBearer: number
  MaximumPlateBearer: number
  DefaultPlateBearer: number
  MinimumSideStrip: number
  MaximumSideStrip: number
  DefaultSideStrip: number
  DefaultPrintingMarginLeft: number
  DefaultPrintingMarginLeft1: number
  DefaultPrintingMarginRight: number
  DefaultPrintingMarginTop: number
  DefaultPrintingMarginBottom: number
  DefaultStrippingMarginLeft: number
  DefaultStrippingMarginRight: number
  DefaultStrippingMarginTop: number
  DefaultStrippingMarginBottom: number
  DefaultJobTrimmingTop: number
  DefaultJobTrimmingBottom: number
  DefaultJobTrimmingLeft: number
  DefaultJobTrimmingRight: number
  DefaultFactor: number
  DefaultPackingCostPercentage: number
  Layer: string
}

/**
 * Get category-wise default configuration
 *
 * Fetches default values for margins, trimmings, gaps, and other parameters
 * based on the selected category
 *
 * @param categoryId - Category ID to fetch defaults for
 * @param session - User session
 * @returns Promise with category default configuration
 */
export async function getCategoryDefaultsAPI(
  categoryId: number,
  session: Session
): Promise<{ success: boolean; data?: CategoryDefaultConfig; error?: string }> {
  try {
    const response = await APIClient.get(
      `/api/planwindow/GetCategoryWiseDefaultConfiguration/${categoryId}`,
      session
    )

    if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
      const config = response.data[0]

      return {
        success: true,
        data: config
      }
    }
    return {
      success: false,
      error: 'No default configuration found for this category'
    }
  } catch (error) {
    console.error('❌ [CATEGORY_DEFAULTS] Error fetching defaults:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch category defaults'
    }
  }
}
