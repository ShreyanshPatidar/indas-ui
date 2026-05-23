// Server-side URL utilities (using dynamic host detection)
import { headers } from 'next/headers'

/**
 * Gets the current server URL dynamically using request headers
 * No hardcoded values - truly production ready
 */
export async function getServerBaseURL(): Promise<string> {
  try {
    // Get headers to determine current URL dynamically
    const headersList = await headers()
    const host = headersList.get('host')

    // Detect protocol dynamically
    const forwardedProto = headersList.get('x-forwarded-proto')
    const forwardedSsl = headersList.get('x-forwarded-ssl')
    const isSecure = forwardedProto === 'https' || forwardedSsl === 'on'
    const protocol = isSecure ? 'https' : 'http'

    if (host) {
      const baseUrl = `${protocol}://${host}`
      return baseUrl
    }

    throw new Error('No host header found in request')

  } catch (error) {
    console.error('Error detecting server URL:', error)
    throw error // Don't return fallback, let caller handle
  }
}

/**
 * Gets the current request URL (full path)
 */
export async function getCurrentURL(): Promise<string> {
  try {
    const headersList = await headers()
    const host = headersList.get('host')
    const protocol = headersList.get('x-forwarded-proto') ||
                     (headersList.get('x-forwarded-ssl') === 'on' ? 'https' : 'http')
    const pathname = headersList.get('x-pathname') || '/'

    if (host) {
      return `${protocol}://${host}${pathname}`
    }

    // Fallback to NEXTAUTH_URL environment variable
    return `${process.env.NEXTAUTH_URL}/`
  } catch (error) {
    console.error('Error getting current URL:', error)
    // Fallback to NEXTAUTH_URL environment variable
    return `${process.env.NEXTAUTH_URL}/`
  }
}

/**
 * Maps a relative path to absolute URL (like Server.MapPath)
 */
export async function mapPath(relativePath: string): Promise<string> {
  const baseUrl = await getServerBaseURL()

  // Ensure path starts with /
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`

  return `${baseUrl}${path}`
}

/**
 * Gets the base URL for client-side usage (window.location based)
 * Falls back to NEXTAUTH_URL for SSR
 */
export function getClientBaseURL(): string {
  // Client-side: use window.location
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`
  }

  // Server-side: use environment variable
  return process.env.NEXTAUTH_URL!
}