// Core API Client
// Handles HTTP requests with authentication and session management

import {
  getGlobalAPIConfig,
  getBasicAuthHeader,
  buildAPIURL,
  setGlobalAPIConfig
} from './config'
import { safeJSONParse } from './utils'
import type { APIResponse } from './types'

// Global session-expired handler — set by SessionExpiryMonitor or any top-level component
// When a 401 or "session not found" response is received, this callback is invoked to redirect to login
let _onSessionExpired: (() => void) | null = null

export function setSessionExpiredHandler(handler: () => void) {
  _onSessionExpired = handler
}

let _isSigningOut = false
export function handleSessionExpired() {
  if (_isSigningOut || !_onSessionExpired) return
  _isSigningOut = true
  try { _onSessionExpired() } finally {
    // Reset after a delay so multiple rapid 401s don't fire multiple times
    setTimeout(() => { _isSigningOut = false }, 5000)
  }
}

/**
 * APIClient class for making HTTP requests to the backend API
 */
class APIClient {
  /**
   * Make a generic API request
   * @param endpoint - API endpoint (relative to base URL)
   * @param options - Fetch options
   * @param sessionData - Optional session data for CompanyID and UserID headers
   * @returns Promise<APIResponse>
   */
  static async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    sessionData?: any,
    baseURLOverride?: string,
    externalSignal?: AbortSignal,
    timeoutMs?: number
  ): Promise<APIResponse<T>> {
    try {
      // Check if API configuration is set
      let config = getGlobalAPIConfig()

      // If not configured, try to initialize with session company credentials
      if (!config && sessionData?.user) {
        const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL
        const companyUsername = sessionData.user.companyUsername
        const companyPassword = sessionData.user.companyPassword

        if (baseURL && companyUsername && companyPassword) {
          setGlobalAPIConfig({
            baseURL,
            username: companyUsername,
            password: companyPassword,
            timeout: 60000
          })
          config = getGlobalAPIConfig()
        } else if (baseURL) {
          // No company credentials in session - user needs to re-login
          console.error('❌ [APIClient] No company credentials in session')
          console.error('❌ [APIClient] User session is outdated - please log out and log back in')
          throw new Error('Session outdated: Please log out and log back in to refresh your credentials')
        }
      }

      // Build complete URL (use override if provided)
      let url: string | null
      if (baseURLOverride) {
        const base = baseURLOverride.endsWith('/') ? baseURLOverride : `${baseURLOverride}/`
        const clean = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
        url = `${base}${clean}`
      } else {
        url = buildAPIURL(endpoint)
      }
      if (!url) {
        throw new Error('API configuration not set. Please configure the API connection.')
      }

      // Get Basic Auth header from config
      const authHeader = getBasicAuthHeader()
      if (!authHeader) {
      }

      // Build session-specific headers
      const sessionHeaders: Record<string, string> = {}

      // Use session CompanyID - handle both uppercase and lowercase
      const companyId = sessionData?.user?.CompanyID || sessionData?.user?.companyID
      if (!companyId) {
        console.error('❌ [APIClient] CompanyID not found in session:', {
          hasSessionData: !!sessionData,
          hasUser: !!sessionData?.user,
          userKeys: sessionData?.user ? Object.keys(sessionData.user) : []
        })
        throw new Error('CompanyID not found in session. Please login again.')
      }
      sessionHeaders['CompanyID'] = companyId.toString()

      // Use session UserID - handle both uppercase and lowercase
      const userId = sessionData?.user?.UserID || sessionData?.user?.userID
      if (!userId) {
        console.error('❌ [APIClient] UserID not found in session:', {
          hasSessionData: !!sessionData,
          hasUser: !!sessionData?.user,
          userKeys: sessionData?.user ? Object.keys(sessionData.user) : []
        })
        throw new Error('UserID not found in session. Please login again.')
      }
      sessionHeaders['UserID'] = userId.toString()

      // Add ProductionUnitID header - REQUIRED
      // ALWAYS use session's ProductionUnitID in headers (logged-in user's production unit)
      // Form-selected ProductionUnitID should be sent in the request body/payload separately
      const productionUnitId = sessionData?.productionUnitId ||
        sessionData?.user?.ProductionUnitID ||
        sessionData?.user?.productionUnitID

      if (!productionUnitId) {
        console.error('❌ [APIClient] ProductionUnitID not found in session:', {
          hasSessionData: !!sessionData,
          hasUser: !!sessionData?.user,
          userKeys: sessionData?.user ? Object.keys(sessionData.user) : []
        })
        throw new Error('ProductionUnitID not found in session. Please login again.')
      }

      sessionHeaders['ProductionUnitID'] = productionUnitId.toString()

      // Add Financial Year header - REQUIRED (format: "2025-2026")
      const fYear = sessionData?.fYear || sessionData?.user?.FYear || sessionData?.user?.fYear
      if (!fYear) {
        console.error('❌ [APIClient] FYear not found in session:', {
          hasSessionData: !!sessionData,
          hasUser: !!sessionData?.user,
          userKeys: sessionData?.user ? Object.keys(sessionData.user) : []
        })
        throw new Error('FYear not found in session. Please login again.')
      }
      sessionHeaders['FYear'] = fYear

      // Merge headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate', // Prevent caching
        'Pragma': 'no-cache', // HTTP/1.0 compatibility
        'Expires': '0', // Proxies
        ...sessionHeaders,
        ...(options.headers || {})
      } as Record<string, string>

      // Add Authorization header only if it exists
      if (authHeader) {
        (headers as Record<string, string>)['Authorization'] = authHeader
      }

      // Per-call timeoutMs overrides the config default. Long-running workloads
      // (chat, multi-turn AI) need to pass an explicit higher value — the 60s
      // default aborts legit requests mid-flight and leaves half-finished turns.
      const configData = getGlobalAPIConfig()
      const timeout = timeoutMs ?? configData?.timeout ?? 60000

      // If caller passed an external signal (user cancel), combine with the timeout
      // signal so either can cancel the fetch.
      const timeoutSignal = AbortSignal.timeout(timeout)
      const signal = externalSignal
        ? (AbortSignal as any).any?.([timeoutSignal, externalSignal]) ?? timeoutSignal
        : timeoutSignal
      const startedAt = Date.now()
      const response = await fetch(url, {
        ...options,
        headers,
        signal,
        cache: 'no-store' // Disable HTTP caching - always fetch fresh data
      })
      // Feeds the app-wide "weak connection" banner (NetworkStatusProvider).
      ;(globalThis as any).__reportRequestMs?.(Date.now() - startedAt)

      // Handle non-OK responses
      if (!response.ok) {
        let errorMessage = `API error: ${response.status} ${response.statusText}`

        try {
          const errorText = await response.text()
          if (errorText) {
            errorMessage = errorText
          }
        } catch {
          // Use default error message if can't parse response
        }

        // Only auto-logout on explicit session expiry messages, NOT on generic 401s
        // A 401 could mean the endpoint doesn't exist or requires different auth — not necessarily session expired
        const lowerErr = errorMessage.toLowerCase()
        if (lowerErr.includes('session not found') || lowerErr.includes('session expired')) {
          handleSessionExpired()
          return { success: false, error: 'Session expired. Redirecting to login...', status: response.status }
        }

        if (response.status === 401) {
          return { success: false, error: errorMessage || 'Unauthorized', status: 401 }
        }

        return {
          success: false,
          error: errorMessage,
          status: response.status
        }
      }

      // Parse response
      let data: T | undefined

      try {
        const responseText = await response.text()

        if (responseText && responseText.trim() !== '') {
          // Use safeJSONParse to handle double/triple encoding automatically
          data = safeJSONParse<T>(responseText)
        }
      } catch (parseError) {
        // If JSON parsing fails, return error
        return {
          success: false,
          error: 'Failed to parse API response',
          status: response.status
        }
      }

      // Capture useful response headers (opt-in)
      const responseHeaders: Record<string, string> = {}
      const userMsgId = response.headers.get('X-User-MessageID')
      if (userMsgId) responseHeaders['X-User-MessageID'] = userMsgId
      const convId = response.headers.get('X-Conversation-ID')
      if (convId) responseHeaders['X-Conversation-ID'] = convId

      // Natural-sort production-unit list responses by name so every dropdown is consistent.
      if (Array.isArray(data) && /productionunit/i.test(endpoint)) {
        const nameOf = (r: any) =>
          String(r?.ProductionUnitName ?? r?.productionUnitName ?? r?.PlantName ?? r?.plantName ?? r?.Name ?? r?.name ?? '')
        const c = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
        data = [...data].sort((a, b) => c.compare(nameOf(a), nameOf(b))) as unknown as T
      }

      return {
        success: true,
        data,
        status: response.status,
        responseHeaders: Object.keys(responseHeaders).length > 0 ? responseHeaders : undefined
      }
    } catch (error) {
      // Handle network errors and timeouts
      let errorMessage = 'Unable to complete request. Please try again.'

      if (error instanceof Error) {
        // AbortSignal.timeout() throws a TimeoutError (not AbortError); a caller-cancelled
        // request throws AbortError. Both land here — distinguish by the external signal.
        const isTimeout = error.name === 'TimeoutError' || error.message.toLowerCase().includes('timed out')
        if (error.name === 'AbortError' || isTimeout) {
          // If the caller's own signal fired, surface a clean "aborted" signal so callers can detect user cancel.
          if (externalSignal?.aborted) {
            return { success: false, error: 'aborted', aborted: true } as APIResponse<T>
          }
          errorMessage = 'Request timed out. The server is taking too long to respond. Please check your internet connection and try again.'
        } else if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to server. Please check your internet connection and try again.'
        } else if (error.message.includes('NetworkError')) {
          errorMessage = 'Network connection lost. Please check your internet connection and try again.'
        } else if (error.message.includes('Session outdated') || error.message.includes('not found in session')) {
          handleSessionExpired()
          errorMessage = 'Session expired. Redirecting to login...'
        } else {
          errorMessage = error.message
        }
      }

      return {
        success: false,
        error: errorMessage
      }
    }
  }

  /**
   * Make a GET request
   */
  static async get<T = any>(endpoint: string, sessionData?: any, baseURLOverride?: string): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' }, sessionData, baseURLOverride)
  }

  /**
   * Make a POST request
   */
  static async post<T = any>(
    endpoint: string,
    data?: any,
    sessionData?: any,
    baseURLOverride?: string,
    signal?: AbortSignal,
    timeoutMs?: number
  ): Promise<APIResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined
      },
      sessionData,
      baseURLOverride,
      signal,
      timeoutMs
    )
  }

  /**
   * Make a PUT request
   */
  static async put<T = any>(
    endpoint: string,
    data?: any,
    sessionData?: any,
    baseURLOverride?: string
  ): Promise<APIResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined
      },
      sessionData,
      baseURLOverride
    )
  }

  /**
   * Make a DELETE request
   */
  static async delete<T = any>(endpoint: string, sessionData?: any, baseURLOverride?: string): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' }, sessionData, baseURLOverride)
  }

  /**
   * Make a PATCH request
   */
  static async patch<T = any>(
    endpoint: string,
    data?: any,
    sessionData?: any
  ): Promise<APIResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined
      },
      sessionData
    )
  }
}

export default APIClient
