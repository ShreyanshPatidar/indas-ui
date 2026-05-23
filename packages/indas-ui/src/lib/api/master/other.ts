// Other Settings API
// Handles all other settings operations (Unit, DieMasterImport, etc.)

import APIClient from '../core/client'
import type { APIResponse } from '../core/types'

/**
 * Other Settings API class
 * Manages operations for Other Settings module (Unit, DieMasterImport)
 */
export class OtherSettingsAPI {
  /**
   * Get Unit list
   * @param sessionData - Session data (REQUIRED)
   */
  static async getUnitList(sessionData?: any): Promise<APIResponse> {
    return APIClient.get('/api/unit/list', sessionData)
  }

  /**
   * Save Unit
   * @param unitData - Unit data
   * @param sessionData - Session data (REQUIRED)
   */
  static async saveUnit(
    unitData: {
      UnitName: string
      UnitSymbol: string
      Type: string
      ConversionValue?: number
      DecimalPlace?: number
    },
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.post('/api/unit/save', unitData, sessionData)
  }

  /**
   * Update Unit
   * @param unitData - Unit data with UnitID
   * @param sessionData - Session data (REQUIRED)
   */
  static async updateUnit(
    unitData: {
      UnitID: number
      UnitName: string
      UnitSymbol: string
      Type: string
      ConversionValue?: number
      DecimalPlace?: number
    },
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.post('/api/unit/update', unitData, sessionData)
  }

  /**
   * Delete Unit
   * @param unitId - Unit ID
   * @param sessionData - Session data (REQUIRED)
   */
  static async deleteUnit(
    unitId: number,
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.post('/api/unit/delete', { UnitID: unitId }, sessionData)
  }

  /**
   * Import Die Master data from Excel
   * @param excelData - Array of die master records
   * @param sessionData - Session data (REQUIRED)
   */
  static async importDieMaster(
    excelData: Array<{
      ProjectNo: string
      JobName: string
      ProdPlant: string
      CustomerName: string
      UpsL: number
      UpsW: number
      NoOfUps: number
      Length: number
      Width: number
      Height: number
    }>,
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.post('/api/diemaster/import', excelData, sessionData)
  }

  /**
   * Get Die Master list
   * @param sessionData - Session data (REQUIRED)
   */
  static async getDieMasterList(sessionData?: any): Promise<APIResponse> {
    return APIClient.get('/api/diemaster/list', sessionData)
  }

}
