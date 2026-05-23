// Authentication API exports
// Central export point for all authentication APIs

export {
  authenticateUser,
  setAuthAPIConfig,
  getAuthAPIConfig,
  clearAuthAPIConfig,
  type AuthAPIConfig,
  type LoginRequest,
  type LoginResponse,
  type UserData
} from './auth'
