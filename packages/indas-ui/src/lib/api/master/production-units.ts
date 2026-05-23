// Production Units API
// Handles production units operations

import APIClient from '../core/client'
import type { APIResponse } from '../core/types'

/**
 * Production Units API class
 */
export class ProductionUnitsAPI {
  /**
   * Get all production units
   */
  static async getProductionUnits(sessionData?: any): Promise<APIResponse> {
    return APIClient.get('api/othermaster/getproductionunits', sessionData)
  }
}
