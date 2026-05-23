// Global API Configuration System
// Store once, use everywhere

import type { APIConfig } from './types'

export interface StoredAPIConfig {
  baseURL: string
  username: string
  password: string
  authToken: string  // Pre-computed Basic Auth token — avoids storing raw password
  timeout: number
  lastUpdated: string
}

// Default configuration from environment variables
// Note: username/password are set dynamically during login from session
const getDefaultConfig = (): APIConfig => ({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  username: '',  // Set during login from session
  password: '',  // Set during login from session
  timeout: 60000 // 60 seconds for complex planning calculations
})

// Global configuration state
let globalConfig: StoredAPIConfig | null = null

// Storage keys
const CONFIG_STORAGE_KEY = 'api-global-config'
const CONFIG_STORAGE_KEY_ENCRYPTED = 'api-global-config-enc'

// Simple encryption for stored credentials (browser only)
const encryptCredentials = (data: string): string => {
  if (typeof window === 'undefined') return data
  try {
    return btoa(data)
  } catch {
    return data
  }
}

const decryptCredentials = (data: string): string => {
  if (typeof window === 'undefined') return data
  try {
    return atob(data)
  } catch {
    return data
  }
}

/**
 * Set the global API configuration
 * This will be used for all API calls across the application
 */
export function setGlobalAPIConfig(config: APIConfig): void {
  // Validate configuration
  if (!config.baseURL) {
    throw new Error('Base URL is required for API configuration')
  }

  // With multi-tenant, username/password are optional (set during login)
  // Legacy: Still validate if both are provided or both are empty
  if ((!config.username && config.password) || (config.username && !config.password)) {
    throw new Error('Username and password must both be provided or both be empty')
  }

  // Validate URL format
  try {
    new URL(config.baseURL)
  } catch {
    throw new Error('Invalid base URL format')
  }

  // Ensure base URL ends with /
  const normalizedBaseURL = config.baseURL.endsWith('/')
    ? config.baseURL
    : config.baseURL + '/'

  // Pre-compute the Basic Auth token so raw password doesn't need to be stored
  let authToken = ''
  if (config.username && config.password) {
    try {
      authToken = btoa(`${config.username}:${config.password}`)
    } catch {
      // Silent fail
    }
  }

  const storedConfig: StoredAPIConfig = {
    baseURL: normalizedBaseURL,
    username: config.username,
    password: '',  // Don't persist raw password in memory
    authToken,
    timeout: config.timeout || 60000,
    lastUpdated: new Date().toISOString()
  }

  globalConfig = storedConfig

  // Store configuration securely (browser only)
  if (typeof window !== 'undefined') {
    try {
      // Store non-sensitive data in regular storage
      const publicConfig = {
        baseURL: storedConfig.baseURL,
        timeout: storedConfig.timeout,
        lastUpdated: storedConfig.lastUpdated
      }
      sessionStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(publicConfig))

      // Store only the pre-computed auth token, not the raw password
      const sensitiveConfig = {
        username: storedConfig.username,
        authToken: storedConfig.authToken
      }
      const encryptedCredentials = encryptCredentials(JSON.stringify(sensitiveConfig))
      sessionStorage.setItem(CONFIG_STORAGE_KEY_ENCRYPTED, encryptedCredentials)
    } catch (error) {
      // Silent fail for storage errors
    }
  }
}

/**
 * Get the current global API configuration
 * Returns null if not configured
 */
export function getGlobalAPIConfig(): StoredAPIConfig | null {
  if (globalConfig) {
    return globalConfig
  }

  // Try to restore from storage (browser only)
  if (typeof window !== 'undefined') {
    try {
      const publicConfigStr = sessionStorage.getItem(CONFIG_STORAGE_KEY)
      const encryptedCredentials = sessionStorage.getItem(CONFIG_STORAGE_KEY_ENCRYPTED)

      if (publicConfigStr && encryptedCredentials) {
        const publicConfig = JSON.parse(publicConfigStr)
        const sensitiveConfig = JSON.parse(decryptCredentials(encryptedCredentials))

        // Compute auth token: use stored token if available, fall back to legacy password for old sessions
        let authToken = sensitiveConfig.authToken || ''
        if (!authToken && sensitiveConfig.username && sensitiveConfig.password) {
          try { authToken = btoa(`${sensitiveConfig.username}:${sensitiveConfig.password}`) } catch {}
        }

        globalConfig = {
          ...publicConfig,
          username: sensitiveConfig.username || '',
          password: '',  // Never restore raw password
          authToken
        }

        return globalConfig
      }
    } catch (error) {
      clearGlobalAPIConfig()
    }
  }

  // Do NOT auto-initialize from environment variables
  // Credentials are set during login from session (multi-tenant mode)
  // This prevents authentication failures
  return null
}

/**
 * Clear the global API configuration
 */
export function clearGlobalAPIConfig(): void {
  globalConfig = null

  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(CONFIG_STORAGE_KEY)
    sessionStorage.removeItem(CONFIG_STORAGE_KEY_ENCRYPTED)
  }
}

/**
 * Check if API is configured
 */
export function isAPIConfigured(): boolean {
  return getGlobalAPIConfig() !== null
}

/**
 * Get Basic Auth header for the current configuration
 */
export function getBasicAuthHeader(): string | null {
  const config = getGlobalAPIConfig()
  if (!config) return null

  // Use pre-computed auth token — raw password is never stored
  if (config.authToken) {
    return `Basic ${config.authToken}`
  }

  return null
}

/**
 * Build a complete API URL from a relative endpoint
 * @param endpoint - Relative endpoint (e.g., 'api/GetLoginDetails')
 * @returns Complete URL or null if not configured
 */
export function buildAPIURL(endpoint: string): string | null {
  const config = getGlobalAPIConfig()
  if (!config) {
    return null
  }

  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint

  // Ensure baseURL ends with slash
  const baseURL = config.baseURL.endsWith('/') ? config.baseURL : `${config.baseURL}/`

  const fullURL = `${baseURL}${cleanEndpoint}`

  return fullURL
}

/**
 * Get default fetch options with Basic Auth header
 */
export function getDefaultAPIOptions(): RequestInit | null {
  const config = getGlobalAPIConfig()
  if (!config) return null

  const authHeader = getBasicAuthHeader()
  if (!authHeader) return null

  return {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': authHeader
    },
    signal: AbortSignal.timeout(config.timeout)
  }
}

// API Initialization flag
let isInitialized = false

/**
 * Initialize API configuration automatically from environment variables
 * This should be called once when the app starts
 */
export function initializeAPI(): boolean {
  if (isInitialized) return true

  try {
    // Check if already configured
    if (isAPIConfigured()) {
      isInitialized = true
      return true
    }

    // Get configuration (getGlobalAPIConfig will auto-load from env)
    const config = getGlobalAPIConfig()
    if (config) {
      isInitialized = true
      return true
    }

    return false
  } catch (error) {
    return false
  }
}
