// Estimation API exports
// Central export point for all estimation-related APIs

// Export category APIs
export { getCategoriesAPI, getClientsAPI, getSalesPersonsAPI, getSalesPersonForClientAPI } from './categories'

// Export quality APIs
export { getQualitiesAPI, getGSMAPI, getMillAPI, getFinishAPI, getCoatingAPI, getBFAPI, getBoardBrandAPI, getPaperCombinationsAPI, getCertificationTypesAPI, getQuoteDefaultsAPI, getMaterialRateAPI, type BFData, type PaperCombinationRow, type CertificationType, type QuoteDefaults } from './qualities'

// Export machine APIs
export { getMachineGridAPI } from './machines'

// Export content API
export {
  ContentAPI,
  type ContentItem,
  type ParsedContentSizes,
  type DisplayContent
} from './content'

// Export planning APIs (includes Shirin Job Master)
export {
  LoadOperationsAPI,
  PlanWindowAPI,
  getMachineAllocatedItemList,
  getProcessAllocatedItemList,
  calculateFlapDimensions,
  type MachineAllocatedItem,
  type ShirinJobMasterRequest,
  type ShirinJobMasterResponse,
  type JobSizeObject,
  type TblPlanningItem,
  type TblOperationsItem,
  type TblBookFormsItem,
  type CalculateFlapDimensionsRequest,
  type CalculateFlapDimensionsResponse
} from './planning'

export { handleAPIResponse } from '../core/utils'

// Export quote panel APIs
export { QuotationAPI } from './quotepanel'

// Export quotation save APIs
export {
  saveQuotationAPI,
  uploadQuotationFilesAPI,
  QuotationSaveAPI,
  type TblBookingData,
  type SaveQuotationPayload
} from './quotation-save'

// Export shipper planning APIs
export {
  calculateShipperPlan,
  calculateContainerPlanning,
  loadContainerMasters,
  loadPalletMasters,
  loadShipperMasters,
} from './shipper-planning'

// Export freight APIs
export {
  getFreightLocations,
  type FreightLocation
} from './freight'
