// Authentication helper functions
// Login and ping APIs

import { getGlobalAPIConfig, setGlobalAPIConfig, getBasicAuthHeader, buildAPIURL } from './config'
import type { APIResponse, LoginResponse } from './types'

/**
 * Login API - Authenticate user credentials
 * @param username - User's username
 * @param password - User's password
 * @returns Promise with login response containing user data
 */
export async function loginAPI(username: string, password: string): Promise<APIResponse<any>> {
  try {
    // Get configuration (should be set by NextAuth with company credentials)
    let config = getGlobalAPIConfig()

    if (!config) {
      console.error('❌ [LOGIN API] API configuration not available')
      console.error('❌ [LOGIN API] Company credentials must be set via setAuthAPIConfig before calling loginAPI')
      throw new Error('API configuration not available - company credentials not set')
    }

    // Validate that credentials are actually set (not empty)
    if (!config.username || (!config.authToken && !config.password)) {
      console.error('❌ [LOGIN API] Company credentials are missing or empty')
      throw new Error('Company credentials not configured - login requires valid company authentication')
    }

    // Build URL with username and password as path parameters
    const url = buildAPIURL(`api/auth/GetLoginDetails/${encodeURIComponent(username)}/${encodeURIComponent(password)}`)
    if (!url) {
      console.error('❌ [LOGIN API] Failed to build API URL')
      throw new Error('Failed to build API URL')
    }

    // Use pre-computed auth token, fall back to password for legacy
    const authHeader = config.authToken
      ? `Basic ${config.authToken}`
      : `Basic ${btoa(`${config.username}:${config.password}`)}`

    // Make request - API uses GET with URL parameters
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': authHeader
      },
      signal: AbortSignal.timeout(config.timeout)
    })

    if (!response.ok) {
      console.error('❌ [LOGIN API] Request failed with status:', response.status)
      return {
        success: false,
        error: `Login failed: ${response.status} ${response.statusText}`,
        status: response.status
      }
    }

    // Parse response
    const responseText = await response.text()

    if (!responseText || responseText.trim() === '') {
      console.error('❌ [LOGIN API] Empty response received')
      return {
        success: false,
        error: 'Invalid username or password'
      }
    }

    let data = JSON.parse(responseText)

    // Handle double/triple-encoded JSON
    if (typeof data === 'string') {
      try{
        data = JSON.parse(data)
        if (typeof data === 'string') {
          data = JSON.parse(data)
        }
      } catch {
        // Keep as is
      }
    }

    return {
      success: true,
      data,
      status: response.status
    }
  } catch (error) {
    console.error('❌ [LOGIN API] Exception:', error instanceof Error ? error.message : 'Unknown error')
    if (error instanceof Error) {
      console.error('❌ [LOGIN API] Stack:', error.stack)
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login request failed'
    }
  }
}

/**
 * Ping API - Check API connectivity
 * @returns Promise with ping response
 */
export async function pingAPI(): Promise<APIResponse<string>> {
  try {
    const config = getGlobalAPIConfig()
    if (!config) {
      throw new Error('API configuration not available')
    }

    const url = buildAPIURL('api/ping')
    if (!url) {
      throw new Error('Failed to build API URL')
    }

    const authHeader = getBasicAuthHeader()
    if (!authHeader) {
      throw new Error('Failed to generate authorization header')
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': authHeader
      },
      signal: AbortSignal.timeout(config.timeout)
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Ping failed: ${response.status} ${response.statusText}`,
        status: response.status
      }
    }

    const data = await response.text()

    return {
      success: true,
      data,
      status: response.status
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ping request failed'
    }
  }
}
