'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { NotificationsAPI } from '@/lib/api/activity'
import type { NotificationResponse } from '@/lib/api/activity'
import { fromBackendNotification } from '@/lib/api/activity/notifications/types'
import { useSignalR } from '@/hooks/useSignalR'

export type NotificationCategoryTab = 'all' | 'pending' | 'escalations' | 'updates'

interface NotificationContextValue {
  // State
  notifications: NotificationResponse[]
  notificationsLoading: boolean
  showNotificationDropdown: boolean
  setShowNotificationDropdown: (v: boolean) => void
  activeNotificationCategory: NotificationCategoryTab
  setActiveNotificationCategory: (v: NotificationCategoryTab) => void
  notificationSearchQuery: string
  setNotificationSearchQuery: (v: string) => void

  // Derived data
  categorizedNotifications: {
    pending: NotificationResponse[]
    escalations: NotificationResponse[]
    updates: NotificationResponse[]
  }
  getFilteredNotifications: () => NotificationResponse[]
  getNotificationCounts: () => { all: number; pending: number; escalations: number; updates: number }
  getUnreadCount: () => number
  getUnreadCategoryCounts: () => { pending: number; escalations: number; updates: number }

  // Actions
  fetchNotifications: () => Promise<void>
  markNotificationAsRead: (notificationId: number) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: number) => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

/**
 * Single source of truth for notifications — runs the fetch/poll/SignalR ONCE for the whole
 * app. Consumers read shared state via `useNotifications()` instead of each mounting their own.
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()

  const [notifications, setNotifications] = useState<NotificationResponse[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false)
  const [activeNotificationCategory, setActiveNotificationCategory] = useState<NotificationCategoryTab>('all')
  const [notificationSearchQuery, setNotificationSearchQuery] = useState('')

  // Key off stable identity, not the session object (useSession() churns its reference each
  // render — depending on it caused a refetch storm). Read the live session via a ref.
  const sessionRef = useRef(session)
  sessionRef.current = session
  const sessionKey = `${(session?.user as any)?.CompanyID ?? ''}:${(session?.user as any)?.UserID ?? ''}`
  const hasSession = !!session?.user

  // limit: 1000 (not 0) — the backend SP treats @Limit=0 as "return 0 rows", not "no cap".
  const fetchNotifications = useCallback(async () => {
    const sess = sessionRef.current
    if (!sess) return
    setNotificationsLoading(true)
    try {
      const response = await NotificationsAPI.getList({ limit: 1000 }, sess)
      if (response.success && response.data) {
        setNotifications(response.data)
      } else {
        setNotifications([])
      }
    } catch {
      setNotifications([])
    } finally {
      setNotificationsLoading(false)
    }
  }, [])

  // Initial fetch once per logged-in identity.
  useEffect(() => {
    if (hasSession) fetchNotifications()
  }, [sessionKey, hasSession, fetchNotifications])

  // Safety-net poll for a dropped socket; SignalR handles live updates.
  useEffect(() => {
    if (!hasSession) return
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [sessionKey, hasSession, fetchNotifications])

  const handleReceiveNotification = useCallback((raw: any) => {
    const mapped = fromBackendNotification(raw)
    setNotifications(prev => {
      if (prev.some(n => n.notificationId === mapped.notificationId)) return prev
      return [mapped, ...prev]
    })
  }, [])

  useSignalR({ session, onReceiveNotification: handleReceiveNotification })

  const categorizedNotifications = useMemo(() => ({
    pending: notifications.filter(n => n.category === 'Pending'),
    escalations: notifications.filter(n => n.category === 'Escalation'),
    updates: notifications.filter(n => n.category === 'Update'),
  }), [notifications])

  const getFilteredNotifications = useCallback(() => {
    let filtered = activeNotificationCategory === 'all'
      ? [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      : categorizedNotifications[activeNotificationCategory] || []

    if (notificationSearchQuery.trim()) {
      const query = notificationSearchQuery.toLowerCase()
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(query) ||
        (n.message && n.message.toLowerCase().includes(query))
      )
    }
    return filtered
  }, [activeNotificationCategory, notifications, categorizedNotifications, notificationSearchQuery])

  const getNotificationCounts = useCallback(() => ({
    all: notifications.length,
    pending: categorizedNotifications.pending.length,
    escalations: categorizedNotifications.escalations.length,
    updates: categorizedNotifications.updates.length,
  }), [notifications.length, categorizedNotifications])

  const getUnreadCount = useCallback(() => {
    return notifications.filter(n => !n.isRead).length
  }, [notifications])

  const getUnreadCategoryCounts = useCallback(() => {
    const unread = notifications.filter(n => !n.isRead)
    return {
      pending: unread.filter(n => n.category === 'Pending').length,
      escalations: unread.filter(n => n.category === 'Escalation').length,
      updates: unread.filter(n => n.category === 'Update').length,
    }
  }, [notifications])

  const markNotificationAsRead = useCallback(async (notificationId: number) => {
    setNotifications(prev =>
      prev.map(n => (n.notificationId === notificationId ? { ...n, isRead: true } : n))
    )
    try {
      await NotificationsAPI.markAsRead([notificationId], sessionRef.current)
    } catch {
      // Revert on error if needed
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    try {
      await NotificationsAPI.markAllAsRead(sessionRef.current)
    } catch {
      // Revert on error if needed
    }
  }, [])

  const deleteNotification = useCallback(async (notificationId: number) => {
    setNotifications(prev => prev.filter(n => n.notificationId !== notificationId))
    try {
      await NotificationsAPI.delete(notificationId, sessionRef.current)
    } catch {
      // Revert on error if needed
    }
  }, [])

  const value = useMemo<NotificationContextValue>(() => ({
    notifications,
    notificationsLoading,
    showNotificationDropdown,
    setShowNotificationDropdown,
    activeNotificationCategory,
    setActiveNotificationCategory,
    notificationSearchQuery,
    setNotificationSearchQuery,
    categorizedNotifications,
    getFilteredNotifications,
    getNotificationCounts,
    getUnreadCount,
    getUnreadCategoryCounts,
    fetchNotifications,
    markNotificationAsRead,
    markAllAsRead,
    deleteNotification,
  }), [
    notifications, notificationsLoading, showNotificationDropdown, activeNotificationCategory,
    notificationSearchQuery, categorizedNotifications, getFilteredNotifications,
    getNotificationCounts, getUnreadCount, getUnreadCategoryCounts, fetchNotifications,
    markNotificationAsRead, markAllAsRead, deleteNotification,
  ])

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

/**
 * Read the shared notification state. Signature keeps the legacy `session` arg for drop-in
 * compatibility with the old hook, but it's ignored — the provider owns the session.
 */
export function useNotifications(_session?: any): NotificationContextValue {
  const ctx = useContext(NotificationContext)
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return ctx
}
