'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ComparisonBar {
  /** Label for this bar */
  label: string
  /** Value to display */
  value: number
  /** Percentage fill (0-100) */
  percentage: number
  /** Bar color: success, warning, error, primary, or custom */
  color?: 'success' | 'warning' | 'error' | 'primary' | string
}

export interface KpiComparisonProps {
  /** Title of the KPI */
  title: string
  /** Main value to display */
  value: string | number
  /** Target value (optional) */
  target?: string | number
  /** Status label (e.g., "On Track", "Behind") */
  status?: {
    label: string
    type: 'success' | 'warning' | 'error'
  }
  /** Comparison bars to display */
  bars: ComparisonBar[]
  /** Additional class names */
  className?: string
}

/**
 * KpiComparison - KPI card with comparison progress bars
 *
 * Great for: Target tracking, period comparisons, goal progress
 */
export function KpiComparison({
  title,
  value,
  target,
  status,
  bars,
  className
}: KpiComparisonProps) {
  const getBarColor = (color?: string) => {
    switch (color) {
      case 'success':
        return 'bg-[rgb(var(--color-success))]'
      case 'warning':
        return 'bg-[rgb(var(--color-warning))]'
      case 'error':
        return 'bg-[rgb(var(--color-error))]'
      case 'primary':
        return 'bg-[rgb(var(--color-primary))]'
      default:
        return color || 'bg-[rgb(var(--color-primary))]'
    }
  }

  const getStatusStyles = (type: 'success' | 'warning' | 'error') => {
    switch (type) {
      case 'success':
        return 'bg-[rgb(var(--color-success))]/10 text-[rgb(var(--color-success))]'
      case 'warning':
        return 'bg-[rgb(var(--color-warning))]/10 text-[rgb(var(--color-warning))]'
      case 'error':
        return 'bg-[rgb(var(--color-error))]/10 text-[rgb(var(--color-error))]'
    }
  }

  return (
    <div
      className={cn(
        'bg-[rgb(var(--bg-surface))] rounded-xl p-5 border border-[rgb(var(--bd-default))] shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-[rgb(var(--fg-muted))]">{title}</p>
        {status && (
          <span className={cn('text-xs px-2 py-0.5 rounded-full', getStatusStyles(status.type))}>
            {status.label}
          </span>
        )}
      </div>

      {/* Main Value */}
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-[rgb(var(--fg-default))]">{value}</p>
        {target && (
          <span className="text-sm text-[rgb(var(--fg-muted))]">/ {target} target</span>
        )}
      </div>

      {/* Comparison Bars */}
      <div className="mt-4 space-y-2">
        {bars.map((bar, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="text-xs text-[rgb(var(--fg-muted))] w-16">{bar.label}</span>
            <div className="flex-1 h-3 bg-[rgb(var(--bg-subtle))] rounded">
              <div
                className={cn('h-full rounded', getBarColor(bar.color))}
                style={{ width: `${Math.min(bar.percentage, 100)}%` }}
              />
            </div>
            <span className="text-xs font-medium w-12 text-right">
              {typeof bar.value === 'number' ? bar.value.toLocaleString() : bar.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
