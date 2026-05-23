'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BreakdownItem {
  /** Label for this item */
  label: string
  /** Value to display */
  value: string | number
  /** Color indicator: success, warning, error, primary, info, or custom hex */
  color?: 'success' | 'warning' | 'error' | 'primary' | 'info' | string
}

export interface KpiBreakdownProps {
  /** Title of the KPI */
  title: string
  /** Total/summary value (optional, displayed in header) */
  total?: string | number
  /** Breakdown items to display */
  items: BreakdownItem[]
  /** Show percentage next to values */
  showPercentage?: boolean
  /** Additional class names */
  className?: string
}

/**
 * KpiBreakdown - KPI card with list breakdown
 *
 * Great for: Status distributions, category splits, item counts by type
 */
export function KpiBreakdown({
  title,
  total,
  items,
  showPercentage = false,
  className
}: KpiBreakdownProps) {
  const getColorClass = (color?: string) => {
    switch (color) {
      case 'success':
        return 'bg-[rgb(var(--color-success))]'
      case 'warning':
        return 'bg-[rgb(var(--color-warning))]'
      case 'error':
        return 'bg-[rgb(var(--color-error))]'
      case 'primary':
        return 'bg-[rgb(var(--color-primary))]'
      case 'info':
        return 'bg-[rgb(var(--color-info))]'
      default:
        // If it's a custom color (hex or rgb), return empty and use inline style
        return color?.startsWith('#') || color?.startsWith('rgb') ? '' : 'bg-[rgb(var(--color-primary))]'
    }
  }

  const totalValue = typeof total === 'number' ? total :
    items.reduce((sum, item) => sum + (typeof item.value === 'number' ? item.value : 0), 0)

  return (
    <div
      className={cn(
        'bg-[rgb(var(--bg-surface))] rounded-xl p-5 border border-[rgb(var(--bd-default))] shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-[rgb(var(--fg-muted))]">{title}</p>
        {total !== undefined && (
          <p className="text-lg font-bold text-[rgb(var(--fg-default))]">
            {typeof total === 'number' ? total.toLocaleString() : total}
          </p>
        )}
      </div>

      {/* Items */}
      <div className="space-y-2">
        {items.map((item, index) => {
          const colorClass = getColorClass(item.color)
          const isCustomColor = item.color?.startsWith('#') || item.color?.startsWith('rgb')
          const numValue = typeof item.value === 'number' ? item.value : 0
          const percentage = totalValue > 0 ? Math.round((numValue / totalValue) * 100) : 0

          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={cn('w-2 h-2 rounded-full', colorClass)}
                  style={isCustomColor ? { backgroundColor: item.color } : undefined}
                />
                <span className="text-sm text-[rgb(var(--fg-default))]">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                </span>
                {showPercentage && (
                  <span className="text-xs text-[rgb(var(--fg-muted))]">({percentage}%)</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
