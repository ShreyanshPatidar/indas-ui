'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type KpiAccent = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'tertiary' | 'secondary' | 'neutral'

interface AccentStyles {
  text: string
  bg: string
  bgHover: string
  iconText: string
  ring: string
  activeBg: string
  pillBg: string
}

// Class strings must be fully static so Tailwind can detect them — no template literals.
export const ACCENT_MAP: Record<KpiAccent, AccentStyles> = {
  primary: {
    text: 'text-[rgb(var(--color-primary))]',
    bg: 'bg-[rgb(var(--color-primary))]/[0.06]',
    bgHover: 'hover:bg-[rgb(var(--color-primary))]/[0.10]',
    iconText: 'text-[rgb(var(--color-primary))]/[0.07]',
    ring: 'ring-[rgb(var(--color-primary))]/40',
    activeBg: 'bg-[rgb(var(--color-primary))]/[0.12]',
    pillBg: 'bg-[rgb(var(--color-primary))]/10',
  },
  success: {
    text: 'text-[rgb(var(--color-success))]',
    bg: 'bg-[rgb(var(--color-success))]/[0.06]',
    bgHover: 'hover:bg-[rgb(var(--color-success))]/[0.10]',
    iconText: 'text-[rgb(var(--color-success))]/[0.07]',
    ring: 'ring-[rgb(var(--color-success))]/40',
    activeBg: 'bg-[rgb(var(--color-success))]/[0.12]',
    pillBg: 'bg-[rgb(var(--color-success))]/10',
  },
  warning: {
    text: 'text-[rgb(var(--color-warning))]',
    bg: 'bg-[rgb(var(--color-warning))]/[0.06]',
    bgHover: 'hover:bg-[rgb(var(--color-warning))]/[0.10]',
    iconText: 'text-[rgb(var(--color-warning))]/[0.07]',
    ring: 'ring-[rgb(var(--color-warning))]/40',
    activeBg: 'bg-[rgb(var(--color-warning))]/[0.12]',
    pillBg: 'bg-[rgb(var(--color-warning))]/10',
  },
  error: {
    text: 'text-[rgb(var(--color-error))]',
    bg: 'bg-[rgb(var(--color-error))]/[0.06]',
    bgHover: 'hover:bg-[rgb(var(--color-error))]/[0.10]',
    iconText: 'text-[rgb(var(--color-error))]/[0.07]',
    ring: 'ring-[rgb(var(--color-error))]/40',
    activeBg: 'bg-[rgb(var(--color-error))]/[0.12]',
    pillBg: 'bg-[rgb(var(--color-error))]/10',
  },
  info: {
    text: 'text-[rgb(var(--color-info))]',
    bg: 'bg-[rgb(var(--color-info))]/[0.06]',
    bgHover: 'hover:bg-[rgb(var(--color-info))]/[0.10]',
    iconText: 'text-[rgb(var(--color-info))]/[0.07]',
    ring: 'ring-[rgb(var(--color-info))]/40',
    activeBg: 'bg-[rgb(var(--color-info))]/[0.12]',
    pillBg: 'bg-[rgb(var(--color-info))]/10',
  },
  tertiary: {
    text: 'text-[rgb(var(--color-tertiary))]',
    bg: 'bg-[rgb(var(--color-tertiary))]/[0.06]',
    bgHover: 'hover:bg-[rgb(var(--color-tertiary))]/[0.10]',
    iconText: 'text-[rgb(var(--color-tertiary))]/[0.07]',
    ring: 'ring-[rgb(var(--color-tertiary))]/40',
    activeBg: 'bg-[rgb(var(--color-tertiary))]/[0.12]',
    pillBg: 'bg-[rgb(var(--color-tertiary))]/10',
  },
  secondary: {
    text: 'text-[rgb(var(--color-secondary))]',
    bg: 'bg-[rgb(var(--color-secondary))]/[0.06]',
    bgHover: 'hover:bg-[rgb(var(--color-secondary))]/[0.10]',
    iconText: 'text-[rgb(var(--color-secondary))]/[0.07]',
    ring: 'ring-[rgb(var(--color-secondary))]/40',
    activeBg: 'bg-[rgb(var(--color-secondary))]/[0.12]',
    pillBg: 'bg-[rgb(var(--color-secondary))]/10',
  },
  neutral: {
    text: 'text-[rgb(var(--fg-muted))]',
    bg: 'bg-[rgb(var(--bg-surface))]',
    bgHover: 'hover:bg-[rgb(var(--bg-subtle))]',
    iconText: 'text-[rgb(var(--fg-muted))]/[0.07]',
    ring: 'ring-[rgb(var(--bd-strong))]',
    activeBg: 'bg-[rgb(var(--bg-subtle))]',
    pillBg: 'bg-[rgb(var(--bg-subtle))]',
  },
}

/** Shared interactive/themed props every KPI card can accept. */
export interface KpiShellProps {
  /** Accent color — drives tinted background, active ring, watermark tint. */
  accent?: KpiAccent
  /** Active/selected state — adds a ring (use for filter-toggle cards). */
  active?: boolean
  /** Click handler — makes the card a button. */
  onClick?: () => void
  /** Loading skeleton. */
  loading?: boolean
  /** Decorative watermark icon, faded in the bottom-right corner. */
  watermarkIcon?: LucideIcon
  className?: string
  /** When true, uses a flat surface card (border + shadow) instead of an accent tint. */
  surface?: boolean
  children?: ReactNode
}

/**
 * KpiShell — reusable card chrome for all KPI components.
 * Owns: accent theming, active ring, click/loading states, watermark.
 * KPI components render their content as children.
 */
export function KpiShell({
  accent: accentKey = 'primary',
  active = false,
  onClick,
  loading = false,
  watermarkIcon: Watermark,
  surface = false,
  className,
  children,
}: KpiShellProps) {
  const a = ACCENT_MAP[accentKey]
  const isInteractive = !!onClick

  const base = cn(
    'w-full h-full relative overflow-hidden rounded-xl border transition-all text-left',
    surface
      ? 'bg-[rgb(var(--bg-surface))] border-[rgb(var(--bd-default))] shadow-sm'
      : active
        ? cn(a.activeBg, 'border-transparent ring-2', a.ring)
        : cn(a.bg, isInteractive && a.bgHover, 'border-transparent'),
    isInteractive && 'cursor-pointer',
    className,
  )

  if (loading) {
    return (
      <div className={base}>
        <div className="relative z-10 space-y-2 animate-pulse p-4">
          <div className="h-2.5 w-14 rounded bg-[rgb(var(--bg-subtle))]" />
          <div className="h-7 w-10 rounded bg-[rgb(var(--bg-subtle))]" />
          <div className="h-2 w-20 rounded bg-[rgb(var(--bg-subtle))]" />
        </div>
      </div>
    )
  }

  const inner = (
    <>
      {Watermark && (
        <Watermark className={cn('absolute -bottom-3 -right-3 w-20 h-20 pointer-events-none', a.iconText)} strokeWidth={1.2} />
      )}
      <div className="relative z-10 h-full">{children}</div>
    </>
  )

  if (isInteractive) {
    return (
      <motion.button type="button" onClick={onClick} whileTap={{ scale: 0.98 }} className={base}>
        {inner}
      </motion.button>
    )
  }

  return <div className={base}>{inner}</div>
}

/**
 * Standalone skeleton for KPI cards that don't render through KpiShell
 * (KpiComparison, KpiBreakdown, KpiQuickStats). Matches the card chrome + pulse.
 */
export function KpiCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-[rgb(var(--bg-surface))] rounded-xl p-5 border border-[rgb(var(--bd-default))] shadow-sm', className)}>
      <div className="space-y-3 animate-pulse">
        <div className="h-3 w-24 rounded bg-[rgb(var(--bg-subtle))]" />
        <div className="h-7 w-16 rounded bg-[rgb(var(--bg-subtle))]" />
        <div className="space-y-2 pt-1">
          <div className="h-2.5 w-full rounded bg-[rgb(var(--bg-subtle))]" />
          <div className="h-2.5 w-5/6 rounded bg-[rgb(var(--bg-subtle))]" />
          <div className="h-2.5 w-2/3 rounded bg-[rgb(var(--bg-subtle))]" />
        </div>
      </div>
    </div>
  )
}
