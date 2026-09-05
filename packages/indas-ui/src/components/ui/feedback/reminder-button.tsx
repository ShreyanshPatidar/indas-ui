'use client'

/**
 * ReminderButton — shared nudge control for any module.
 *
 * Only the person who raised the document can send reminders (the server
 * enforces this too); everyone else sees the state read-only. Two manual
 * reminders are allowed, after which the server sweep escalates to the
 * assignee's manager 24h later if there is still no response.
 */

import * as React from 'react'
import { BellRing, ShieldAlert } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/buttons/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { useGlobalAlert } from '@/contexts/GlobalAlertContext'
import { RemindersAPI, type ReminderModule, type ReminderStatus } from '@/lib/api/activity/notifications'

export interface ReminderButtonProps {
  module: ReminderModule
  documentId: number
  /** Called after a reminder or escalation lands, so the caller can refresh. */
  onSent?: () => void
  size?: 'sm' | 'md'
  className?: string
}

export function ReminderButton({ module, documentId, onSent, size = 'sm', className }: ReminderButtonProps) {
  const { data: session } = useSession()
  const { t } = useLanguage()
  const alerts = useGlobalAlert()

  const [status, setStatus] = React.useState<ReminderStatus | null>(null)
  const [busy, setBusy] = React.useState(false)

  const sessionKey = `${(session?.user as any)?.CompanyID ?? ''}:${(session?.user as any)?.UserID ?? ''}`

  const load = React.useCallback(async () => {
    if (!session || !documentId) return
    const res = await RemindersAPI.getStatus(module, documentId, session)
    if (res.success && res.data) setStatus(res.data as ReminderStatus)
  }, [module, documentId, session])

  React.useEffect(() => { load() }, [module, documentId, sessionKey])

  const handleRemind = async () => {
    // Guard on status too: without it a double-click could fire a second
    // reminder before the refreshed count comes back.
    if (!session || busy || !status?.canRemind) return
    setBusy(true)
    try {
      const res = await RemindersAPI.send(module, documentId, session)
      if (res.success) {
        const d: any = res.data
        alerts.showSuccess(
          d?.isFinal ? t('Final Reminder Sent') : t('Reminder Sent'),
          d?.isFinal
            ? t('This request escalates to the assignee\'s manager in 24 hours if unanswered.')
            : t('The assignee has been notified.')
        )
        await load()
        onSent?.()
      } else {
        alerts.showError(t('Error'), res.error || t('Could not send the reminder'))
      }
    } finally {
      setBusy(false)
    }
  }

  if (!status) return null

  // Already escalated — show it, no action left.
  if (status.escalated) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs text-[rgb(var(--color-warning))] ${className || ''}`}>
        <ShieldAlert className="h-3.5 w-3.5" />
        {t('Escalated')}
      </span>
    )
  }

  const used = status.reminderCount
  const max = status.maxReminders

  // Not the raiser (or nothing to chase) — read-only state.
  if (!status.canRemind) {
    if (used === 0) return null
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs text-[rgb(var(--fg-muted))] ${className || ''}`}>
        <BellRing className="h-3.5 w-3.5" />
        {t('Reminded')} {used}/{max}
      </span>
    )
  }

  return (
    <Button
      variant={used >= max - 1 ? 'action-cancel' : 'action-secondary'}
      size={size}
      icon={BellRing}
      onClick={handleRemind}
      disabled={busy}
      className={className}
      title={used >= max - 1
        ? t('Final reminder — escalates in 24 hours if unanswered')
        : t('Send a reminder to the assignee')}
    >
      {used === 0 ? t('Remind') : `${t('Remind')} ${used}/${max}`}
    </Button>
  )
}

ReminderButton.displayName = 'ReminderButton'
