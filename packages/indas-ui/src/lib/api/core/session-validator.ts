import { getServerAuthSession } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { Session } from 'next-auth'

/**
 * Result of session validation
 */
interface SessionValidationResult {
    valid: boolean
    session?: Session
    response?: NextResponse
}

/**
 * Validate session for API routes
 * Checks if session exists and is not expired
 * 
 * @returns SessionValidationResult with session if valid, or error response if invalid
 * 
 * @example
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const validation = await validateSession()
 *   if (!validation.valid) return validation.response!
 * 
 *   const { session } = validation
 *   // ... rest of API logic using session
 * }
 * ```
 */
export async function validateSession(): Promise<SessionValidationResult> {
    try {
        const session = await getServerAuthSession()

        // Check if session exists
        if (!session || !session.user) {
            return {
                valid: false,
                response: NextResponse.json(
                    {
                        success: false,
                        message: 'Session expired. Please login again.',
                        error: 'UNAUTHORIZED'
                    },
                    { status: 401 }
                )
            }
        }

        // Check if session is expired
        if (session.expires) {
            const expiryTime = new Date(session.expires)
            const now = new Date()

            if (now >= expiryTime) {
                return {
                    valid: false,
                    response: NextResponse.json(
                        {
                            success: false,
                            message: 'Session expired. Please login again.',
                            error: 'SESSION_EXPIRED'
                        },
                        { status: 401 }
                    )
                }
            }
        }

        // Session is valid
        return {
            valid: true,
            session
        }
    } catch (error) {
        console.error('Session validation error:', error)
        return {
            valid: false,
            response: NextResponse.json(
                {
                    success: false,
                    message: 'Authentication error. Please try again.',
                    error: 'AUTH_ERROR'
                },
                { status: 500 }
            )
        }
    }
}

/**
 * Validate session and extract user data
 * Convenience function that returns user data directly
 * 
 * @returns User data if session valid, or error response if invalid
 * 
 * @example
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const result = await validateSessionAndGetUser()
 *   if ('response' in result) return result.response
 * 
 *   const { user, session } = result
 *   // ... rest of API logic using user and session
 * }
 * ```
 */
export async function validateSessionAndGetUser() {
    const validation = await validateSession()

    if (!validation.valid) {
        return { response: validation.response! }
    }

    return {
        user: validation.session!.user,
        session: validation.session!
    }
}
