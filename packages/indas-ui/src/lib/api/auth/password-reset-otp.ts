/**
 * Password Reset OTP API
 * Integrates with C# backend for OTP generation and validation
 *
 * NOTE: These APIs do NOT require session/authentication since they're used BEFORE login
 * We use direct fetch calls instead of APIClient to avoid session requirements
 */

/**
 * Get API base URL
 */
function getAPIBaseURL(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || ''
}

/**
 * Get Basic Auth header from company credentials
 * Uses the credentials obtained from company code validation
 */
function getPasswordResetAuthHeader(companyUsername: string, companyPassword: string): string | null {
  if (!companyUsername || !companyPassword) {
    console.error('❌ [Password Reset] Company credentials are required')
    return null
  }

  try {
    const credentials = btoa(`${companyUsername}:${companyPassword}`)
    return `Basic ${credentials}`
  } catch (error) {
    console.error('❌ [Password Reset] Failed to encode credentials:', error)
    return null
  }
}

/**
 * Get client IP address (best effort)
 * Note: Due to CSP restrictions and browser security, we cannot fetch external IP
 * The backend should extract IP from request headers instead
 */
async function getClientIPAddress(): Promise<string> {
  // Return "Unknown" - backend will extract actual IP from request headers
  // This avoids CSP violations from calling external IP services
  return 'Unknown'
}

/**
 * Get user agent from browser
 */
function getUserAgent(): string {
  return typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
}

/**
 * Generate OTP for password reset
 * Calls backend: POST /api/CommanApis/generate-otp
 * Requires Basic Auth with company credentials from company code validation
 */
export async function generateOTPAPI(email: string, companyUsername: string, companyPassword: string) {
  try {
    // Get client information from browser
    const ipAddress = await getClientIPAddress()
    const userAgent = getUserAgent()

    const baseURL = getAPIBaseURL()
    const authHeader = getPasswordResetAuthHeader(companyUsername, companyPassword)

    const response = await fetch(`${baseURL}/api/CommanApis/generate-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
      body: JSON.stringify({
        Email: email,
        IPAddress: ipAddress,
        UserAgent: userAgent
      })
    })

    const text = await response.text()

    let data: any
    try {
      data = JSON.parse(text)
    } catch (e) {
      console.error('❌ [Generate OTP] Failed to parse JSON:', text)
      return {
        success: false,
        data: null,
        message: 'Invalid response from server'
      }
    }

    // Handle double-nested response: data.data instead of just data
    const actualData = data.data || data
    const isSuccess = response.ok && (data.success === true || actualData.success === true)

    return {
      success: isSuccess,
      data: actualData,
      message: actualData.message || data.message || data.Message || (response.ok ? 'OTP generated successfully' : 'Failed to generate OTP')
    }
  } catch (error) {
    console.error('❌ [Generate OTP] Error:', error)
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'Failed to generate OTP'
    }
  }
}

/**
 * Validate OTP for password reset
 * Calls backend: POST /api/CommanApis/validate-otp
 * Requires Basic Auth with company credentials from company code validation
 */
export async function validateOTPAPI(email: string, otpCode: string, companyUsername: string, companyPassword: string) {
  const baseURL = getAPIBaseURL()
  const authHeader = getPasswordResetAuthHeader(companyUsername, companyPassword)

  const response = await fetch(`${baseURL}/api/CommanApis/validate-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(authHeader ? { 'Authorization': authHeader } : {}),
    },
    body: JSON.stringify({
      Email: email,
      OTPCode: otpCode
    })
  })

  const data = await response.json()

  // Handle double-nested response: data.data instead of just data
  const actualData = data.data || data
  const isSuccess = response.ok && (data.success === true || actualData.success === true)

  return {
    success: isSuccess,
    data: actualData,
    message: actualData.message || data.message || (response.ok ? 'OTP validated successfully' : 'Invalid OTP')
  }
}

/**
 * Reset password with OTP
 * Calls backend: POST /api/CommanApis/reset-password
 * Requires Basic Auth with company credentials from company code validation
 */
export async function resetPasswordAPI(email: string, otpCode: string, newPassword: string, companyUsername: string, companyPassword: string) {
  const baseURL = getAPIBaseURL()
  const authHeader = getPasswordResetAuthHeader(companyUsername, companyPassword)

  const response = await fetch(`${baseURL}/api/CommanApis/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(authHeader ? { 'Authorization': authHeader } : {}),
    },
    body: JSON.stringify({
      Email: email,
      OTPCode: otpCode,
      NewPassword: newPassword
    })
  })

  const data = await response.json()

  // Handle double-nested response: data.data instead of just data
  const actualData = data.data || data
  const isSuccess = response.ok && (data.success === true || actualData.success === true)

  return {
    success: isSuccess,
    data: actualData,
    message: actualData.message || data.message || (response.ok ? 'Password reset successfully' : 'Failed to reset password')
  }
}

/**
 * Get OTP statistics (Admin only)
 * Calls backend: GET api/auth/password-reset/stats
 * NOTE: These admin functions are kept for future use but currently not implemented
 */
export async function getOTPStatsAPI() {
  // TODO: Implement when admin panel is ready
  // These will need session/authentication, so they should use APIClient when implemented
  throw new Error('OTP statistics endpoint not yet implemented')
}

/**
 * Cleanup expired OTPs (Admin only)
 * Calls backend: POST api/auth/password-reset/cleanup
 * NOTE: These admin functions are kept for future use but currently not implemented
 */
export async function cleanupExpiredOTPsAPI() {
  // TODO: Implement when admin panel is ready
  // These will need session/authentication, so they should use APIClient when implemented
  throw new Error('OTP cleanup endpoint not yet implemented')
}
