'use client'

import { Lock, Monitor } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/hooks/useTranslation'

interface UnauthorizedPageProps {
  message?: string
}

export function UnauthorizedPage({ message }: UnauthorizedPageProps) {
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
      <Lock className="w-12 h-12 text-[rgb(var(--fg-muted))] mb-4" strokeWidth={1.5} />
      <h2 className="text-lg font-medium text-[rgb(var(--fg-default))] mb-1">
        {t('Access Restricted')}
      </h2>
      <p className="text-sm text-[rgb(var(--fg-muted))] mb-4 text-center max-w-sm">
        {message || t('You don\'t have permission to view this page.')}
      </p>
      <button
        onClick={() => router.push('/home')}
        className="text-sm text-[rgb(var(--color-primary))] hover:underline"
      >
        {t('Return to Home')}
      </button>
    </div>
  )
}

export function MobileUnavailablePage() {
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[rgb(var(--bg-subtle))] flex items-center justify-center mb-5">
        <Monitor className="w-8 h-8 text-[rgb(var(--fg-muted))]" strokeWidth={1.5} />
      </div>
      <h2 className="text-lg font-semibold text-[rgb(var(--fg-default))] mb-2">
        {t('Desktop Only')}
      </h2>
      <p className="text-sm text-[rgb(var(--fg-muted))] mb-6 max-w-xs leading-relaxed">
        {t('This module is optimized for desktop. Please use a larger screen for the best experience.')}
      </p>
      <button
        onClick={() => router.push('/home')}
        className="px-5 py-2.5 text-sm font-medium rounded-lg bg-[rgb(var(--color-primary))] text-white hover:opacity-90 transition-opacity min-h-[2.75rem]"
      >
        {t('Go to Home')}
      </button>
    </div>
  )
}
