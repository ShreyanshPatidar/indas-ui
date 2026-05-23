"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui"
import { Button } from "@/components/ui"
import { AlertTriangle, Clock } from "lucide-react"

interface SessionExpiryWarningProps {
    isOpen: boolean
    onExtend: () => void
    onLogout: () => void
    minutesRemaining: number
}

/**
 * Modal to warn users when their session is about to expire
 * Gives them the option to extend the session or logout immediately
 */
export function SessionExpiryWarning({
    isOpen,
    onExtend,
    onLogout,
    minutesRemaining
}: SessionExpiryWarningProps) {
    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent
                className="max-w-md"
                hideCloseButton
            >
                <DialogHeader className="border-b border-[rgb(var(--bd-default))] pb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                        </div>
                        <DialogTitle className="text-lg font-semibold text-[rgb(var(--fg-default))]">
                            Session Expiring Soon
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-4">
                    {/* Time Remaining */}
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-[rgb(var(--bg-surface-secondary))] border border-[rgb(var(--bd-default))]">
                        <Clock className="h-5 w-5 text-[rgb(var(--color-icon))]" />
                        <div>
                            <p className="text-sm font-medium text-[rgb(var(--fg-default))]">
                                Time Remaining
                            </p>
                            <p className="text-2xl font-bold text-amber-600 dark:text-amber-500">
                                {minutesRemaining} {minutesRemaining === 1 ? 'minute' : 'minutes'}
                            </p>
                        </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                        <p className="text-sm text-[rgb(var(--fg-default))]">
                            Your session will expire in <span className="font-semibold text-amber-600 dark:text-amber-500">{minutesRemaining} {minutesRemaining === 1 ? 'minute' : 'minutes'}</span> due to inactivity.
                        </p>
                        <p className="text-sm text-[rgb(var(--fg-muted))]">
                            Would you like to extend your session and continue working?
                        </p>
                    </div>

                    {/* Warning Note */}
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                        <p className="text-xs text-amber-800 dark:text-amber-400">
                            <strong>Note:</strong> If you don't take action, you'll be automatically logged out when the timer reaches zero. Any unsaved work may be lost.
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface-secondary))]">
                    <Button
                        variant="outline"
                        onClick={onLogout}
                        className="min-w-[100px]"
                    >
                        Logout Now
                    </Button>
                    <Button
                        onClick={onExtend}
                        className="min-w-[120px] bg-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary-hover))] text-white"
                    >
                        Extend Session
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
