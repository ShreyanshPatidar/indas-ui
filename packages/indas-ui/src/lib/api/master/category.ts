// Category API
// Handles category-related API calls

import APIClient from '../core/client'
import type { APIResponse } from '../core/types'

/**
 * Category data interface based on API response
 */
export interface CategoryItem {
    SegmentID: number
    SegmentName: string
    CategoryID: number
    CategoryName: string
    Orientation: '2D' | '3D' | 'BOOK'
    ProcessIDString: string | null
    ContentsIDString: string | null
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
    DefaultPrintingMarginTop: number
    DefaultPrintingMarginBottom: number
    DefaultPrintingMarginLeft: number
    DefaultPrintingMarginRight: number
    DefaultStrippingMarginTop: number
    DefaultStrippingMarginBottom: number
    DefaultStrippingMarginLeft: number
    DefaultStrippingMarginRight: number
    DefaultJobTrimmingTop: number
    DefaultJobTrimmingBottom: number
    DefaultJobTrimmingLeft: number
    DefaultJobTrimmingRight: number
    Layer: number | null
    IsForBot?: boolean | number
    Remark: string | null
}

/**
 * Segment (Division) data interface based on API response
 */
export interface SegmentItem {
    SegmentID: number
    SegmentCode: string
    SegmentName: string
    RefSegmentCode: string
    CompanyID: number
    UserID: number
    CreatedBy: number
    CreatedDate: string
    ModifiedBy: number
    ModifiedDate: string | null
    IsDeletedTransaction: boolean
    DeletedDate: string | null
    DeletedBy: number
    MaxSegmentCode: number
    SegmentPrefix: string
    ProductionUnitID: number | null
    DefaultFactor: number
    FactorValueType: string
    DefaultProfit: number
    DefaultPackingCostPercentage: number | null
}

/**
 * Category API class
 */
export class CategoryAPI {
    /**
     * Get all categories
     * @param sessionData - Session data for authentication
     * @returns Promise with category items array
     */
    static async getCategories(sessionData?: any): Promise<APIResponse<CategoryItem[]>> {
        try {
            const endpoint = 'api/othermaster/category'
            const response = await APIClient.get<CategoryItem[]>(endpoint, sessionData)

            // Validate that data is actually an array
            if (response.success && response.data) {
                if (!Array.isArray(response.data)) {
                    console.error('❌ Category API returned non-array data')
                    return {
                        success: false,
                        error: 'API returned invalid data format (expected array)',
                        data: []
                    }
                }
            }

            return response
        } catch (error) {
            console.error('❌ [CATEGORY] Failed to fetch categories:', error)
            return {
                success: false,
                error: `Failed to fetch categories: ${error instanceof Error ? error.message : 'Unknown error'}`,
                data: []
            }
        }
    }

    /**
     * Get all segments (divisions)
     * @param sessionData - Session data for authentication
     * @returns Promise with segment items array
     */
    static async getSegments(sessionData?: any): Promise<APIResponse<SegmentItem[]>> {
        try {
            const endpoint = 'api/othermaster/getsegment'
            const response = await APIClient.get<SegmentItem[]>(endpoint, sessionData)

            // Validate that data is actually an array
            if (response.success && response.data) {
                if (!Array.isArray(response.data)) {
                    console.error('❌ Segment API returned non-array data')
                    return {
                        success: false,
                        error: 'API returned invalid data format (expected array)',
                        data: []
                    }
                }
            }

            return response
        } catch (error) {
            console.error('❌ [CATEGORY] Failed to fetch segments:', error)
            return {
                success: false,
                error: `Failed to fetch segments: ${error instanceof Error ? error.message : 'Unknown error'}`,
                data: []
            }
        }
    }

    /**
     * Get all allocated contents for a category
     * @param categoryID - Category ID to fetch contents for
     * @param sessionData - Session data for authentication
     * @returns Promise with allocated contents array
     */
    static async getAllContents(categoryID: number, sessionData?: any): Promise<APIResponse<any>> {
        try {
            const endpoint = `api/othermaster/all-contents/${categoryID}`
            const response = await APIClient.get<any>(endpoint, sessionData)
            return response
        } catch (error) {
            console.error('❌ [CATEGORY] Failed to fetch contents:', error)
            return {
                success: false,
                error: `Failed to fetch contents: ${error instanceof Error ? error.message : 'Unknown error'}`,
                data: null
            }
        }
    }

    /**
     * Update an existing category
     * @param categoryData - Category data to update
     * @param sessionData - Session data for authentication
     * @returns Promise with API response
     */
    static async updateCategory(categoryData: any, sessionData?: any): Promise<APIResponse<any>> {
        try {
            const endpoint = 'api/othermaster/update-category'
            const response = await APIClient.post<any>(endpoint, categoryData, sessionData)

            return response
        } catch (error) {
            console.error('❌ [CATEGORY] Failed to update category:', error)
            return {
                success: false,
                error: `Failed to update category: ${error instanceof Error ? error.message : 'Unknown error'}`,
                data: null
            }
        }
    }

    /**
     * Save a new category
     * @param categoryData - Category data to save
     * @param sessionData - Session data for authentication
     * @returns Promise with API response
     */
    static async saveCategory(categoryData: any, sessionData?: any): Promise<APIResponse<any>> {
        try {
            const endpoint = 'api/othermaster/save-category'
            const response = await APIClient.post<any>(endpoint, categoryData, sessionData)

            return response
        } catch (error) {
            console.error('❌ [CATEGORY] Failed to save category:', error)
            return {
                success: false,
                error: `Failed to save category: ${error instanceof Error ? error.message : 'Unknown error'}`,
                data: null
            }
        }
    }

    /**
     * Delete a category
     * @param categoryId - Category ID to delete
     * @param sessionData - Session data for authentication
     * @returns Promise with API response
     */
    static async deleteCategory(categoryId: number, sessionData?: any): Promise<APIResponse<any>> {
        try {
            const endpoint = `api/othermaster/delete-category/${categoryId}`
            const response = await APIClient.post<any>(endpoint, {}, sessionData)

            return response
        } catch (error) {
            return {
                success: false,
                error: `Failed to delete category: ${error instanceof Error ? error.message : 'Unknown error'}`,
                data: null
            }
        }
    }

    /**
     * Get the processes allocated to a category (its default processes).
     * Returns the distinct ProcessName list from CategoryWiseProcessAllocation.
     * Used to auto-fill the grid-costing template's process columns when
     * downloading from an enquiry (no manual process picker).
     */
    static async getCategoryProcesses(categoryID: number, sessionData?: any): Promise<APIResponse<string[]>> {
        try {
            const endpoint = `api/categorymaster/getallcontents/${categoryID}`
            const response = await APIClient.get<any>(endpoint, sessionData)
            if (!response.success) return { success: false, error: response.error, data: [] }

            // Endpoint returns a (possibly double-serialized) DataSet { Contents, Process }.
            let payload: any = response.data
            for (let i = 0; i < 3 && typeof payload === 'string'; i++) {
                try { payload = JSON.parse(payload) } catch { break }
            }
            const procRows: any[] = Array.isArray(payload?.Process) ? payload.Process : []
            // Order by department sequence (same as estimation), then name; backend
            // already orders this way, but sort here too so it's robust to dedup.
            const ordered = procRows.slice().sort((a: any, b: any) => {
                const sa = Number(a?.DepartmentSequenceNo ?? 0), sb = Number(b?.DepartmentSequenceNo ?? 0)
                if (sa !== sb) return sa - sb
                return String(a?.DisplayProcessName ?? a?.ProcessName ?? '').localeCompare(String(b?.DisplayProcessName ?? b?.ProcessName ?? ''))
            })
            // Prefer DisplayProcessName (what the template's process columns key on).
            const names = Array.from(new Set(
                ordered.map((p: any) => String(p?.DisplayProcessName ?? p?.ProcessName ?? '').trim()).filter(Boolean),
            ))
            return { success: true, data: names }
        } catch (error) {
            return {
                success: false,
                error: `Failed to fetch category processes: ${error instanceof Error ? error.message : 'Unknown error'}`,
                data: []
            }
        }
    }

    static async getMachineAllocatedItemSubList(machineId: number, sessionData?: any): Promise<APIResponse<MachineAllocatedItemSubGroup[]>> {
        try {
            return await APIClient.get<MachineAllocatedItemSubGroup[]>(`api/planwindow/GetMachineAllocatedItemSubList/${machineId}`, sessionData)
        } catch (error) {
            return {
                success: false,
                error: `Failed to fetch item sub groups: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
        }
    }
}

export interface MachineAllocatedItemSubGroup {
    MachineID: number
    MachineName: string
    ItemSubGroupID: number
    ItemSubGroupName: string
    ItemID: number
    ItemName: string
}
