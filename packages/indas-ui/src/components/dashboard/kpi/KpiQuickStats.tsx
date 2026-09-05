'use client'

import * as React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KpiCardSkeleton } from './kpi-shell'

export interface QuickStat {
  /** Label for this stat */
  label: string
  /** Value to display */
  value: string | number
  /** Icon component */
  icon: LucideIcon
  /** Icon color: success, warning, error, primary, info */
  iconColor?: 'success' | 'warning' | 'error' | 'primary' | 'info'
}

export interface KpiQuickStatsProps {
  /** Title of the KPI card */
  title: string
  /** Stats to display (2-4 recommended) */
  stats: QuickStat[]
  /** Number of columns (2, 3, or 4) */
  columns?: 2 | 3 | 4
  /** Show a skeleton placeholder while data loads */
  loading?: boolean
  /** Additional class names */
  className?: string
}

/**
 * KpiQuickStats - KPI card with grid of icon stats
 *
 * Great for: Quick overview panels, dashboard summaries, multi-metric cards
 */
export function KpiQuickStats({
  title,
  stats,
  columns = 2,
  loading,
  className
}: KpiQuickStatsProps) {
  if (loading) return <KpiCardSkeleton className={className} />
  const getIconColorClass = (color?: string) => {
    switch (color) {
      case 'success':
        return 'text-[rgb(var(--color-success))]'
      case 'warning':
        return 'text-[rgb(var(--color-warning))]'
      case 'error':
        return 'text-[rgb(var(--color-error))]'
      case 'primary':
        return 'text-[rgb(var(--color-primary))]'
      case 'info':
        return 'text-[rgb(var(--color-info))]'
      default:
        return 'text-[rgb(var(--fg-muted))]'
    }
  }

  const gridClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  }

  return (
    <div
      className={cn(
        'bg-[rgb(var(--bg-surface))] rounded-xl p-5 border border-[rgb(var(--bd-default))] shadow-sm',
        className
      )}
    >
      {/* Title */}
      <p className="text-sm text-[rgb(var(--fg-muted))] mb-3">{title}</p>

      {/* Stats Grid */}
      <div className={cn('grid gap-x-3 gap-y-2', gridClasses[columns])}>
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="flex items-center gap-2">
              <Icon className={cn('w-4 h-4', getIconColorClass(stat.iconColor))} />
              <div>
                <p className="text-lg font-bold text-[rgb(var(--fg-default))]">
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </p>
                <p className="text-xs text-[rgb(var(--fg-muted))]">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
