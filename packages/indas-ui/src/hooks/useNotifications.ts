'use client'

import {
  Bell, FileText, DollarSign, AlertTriangle, AlertOctagon,
  CheckCircle, UserPlus
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { NotificationResponse } from '@/lib/api/activity'

// `useNotifications` now reads from the shared NotificationProvider (one fetch/poll/SignalR
// for the whole app) instead of running its own per-mount. Re-exported here so existing
// `@/hooks/useNotifications` imports keep working unchanged.
export { useNotifications } from '@/contexts/NotificationContext'
export type { NotificationCategoryTab } from '@/contexts/NotificationContext'

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
