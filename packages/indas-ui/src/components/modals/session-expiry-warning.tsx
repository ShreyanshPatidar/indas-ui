"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui"
import { Button } from "@/components/ui"
import { AlertTriangle, Clock, LogOut, RefreshCw } from "lucide-react"
import { useOptionalLanguage } from "@/contexts/LanguageContext"

interface SessionExpiryWarningProps {
    isOpen: boolean
    onExtend: () => void
    onLogout: () => void
    minutesRemaining: number
}

/**
 * Modal to warn users when their session is about to expire.
 * Gives them the option to extend the session or logout immediately.
 */
export function SessionExpiryWarning({
    isOpen,
    onExtend,
    onLogout,
    minutesRemaining
}: SessionExpiryWarningProps) {
    const { t } = useOptionalLanguage()
    const minuteLabel = minutesRemaining === 1 ? t('minute') : t('minutes')

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent
                className="max-w-md"
                hideCloseButton
            >
                <DialogHeader className="border-b border-[rgb(var(--bd-default))] pb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[rgb(var(--color-warning)/0.12)] flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-[rgb(var(--color-warning))]" />
                        </div>
                        <DialogTitle className="text-lg font-semibold text-[rgb(var(--fg-default))]">
                            {t('Session Expiring Soon')}
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-4">
                    {/* Time Remaining */}
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-[rgb(var(--bg-subtle))] border border-[rgb(var(--bd-default))]">
                        <Clock className="h-5 w-5 text-[rgb(var(--color-icon))]" />
                        <div>
                            <p className="text-sm font-medium text-[rgb(var(--fg-default))]">
                                {t('Time Remaining')}
                            </p>
                            <p className="text-2xl font-bold text-[rgb(var(--color-warning))]">
                                {minutesRemaining} {minuteLabel}
                            </p>
                        </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                        <p className="text-sm text-[rgb(var(--fg-default))]">
                            {t('Your session will expire in')} <span className="font-semibold text-[rgb(var(--color-warning))]">{minutesRemaining} {minuteLabel}</span>.
                        </p>
                        <p className="text-sm text-[rgb(var(--fg-muted))]">
                            {t('Would you like to extend your session and continue working?')}
                        </p>
                    </div>

                    {/* Warning Note */}
                    <div className="p-3 rounded-lg bg-[rgb(var(--color-warning)/0.08)] border border-[rgb(var(--color-warning)/0.2)]">
                        <p className="text-xs text-[rgb(var(--color-warning-hover))]">
                            <strong>{t('Note')}:</strong> {t("If you don't take action, you'll be automatically logged out when the timer reaches zero. Any unsaved work may be lost.")}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-subtle))]">
                    <Button
                        variant="action-delete"
                        icon={LogOut}
                        onClick={onLogout}
                    >
                        {t('Logout Now')}
                    </Button>
                    <Button
                        variant="action-apply"
                        icon={RefreshCw}
                        onClick={onExtend}
                    >
                        {t('Extend Session')}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
