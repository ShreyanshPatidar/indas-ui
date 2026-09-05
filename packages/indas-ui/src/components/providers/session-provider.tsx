"use client"

import { SessionProvider, useSession, signOut } from "next-auth/react"
import { useCallback, useEffect, useState, useRef } from "react"
import type { Session } from "next-auth"
import { SessionExpiryWarning } from "@/components/modals/session-expiry-warning"
import { SessionAdapterProvider, type SessionUser } from "@/contexts/SessionAdapterContext"
import { performLogoutCleanup } from "@/lib/utils/logout-cleanup"
import { setSessionExpiredHandler } from "@/lib/api/core/client"

interface AuthSessionProviderProps {
  children: React.ReactNode
  session: Session | null
}

// Session lifetime — MUST match `maxAge` in [...nextauth].ts (session + jwt + hard-expiry).
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000 // 8 hours
const WARNING_BEFORE_MS = 5 * 60 * 1000 // 5 minutes
const CHECK_INTERVAL_MS = 30000 // 30 seconds

// Session expiry monitor component
function SessionExpiryMonitor({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession()
  const [showExpiryWarning, setShowExpiryWarning] = useState(false)
  const [minutesRemaining, setMinutesRemaining] = useState(0)

  // Guards against double-fire: the expiry timer, the status-flip effect, and the
  // APIClient 401 handler can all reach logout near the same moment. Without this,
  // performLogoutCleanup() runs concurrently (double IndexedDB delete, double redirect).
  const hasLoggedOut = useRef(false)
  const handleAutoLogout = async () => {
    if (hasLoggedOut.current) return
    hasLoggedOut.current = true
    try {
      await performLogoutCleanup()
      await signOut({ callbackUrl: '/login', redirect: true })
    } catch {
      await signOut({ callbackUrl: '/login', redirect: true })
    }
  }

  // Register global session-expired handler so APIClient 401s trigger sign-out
  const autoLogoutRef = useRef(handleAutoLogout)
  autoLogoutRef.current = handleAutoLogout

  useEffect(() => {
    setSessionExpiredHandler(() => { autoLogoutRef.current() })
  }, [])

  // Auto-logout ONLY on a confirmed authenticated→unauthenticated flip within this tab —
  // i.e. the cookie was valid and then went away (hard expiry from the jwt callback, or
  // logout in another tab). A freshly-opened tab reads the same shared cookie and is
  // authenticated immediately; its brief `loading → unauthenticated → authenticated`
  // flicker is NOT expiry and must never trigger logout — that was logging users out the
  // instant they opened a second tab.
  // Note: this intentionally does NOT redirect a tab that starts unauthenticated. Genuine
  // expiry is caught by the loginTime+maxAge timer below and by the APIClient 401 handler;
  // the rare "expired cookie + manual refresh before either notices" case is left to those.
  const wasAuthenticated = useRef(false)
  useEffect(() => {
    if (status === 'authenticated') {
      wasAuthenticated.current = true
      return
    }
    if (status === 'unauthenticated' && wasAuthenticated.current) {
      wasAuthenticated.current = false
      handleAutoLogout()
    }
  }, [status])

  // Check session expiry on a timer.
  // Expiry is derived from loginTime + SESSION_MAX_AGE_MS — NOT session.expires.
  // session.expires does not reliably move forward on a manual update(), so it would
  // fire logout at the original time even after Extend. loginTime IS reset by the jwt
  // callback on Extend, so a successful extend produces a new session object → this
  // effect re-runs with a fresh expiry and the timer re-arms correctly.
  const loginTime = (session?.user as any)?.loginTime as string | undefined
  useEffect(() => {
    if (status !== "authenticated" || !loginTime) return

    const expiryMs = new Date(loginTime).getTime() + SESSION_MAX_AGE_MS

    const tick = () => {
      const timeUntilExpiry = expiryMs - Date.now()

      if (timeUntilExpiry <= 0) {
        handleAutoLogout()
        return
      }

      if (timeUntilExpiry <= WARNING_BEFORE_MS) {
        setMinutesRemaining(Math.ceil(timeUntilExpiry / (60 * 1000)))
        setShowExpiryWarning(true)
      } else {
        // Extend pushed expiry back out — clear any stale warning.
        setShowExpiryWarning(false)
      }
    }

    tick() // run immediately so a re-arm after Extend reflects right away
    const interval = setInterval(tick, CHECK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [loginTime, status])

  const handleExtendSession = async () => {
    try {
      // Resets loginTime on the server (jwt trigger==='update'); the returned session
      // re-arms the expiry timer above. Hide the warning optimistically.
      setShowExpiryWarning(false)
      await update()
    } catch (error) {
      console.error('Session extend error:', error)
    }
  }

  const handleLogoutNow = async () => {
    setShowExpiryWarning(false)
    await handleAutoLogout()
  }

  // Stable identity: a fresh function per render would rebuild the adapter value and
  // re-fire every consumer keyed on the session (ModuleAuth permission refetch).
  const adapterSignOut = useCallback(async (options?: { callbackUrl?: string; redirect?: boolean }) => {
    await signOut({ callbackUrl: options?.callbackUrl ?? "/login", redirect: options?.redirect ?? true })
  }, [])

  return (
    // Feed the auth-agnostic adapter so layout components never import next-auth themselves.
    <SessionAdapterProvider
      user={(session?.user as unknown as SessionUser | undefined) ?? null}
      status={status}
      signOut={adapterSignOut}
    >
      {children}
      <SessionExpiryWarning
        isOpen={showExpiryWarning}
        onExtend={handleExtendSession}
        onLogout={handleLogoutNow}
        minutesRemaining={minutesRemaining}
      />
    </SessionAdapterProvider>
  )
}

export function AuthSessionProvider({ children, session }: AuthSessionProviderProps) {
  return (
    <SessionProvider
      session={session}
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={false} // Don't re-fetch the session on tab focus — caused full page "refresh" feel
    >
      <SessionExpiryMonitor>
        {children}
      </SessionExpiryMonitor>
    </SessionProvider>
  )
}
