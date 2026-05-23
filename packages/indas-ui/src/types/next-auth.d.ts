/**
 * NextAuth.js type declarations
 * Extends the default session/user types with custom properties
 */

import 'next-auth'
import { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    UserID: string
    UserName: string
    FYear: string
    CompanyID: string
    BranchID: string
    CompanyName: string
    ProductionUnitID: string
    IsAdmin: boolean
    APIIntegrationRequired?: string
    APIBaseURL?: string
    APIAuthenticationURL?: string
    HomePage?: string
    IsGstApplicable?: boolean
    IsVatApplicable?: boolean
    DefaultTaxLedgerTypeName?: string
    IsEinvoiceApplicable?: boolean
    CurrencyHeadName?: string
    CurrencyChildName?: string
    CurrencyCode?: string
    CurrencySymboliconRef?: string
    TaxApplicableBranchWise?: boolean
    EstimationRoundOffDecimalPlace?: number
    PurchaseRoundOffDecimalPlace?: number
    InvoiceRoundOffDecimalPlace?: number
    CostEstimationMethodType?: string
    OTPVerificationFeatureEnabled?: boolean
    EmailID?: string
    // SMTP Settings
    smtpUserName?: string
    smtpUserPassword?: string
    smtpServer?: string
    smtpServerPort?: string
    smtpAuthenticate?: string
    smtpUseSSL?: string
    token?: string
    // Company credentials for API authentication
    companyUsername: string
    companyPassword: string
    companyCode: string
    // Lowercase aliases (for compatibility)
    userID?: string
  }

  interface Session {
    user: User
    productionUnitId?: number // Override for Plant dropdown
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    UserID: string
    UserName: string
    FYear: string
    CompanyID: string
    BranchID: string
    CompanyName: string
    ProductionUnitID: string
    IsAdmin: boolean
    companyUsername: string
    companyPassword: string
    companyCode: string
  }
}
