// Process Master API
// Handles all process master operations

import APIClient from '../core/client'
import type { APIResponse } from '../core/types'
import type { SaveProcessMasterDataRequest, SaveProcessMasterDataResponse } from './process-types'

/**
 * Process Master API class
 */
export class ProcessMasterAPI {
  /**
   * Get all processes from the database
   */
  static async getProcesses(sessionData?: any): Promise<APIResponse> {
    return APIClient.get('api/processmaster/processmaster', sessionData)
  }

  /**
   * Create a new process
   */
  static async createProcess(processData: any, sessionData?: any): Promise<APIResponse> {
    return APIClient.post('api/processmaster/processmaster', processData, sessionData)
  }

  /**
   * Update an existing process
   * Uses POST method with specific request body format
   * Request body format:
   * {
   *   CostingDataProcessDetailMaster: [{ ...processFields }],
   *   finalStringContent: string,
   *   AllocattedMachineID: string,
   *   ProcessID: string
   * }
   * Response format: "Success"
   */
  static async updateProcess(
    processId: string,
    processData: {
      CostingDataProcessDetailMaster: any[]
      finalStringContent: string
      AllocattedMachineID: string
      ProcessID: string
      PrcoessID: string  // Backend expects this typo field
      [key: string]: any  // Allow additional fields
    },
    sessionData?: any
  ): Promise<APIResponse<string>> {
    return APIClient.post<string>('api/processmaster/updateprocessmasterdata', processData, sessionData)
  }

  /**
   * Delete a process
   * Uses POST method with ProcessID in URL path
   * Response format: "Success"
   */
  static async deleteProcess(processId: number, sessionData?: any): Promise<APIResponse<string>> {
    return APIClient.post<string>(`api/processmaster/deleteprocessmasterdata/${processId}`, {}, sessionData)
  }

  /**
   * Get a single process by ID
   */
  static async getProcess(processId: string, sessionData?: any): Promise<APIResponse> {
    return APIClient.get(`api/processmaster/processmaster/${processId}`, sessionData)
  }

  /**
   * Get existing slabs for a specific process
   */
  static async getProcessSlabs(processId: string, sessionData?: any): Promise<APIResponse> {
    return APIClient.get(`api/processmaster/existslab/${processId}`, sessionData)
  }

  /**
   * Get type of charges dropdown options
   */
  static async getTypeOfCharges(sessionData?: any): Promise<APIResponse> {
    return APIClient.get('api/processmaster/GetTypeOfCharges', sessionData)
  }

  /**
   * Get start unit dropdown options
   */
  static async getStartUnit(sessionData?: any): Promise<APIResponse> {
    return APIClient.get('api/processmaster/StartUnit', sessionData)
  }

  /**
   * Get machine allocation data for process master
   */
  static async getMachineAllocation(sessionData?: any): Promise<APIResponse> {
    return APIClient.get('api/processmaster/machigrid', sessionData)
  }

  /**
   * Get allocated machines list for a specific process
   */
  static async getAllocatedMachinesList(processId: number, sessionData?: any): Promise<APIResponse> {
    return APIClient.get(`api/processmaster/getallocatedmachineslist/${processId}`, sessionData)
  }

  /**
   * Get allocated tool groups list for a specific process
   */
  static async getAllocatedToolGroupsList(processId: number, sessionData?: any): Promise<APIResponse> {
    return APIClient.get(`api/processmaster/getprocessallocatedtoolgroups/${processId}`, sessionData)
  }

  /**
   * Get allocated material groups list for a specific process
   */
  static async getAllocatedMaterialGroupsList(processId: number, sessionData?: any): Promise<APIResponse> {
    return APIClient.get(`api/processmaster/getprocessallocatedmaterialgroups/${processId}`, sessionData)
  }

  /**
   * Get tool group list for tool allocation
   */
  static async getToolGroupList(sessionData?: any): Promise<APIResponse> {
    return APIClient.get('api/processmaster/gettoolgrouplist', sessionData)
  }

  /**
   * Get material group list for material allocation
   */
  static async getMaterialGroupList(sessionData?: any): Promise<APIResponse> {
    return APIClient.get('api/processmaster/getMaterialgrouplist', sessionData)
  }

  /**
   * Get inspection parameters for a specific process
   */
  static async getInspectionParameters(processId: number, sessionData?: any): Promise<APIResponse> {
    return APIClient.get(`api/processmaster/LoadProcessInspectionParameter/${processId}`, sessionData)
  }

  /**
   * Get line clearance parameters for a specific process
   */
  static async getLineClearanceParameters(processId: number, sessionData?: any): Promise<APIResponse> {
    return APIClient.get(`api/processmaster/LoadLineClearanceParameter/${processId}`, sessionData)
  }

  /**
   * Save process master data
   * Saves complete process master configuration including all allocations, slabs, and parameters
   */
  static async saveProcessMasterData(
    processData: SaveProcessMasterDataRequest,
    sessionData?: any
  ): Promise<APIResponse<SaveProcessMasterDataResponse>> {
    return APIClient.post<SaveProcessMasterDataResponse>(
      'api/processmaster/saveprocessmasterdata',
      processData,
      sessionData
    )
  }
}
