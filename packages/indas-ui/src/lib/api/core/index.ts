// Core API exports
// Central export point for all core API utilities

// Export APIClient as both named and default export
export { default as APIClient } from './client'
export { default } from './client'

// Export configuration functions
export {
  setGlobalAPIConfig,
  getGlobalAPIConfig,
  clearGlobalAPIConfig,
  isAPIConfigured,
  getBasicAuthHeader,
  buildAPIURL,
  getDefaultAPIOptions,
  initializeAPI,
  type StoredAPIConfig
} from './config'

// Export auth helpers
export { loginAPI, pingAPI } from './auth-helpers'
export * from './utils'

// Export all types
export type {
  APIResponse,
  APIConfig,
  Category,
  Client,
  SalesPerson,
  Quality,
  GSMData,
  MillData,
  FinishData,
  BoardBrandData,
  CoatingData,
  MachineData,
  LoginRequest,
  UserData,
  LoginResponse
} from './types'
