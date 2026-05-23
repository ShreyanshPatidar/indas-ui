'use client'

import { useEffect, useRef } from 'react'
import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'
import type { HubConnection } from '@microsoft/signalr'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''

interface UseSignalROptions {
  session: any
  onReceiveNotification: (data: any) => void
}

/**
 * Hook to manage a SignalR connection for real-time notifications.
 *
 * Connects to /hubs/notifications with companyId/userId as query params.
 * Auto-reconnects with backoff: [0s, 2s, 5s, 10s, 30s].
 * Uses ref pattern to avoid stale closure issues with the callback.
 */
export function useSignalR({ session, onReceiveNotification }: UseSignalROptions) {
  const connectionRef = useRef<HubConnection | null>(null)
  const onReceiveRef = useRef(onReceiveNotification)

  // Keep callback ref current without re-connecting
  useEffect(() => {
    onReceiveRef.current = onReceiveNotification
  }, [onReceiveNotification])

  useEffect(() => {
    if (!session?.user || !API_BASE_URL) return

    const companyId = session.user.CompanyID || session.user.companyID
    const userId = session.user.UserID || session.user.userID

    if (!companyId || !userId) return

    const hubUrl = `${API_BASE_URL}/hubs/notifications?companyId=${companyId}&userId=${userId}`

    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.None)
      .build()

    connection.on('ReceiveNotification', (data: any) => {
      onReceiveRef.current(data)
    })

    connection.onreconnecting(() => {})
    connection.onreconnected(() => {})
    connection.onclose(() => {})

    connection
      .start()
      .catch(() => {
        // Silent fail — auto-reconnect will retry
      })

    connectionRef.current = connection

    return () => {
      if (connection.state !== HubConnectionState.Disconnected) {
        connection.stop()
      }
    }
  }, [session?.user?.CompanyID, session?.user?.companyID, session?.user?.UserID, session?.user?.userID])
}
