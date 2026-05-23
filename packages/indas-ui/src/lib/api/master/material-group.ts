// Material Group Master API
// Handles all material group operations

import APIClient from '../core/client'
import type { APIResponse } from '../core/types'

/**
 * Material Group interface
 */
export interface MaterialGroup {
    ItemSubGroupUniqueID: string
    ItemSubGroupID: number
    ItemSubGroupName: string
    ItemSubGroupDisplayName: string
    UnderSubGroupID: number
    ItemSubGroupLevel: number
    GroupName: string // For grouping in grid
}

/**
 * Under Group option for dropdown
 */
export interface UnderGroupOption {
    ItemSubGroupID: number
    ItemSubGroupDisplayName: string
    ItemSubGroupName?: string
    UnderSubGroupID?: number
    ItemSubGroupLevel?: number
}

/**
 * Material Group API class
 */
export class MaterialGroupAPI {
    /**
     * Get all material groups
     * Endpoint: GET /api/itemmaster/group
     */
    static async getGroups(sessionData?: any): Promise<APIResponse<MaterialGroup[]>> {
        return APIClient.get<MaterialGroup[]>('api/itemmaster/group', sessionData)
    }

    /**
     * Get under groups (parent groups) for dropdown
     * Endpoint: GET /api/itemmaster/under-group
     */
    static async getUnderGroups(sessionData?: any): Promise<APIResponse<UnderGroupOption[]>> {
        return APIClient.get<UnderGroupOption[]>('api/itemmaster/under-group', sessionData)
    }

    /**
     * Save a new material group
     * Endpoint: POST /api/itemmaster/save-group
     * 
     * Request Body Format:
     * {
     *   CostingDataGroupMaster: [{
     *     ItemSubGroupName: string,
     *     ItemSubGroupDisplayName: string,
     *     UnderSubGroupID: number
     *   }],
     *   GroupName: string,
     *   UnderGroupID: number,
     *   ItemGroupID: number
     * }
     * 
     * Response: "Success" or "Exist" (duplicate)
     */
    static async saveGroup(
        groupData: {
            ItemSubGroupName: string
            ItemSubGroupDisplayName: string
            UnderSubGroupID: number
        },
        itemGroupID: number,
        sessionData?: any
    ): Promise<APIResponse<string>> {
        const requestData = {
            CostingDataGroupMaster: [groupData],
            GroupName: groupData.ItemSubGroupName,
            UnderGroupID: groupData.UnderSubGroupID,
            ItemGroupID: itemGroupID
        }
        return APIClient.post<string>('api/itemmaster/save-group', requestData, sessionData)
    }

    /**
     * Update an existing material group
     * Endpoint: POST /api/itemmaster/update-group
     * 
     * Request Body Format:
     * {
     *   CostingDataGroupMaster: [{
     *     ItemSubGroupName: string,
     *     ItemSubGroupDisplayName: string,
     *     UnderSubGroupID: number
     *   }],
     *   ItemSubGroupUniqueID: string,
     *   ItemSubGroupLevel: string,
     *   GroupName: string,
     *   ItemGroupID: number
     * }
     * 
     * Response: "Success" or "Exist" (duplicate)
     */
    static async updateGroup(
        uniqueID: string,
        level: number,
        groupData: {
            ItemSubGroupName: string
            ItemSubGroupDisplayName: string
            UnderSubGroupID: number
        },
        itemGroupID: number,
        sessionData?: any
    ): Promise<APIResponse<string>> {
        const requestData = {
            CostingDataGroupMaster: [groupData],
            ItemSubGroupUniqueID: uniqueID,
            ItemSubGroupLevel: level.toString(),
            GroupName: groupData.ItemSubGroupName,
            ItemGroupID: itemGroupID
        }
        return APIClient.post<string>('api/itemmaster/update-group', requestData, sessionData)
    }

    /**
     * Delete a material group
     * Endpoint: POST /api/itemmaster/delete-group
     * 
     * Request Body Format:
     * {
     *   ItemSubGroupUniqueID: string
     * }
     * 
     * Response: "Success"
     */
    static async deleteGroup(uniqueID: string, sessionData?: any): Promise<APIResponse<string>> {
        const requestData = {
            ItemSubGroupUniqueID: uniqueID
        }
        return APIClient.post<string>('api/itemmaster/delete-group', requestData, sessionData)
    }
}
