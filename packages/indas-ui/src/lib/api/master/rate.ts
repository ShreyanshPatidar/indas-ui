// Rate Settings API
// Handles all rate settings operations (RM Rate Settings, Item Group Cost Setting, Item Sub-Group Rate Setting)

import APIClient from '../core/client'
import type { APIResponse } from '../core/types'

/**
 * Rate Settings API class
 * Manages operations for Rate Settings module
 */
export class RateSettingsAPI {
  /**
   * Get quality options for a specific item group
   * @param itemGroupId - The item group ID
   * @param sessionData - Session data (REQUIRED)
   */
  static async getQuality(
    itemGroupId: number,
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.get(
      `api/othermaster/getquality/${itemGroupId}`,
      sessionData
    )
  }

  /**
   * Get distinct values for any ItemMaster field for a given group.
   * Used for Ink (InkColour, ItemType), Lamination (SizeW, Thickness), Varnish (ItemType), Other (Quality).
   * Returns: [{ Value: "..." }, ...]
   */
  static async getDistinctField(
    itemGroupId: number,
    fieldName: 'InkColour' | 'ItemType' | 'SizeW' | 'Thickness' | 'Quality' | 'Manufecturer' | 'BF' | 'BoardBrand' | 'Finish' | 'ItemName' | 'SubGroup',
    sessionData?: any,
    quality?: string,
    subGroup?: string
  ): Promise<APIResponse> {
    const qs = new URLSearchParams()
    if (quality) qs.set('quality', quality)
    if (subGroup) qs.set('subGroup', subGroup)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return APIClient.get(
      `api/othermaster/getdistinctfield/${itemGroupId}/${fieldName}${suffix}`,
      sessionData
    )
  }

  /**
   * Get GSM options for a specific item group and quality
   * @param itemGroupId - The item group ID
   * @param quality - The quality (optional)
   * @param sessionData - Session data (REQUIRED)
   */
  static async getGSM(
    itemGroupId: number,
    quality?: string,
    sessionData?: any
  ): Promise<APIResponse> {
    const endpoint = quality
      ? `api/othermaster/getgsm/${itemGroupId}/${encodeURIComponent(quality)}`
      : `api/othermaster/getgsm/${itemGroupId}`

    return APIClient.get(endpoint, sessionData)
  }

  /**
   * Get mill options for a specific item group
   * @param itemGroupId - The item group ID
   * @param quality - The quality filter (optional)
   * @param sessionData - Session data (REQUIRED)
   */
  static async getMill(
    itemGroupId: number,
    quality?: string,
    sessionData?: any
  ): Promise<APIResponse> {
    const endpoint = quality
      ? `api/othermaster/getmill/${itemGroupId}?quality=${encodeURIComponent(quality)}`
      : `api/othermaster/getmill/${itemGroupId}`

    return APIClient.get(endpoint, sessionData)
  }

  /**
   * Get filtered item list based on filters
   * @param filters - Filter parameters
   * @param sessionData - Session data (REQUIRED)
   */
  static async getFilteredItemList(
    filters: {
      ItemGroupID: number
      PlantID: string | number
      // PAPER / REEL
      Quality?: string
      GSMFrom?: string
      GSMTo?: string
      Mill?: string
      // INK & ADDITIVES
      InkColour?: string
      ItemType?: string
      // LAMINATION FILM
      SizeW?: string
      Thickness?: string
      ItemName?: string
      // REEL
      BF?: string
      BFFrom?: string
      BFTo?: string
      // BOARD
      BoardBrand?: string
      Finish?: string
      // SUB GROUP (Ink/Varnish/Lamination/Foil/Shipper/Other)
      ItemSubGroupName?: string
    },
    sessionData?: any
  ): Promise<APIResponse> {
    const requestBody: Record<string, any> = {
      ItemGroupID: filters.ItemGroupID,
      PlantID: filters.PlantID,
      BF: filters.BF || '',
      BFFrom: filters.BFFrom || '',
      BFTo: filters.BFTo || '',
      BoardBrand: filters.BoardBrand || '',
      Finish: filters.Finish || '',
      Quality: filters.Quality || '',
      GSMFrom: filters.GSMFrom || '',
      GSMTo: filters.GSMTo || '',
      Mill: filters.Mill || '',
      InkColour: filters.InkColour || '',
      ItemType: filters.ItemType || '',
      SizeW: filters.SizeW || '',
      Thickness: filters.Thickness || '',
      ItemName: filters.ItemName || '',
      ItemSubGroupName: filters.ItemSubGroupName || '',
    }

    return APIClient.post(
      'api/othermaster/getfiltereditemlist',
      requestBody,
      sessionData
    )
  }

  /**
   * Get filtered item list for client-wise rate setting
   * @param filters - Filter parameters including client and rate type
   * @param sessionData - Session data (REQUIRED)
   */
  static async getFilteredItemListClientWise(
    filters: {
      ItemGroupID: number
      PlantID: string | number
      Quality?: string
      GSMFrom?: string
      GSMTo?: string
      Mill?: string
      BF?: string
      BFFrom?: string
      BFTo?: string
      BoardBrand?: string
      Finish?: string
      LedgerID?: string | number
      RateType?: string
    },
    sessionData?: any
  ): Promise<APIResponse> {
    const requestBody = {
      ItemGroupID: filters.ItemGroupID,
      PlantID: filters.PlantID,
      Quality: filters.Quality || '',
      GSMFrom: filters.GSMFrom || '',
      GSMTo: filters.GSMTo || '',
      Mill: filters.Mill || '',
      BF: filters.BF || '',
      BFFrom: filters.BFFrom || '',
      BFTo: filters.BFTo || '',
      BoardBrand: filters.BoardBrand || '',
      Finish: filters.Finish || '',
      LedgerID: filters.LedgerID || '',
      RateType: filters.RateType || ''
    }

    return APIClient.post(
      'api/othermaster/getfiltereditemlistclientwise',
      requestBody,
      sessionData
    )
  }

  /**
   * Update client-wise rate setting
   * @param items - Array of items with rates to update (includes LedgerID, RateType)
   * @param sessionData - Session data (REQUIRED)
   */
  static async clientWiseRateSetting(
    items: Array<{
      ItemGroupID: number
      PlantID: number
      ItemID: number
      EstimationRate: number
      LedgerID: number
      RateType: string
    }>,
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.post(
      'api/othermaster/clientwiseratesetting',
      items,
      sessionData
    )
  }

  /**
   * Update bulk item rates.
   * EstimationRate (L1) and EstimationRateL2 are both optional — backend only
   * writes the column when the field is present, so a single call can update
   * L1, L2, or both.
   * @param items - Array of items with rates to update
   * @param sessionData - Session data (REQUIRED)
   */
  static async updateBulkItemRate(
    items: Array<{
      ItemGroupID: number
      PlantID: number
      ItemID: number
      EstimationRate?: number
      EstimationRateL2?: number
    }>,
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.post(
      'api/othermaster/updatebulkitemrate',
      items,
      sessionData
    )
  }

  /**
   * Update bulk sub-group rates
   * @param items - Array of sub-groups with rates to update
   * @param sessionData - Session data (REQUIRED)
   */
  static async updateBulkSubGroupRate(
    items: Array<{
      ItemSubGroupID: string
      PlantID: string
      EstimationRate: string
    }>,
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.post(
      'api/othermaster/updatebulk-subgrouprate',
      items,
      sessionData
    )
  }

  /**
   * Get Item Group List for dropdown
   * @param sessionData - Session data (REQUIRED)
   */
  static async getItemGroupList(sessionData?: any): Promise<APIResponse> {
    return APIClient.get('/api/userauthentication/GetItemGroupList', sessionData)
  }

  /**
   * Get Item Sub Group List for dropdown
   * @param itemGroupId - Item Group ID
   * @param sessionData - Session data (REQUIRED)
   */
  static async getItemSubGroupList(
    itemGroupId: string,
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.get(
      `/api/userauthentication/getitemsubgrouplistdata?itemGroupID=${itemGroupId}`,
      sessionData
    )
  }

  /**
   * Get filtered sub-group list with rates
   * @param filters - Filter parameters
   * @param sessionData - Session data (REQUIRED)
   */
  static async getFilteredSubGroupList(
    filters: {
      ItemGroupID: number
      ItemSubGroupIDs: string // Comma-separated IDs (e.g., "37,38,42") - Note: API uses plural
      PlantID: string
    },
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.post(
      'api/othermaster/getfilteredSubGrouplist',
      filters,
      sessionData
    )
  }

  /**
   * Get Domain Type List for dropdown
   * @param sessionData - Session data (REQUIRED)
   */
  static async getDomainTypeList(sessionData?: any): Promise<APIResponse> {
    return APIClient.get('/api/userauthentication/getdomaintypelist', sessionData)
  }

  /**
   * Get Item Group Cost Setting grid data
   * @param itemGroupId - Item Group ID
   * @param itemSubGroupId - Item Sub Group ID
   * @param domainType - Domain Type
   * @param sessionData - Session data (REQUIRED)
   */
  static async getCostSettingGrid(
    itemGroupId: string,
    itemSubGroupId: string,
    domainType: string,
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.get(
      `/api/userauthentication/refreshcostsettinggrid?ItemGroupID=${itemGroupId}&ItemSubGroupID=${itemSubGroupId}&DomainType=${domainType}`,
      sessionData
    )
  }

  /**
   * Save Material Cost Setting
   * @param payload - Payload with JsonCostSetting array, itemSubGroupID, itemGroupID
   * @param sessionData - Session data (REQUIRED)
   */
  static async saveMaterialCostSetting(
    payload: {
      JsonCostSetting: any[]
      itemSubGroupID: string
      itemGroupID: string
    },
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.post(
      '/api/userauthentication/savematerialcostsetting',
      payload,
      sessionData
    )
  }

  /**
   * Get client names for client-wise rate setting
   * @param sessionData - Session data (REQUIRED)
   */
  static async getClientNames(sessionData?: any): Promise<APIResponse> {
    return APIClient.get('api/othermaster/getclientname', sessionData)
  }

  /**
   * Save As Material Cost Setting Details (copy to different Item Sub Group/Domain Type)
   * @param payload - Payload with JsonCostSetting array, itemSubGroupID, itemGroupID
   * @param sessionData - Session data (REQUIRED)
   */
  static async saveAsMaterialCostSetting(
    payload: {
      JsonCostSetting: any[]
      itemSubGroupID: string
      itemGroupID: string
    },
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.post(
      '/api/userauthentication/saveasmaterialcostsettingdetails',
      payload,
      sessionData
    )
  }
}
