'use client'

import * as React from 'react'
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface KpiTrendProps {
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
  /** Icon color class */
  iconColor?: string
  /** Whether a decrease is positive (e.g., for lead time, costs) */
  decreaseIsGood?: boolean
  /** Additional class names */
  className?: string
}

/**
 * KpiTrend - KPI card with trend indicator
 *
 * Great for: Metrics with period-over-period changes
 */
export function KpiTrend({
  title,
  value,
  unit,
  change,
  changeUnit,
  description,
  icon: Icon,
  iconColor = 'text-[rgb(var(--fg-muted))]',
  decreaseIsGood = false,
  className
}: KpiTrendProps) {
  const getTrendConfig = () => {
    if (change === undefined || change === 0) {
      return {
        icon: Minus,
        color: 'text-[rgb(var(--fg-muted))] bg-[rgb(var(--bg-subtle))]'
      }
    }

    const isPositive = change > 0
    const isGood = decreaseIsGood ? !isPositive : isPositive

    return {
      icon: isPositive ? TrendingUp : TrendingDown,
      color: isGood
        ? 'text-[rgb(var(--color-success))] bg-[rgb(var(--color-success))]/10'
        : 'text-[rgb(var(--color-error))] bg-[rgb(var(--color-error))]/10'
    }
  }

  const trend = getTrendConfig()
  const TrendIcon = trend.icon

  return (
    <div
      className={cn(
        'bg-[rgb(var(--bg-surface))] rounded-xl p-5 border border-[rgb(var(--bd-default))] shadow-sm',
        className
      )}
    >
      {/* Header with icon and title */}
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className={cn('w-4 h-4', iconColor)} />}
        <p className="text-sm text-[rgb(var(--fg-muted))]">{title}</p>
      </div>

      {/* Value with trend indicator */}
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

      {/* Description */}
      {description && (
        <p className="text-xs text-[rgb(var(--fg-muted))] mt-2">{description}</p>
      )}
    </div>
  )
}
