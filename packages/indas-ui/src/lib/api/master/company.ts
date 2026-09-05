/**
 * Company Master API
 * Handles company profile, department, division, and production unit operations
 */

import APIClient from '@/lib/api/core/client'

// Backend returns HTTP 200 with a status string ("Success" | "fail" | "Exist" |
// "Error:..." | "You cannot delete..."); surface anything that isn't Success.
function checkBackendResult(response: any, fallback: string) {
  const body = typeof response?.data === 'string' ? response.data.trim() : ''
  if (response?.success && body && body.toLowerCase() !== 'success') {
    if (body === 'Exist') {
      return { success: false, error: 'Record already exists or is in use by other records' }
    }
    return { success: false, error: body.toLowerCase() === 'fail' ? fallback : body }
  }
  return response
}

// ============================================================================
// TYPES
// ============================================================================

export interface CompanyProfile {
  CompanyID?: number
  CompanyName: string
  Address1: string
  City: string
  State: string
  Pincode: string
  Country: string
  ContactNO: string
  FAX?: string
  Email: string
  Website?: string
  PAN?: string
  CINNo?: string
  GSTIN?: string
  ProductionUnitName?: string
  ImportExportCode?: string
}

export interface Department {
  DepartmentID?: number
  DepartmentName: string
  Press: string
  SequenceNo: string
}

export interface Domain {
  SegmentID?: number
  SegmentName: string
  RefSegmentCode: string
  DefaultFactor: string
  FactorValueType: string | null
  DefaultProfit: number
  ApprovalRanges?: ApprovalRange[]
}

export interface ApprovalRange {
  TransID: number
  RangeFrom: string
  RangeTo: string
  UserApprovalAuthorityID: number
  UserApprovalAuthorityName: string
  RangeType: string
}

export interface ProductionUnit {
  ProductionUnitID?: number
  ProductionUnitName: string
  BranchID: number
  Pincode: string
  Address: string
  City: string
  State: string
  Country: string
  CompanyID: number
  GSTNo: string
  RefProductionUnitCode: string
}

// ============================================================================
// COMPANY PROFILE APIs
// ============================================================================

/**
 * Get all companies
 * NOTE: Company Master typically shows only current company, not a list
 * Returns session company data for display/editing
 */
export async function getCompaniesAPI(session: any) {
  try {
    // Return company data from session (no backend endpoint needed for single company view)
    if (session?.user) {
      const user = session.user
      return {
        success: true,
        data: [{
          CompanyID: user.CompanyID || user.companyID || 0,
          CompanyName: user.CompanyName || user.companyName || 'N/A',
          Address1: user.Address1 || user.address1 || user.Address || user.address || '',
          ContactNO: user.ContactNO || user.contactNo || user.ContactNo || user.Phone || user.phone || null,
          FAX: user.FAX || user.fax || user.Fax || '-',
          Email: user.Email || user.email || user.EmailID || user.emailID || '',
          Website: user.Website || user.website || null,
          Country: user.Country || user.country || '',
          State: user.State || user.state || '',
          City: user.City || user.city || '',
          Pincode: user.Pincode || user.pincode || user.PinCode || user.pinCode || '',
          PAN: user.PAN || user.pan || user.Pan || null,
          CINNo: user.CINNo || user.cinNo || user.CIN || user.cin || null,
          GSTIN: user.GSTIN || user.gstin || user.GSTNo || user.gstNo || null,
          ProductionUnitName: user.ProductionUnitName || user.productionUnitName || '',
          ImportExportCode: user.ImportExportCode || user.importExportCode || user.IECode || user.ieCode || null
        }]
      }
    }

    return {
      success: false,
      error: 'No session data available'
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch companies'
    }
  }
}

/**
 * Save new company
 */
export async function saveCompanyAPI(companyData: CompanyProfile, session: any) {
  try {
    const payload = {
      objCompany_Entry: [companyData]
    }

    const response = await APIClient.post('/api/othermaster/save-company-profile', payload, session)
    return response
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to save company'
    }
  }
}

/**
 * Update existing company
 */
export async function updateCompanyAPI(companyData: CompanyProfile, session: any) {
  try {
    const payload = {
      objCompany_Entry: [companyData]
    }

    const response = await APIClient.post('/api/othermaster/update-company-profile', payload, session)
    return response
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to update company'
    }
  }
}

/**
 * Delete company
 */
export async function deleteCompanyAPI(companyID: number, session: any) {
  try {
    const response = await APIClient.post(`/api/othermaster/delete-company/${companyID}`, { companyID }, session)
    return response
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to delete company'
    }
  }
}

// ============================================================================
// DEPARTMENT APIs
// ============================================================================

/**
 * Get all departments
 */
export async function getDepartmentsAPI(session: any) {
  try {
    const response = await APIClient.get('/api/othermaster/department-list', session)
    return response
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch departments'
    }
  }
}

/**
 * Save new department
 */
export async function saveDepartmentAPI(departmentData: Department, session: any) {
  try {
    // Backend model is List<CostingDataGroupMaster> and reads [0] — must be an array.
    const payload = {
      CostingDataGroupMaster: [{
        DepartmentName: departmentData.DepartmentName,
        Press: departmentData.Press,
        SequenceNo: departmentData.SequenceNo
      }],
      DepartmentName: departmentData.DepartmentName,
      SelectBoxPress: ''
    }

    const response = await APIClient.post('/api/othermaster/save-department', payload, session)
    return checkBackendResult(response, 'Failed to save department')
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to save department'
    }
  }
}

/**
 * Update existing department
 */
export async function updateDepartmentAPI(departmentData: Department, departmentID: number, session: any) {
  try {
    const payload = {
      CostingDataGroupMaster: {
        DepartmentName: departmentData.DepartmentName,
        Press: departmentData.Press,
        SequenceNo: departmentData.SequenceNo
      },
      TxtDepartmentID: String(departmentID)
    }

    const response = await APIClient.put('/api/othermaster/update-department', payload, session)
    return checkBackendResult(response, 'Failed to update department')
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to update department'
    }
  }
}

/**
 * Delete department
 */
export async function deleteDepartmentAPI(departmentID: number, session: any) {
  try {
    const response = await APIClient.delete(`/api/othermaster/delete-department/${departmentID}`, session)
    return checkBackendResult(response, 'Failed to delete department')
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to delete department'
    }
  }
}

// ============================================================================
// DOMAIN APIs
// ============================================================================

/**
 * Get all domains (segments)
 */
export async function getDomainsAPI(session: any) {
  try {
    const response = await APIClient.get('/api/othermaster/getsegmentgrid', session)
    return response
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch domains'
    }
  }
}

/**
 * Save new domain
 */
export async function saveDomainAPI(domainData: Domain, session: any) {
  try {
    const payload = {
      jsonObjectsComplaintMain: {
        SegmentName: domainData.SegmentName,
        RefSegmentCode: domainData.RefSegmentCode,
        DefaultFactor: domainData.DefaultFactor,
        FactorValueType: domainData.FactorValueType,
        DefaultProfit: domainData.DefaultProfit
      },
      jsonObjectsComplaintDetails: domainData.ApprovalRanges?.[0] || {
        TransID: 1,
        RangeFrom: '0.00',
        RangeTo: '0.00',
        UserApprovalAuthorityID: 0,
        UserApprovalAuthorityName: '',
        RangeType: 'Profit'
      },
      prefix: 'SM'
    }

    const response = await APIClient.post('/api/othermaster/savesegmentdata', payload, session)
    return checkBackendResult(response, 'Failed to save domain')
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to save domain'
    }
  }
}

/**
 * Update existing domain
 */
export async function updateDomainAPI(domainData: Domain, segmentID: number, session: any) {
  try {
    const payload = {
      jsonObjectsComplaintMain: {
        SegmentName: domainData.SegmentName,
        RefSegmentCode: domainData.RefSegmentCode,
        DefaultFactor: domainData.DefaultFactor,
        FactorValueType: domainData.FactorValueType,
        DefaultProfit: domainData.DefaultProfit
      },
      jsonObjectsComplaintDetails: domainData.ApprovalRanges?.[0] || {
        TransID: 1,
        RangeFrom: '0.00',
        RangeTo: '0.00',
        UserApprovalAuthorityID: 0,
        UserApprovalAuthorityName: '',
        RangeType: 'Profit'
      },
      SegmentID: String(segmentID)
    }

    const response = await APIClient.post('/api/othermaster/updatesegmentdata', payload, session)
    return checkBackendResult(response, 'Failed to update domain')
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to update domain'
    }
  }
}

/**
 * Delete domain
 */
export async function deleteDomainAPI(segmentID: number, session: any) {
  try {
    const payload = {
      SegmentID: String(segmentID)
    }
    const response = await APIClient.post('/api/othermaster/deletesegmentdata', payload, session)
    return checkBackendResult(response, 'Failed to delete domain')
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to delete domain'
    }
  }
}

// ============================================================================
// PRODUCTION UNIT APIs
// ============================================================================

/**
 * Get all production units
 */
export async function getProductionUnitsAPI(session: any) {
  try {
    const response = await APIClient.get('/api/othermaster/getproductionunitmasterlist', session)
    return response
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch production units'
    }
  }
}

/**
 * Save new production unit
 */
export async function saveProductionUnitAPI(unitData: ProductionUnit, session: any) {
  try {
    // Backend binds the WHOLE body to its data object (no wrapper key) and adds
    // CompanyID itself — sending it again duplicates the column in the INSERT.
    const { ProductionUnitID: _id, CompanyID: _cid, ...payload } = unitData

    const response = await APIClient.post('/api/othermaster/saveproductionunitmaster', payload, session)
    return checkBackendResult(response, 'Failed to save production unit')
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to save production unit'
    }
  }
}

/**
 * Update existing production unit
 */
export async function updateProductionUnitAPI(unitData: ProductionUnit, productionUnitID: number, session: any) {
  try {
    // ProductionUnitID is a URI-bound param on the backend; body is the raw unit
    // data (CompanyID/ModifiedBy are appended by the backend itself).
    const { ProductionUnitID: _id, CompanyID: _cid, ...payload } = unitData

    const response = await APIClient.post(`/api/othermaster/updateproductionunitmaster?ProductionUnitID=${productionUnitID}`, payload, session)
    return checkBackendResult(response, 'Failed to update production unit')
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to update production unit'
    }
  }
}

/**
 * Delete production unit
 */
export async function deleteProductionUnitAPI(productionUnitID: number, session: any) {
  try {
    const response = await APIClient.post(`/api/othermaster/deleteproductionunitmaster?ProductionUnitID=${productionUnitID}`, null, session)
    return checkBackendResult(response, 'Failed to delete production unit')
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to delete production unit'
    }
  }
}
