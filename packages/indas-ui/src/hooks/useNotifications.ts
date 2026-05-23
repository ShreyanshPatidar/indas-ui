'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { NotificationsAPI } from '@/lib/api/activity'
import type { NotificationResponse } from '@/lib/api/activity'
import { fromBackendNotification } from '@/lib/api/activity/notifications/types'
import { useSignalR } from './useSignalR'
import {
  Bell, FileText, DollarSign, AlertTriangle, AlertOctagon,
  CheckCircle, UserPlus
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type NotificationCategoryTab = 'all' | 'pending' | 'escalations' | 'updates'

export function useNotifications(session: any) {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false)
  const [activeNotificationCategory, setActiveNotificationCategory] = useState<NotificationCategoryTab>('all')
  const [notificationSearchQuery, setNotificationSearchQuery] = useState('')

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!session) return

    setNotificationsLoading(true)
    try {
      const response = await NotificationsAPI.getList(
        { limit: 50 },
        session
      )
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
  }, [session])

  // Fetch on mount and when dropdown opens
  useEffect(() => {
    if (showNotificationDropdown && notifications.length === 0) {
      fetchNotifications()
    }
  }, [showNotificationDropdown, fetchNotifications, notifications.length])

  // Initial fetch
  useEffect(() => {
    if (session && notifications.length === 0) {
      fetchNotifications()
    }
  }, [session, fetchNotifications, notifications.length])

  // Poll every 30s to catch notifications not pushed via SignalR
  useEffect(() => {
    if (!session) return
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [session, fetchNotifications])

  // Categorize notifications by DB Category field
  const categorizedNotifications = useMemo(() => {
    const pending = notifications.filter(n => n.category === 'Pending')
    const escalations = notifications.filter(n => n.category === 'Escalation')
    const updates = notifications.filter(n => n.category === 'Update')

    return { pending, escalations, updates }
  }, [notifications])

  // SignalR: receive real-time push notifications
  const handleReceiveNotification = useCallback((raw: any) => {
    const mapped = fromBackendNotification(raw)
    setNotifications(prev => {
      if (prev.some(n => n.notificationId === mapped.notificationId)) return prev
      return [mapped, ...prev]
    })
  }, [])

  useSignalR({ session, onReceiveNotification: handleReceiveNotification })

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
    updates: categorizedNotifications.updates.length
  }), [notifications.length, categorizedNotifications])

  const getUnreadCount = useCallback(() => {
    return notifications.filter(n => !n.isRead).length
  }, [notifications])

  // Unread counts per category — used for bell icon color indicator
  const getUnreadCategoryCounts = useCallback(() => {
    const unread = notifications.filter(n => !n.isRead)
    return {
      pending: unread.filter(n => n.category === 'Pending').length,
      escalations: unread.filter(n => n.category === 'Escalation').length,
      updates: unread.filter(n => n.category === 'Update').length
    }
  }, [notifications])

  const markNotificationAsRead = useCallback(async (notificationId: number) => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(n =>
        n.notificationId === notificationId ? { ...n, isRead: true } : n
      )
    )

    try {
      await NotificationsAPI.markAsRead([notificationId], session)
    } catch {
      // Revert on error if needed
    }
  }, [session])

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))

    try {
      await NotificationsAPI.markAllAsRead(session)
    } catch {
      // Revert on error if needed
    }
  }, [session])

  const deleteNotification = useCallback(async (notificationId: number) => {
    // Optimistic update
    setNotifications(prev => prev.filter(n => n.notificationId !== notificationId))

    try {
      await NotificationsAPI.delete(notificationId, session)
    } catch {
      // Revert on error if needed
    }
  }, [session])

  return {
    // State
    notifications,
    notificationsLoading,
    showNotificationDropdown,
    setShowNotificationDropdown,
    activeNotificationCategory,
    setActiveNotificationCategory,
    notificationSearchQuery,
    setNotificationSearchQuery,

    // Derived data
    categorizedNotifications,
    getFilteredNotifications,
    getNotificationCounts,
    getUnreadCount,
    getUnreadCategoryCounts,

    // Actions
    fetchNotifications,
    markNotificationAsRead,
    markAllAsRead,
    deleteNotification,
  }
}

// Helper: format relative time
export function formatTimeAgo(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  return date.toLocaleDateString()
}

// Helper: get icon component for a notification
export function getNotificationIcon(notification: NotificationResponse): LucideIcon {
  const type = notification.type
  const module = notification.module

  if (type === 'Approval' || module === 'Approval') return FileText
  if (type === 'Warning') return AlertTriangle
  if (type === 'Error') return AlertOctagon
  if (type === 'Success') return CheckCircle
  if (module === 'Enquiry') return UserPlus
  if (module === 'Estimation') return DollarSign
  if (module === 'Quotation') return FileText
  return Bell
}

// Helper: get icon box color classes for a notification (based on category)
export function getIconBoxColors(notification: NotificationResponse): string {
  const category = notification.category

  if (category === 'Pending') {
    return 'bg-amber-50 text-amber-600'
  }
  if (category === 'Escalation') {
    return 'bg-red-50 text-red-600'
  }
  // Update
  return 'bg-blue-50 text-blue-500'
}
