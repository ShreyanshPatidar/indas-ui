/**
 * Two-Factor Authentication API
 * Handles OTP send and verify operations for 2FA
 * Uses server-side proxy to keep company credentials secure
 */

import type { APIResponse } from '@/lib/api/core/types'

// Get device fingerprint from browser - enhanced version
export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server'

  // Collect multiple browser/device properties for a more unique fingerprint
  const components: string[] = []

  // Basic browser info
  components.push(navigator.userAgent)
  components.push(navigator.language)
  components.push(navigator.languages?.join(',') || '')
  components.push(String(navigator.hardwareConcurrency || ''))
  components.push(String(navigator.maxTouchPoints || 0))

  // Screen properties
  components.push(`${window.screen.width}x${window.screen.height}`)
  components.push(`${window.screen.availWidth}x${window.screen.availHeight}`)
  components.push(String(window.screen.colorDepth))
  components.push(String(window.screen.pixelDepth))
  components.push(String(window.devicePixelRatio || 1))

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone)
  components.push(String(new Date().getTimezoneOffset()))

  // Platform
  components.push(navigator.platform || '')

  // Canvas fingerprint (renders text and gets unique signature)
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      canvas.width = 200
      canvas.height = 50
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillStyle = '#f60'
      ctx.fillRect(0, 0, 100, 50)
      ctx.fillStyle = '#069'
      ctx.fillText('INDAS-FP', 2, 15)
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
      ctx.fillText('INDAS-FP', 4, 17)
      components.push(canvas.toDataURL().slice(-50))
    }
  } catch (e) {
    components.push('canvas-error')
  }

  // WebGL fingerprint
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (gl && gl instanceof WebGLRenderingContext) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
      if (debugInfo) {
        components.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '')
        components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '')
      }
    }
  } catch (e) {
    components.push('webgl-error')
  }

  // Combine all components and create hash
  const fingerprint = components.join('|')

  // Create a more robust hash (FNV-1a algorithm)
  let hash = 2166136261
  for (let i = 0; i < fingerprint.length; i++) {
    hash ^= fingerprint.charCodeAt(i)
    hash = (hash * 16777619) >>> 0
  }

  return hash.toString(36)
}

// Get device name (browser + OS)
export function getDeviceName(): string {
  if (typeof window === 'undefined') return 'Unknown Device'

  const userAgent = navigator.userAgent

  // Detect browser
  let browser = 'Unknown Browser'
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome'
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari'
  else if (userAgent.includes('Firefox')) browser = 'Firefox'
  else if (userAgent.includes('Edg')) browser = 'Edge'

  // Detect OS
  let os = 'Unknown OS'
  if (userAgent.includes('Windows')) os = 'Windows'
  else if (userAgent.includes('Mac')) os = 'macOS'
  else if (userAgent.includes('Linux')) os = 'Linux'
  else if (userAgent.includes('Android')) os = 'Android'
  else if (userAgent.includes('iOS')) os = 'iOS'

  return `${browser} on ${os}`
}

interface SendOTPResponse {
  success: boolean
  message: string
  otpExpiry?: number
}

interface VerifyOTPResponse {
  success: boolean
  userId?: number
  companyId?: number
  userName?: string
  email?: string
  companyName?: string
  message: string
}

interface TwoFactorSessionData {
  userId: number
  companyId: number
  productionUnitId?: number
  fYear?: string
}

/**
 * Send OTP to user's registered email
 * Uses server-side proxy at /api/auth/2fa
 * Company credentials read from HttpOnly cookie on server
 */
export async function sendOTP(
  deviceId: string,
  sessionData: TwoFactorSessionData
): Promise<APIResponse<SendOTPResponse>> {
  try {
    const response = await fetch('/api/auth/2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send-otp',
        deviceId,
        userId: sessionData.userId,
        companyId: sessionData.companyId,
        productionUnitId: sessionData.productionUnitId || 1,
        fYear: sessionData.fYear || '2025-2026'
      })
    })

    const result = await response.json()

    return {
      success: result.success,
      data: result.data || result,
      error: result.success ? undefined : (result.message || 'Failed to send OTP')
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to send OTP',
      data: {
        success: false,
        message: 'Failed to send OTP'
      }
    }
  }
}

/**
 * Verify OTP and register device as trusted
 * Uses server-side proxy at /api/auth/2fa
 * Company credentials read from HttpOnly cookie on server
 */
export async function verifyOTP(
  otp: string,
  deviceId: string,
  deviceName: string,
  sessionData: TwoFactorSessionData
): Promise<APIResponse<VerifyOTPResponse>> {
  try {
    const response = await fetch('/api/auth/2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'verify-otp',
        otp,
        deviceId,
        deviceName,
        userId: sessionData.userId,
        companyId: sessionData.companyId,
        productionUnitId: sessionData.productionUnitId || 1,
        fYear: sessionData.fYear || '2025-2026'
      })
    })

    const result = await response.json()

    return {
      success: result.success,
      data: result.data || result,
      error: result.success ? undefined : (result.message || 'Failed to verify OTP')
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to verify OTP',
      data: {
        success: false,
        message: 'Failed to verify OTP'
      }
    }
  }
}
