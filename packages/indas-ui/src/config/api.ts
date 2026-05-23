/**
 * Centralized API Domain Configuration
 *
 * Change the DOMAIN here to update across the entire application.
 * Endpoints are hardcoded in each API call as they should be.
 */

// Centralized domain - read from environment variables (no fallback)
const API_DOMAIN_RAW = process.env.NEXT_PUBLIC_API_BASE_URL
let API_DOMAIN = API_DOMAIN_RAW?.replace(/\/$/, '') || ''

// Validation - only API_DOMAIN is required
if (!API_DOMAIN) {
  throw new Error('Missing required API configuration: NEXT_PUBLIC_API_BASE_URL must be set in .env.local')
}

/**
 * Set API domain dynamically
 */
export function setApiDomain(domain: string): void {
  // Remove trailing slash if present
  API_DOMAIN = domain.replace(/\/$/, '')
}

/**
 * Get current API domain
 */
export function getApiDomain(): string {
  return API_DOMAIN
}

/**
 * Build complete API URL with hardcoded endpoint
 */
export function buildApiUrl(endpoint: string): string {
  // Ensure endpoint starts with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${API_DOMAIN}${cleanEndpoint}`
}

/**
 * Default headers for API requests
 */
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
} as const

/**
 * Create headers with company and user ID
 * Note: Use APIClient from @/lib/api/core/client for proper multi-tenant authentication
 * This function is deprecated and kept only for backward compatibility
 */
export function createApiHeaders(companyId?: number, userId?: number): Record<string, string> {
  const headers: Record<string, string> = {
    ...DEFAULT_HEADERS
  }

  if (companyId !== undefined) {
    headers['CompanyID'] = companyId.toString()
  }

  if (userId !== undefined) {
    headers['UserID'] = userId.toString()
  }

  return headers
}