// Production-grade rate limiter using C# backend API with MSSQL database
// Distributed and persisted across server restarts

class RateLimiter {
  private apiBaseUrl: string

  constructor() {
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ''
  }

  /**
   * Check if a request should be rate limited using backend API
   * @param identifier - Usually IP address or username
   * @param maxAttempts - Maximum attempts allowed in the window
   * @param windowMs - Time window in milliseconds
   * @returns Object with allowed status and remaining attempts
   */
  async check(
    identifier: string,
    maxAttempts: number = 5,
    windowMs: number = 15 * 60 * 1000, // 15 minutes default
    identifierType: string = 'USERNAME'
  ): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
    try {
      const windowMinutes = Math.floor(windowMs / 60000)
      const blockMinutes = windowMinutes // Block for same duration as window

      const response = await fetch(`${this.apiBaseUrl}/api/security/ratelimit/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Identifier: identifier,
          IdentifierType: identifierType,
          MaxAttempts: maxAttempts,
          WindowMinutes: windowMinutes,
          BlockMinutes: blockMinutes
        })
      })

      if (response.ok) {
        const result = await response.json()
        return {
          allowed: result.allowed,
          remaining: result.remaining,
          resetIn: result.resetIn * 1000 // Convert seconds to milliseconds
        }
      }

      // If API fails, allow the request (fail open)
      console.error('Rate limit check failed, allowing request')
      return {
        allowed: true,
        remaining: maxAttempts,
        resetIn: windowMs
      }
    } catch (error) {
      // If API fails, allow the request (fail open)
      console.error('Rate limit check error:', error)
      return {
        allowed: true,
        remaining: maxAttempts,
        resetIn: windowMs
      }
    }
  }

  /**
   * Reset rate limit for an identifier (e.g., after successful login)
   */
  async reset(identifier: string, identifierType: string = 'USERNAME'): Promise<void> {
    try {
      await fetch(`${this.apiBaseUrl}/api/security/ratelimit/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Identifier: identifier,
          IdentifierType: identifierType
        })
      })
    } catch (error) {
      console.error('Rate limit reset error:', error)
    }
  }

  /**
   * Get current stats for an identifier (for debugging)
   */
  async getStats(identifier: string, identifierType: string = 'USERNAME'): Promise<any> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/security/ratelimit/status?identifier=${encodeURIComponent(identifier)}&identifierType=${identifierType}`
      )

      if (response.ok) {
        const result = await response.json()
        return result.data
      }

      return null
    } catch (error) {
      console.error('Failed to get rate limit stats:', error)
      return null
    }
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter()

// Helper function to get client IP from request
export function getClientIP(request: Request): string {
  // Try various headers in order of preference
  const headers = [
    'x-real-ip',
    'x-forwarded-for',
    'cf-connecting-ip', // Cloudflare
    'true-client-ip', // Cloudflare Enterprise
    'x-client-ip'
  ]

  for (const header of headers) {
    const value = request.headers.get(header)
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first one
      return value.split(',')[0].trim()
    }
  }

  // Fallback to 'unknown' if no IP found
  return 'unknown'
}
