/**
 * Comprehensive logout cleanup utility
 * Clears all client-side storage, cookies, caches, and databases
 */

/**
 * Clear all cookies including NextAuth cookies
 * Handles all domain/path/security variations
 */
export function clearAllCookies(): void {
    if (typeof window === 'undefined') return

    const cookies = document.cookie.split(";")
    const hostname = window.location.hostname
    const paths = ['/', '/api', '/api/auth']

    // Get all possible domain variations
    const domains = ['', hostname]
    const hostParts = hostname.split('.')
    if (hostParts.length > 1) {
        // Add root domain (e.g., .example.com)
        domains.push('.' + hostParts.slice(-2).join('.'))
    }

    // Clear each cookie with all possible variations
    cookies.forEach((cookie) => {
        const cookieName = cookie.split("=")[0].trim()
        if (!cookieName) return

        paths.forEach((path) => {
            domains.forEach((domain) => {
                // Basic clear
                document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}`
                // With Secure flag
                document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};Secure`
                // With SameSite variations
                document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};SameSite=Lax`
                document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};SameSite=Strict`
                document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};SameSite=None;Secure`

                if (domain) {
                    document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};domain=${domain}`
                    document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};domain=${domain};Secure`
                    document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};domain=${domain};SameSite=Lax`
                }
            })
        })
    })

    // Explicitly clear NextAuth cookies
    const nextAuthCookies = [
        'next-auth.session-token',
        'next-auth.csrf-token',
        'next-auth.callback-url',
        '__Secure-next-auth.session-token',
        '__Secure-next-auth.csrf-token',
        '__Secure-next-auth.callback-url',
        '__Host-next-auth.csrf-token'
    ]

    nextAuthCookies.forEach((cookieName) => {
        paths.forEach((path) => {
            document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}`
            document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};Secure`
            document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};SameSite=Lax`
            domains.forEach((domain) => {
                if (domain) {
                    document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};domain=${domain}`
                    document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};domain=${domain};Secure`
                }
            })
        })
    })

}

/**
 * Clear all Cache Storage entries
 */
export async function clearCacheStorage(): Promise<void> {
    if (typeof window === 'undefined' || !('caches' in window)) return

    try {
        const cacheNames = await caches.keys()
        await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
        )
    } catch (error) {
        console.error('Error clearing Cache Storage:', error)
    }
}

/**
 * Clear all IndexedDB databases
 */
export async function clearIndexedDB(): Promise<void> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) return

    try {
        const databases = await indexedDB.databases()
        await Promise.all(
            databases.map((db) => {
                if (db.name) {
                    return new Promise<void>((resolve) => {
                        const request = indexedDB.deleteDatabase(db.name!)
                        request.onsuccess = () => {
                            resolve()
                        }
                        request.onerror = () => {
                            console.error(`Error deleting IndexedDB ${db.name}:`, request.error)
                            resolve() // Continue anyway
                        }
                        request.onblocked = () => {
                            resolve() // Continue anyway
                        }
                    })
                }
                return Promise.resolve()
            })
        )
    } catch (error) {
        console.error('Error clearing IndexedDB:', error)
    }
}

/**
 * Clear localStorage EXCEPT user preferences
 * Preserves: theme, language, currency, sidebar preferences, search preferences
 */
export function clearLocalStorage(): void {
    if (typeof window === 'undefined') return

    // Keys to PRESERVE (user preferences from settings page)
    const preserveKeys = [
        'erp-theme',              // Theme preference (ThemeContext)
        'app-language',           // Language preference (LanguageContext)
        'selectedCurrency',       // Currency preference (CurrencyContext)
        'sidebarPreferences',     // Sidebar state (SidebarPreferencesContext)
        'searchPreferences',      // Search preferences (SearchPreferencesContext)
        'bottom-nav-quick-tabs-v4' // Mobile bottom-nav quick tabs (bottom-nav.tsx)
    ]
    // Per-user keys (dashboard Quick Actions, home/quick-actions.tsx) — matched by prefix.
    // 'datagrid-view:' keeps DataGrid view prefs (column order/visibility/width/sort)
    // across logins — they're device-level, like theme/language.
    const preservePrefixes = ['estimo_quick_actions_v3_', 'estimo_quick_starred_v3_', 'datagrid-view:']

    // Get all current values to preserve
    const preservedValues: Record<string, string | null> = {}
    Object.keys(localStorage).forEach(key => {
        if (preserveKeys.includes(key) || preservePrefixes.some(p => key.startsWith(p))) {
            preservedValues[key] = localStorage.getItem(key)
        }
    })

    // Clear ALL localStorage
    localStorage.clear()

    // Restore preserved values
    Object.entries(preservedValues).forEach(([key, value]) => {
        if (value !== null) localStorage.setItem(key, value)
    })

}

/**
 * Clear sessionStorage completely
 */
export function clearSessionStorage(): void {
    if (typeof window === 'undefined') return

    sessionStorage.clear()
}

/**
 * Clear React Query cache if present
 */
export function clearReactQueryCache(): void {
    if (typeof window === 'undefined') return

    try {
        // Check for React Query global cache
        const queryClient = (window as any).__REACT_QUERY_CLIENT__
            || (window as any).queryClient
            || (window as any).__TANSTACK_QUERY_CLIENT__

        if (queryClient && typeof queryClient.clear === 'function') {
            queryClient.clear()
        }
    } catch (error) {
        // Silently ignore if React Query is not available
    }
}

/**
 * Clear Next.js router cache
 */
export function clearNextRouterCache(): void {
    if (typeof window === 'undefined') return

    try {
        // Clear Next.js router cache by replacing state
        window.history.replaceState(null, '', window.location.pathname)
    } catch (error) {
        console.error('Error clearing Next.js router cache:', error)
    }
}

/**
 * Unregister service workers
 */
export async function unregisterServiceWorkers(): Promise<void> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    try {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(
            registrations.map(registration => registration.unregister())
        )
    } catch (error) {
        console.error('Error unregistering service workers:', error)
    }
}

/**
 * Clear browser back/forward cache (bfcache)
 */
export function clearBFCache(): void {
    if (typeof window === 'undefined') return

    try {
        // Add event listener to prevent bfcache restoration
        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                // Page was restored from bfcache, reload to clear it
                window.location.reload()
            }
        }

        window.addEventListener('pageshow', handlePageShow)
    } catch (error) {
        console.error('Error setting up bfcache prevention:', error)
    }
}

/**
 * Clear HttpOnly cookies via API
 */
export async function clearHttpOnlyCookies(): Promise<void> {
    try {
        await fetch('/api/auth/remember', { method: 'DELETE' })
    } catch (error) {
        console.error('Error clearing HttpOnly cookies:', error)
    }
}

/**
 * Clear ALL localStorage including user preferences (no preservation).
 * Use this when the user explicitly asks to wipe everything.
 */
export function clearAllLocalStorage(): void {
    if (typeof window === 'undefined') return
    localStorage.clear()
}

/**
 * Wipe every client-side data store: cookies, localStorage (incl. preferences),
 * sessionStorage, Cache Storage, IndexedDB, React Query cache, service workers.
 * Used by the "Clear all data" button in Settings.
 */
export async function performFullDataWipe(): Promise<boolean> {
    try {
        clearSessionStorage()
        clearAllLocalStorage()
        clearAllCookies()
        clearReactQueryCache()
        clearNextRouterCache()

        await Promise.all([
            clearHttpOnlyCookies(),
            clearCacheStorage(),
            clearIndexedDB(),
            unregisterServiceWorkers()
        ])

        return true
    } catch (error) {
        console.error('Full data wipe failed:', error)
        return false
    }
}

/**
 * Perform complete logout cleanup
 * Call this before signOut() for thorough cleanup
 * @returns Promise<boolean> - true if cleanup successful, false otherwise
 */
export async function performLogoutCleanup(): Promise<boolean> {
    try {
        // Clear all storage synchronously first
        clearSessionStorage()
        clearLocalStorage()
        clearAllCookies()
        clearReactQueryCache()
        clearNextRouterCache()
        clearBFCache()

        // Clear async storage
        await Promise.all([
            clearHttpOnlyCookies(),
            clearCacheStorage(),
            clearIndexedDB(),
            unregisterServiceWorkers()
        ])

        return true
    } catch (error) {
        console.error('❌ Logout cleanup failed:', error)
        return false
    }
}
