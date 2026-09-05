'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'

/**
 * Auth-agnostic session for layout components (TopHeader, UserProfileDropdown,
 * MobileMenuSheet, ReminderButton). The library no longer imports next-auth in
 * those components; instead a host app provides the signed-in user through this
 * adapter. `AuthSessionProvider` (next-auth) wires it automatically for Estimo;
 * apps on Supabase, Clerk or custom auth pass `user` and `signOut` directly.
 */
export interface SessionUser {
  id?: string
  name?: string | null
  email?: string | null
  image?: string | null
  role?: string | null
  /** Any extra fields a host app wants to expose (e.g. employeeId, loginTime). */
  [key: string]: unknown
}

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface SessionAdapterValue {
  /** next-auth-shaped so existing call sites keep reading `data?.user`. */
  data: { user: SessionUser } | null
  status: SessionStatus
  signOut: (options?: { callbackUrl?: string; redirect?: boolean }) => Promise<void> | void
}

const SessionAdapterContext = createContext<SessionAdapterValue | null>(null)

export interface SessionAdapterProviderProps {
  user: SessionUser | null | undefined
  status?: SessionStatus
  /** Must be referentially stable (useCallback / module-level); a new function per render re-triggers every consumer keyed on the session. */
  signOut: SessionAdapterValue['signOut']
  children: ReactNode
}

export function SessionAdapterProvider({ user, status, signOut, children }: SessionAdapterProviderProps) {
  const value = useMemo<SessionAdapterValue>(
    () => ({
      data: user ? { user } : null,
      status: status ?? (user ? 'authenticated' : 'unauthenticated'),
      signOut,
    }),
    [user, status, signOut],
  )
  return <SessionAdapterContext.Provider value={value}>{children}</SessionAdapterContext.Provider>
}

/** Drop-in replacement for next-auth's `useSession()` inside library components. */
export function useSessionAdapter(): SessionAdapterValue {
  const ctx = useContext(SessionAdapterContext)
  if (!ctx) {
    throw new Error('useSessionAdapter must be used within <SessionAdapterProvider> (or indas-ui <AuthSessionProvider>)')
  }
  return ctx
}
