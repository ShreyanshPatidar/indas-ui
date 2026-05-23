// Company Configuration API
// Handles company configurations for estimation module
// Called when estimation page opens

import APIClient from '../core/client'
import type { APIResponse } from '../core/types'

/**
 * Company Configuration interface
 */
export interface CompanyConfiguration {
  ShowPlanUptoWastagePerc: number
  JobReleasedChecklistFeature: boolean
  IsGstApplicable: boolean
  IsVatApplicable: boolean
  IsEinvoiceApplicable: boolean
  CurrencyHeadName: string
  CurrencyChildName: string
  CurrencyCode: string
  CurrencySymboliconRef: string
  TaxApplicableBranchWise: boolean
  CostEstimationMethodType: string
  EstimationRoundOffDecimalPlace: number
  PurchaseRoundOffDecimalPlace: number
  InvoiceRoundOffDecimalPlace: number
  DefaultTaxLedgerTypeName: string
  IsInternalApprovalRequired: boolean
  CannotViewCostingDetail: boolean
  CanCopyQuotation: boolean
  CanDeleteQuotation: boolean
  CanRejectQuotation: boolean
  CanPrintQuotation: boolean
  CanReviewQuotation: boolean
  CanReviseQuotation: boolean
  CanUserViewOtherQuotation: boolean
  CanSendQuotationForSO: boolean
  CanCheckEstimatedJobDetails: boolean
  CanCheckEstimatedDetailCosting: boolean
  CanAssignEnquiry: boolean
  CanEditApprovedCostInPriceApproval: boolean
  CanEditPOQuantityAndRate: boolean
  CanEditMaterialCostParameter: boolean
  WtCalculateOnEstimation: string
  EstimationPerUnitCostDecimalPlace: number
  AcceptSOLessThanEstimatedQty: boolean
  TypeOfCost: string
  ProcessWiseWastageTypeSetting: number // 0 = hide wastage dropdown, 1 = show wastage dropdown
  IsMarginBasedApproval: boolean // true = margin-based approval system is active
}

/**
 * Company Configuration API class
 * Manages company configurations for estimation
 */
export class CompanyConfigAPI {
  /**
   * Get company configurations
   * Called when estimation page opens
   * @param sessionData - Session data (REQUIRED)
   */
  static async getCompanyConfigurations(sessionData?: any): Promise<APIResponse<CompanyConfiguration[]>> {
    return APIClient.post('api/othermaster/getcompanyconfigrations', {}, sessionData)
  }
}
