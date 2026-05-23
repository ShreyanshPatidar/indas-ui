'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type KpiAccent = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'tertiary' | 'secondary'

export interface KpiProps {
  /** KPI title/label — uppercase, small, accent-colored */
  title: string

  /** Main value to display */
  value: string | number

  /** Optional unit suffix (%, $, etc.) — appended after value */
  unit?: string

  /** Optional badge in bottom-right corner (e.g., "12 actions") — shown only when `change` is undefined */
  badge?: string | number

  /** Optional badge label (e.g., "actions") shown after the badge value */
  badgeLabel?: string

  /** Change from previous period — renders trend pill (overrides badge) */
  change?: number

  /** Change label (e.g., "vs last week") — small text after the trend pill */
  changeLabel?: string

  /** Optional subtitle/description below value */
  subtitle?: string

  /** Decorative watermark icon (bottom-right, faded) */
  icon?: LucideIcon

  /** Accent color — drives title color, background tint, and watermark */
  accent?: KpiAccent

  /** Active/selected state — adds ring and stronger background */
  active?: boolean

  /** Size variant */
  size?: 'sm' | 'md' | 'lg'

  /** Loading skeleton */
  loading?: boolean

  /** Click handler — makes the card a button */
  onClick?: () => void

  /** Optional footer content (e.g., sparkline chart) */
  footer?: React.ReactNode

  className?: string
}

const ACCENT_MAP: Record<KpiAccent, { token: string; bg: string; bgHover: string; text: string; iconText: string; ring: string; activeBg: string; pillBg: string }> = {
  primary: {
    token: '--color-primary',
    bg: 'bg-[rgb(var(--color-primary))]/[0.06]',
    bgHover: 'hover:bg-[rgb(var(--color-primary))]/[0.10]',
    text: 'text-[rgb(var(--color-primary))]',
    iconText: 'text-[rgb(var(--color-primary))]/[0.07]',
    ring: 'ring-[rgb(var(--color-primary))]/40',
    activeBg: 'bg-[rgb(var(--color-primary))]/[0.12]',
    pillBg: 'bg-[rgb(var(--color-primary))]/10',
  },
  success: {
    token: '--color-success',
    bg: 'bg-[rgb(var(--color-success))]/[0.06]',
    bgHover: 'hover:bg-[rgb(var(--color-success))]/[0.10]',
    text: 'text-[rgb(var(--color-success))]',
    iconText: 'text-[rgb(var(--color-success))]/[0.07]',
    ring: 'ring-[rgb(var(--color-success))]/40',
    activeBg: 'bg-[rgb(var(--color-success))]/[0.12]',
    pillBg: 'bg-[rgb(var(--color-success))]/10',
  },
  warning: {
    token: '--color-warning',
    bg: 'bg-[rgb(var(--color-warning))]/[0.06]',
    bgHover: 'hover:bg-[rgb(var(--color-warning))]/[0.10]',
    text: 'text-[rgb(var(--color-warning))]',
    iconText: 'text-[rgb(var(--color-warning))]/[0.07]',
    ring: 'ring-[rgb(var(--color-warning))]/40',
    activeBg: 'bg-[rgb(var(--color-warning))]/[0.12]',
    pillBg: 'bg-[rgb(var(--color-warning))]/10',
  },
  error: {
    token: '--color-error',
    bg: 'bg-[rgb(var(--color-error))]/[0.06]',
    bgHover: 'hover:bg-[rgb(var(--color-error))]/[0.10]',
    text: 'text-[rgb(var(--color-error))]',
    iconText: 'text-[rgb(var(--color-error))]/[0.07]',
    ring: 'ring-[rgb(var(--color-error))]/40',
    activeBg: 'bg-[rgb(var(--color-error))]/[0.12]',
    pillBg: 'bg-[rgb(var(--color-error))]/10',
  },
  info: {
    token: '--color-info',
    bg: 'bg-[rgb(var(--color-info))]/[0.06]',
    bgHover: 'hover:bg-[rgb(var(--color-info))]/[0.10]',
    text: 'text-[rgb(var(--color-info))]',
    iconText: 'text-[rgb(var(--color-info))]/[0.07]',
    ring: 'ring-[rgb(var(--color-info))]/40',
    activeBg: 'bg-[rgb(var(--color-info))]/[0.12]',
    pillBg: 'bg-[rgb(var(--color-info))]/10',
  },
  tertiary: {
    token: '--color-tertiary',
    bg: 'bg-[rgb(var(--color-tertiary))]/[0.06]',
    bgHover: 'hover:bg-[rgb(var(--color-tertiary))]/[0.10]',
    text: 'text-[rgb(var(--color-tertiary))]',
    iconText: 'text-[rgb(var(--color-tertiary))]/[0.07]',
    ring: 'ring-[rgb(var(--color-tertiary))]/40',
    activeBg: 'bg-[rgb(var(--color-tertiary))]/[0.12]',
    pillBg: 'bg-[rgb(var(--color-tertiary))]/10',
  },
  secondary: {
    token: '--color-secondary',
    bg: 'bg-[rgb(var(--color-secondary))]/[0.06]',
    bgHover: 'hover:bg-[rgb(var(--color-secondary))]/[0.10]',
    text: 'text-[rgb(var(--color-secondary))]',
    iconText: 'text-[rgb(var(--color-secondary))]/[0.07]',
    ring: 'ring-[rgb(var(--color-secondary))]/40',
    activeBg: 'bg-[rgb(var(--color-secondary))]/[0.12]',
    pillBg: 'bg-[rgb(var(--color-secondary))]/10',
  },
}

const SIZE_MAP = {
  sm: { padding: 'px-3 py-2.5', minH: 'min-h-[3.75rem]', icon: 'w-12 h-12 -bottom-1 -right-1', value: 'text-xl', title: 'text-[0.6rem]' },
  md: { padding: 'px-3.5 py-3',  minH: 'min-h-[4.5rem]',  icon: 'w-16 h-16 -bottom-2 -right-2', value: 'text-2xl', title: 'text-[0.625rem]' },
  lg: { padding: 'px-4 py-3.5',  minH: 'min-h-[5.5rem]',  icon: 'w-20 h-20 -bottom-3 -right-3', value: 'text-3xl', title: 'text-xs' },
}

function getTrendIcon(change: number | undefined) {
  if (change === undefined || change === 0) return <Minus className="w-3 h-3" />
  return change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
}

function getTrendColor(change: number | undefined) {
  if (change === undefined || change === 0) return 'text-[rgb(var(--fg-muted))] bg-[rgb(var(--bg-subtle))]'
  return change > 0
    ? 'text-[rgb(var(--color-success))] bg-[rgb(var(--color-success))]/10'
    : 'text-[rgb(var(--color-error))] bg-[rgb(var(--color-error))]/10'
}

/**
 * Kpi — Compact KPI card with watermark icon style (matches home dashboard).
 * Layout: tiny uppercase accent label on top, big bold value bottom-left,
 * optional badge or trend pill bottom-right, decorative watermark icon in corner.
 *
 * Supports: trend %, subtitle, footer (sparkline), 3 sizes, active/loading states.
 */
export function Kpi({
  title,
  value,
  unit,
  badge,
  badgeLabel,
  change,
  changeLabel,
  subtitle,
  icon: Icon,
  accent = 'primary',
  active = false,
  size = 'md',
  loading = false,
  onClick,
  footer,
  className,
}: KpiProps) {
  const a = ACCENT_MAP[accent]
  const s = SIZE_MAP[size]
  const isInteractive = !!onClick
  const showBadge = change === undefined && badge !== undefined && badge !== null && badge !== ''

  const baseClasses = cn(
    'w-full h-full relative overflow-hidden rounded-xl border transition-all text-left group',
    active
      ? cn(a.activeBg, 'border-transparent ring-2', a.ring)
      : cn(a.bg, isInteractive && a.bgHover, 'border-transparent'),
    isInteractive && 'cursor-pointer',
    className,
  )

  if (loading) {
    return (
      <div className={baseClasses}>
        <div className={cn('relative z-10 space-y-2 animate-pulse', s.padding)}>
          <div className="h-2.5 w-14 rounded bg-[rgb(var(--bg-subtle))]" />
          <div className="h-7 w-10 rounded bg-[rgb(var(--bg-subtle))]" />
          {(subtitle || footer) && <div className="h-2 w-20 rounded bg-[rgb(var(--bg-subtle))]" />}
        </div>
      </div>
    )
  }

  const content = (
    <>
      {Icon && (
        <Icon
          className={cn('absolute pointer-events-none', s.icon, a.iconText)}
          strokeWidth={1.2}
        />
      )}
      <div className={cn('relative z-10 flex flex-col justify-between', s.padding, s.minH)}>
        <p className={cn('font-bold uppercase tracking-wider leading-none', s.title, a.text)}>
          {title}
        </p>

        <div className="flex items-end justify-between gap-2 mt-1">
          <span className={cn('font-extrabold text-[rgb(var(--fg-default))] tabular-nums leading-none', s.value)}>
            {value}
            {unit && (
              <span className="text-base font-medium text-[rgb(var(--fg-muted))] ml-0.5">{unit}</span>
            )}
          </span>

          {/* Trend pill (preferred) or badge */}
          {change !== undefined && (
            <span className={cn(
              'inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none shrink-0 tabular-nums',
              getTrendColor(change),
            )}>
              {getTrendIcon(change)}
              {Math.abs(change)}%
            </span>
          )}
          {showBadge && (
            <span className={cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none shrink-0 tabular-nums',
              a.text,
              a.pillBg,
            )}>
              {badge}{badgeLabel ? ` ${badgeLabel}` : ''}
            </span>
          )}
        </div>

        {(subtitle || changeLabel) && (
          <p className="text-[10px] text-[rgb(var(--fg-muted))] mt-1 truncate leading-tight">
            {changeLabel || subtitle}
          </p>
        )}
      </div>

      {footer && (
        <div className="relative z-10 px-3.5 pb-2 -mt-1">
          {footer}
        </div>
      )}
    </>
  )

  if (isInteractive) {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        whileTap={{ scale: 0.98 }}
        className={baseClasses}
      >
        {content}
      </motion.button>
    )
  }

  return <div className={baseClasses}>{content}</div>
}
