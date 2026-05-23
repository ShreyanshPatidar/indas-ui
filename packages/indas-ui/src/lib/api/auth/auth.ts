// Authentication API
// Handles user authentication

import { loginAPI } from '../core/auth-helpers'
import { setGlobalAPIConfig } from '../core/config'
import type { LoginRequest, LoginResponse, UserData } from '../core/types'

export interface AuthAPIConfig {
  baseURL: string
  authEndpoint?: string
  username?: string
  password?: string
}

let apiConfig: AuthAPIConfig | null = null

export function setAuthAPIConfig(config: AuthAPIConfig) {
  if (!config.baseURL) {
    throw new Error('Invalid API configuration: baseURL is required')
  }

  // Validate URL format
  try {
    new URL(config.baseURL)
  } catch {
    throw new Error('Invalid baseURL format')
  }

  // Ensure authEndpoint starts with / (if provided)
  if (config.authEndpoint && !config.authEndpoint.startsWith('/')) {
    config.authEndpoint = '/' + config.authEndpoint
  }

  apiConfig = config

  // IMPORTANT: Also update global API config for loginAPI to use
  // This ensures company credentials are available for authentication
  if (config.username && config.password) {
    setGlobalAPIConfig({
      baseURL: config.baseURL,
      username: config.username,
      password: config.password,
      timeout: 60000
    })
  }

  // Persist configuration for session
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('auth-api-config', JSON.stringify(config))
  }
}

export function getAuthAPIConfig(): AuthAPIConfig | null {
  if (apiConfig) {
    return apiConfig
  }

  // Try to restore from session storage
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('auth-api-config')
    if (stored) {
      try {
        apiConfig = JSON.parse(stored)
        return apiConfig
      } catch {
        sessionStorage.removeItem('auth-api-config')
      }
    }
  }

  return null
}

export function clearAuthAPIConfig() {
  apiConfig = null
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('auth-api-config')
  }
}

export async function authenticateUser(credentials: LoginRequest): Promise<LoginResponse> {
  // Use the new global API configuration
  try {
    const response = await loginAPI(credentials.username, credentials.password)

    if (response.success && response.data) {
      // Handle array response format
      let data = response.data

      // Check if data is a JSON string that needs parsing
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data)
        } catch (parseError) {
          // Keep as is
        }
      }

      if (Array.isArray(data) && data.length > 0) {
        const userData = data[0] // Take first user data object

        // Map the response data to our UserData interface
        const mappedUserData: UserData = {
          UserID: userData.UserID?.toString() || '',
          UserName: userData.UserName || '',
          FYear: userData.FYear || new Date().getFullYear().toString(),
          CompanyID: userData.CompanyID?.toString() || '',
          BranchID: userData.BranchID?.toString() || '',
          CompanyName: userData.CompanyName || '',
          ProductionUnitID: userData.ProductionUnitID?.toString() || '',
          IsAdmin: userData.UserType === 'Admin' || userData.IsAdmin === true,
          APIIntegrationRequired: userData.APIIntegrationRequired,
          APIBaseURL: userData.APIBaseURL,
          APIAuthenticationURL: userData.APIAuthenticationURL,
          HomePage: userData.HomePage,
          IsGstApplicable: userData.IsGstApplicable,
          IsVatApplicable: userData.IsVatApplicable,
          DefaultTaxLedgerTypeName: userData.DefaultTaxLedgerTypeName,
          IsEinvoiceApplicable: userData.IsEinvoiceApplicable,
          CurrencyHeadName: userData.CurrencyHeadName,
          CurrencyChildName: userData.CurrencyChildName,
          CurrencyCode: userData.CurrencyCode,
          CurrencySymboliconRef: userData.CurrencySymboliconRef,
          TaxApplicableBranchWise: userData.TaxApplicableBranchWise,
          EstimationRoundOffDecimalPlace: userData.EstimationRoundOffDecimalPlace,
          PurchaseRoundOffDecimalPlace: userData.PurchaseRoundOffDecimalPlace,
          InvoiceRoundOffDecimalPlace: userData.InvoiceRoundOffDecimalPlace,
          CostEstimationMethodType: userData.CostEstimationMethodType,
          OTPVerificationFeatureEnabled: userData.OTPVerificationFeatureEnabled,
          EmailID: userData.EmailID,
          // Role
          RoleID: userData.RoleID || userData.roleID || 0,
          RoleName: userData.RoleName || userData.roleName || '',
          // SMTP Settings (handle various casing from API)
          smtpUserName: userData.smtpUserName || userData.SmtpUserName || userData.SMTPUserName,
          smtpUserPassword: userData.smtpUserPassword || userData.SmtpUserPassword || userData.SMTPUserPassword,
          smtpServer: userData.smtpServer || userData.SmtpServer || userData.SMTPServer,
          smtpServerPort: userData.smtpServerPort || userData.SmtpServerPort || userData.SMTPServerPort,
          smtpAuthenticate: userData.smtpAuthenticate || userData.SmtpAuthenticate || userData.SMTPAuthenticate,
          smtpUseSSL: userData.smtpUseSSL || userData.SmtpUseSSL || userData.SMTPUseSSL
        }

        return {
          success: true,
          user: mappedUserData,
          token: userData.token || userData.SessionToken || userData.authToken
        }
      } else {
        return {
          success: false,
          message: 'Invalid username or password'
        }
      }
    } else {
      return {
        success: false,
        message: response.error || 'Authentication failed'
      }
    }

  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Authentication service error'
    }
  }
}

// Re-export types
export type { LoginRequest, LoginResponse, UserData }
