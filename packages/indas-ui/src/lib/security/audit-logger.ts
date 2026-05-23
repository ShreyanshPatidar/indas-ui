// Audit logging for security events
// Uses C# backend API for persistent storage in MSSQL database

export interface AuditLogOptions {
  /** Basic auth credentials — needed when logging before session exists (e.g. login events) */
  basicAuth?: { username: string; password: string }
}

export interface AuditLog {
  timestamp?: string
  event: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'LOGOUT' | 'SESSION_EXPIRED' | 'RATE_LIMIT_EXCEEDED' | 'UNAUTHORIZED_ACCESS'
  username?: string
  userId?: string
  companyId?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
  success?: boolean
  errorMessage?: string
  // Login/session tracking
  loginTime?: string
  sessionDurationMinutes?: number
  attemptCount?: number
  failureReason?: string
}

class AuditLogger {
  private apiBaseUrl: string

  constructor() {
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ''
  }

  /**
   * Log a security event to backend database
   */
  async log(event: AuditLog, options?: AuditLogOptions): Promise<void> {
    try {
      // Console log in development
      if (process.env.NODE_ENV === 'development') {
        const emoji = this.getEventEmoji(event.event)
      }

      // Send to backend API — include session headers so backend accepts the request
      // At login time UserID/CompanyID come from the event itself (no session yet)
      const companyId = event.companyId || '0'
      const userId = event.userId || '0'

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'CompanyID': companyId,
        'UserID': userId,
        'ProductionUnitID': '0',
        'FYear': new Date().getFullYear().toString(),
      }

      // Add Basic Auth if provided (needed for pre-session auth events)
      if (options?.basicAuth) {
        const encoded = Buffer.from(`${options.basicAuth.username}:${options.basicAuth.password}`).toString('base64')
        headers['Authorization'] = `Basic ${encoded}`
      }

      const response = await fetch(`${this.apiBaseUrl}/api/auditlog`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          Event: event.event,
          Username: event.username,
          UserID: userId,
          CompanyID: companyId,
          IPAddress: event.ipAddress,
          UserAgent: event.userAgent,
          Success: event.success,
          ErrorMessage: event.errorMessage,
          Metadata: {
            ...event.metadata,
            ...(event.loginTime && { loginTime: event.loginTime }),
            ...(event.sessionDurationMinutes !== undefined && { sessionDurationMinutes: event.sessionDurationMinutes }),
            ...(event.attemptCount !== undefined && { attemptCount: event.attemptCount }),
            ...(event.failureReason && { failureReason: event.failureReason }),
          },
          Module: 'AUTH',
          Action: event.event,
          DocumentName: 'Session'
        })
      })

      if (!response.ok) {
        console.error('Failed to log audit event to backend:', await response.text())
      }
    } catch (error) {
      // Silent fail - don't break authentication flow if audit logging fails
      console.error('Audit logging error:', error)
    }
  }

  /**
   * Get recent logs from backend
   */
  async getRecentLogs(limit: number = 100, options?: {
    eventType?: string,
    username?: string,
    companyId?: string
  }): Promise<AuditLog[]> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString()
      })

      if (options?.eventType) params.append('eventType', options.eventType)
      if (options?.username) params.append('username', options.username)
      if (options?.companyId) params.append('companyId', options.companyId)

      const response = await fetch(`${this.apiBaseUrl}/api/auditlog/recent?${params}`)

      if (response.ok) {
        const result = await response.json()
        return result.data || []
      }

      return []
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
      return []
    }
  }

  /**
   * Get logs for a specific user
   */
  async getUserLogs(username: string, limit: number = 50): Promise<AuditLog[]> {
    return this.getRecentLogs(limit, { username })
  }

  /**
   * Get logs for a specific event type
   */
  async getEventLogs(event: AuditLog['event'], limit: number = 100): Promise<AuditLog[]> {
    return this.getRecentLogs(limit, { eventType: event })
  }

  /**
   * Get failed login attempts for a user
   */
  async getFailedLoginAttempts(username: string, since?: Date): Promise<AuditLog[]> {
    const logs = await this.getUserLogs(username, 100)
    const sinceTime = since ? since.getTime() : Date.now() - 24 * 60 * 60 * 1000

    return logs.filter(log =>
      log.event === 'LOGIN_FAILURE' &&
      log.timestamp && new Date(log.timestamp).getTime() >= sinceTime
    )
  }

  /**
   * Get emoji for event type
   */
  private getEventEmoji(event: AuditLog['event']): string {
    const emojiMap: Record<AuditLog['event'], string> = {
      'LOGIN_SUCCESS': '✅',
      'LOGIN_FAILURE': '❌',
      'LOGOUT': '👋',
      'SESSION_EXPIRED': '⏰',
      'RATE_LIMIT_EXCEEDED': '🚫',
      'UNAUTHORIZED_ACCESS': '⚠️'
    }
    return emojiMap[event] || '📝'
  }

  /**
   * Get statistics from backend
   */
  async getStats(companyId?: string, startDate?: Date): Promise<{
    totalLogs: number
    loginSuccesses: number
    loginFailures: number
    logouts: number
    rateLimitExceeded: number
    unauthorizedAccess: number
    uniqueUsers: number
    uniqueIPAddresses: number
  }> {
    try {
      const params = new URLSearchParams()
      if (companyId) params.append('companyId', companyId)
      if (startDate) params.append('startDate', startDate.toISOString())

      const response = await fetch(`${this.apiBaseUrl}/api/auditlog/stats?${params}`)

      if (response.ok) {
        const result = await response.json()
        return result.data
      }

      return {
        totalLogs: 0,
        loginSuccesses: 0,
        loginFailures: 0,
        logouts: 0,
        rateLimitExceeded: 0,
        unauthorizedAccess: 0,
        uniqueUsers: 0,
        uniqueIPAddresses: 0
      }
    } catch (error) {
      console.error('Failed to fetch audit stats:', error)
      return {
        totalLogs: 0,
        loginSuccesses: 0,
        loginFailures: 0,
        logouts: 0,
        rateLimitExceeded: 0,
        unauthorizedAccess: 0,
        uniqueUsers: 0,
        uniqueIPAddresses: 0
      }
    }
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger()

// Helper function to get user agent from request
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown'
}
