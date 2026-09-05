'use client'

import React from 'react'
import { WifiOff, AlertTriangle, X } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

type ConnInfo = { downlink: number; rtt: number; effectiveType: string } | null

type NetworkStatus = {
  online: boolean
  slow: boolean
  /** Browser-reported link quality; null where the Network Information API is absent. */
  conn: ConnInfo
  reportSlow: (ms: number) => void
}

const NetworkStatusContext = React.createContext<NetworkStatus>({
  online: true, slow: false, conn: null, reportSlow: () => {},
})

export const useNetworkStatus = () => React.useContext(NetworkStatusContext)

// Link is weak below this throughput or above this round-trip time.
const MIN_DOWNLINK_MBPS = 1
const MAX_RTT_MS = 500
// Fallback only (no Network Information API): a request this slow suggests trouble.
// Deliberately high — a slow BACKEND query is not a slow connection.
const SLOW_MS = 12000
const SLOW_CLEAR_MS = 15000
// Dismissing the slow banner snoozes it — without this, a link flapping around the
// threshold resets the dismissal and the banner re-appears seconds after closing.
const SLOW_SNOOZE_MS = 10 * 60_000

function readConnection(): ConnInfo {
  const c = (navigator as any)?.connection
  if (!c || typeof c.downlink !== 'number') return null
  return { downlink: c.downlink, rtt: c.rtt ?? 0, effectiveType: c.effectiveType ?? '' }
}

export function NetworkStatusProvider({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage()
  const [online, setOnline] = React.useState(true)
  const [conn, setConn] = React.useState<ConnInfo>(null)
  const [slowFallback, setSlowFallback] = React.useState(false)
  const clearTimer = React.useRef<ReturnType<typeof setTimeout>>()

  React.useEffect(() => {
    setOnline(navigator.onLine)
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)

    const c = (navigator as any)?.connection
    const sync = () => setConn(readConnection())
    sync()
    c?.addEventListener?.('change', sync)

    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
      c?.removeEventListener?.('change', sync)
    }
  }, [])

  // Duration heuristic — only consulted when the browser gives us no link metrics.
  const reportSlow = React.useCallback((ms: number) => {
    if (readConnection() || ms < SLOW_MS) return
    setSlowFallback(true)
    clearTimeout(clearTimer.current)
    clearTimer.current = setTimeout(() => setSlowFallback(false), SLOW_CLEAR_MS)
  }, [])

  React.useEffect(() => {
    ;(globalThis as any).__reportRequestMs = reportSlow
    return () => { delete (globalThis as any).__reportRequestMs }
  }, [reportSlow])

  const slow = conn
    ? conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g' ||
      conn.downlink < MIN_DOWNLINK_MBPS || conn.rtt > MAX_RTT_MS
    : slowFallback

  const [dismissed, setDismissed] = React.useState<'offline' | 'slow' | null>(null)
  const snoozeUntil = React.useRef(0)
  const state: 'offline' | 'slow' | null = !online ? 'offline' : slow ? 'slow' : null
  const prevState = React.useRef(state)
  React.useEffect(() => {
    if (prevState.current !== state) {
      prevState.current = state
      if (Date.now() >= snoozeUntil.current) setDismissed(null)
    }
  }, [state])
  const showBanner = state !== null && dismissed !== state

  const value = React.useMemo(() => ({ online, slow, conn, reportSlow }), [online, slow, conn, reportSlow])

  // Quantified when the browser supplies it: "Weak connection (0.8 Mbps) — …".
  const weakText = conn && conn.downlink > 0
    ? `${t('Weak connection')} (${conn.downlink.toFixed(1)} Mbps) — ${t('please check your internet connection')}`
    : t('Weak connection — please check your internet connection')

  return (
    <NetworkStatusContext.Provider value={value}>
      {showBanner && (
        <div
          role="status"
          className="fixed top-2 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-md flex items-center justify-center gap-2 pl-4 pr-9 py-3 rounded-lg shadow-lg text-xs font-medium bg-[rgb(var(--color-error))] text-white"
        >
          {state === 'offline' ? <WifiOff className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
          <span>{state === 'offline' ? t('No internet — please check your connection') : weakText}</span>
          <button
            type="button"
            onClick={() => {
              setDismissed(state)
              if (state === 'slow') snoozeUntil.current = Date.now() + SLOW_SNOOZE_MS
            }}
            aria-label={t('Dismiss')}
            className="absolute right-3 p-0.5 rounded hover:bg-black/10 focus:outline-none focus:ring-1 focus:ring-current"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {children}
    </NetworkStatusContext.Provider>
  )
}
