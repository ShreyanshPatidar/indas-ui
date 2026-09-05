'use client'

import { useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui'
import { cn } from '@/lib/utils'
import { LogOut, Clock, Monitor, Smartphone, Tablet, X, XCircle, ClipboardCheck, ArrowRight } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export interface DeviceInfo {
  id: string
  name: string
  type: 'desktop' | 'mobile' | 'tablet'
  browser?: string
  os?: string
  lastUsed: Date
  isCurrent: boolean
}

export interface TaskStatus {
  overdue: number
  dueSoon: number
  total: number
}

export interface LogoutModalProps {
  isOpen: boolean
  onClose: () => void
  onLogout: () => void
  onLogoutEverywhere: () => void
  sessionData: {
    duration: string
    startTime: Date
    tasks: TaskStatus
    activeDevices: DeviceInfo[]
    isInactivityWarning?: boolean
    timeUntilAutoLogout?: string
  }
  onExtendSession?: () => void
  onViewTasks?: () => void
  className?: string
}

export function LogoutModal({
  isOpen,
  onClose,
  onLogout,
  sessionData,
  onViewTasks,
  className
}: LogoutModalProps) {
  const { t } = useLanguage()

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter') { e.preventDefault(); onLogout() }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, onLogout])

  const getDeviceIcon = (type: DeviceInfo['type']) => {
    const cls = "h-3.5 w-3.5 text-[rgb(var(--fg-muted))]"
    if (type === 'mobile') return <Smartphone className={cls} />
    if (type === 'tablet') return <Tablet className={cls} />
    return <Monitor className={cls} />
  }

  const currentDevice = sessionData.activeDevices.find(d => d.isCurrent)
  const pendingCount = sessionData.tasks.overdue + sessionData.tasks.dueSoon
  const hasPending = pendingCount > 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn("sm:max-w-[400px] p-0 gap-0 rounded-xl overflow-hidden", className)}
        hideCloseButton={true}
      >
        {/* Header */}
        <DialogHeader className="px-5 pt-4 pb-3.5 border-b border-[rgb(var(--bd-default))]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-base font-semibold text-[rgb(var(--fg-default))]">
                {t('Log out?')}
              </DialogTitle>
              <p className="text-xs text-[rgb(var(--fg-muted))] mt-0.5">
                {t('Your work will be saved automatically')}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[rgb(var(--bg-subtle))] border border-[rgb(var(--bd-default))]">
                <Clock className="h-3 w-3 text-[rgb(var(--fg-muted))]" />
                <span className="text-xs text-[rgb(var(--fg-muted))]">{sessionData.duration}</span>
              </div>
              <button onClick={onClose} className="close-btn-sm" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </DialogHeader>

        <div className="px-5 py-4 space-y-3">
          {/* Pending approvals warning */}
          {hasPending && (
            <button
              onClick={onViewTasks}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors group",
                sessionData.tasks.overdue > 0
                  ? "bg-[rgb(var(--color-error))]/5 border-[rgb(var(--color-error))]/20 hover:bg-[rgb(var(--color-error))]/10"
                  : "bg-[rgb(var(--color-warning))]/5 border-[rgb(var(--color-warning))]/20 hover:bg-[rgb(var(--color-warning))]/10"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
                sessionData.tasks.overdue > 0
                  ? "bg-[rgb(var(--color-error))]/10"
                  : "bg-[rgb(var(--color-warning))]/10"
              )}>
                <ClipboardCheck className={cn("h-4 w-4", sessionData.tasks.overdue > 0 ? "text-[rgb(var(--color-error))]" : "text-[rgb(var(--color-warning))]")} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-semibold", sessionData.tasks.overdue > 0 ? "text-[rgb(var(--color-error))]" : "text-[rgb(var(--color-warning))]")}>
                  {pendingCount} {sessionData.tasks.overdue > 0 ? t('overdue task') : t('pending task')}
                  {pendingCount !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-[rgb(var(--fg-muted))] mt-0.5">{t('View notifications')}</p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-[rgb(var(--fg-muted))] group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
            </button>
          )}

          {/* Current device */}
          {currentDevice && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[rgb(var(--bg-subtle))] border border-[rgb(var(--bd-default))]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgb(var(--bg-surface))] border border-[rgb(var(--bd-default))]">
                {getDeviceIcon(currentDevice.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[rgb(var(--fg-default))] truncate">
                  {currentDevice.browser && currentDevice.os
                    ? `${currentDevice.browser} on ${currentDevice.os}`
                    : t('This Device')}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--color-success))]" />
                  <span className="text-xs text-[rgb(var(--fg-muted))]">{t('Active now')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-5 py-3 bg-[rgb(var(--bg-subtle))] border-t border-[rgb(var(--bd-default))]">
          <div className="flex items-center gap-2.5 w-full">
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 bg-[rgb(var(--bg-surface))] hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--fg-default))] border border-[rgb(var(--bd-default))] transition-colors text-sm font-medium"
            >
              <XCircle className="h-3.5 w-3.5" />
              {t('Cancel')}
            </button>
            <button
              onClick={onLogout}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 bg-[rgb(var(--color-error))]/10 hover:bg-[rgb(var(--color-error))]/20 text-[rgb(var(--color-error))] border border-[rgb(var(--color-error))]/25 transition-colors text-sm font-medium"
            >
              <LogOut className="h-3.5 w-3.5" />
              {t('Log Out')}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
