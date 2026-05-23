// Item Master API
// Handles all item master operations

import APIClient from '../core/client'
import type { APIResponse } from '../core/types'

/**
 * Item Master API class
 */
export class ItemMasterAPI {
  /**
   * Get all items from the database
   */
  static async getItems(sessionData?: any): Promise<APIResponse> {
    return APIClient.get('api/itemmaster/itemmaster', sessionData)
  }

  /**
   * Create a new item
   */
  static async createItem(itemData: any, sessionData?: any): Promise<APIResponse> {
    return APIClient.post('api/itemmaster/itemmaster', itemData, sessionData)
  }

  /**
   * Save item (create new item)
   * Endpoint: POST /api/itemmaster/save
   * Auth: Basic Authentication
   *
   * Request Body Format:
   * {
   *   CostingDataItemMaster: [{
   *     ItemType: string,
   *     ItemGroupID: string,
   *     ItemName: string,
   *     ItemDescription: string,
   *     TallyItemName: string,
   *     StockUnit: string,
   *     PurchaseUnit: string,
   *     EstimationUnit: string,
   *     WtPerPacking: string,
   *     UnitPerPacking: string,
   *     ConversionFactor: string,
   *     ProductHSNID: number,
   *     SizeW: number,
   *     PurchaseRate: string
   *   }],
   *   ItemGroupID: string,
   *   StockRefCode: string
   * }
   *
   * Response: Success message or error
   */
  static async saveItem(
    itemData: {
      CostingDataItemMaster: Array<{
        ItemType: string
        ItemGroupID: string
        ItemName: string
        ItemDescription: string
        TallyItemName: string
        StockUnit: string
        PurchaseUnit: string
        EstimationUnit: string
        WtPerPacking: string
        UnitPerPacking: string
        ConversionFactor: string
        ProductHSNID: number
        SizeW: number
        PurchaseRate: string
        [key: string]: any // Allow additional fields
      }>
      ItemGroupID: string
      StockRefCode: string
    },
    sessionData?: any
  ): Promise<APIResponse<string>> {
    return APIClient.post<string>('api/itemmaster/save', itemData, sessionData)
  }

  /**
   * Bulk save items via async pipeline. Use for 2+ items (Excel import, etc.) —
   * single-item forms keep using saveItem(). Returns immediately with a
   * saveBatchId; poll getBulkSaveStatus until status is "completed" or "failed".
   *
   * Endpoint: POST /api/itemmaster/save-bulk
   */
  static async saveItemsBulk(
    payload: {
      ItemGroupID: string
      MasterName?: string
      Items: Array<{
        StockRefCode?: string
        ActiveItem?: string
        CostingDataItemMaster: any[]
        [key: string]: any
      }>
    },
    sessionData?: any
  ): Promise<APIResponse<{ saveBatchId: string; status: string; totalItems: number }>> {
    return APIClient.post('api/itemmaster/save-bulk', payload, sessionData)
  }

  /**
   * Poll bulk save status.
   * Endpoint: GET /api/itemmaster/save-bulk/{saveBatchId}/status
   */
  static async getBulkSaveStatus(
    saveBatchId: string,
    sessionData?: any
  ): Promise<APIResponse<{
    status: 'queued' | 'processing' | 'completed' | 'failed'
    progress: number
    totalItems: number
    savedCount: number
    failedCount: number
    itemCodes?: string[]
    itemIds?: number[]
    errors?: Array<{ rowIndex: number; error: string }>
    errorMessage?: string
  }>> {
    return APIClient.get(`api/itemmaster/save-bulk/${saveBatchId}/status`, sessionData)
  }

  /**
   * Update an existing item
   * Uses POST method with specific request body format
   * Request body format:
   * {
   *   CostingDataItemMaster: [{ ...itemFields }],
   *   ItemID: string,
   *   StockRefCode: string,
   *   UnderGroupID: string
   * }
   * Response format: "Success"
   */
  static async updateItem(
    itemId: string,
    itemData: {
      CostingDataItemMaster: any[]
      ItemID: string
      StockRefCode: string
      UnderGroupID: string
    },
    sessionData?: any
  ): Promise<APIResponse<string>> {
    return APIClient.post<string>('api/itemmaster/update', itemData, sessionData)
  }

  /**
   * Delete an item
   * Uses POST method with itemID and itemgroupID as query parameters
   * Response format: "Success"
   */
  static async deleteItem(itemId: number, itemGroupId: number, sessionData?: any): Promise<APIResponse<string>> {
    return APIClient.post<string>(`api/itemmaster/deleteitem?itemID=${itemId}&itemgroupID=${itemGroupId}`, {}, sessionData)
  }

  /**
   * Bulk deactivate items (set ISItemActive = 0)
   * @param itemIds - Array of ItemIDs to deactivate
   * @param sessionData - Session data (REQUIRED)
   */
  static async bulkDeactivateItems(
    itemIds: number[],
    sessionData?: any
  ): Promise<APIResponse<string>> {
    return APIClient.post<string>('api/itemmaster/bulkdeactivate', { ItemIDs: itemIds }, sessionData)
  }

  /**
   * Get a single item by ID
   */
  static async getItem(itemId: string, sessionData?: any): Promise<APIResponse> {
    return APIClient.get(`api/itemmaster/itemmaster/${itemId}`, sessionData)
  }

  /** Lightweight name lookup — returns just { ItemID, ItemName }. */
  static async getItemName(itemId: number | string, sessionData?: any): Promise<APIResponse> {
    return APIClient.get(`api/itemmaster/item-name/${itemId}`, sessionData)
  }

  /**
   * Load selectbox options for multiple fields
   */
  static async loadSelectBoxOptions(
    fields: Array<{ FieldID: string; FieldName: string }>,
    sessionData?: any
  ): Promise<APIResponse> {
    return APIClient.post('api/itemmaster/selectboxload', fields, sessionData)
  }

  /**
   * Get master groups with grid column configuration
   */
  static async getMasterGroups(sessionData?: any): Promise<APIResponse> {
    return APIClient.get('api/itemmaster/itemmasterlist', sessionData)
  }

  /**
   * Get master fields configuration for creating/editing items
   */
  static async getMasterFields(masterID: number, sessionData?: any): Promise<APIResponse> {
    return APIClient.get(`api/itemmaster/getmasterfields/${masterID}`, sessionData)
  }

  /**
   * Get grid data for a specific master group
   */
  static async getGridData(masterID: number, sessionData?: any): Promise<APIResponse> {
    return APIClient.get(`api/itemmaster/grid/${masterID}`, sessionData)
  }
}
