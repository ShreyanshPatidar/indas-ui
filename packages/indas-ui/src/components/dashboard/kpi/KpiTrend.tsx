'use client'

import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KpiShell, ACCENT_MAP, type KpiShellProps } from './kpi-shell'

export interface KpiTrendProps extends KpiShellProps {
  /** Title of the KPI */
  title: string
  /** Main value to display */
  value: string | number
  /** Unit label (e.g., "days", "%", "hrs") */
  unit?: string
  /** Change value (positive or negative) */
  change?: number
  /** Change unit (defaults to same as unit) */
  changeUnit?: string
  /** Description text (e.g., "Improved from 5.0 days last month") */
  description?: string
  /** Icon to display next to title */
  icon?: LucideIcon
  /** Icon color class — falls back to the accent color when an accent is set */
  iconColor?: string
  /** Whether a decrease is positive (e.g., for lead time, costs) */
  decreaseIsGood?: boolean
}

/**
 * KpiTrend — KPI card with trend indicator, built on the reusable KpiShell.
 * Inherits accent / active / onClick / loading / watermark from the shell, so it
 * works both as a plain metric card (surface) and as an interactive filter toggle.
 */
export function KpiTrend({
  title,
  value,
  unit,
  change,
  changeUnit,
  description,
  icon: Icon,
  iconColor,
  decreaseIsGood = false,
  // shell props
  accent,
  active,
  onClick,
  loading,
  watermarkIcon,
  className,
}: KpiTrendProps) {
  const getTrendConfig = () => {
    if (change === undefined || change === 0) {
      return { icon: Minus, color: 'text-[rgb(var(--fg-muted))] bg-[rgb(var(--bg-subtle))]' }
    }
    const isPositive = change > 0
    const isGood = decreaseIsGood ? !isPositive : isPositive
    return {
      icon: isPositive ? TrendingUp : TrendingDown,
      color: isGood
        ? 'text-[rgb(var(--color-success))] bg-[rgb(var(--color-success))]/10'
        : 'text-[rgb(var(--color-error))] bg-[rgb(var(--color-error))]/10',
    }
  }

  const trend = getTrendConfig()
  const TrendIcon = trend.icon
  // Flat surface card unless an accent/active/onClick is requested (then use the tinted shell).
  const surface = !accent && !active && !onClick
  const titleColor = accent ? ACCENT_MAP[accent].text : 'text-[rgb(var(--fg-muted))]'
  const headIconColor = iconColor || (accent ? ACCENT_MAP[accent].text : 'text-[rgb(var(--fg-muted))]')

  return (
    <KpiShell
      accent={accent}
      active={active}
      onClick={onClick}
      loading={loading}
      watermarkIcon={watermarkIcon}
      surface={surface}
      className={className}
    >
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          {Icon && <Icon className={cn('w-4 h-4', headIconColor)} />}
          <p className={cn('text-sm', titleColor)}>{title}</p>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-3xl font-bold text-[rgb(var(--fg-default))]">{value}</p>
          {unit && <span className="text-lg text-[rgb(var(--fg-muted))]">{unit}</span>}

          {change !== undefined && (
            <div className={cn('ml-auto flex items-center gap-1 px-2 py-1 rounded', trend.color)}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-sm font-medium">
                {change > 0 ? '+' : ''}{change}{changeUnit || unit || ''}
              </span>
            </div>
          )}
        </div>

        {description && (
          <p className="text-xs text-[rgb(var(--fg-muted))] mt-2">{description}</p>
        )}
      </div>
    </KpiShell>
  )
}
