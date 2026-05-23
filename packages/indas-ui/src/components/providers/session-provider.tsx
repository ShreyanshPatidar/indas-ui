"use client"

import { SessionProvider, useSession, signOut } from "next-auth/react"
import { useEffect, useState, useRef } from "react"
import type { Session } from "next-auth"
import { SessionExpiryWarning } from "@/components/modals/session-expiry-warning"
import { performLogoutCleanup } from "@/lib/utils/logout-cleanup"
import { setSessionExpiredHandler } from "@/lib/api/core/client"

interface AuthSessionProviderProps {
  children: React.ReactNode
  session: Session | null
}

// Session expiry monitor component
function SessionExpiryMonitor({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession()
  const [showExpiryWarning, setShowExpiryWarning] = useState(false)
  const [minutesRemaining, setMinutesRemaining] = useState(0)

  const handleAutoLogout = async () => {
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

  // Auto-logout when session becomes unauthenticated (e.g. hard expiry from jwt callback)
  const wasAuthenticated = useRef(false)
  useEffect(() => {
    if (status === 'authenticated') {
      wasAuthenticated.current = true
    } else if (status === 'unauthenticated' && wasAuthenticated.current) {
      // Session was valid, now it's gone — hard expiry triggered
      wasAuthenticated.current = false
      handleAutoLogout()
    }
  }, [status])

  // Check session expiry on a timer
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (status === "authenticated" && session?.expires) {
      interval = setInterval(() => {
        const now = new Date()
        const expiryTime = new Date(session.expires)
        const timeUntilExpiry = expiryTime.getTime() - now.getTime()
        const minutesLeft = Math.ceil(timeUntilExpiry / (60 * 1000))

        if (timeUntilExpiry <= 5 * 60 * 1000 && timeUntilExpiry > 0) {
          setMinutesRemaining(minutesLeft)
          setShowExpiryWarning(true)
        }

        if (now >= expiryTime) {
          handleAutoLogout()
        }
      }, 30000)
    }

    return () => { if (interval) clearInterval(interval) }
  }, [session, status])

  const handleExtendSession = async () => {
    try {
      // Trigger session refresh by calling update
      await update()
      setShowExpiryWarning(false)
    } catch (error) {
      console.error('Session extend error:', error)
    }
  }

  const handleLogoutNow = async () => {
    setShowExpiryWarning(false)
    await handleAutoLogout()
  }

  return (
    <>
      {children}
      <SessionExpiryWarning
        isOpen={showExpiryWarning}
        onExtend={handleExtendSession}
        onLogout={handleLogoutNow}
        minutesRemaining={minutesRemaining}
      />
    </>
  )
}

export function AuthSessionProvider({ children, session }: AuthSessionProviderProps) {
  return (
    <SessionProvider
      session={session}
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true} // Refetch when window regains focus
    >
      <SessionExpiryMonitor>
        {children}
      </SessionExpiryMonitor>
    </SessionProvider>
  )
}
