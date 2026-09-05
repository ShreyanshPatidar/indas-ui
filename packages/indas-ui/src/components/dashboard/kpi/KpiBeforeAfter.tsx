'use client'

import * as React from 'react'
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface KpiBeforeAfterProps {
  /** Title of the KPI */
  title: string
  /** Before value */
  beforeValue: string | number
  /** Before label (defaults to "Before") */
  beforeLabel?: string
  /** Before sublabel (e.g., "Avg cycle time") */
  beforeSublabel?: string
  /** After value */
  afterValue: string | number
  /** After label (defaults to "After") */
  afterLabel?: string
  /** After sublabel (e.g., "Avg cycle time") */
  afterSublabel?: string
  /** Improvement percentage */
  improvement?: number
  /** Improvement label (defaults to "improvement") */
  improvementLabel?: string
  /** Whether improvement is shown as decrease (down arrow) or increase (up arrow) */
  improvementType?: 'decrease' | 'increase'
  /** Additional class names */
  className?: string
}

/**
 * KpiBeforeAfter - KPI card comparing before/after values
 *
 * Great for: Process improvements, A/B results, optimization metrics
 */
export function KpiBeforeAfter({
  title,
  beforeValue,
  beforeLabel = 'Before',
  beforeSublabel,
  afterValue,
  afterLabel = 'After',
  afterSublabel,
  improvement,
  improvementLabel = 'improvement',
  improvementType = 'decrease',
  className
}: KpiBeforeAfterProps) {
  const ImprovementIcon = improvementType === 'decrease' ? TrendingDown : TrendingUp

  return (
    <div
      className={cn(
        'bg-[rgb(var(--bg-surface))] rounded-xl p-5 border border-[rgb(var(--bd-default))] shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[rgb(var(--fg-muted))]">{title}</p>
        {improvement !== undefined && (
          <div className="text-right">
            <span className="text-lg font-bold text-[rgb(var(--color-success))]">{improvement}%</span>
            <span className="text-xs text-[rgb(var(--fg-muted))] ml-1">{improvementLabel}</span>
          </div>
        )}
      </div>

      {/* Before/After comparison */}
      <div className="flex items-center">
        {/* Before */}
        <div className="flex-1 text-center">
          <p className="text-xs text-[rgb(var(--fg-muted))] mb-1">{beforeLabel}</p>
          <p className="text-2xl font-bold text-[rgb(var(--fg-muted))]">{beforeValue}</p>
          {beforeSublabel && (
            <p className="text-xs text-[rgb(var(--fg-muted))]">{beforeSublabel}</p>
          )}
        </div>

        {/* Arrow indicator */}
        <div className="px-4">
          <div className="w-8 h-8 rounded-full bg-[rgb(var(--color-success))]/10 flex items-center justify-center">
            <ImprovementIcon className="w-4 h-4 text-[rgb(var(--color-success))]" />
          </div>
        </div>

        {/* After */}
        <div className="flex-1 text-center">
          <p className="text-xs text-[rgb(var(--fg-muted))] mb-1">{afterLabel}</p>
          <p className="text-2xl font-bold text-[rgb(var(--color-success))]">{afterValue}</p>
          {afterSublabel && (
            <p className="text-xs text-[rgb(var(--fg-muted))]">{afterSublabel}</p>
          )}
        </div>
      </div>
    </div>
  )
}
