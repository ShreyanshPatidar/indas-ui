'use client'

import * as React from 'react'
import { TrendingUp, TrendingDown, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface RatingBreakdown {
  /** Star rating (1-5) */
  stars: number
  /** Number of ratings */
  count: number
  /** Percentage of total */
  percentage: number
}

export interface KpiRatingProps {
  /** Title of the KPI */
  title: string
  /** Rating score (e.g., 4.8) */
  score: number
  /** Maximum score (defaults to 5) */
  maxScore?: number
  /** Total number of reviews */
  reviewCount?: number
  /** Status badge text (e.g., "Excellent", "Good") */
  status?: string
  /** Status type for coloring */
  statusType?: 'success' | 'warning' | 'error'
  /** Change from previous period */
  change?: number
  /** Period label (e.g., "from last month") */
  changeLabel?: string
  /** Footer period text (e.g., "Last 30 days") */
  periodLabel?: string
  /** Tooltip info */
  tooltip?: {
    /** Formula explanation */
    formula?: string
    /** Description */
    description?: string
    /** Rating breakdown data */
    breakdown?: RatingBreakdown[]
  }
  /** Additional class names */
  className?: string
}

/**
 * KpiRating - KPI card with star rating display
 *
 * Great for: Customer satisfaction, NPS scores, product ratings
 */
export function KpiRating({
  title,
  score,
  maxScore = 5,
  reviewCount,
  status,
  statusType = 'success',
  change,
  changeLabel = 'from last month',
  periodLabel,
  tooltip,
  className
}: KpiRatingProps) {
  const filledStars = Math.floor(score)
  const hasPartialStar = score % 1 >= 0.5

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

  const getBreakdownBarColor = (pct: number) => {
    if (pct >= 50) return 'bg-[rgb(var(--color-success))]'
    if (pct >= 20) return 'bg-[rgb(var(--color-warning))]'
    return 'bg-[rgb(var(--color-error))]'
  }

  return (
    <div
      className={cn(
        'bg-[rgb(var(--bg-surface))] rounded-xl p-5 border border-[rgb(var(--bd-default))] shadow-sm relative group',
        className
      )}
    >
      {/* Header with title and info icon */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-[rgb(var(--fg-muted))]">{title}</p>
        {tooltip && (
          <div className="relative">
            <div className="w-5 h-5 rounded-full bg-[rgb(var(--bg-subtle))] flex items-center justify-center cursor-help hover:bg-[rgb(var(--color-primary))]/10 transition-colors peer">
              <Info className="w-3 h-3 text-[rgb(var(--fg-muted))]" />
            </div>
            {/* Tooltip */}
            <div className="absolute right-0 top-7 w-72 p-3 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--bd-default))] rounded-lg shadow-lg opacity-0 invisible peer-hover:opacity-100 peer-hover:visible transition-all z-10">
              {tooltip.formula && (
                <>
                  <p className="text-xs font-medium text-[rgb(var(--fg-default))] mb-2">Formula:</p>
                  <div className="bg-[rgb(var(--bg-subtle))] rounded p-2 mb-3">
                    <p className="text-[10px] font-mono text-[rgb(var(--fg-muted))]">{tooltip.formula}</p>
                  </div>
                </>
              )}
              {tooltip.description && (
                <p className="text-[10px] text-[rgb(var(--fg-muted))] mb-3">{tooltip.description}</p>
              )}
              {tooltip.breakdown && tooltip.breakdown.length > 0 && (
                <div className="border-t border-[rgb(var(--bd-default))] pt-3">
                  <p className="text-xs font-medium text-[rgb(var(--fg-default))] mb-2">Rating Breakdown:</p>
                  <div className="space-y-1.5">
                    {tooltip.breakdown.map((item) => (
                      <div key={item.stars} className="flex items-center gap-2">
                        <span className="text-[10px] text-[rgb(var(--fg-muted))] w-3">{item.stars}</span>
                        <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <div className="flex-1 h-1.5 bg-[rgb(var(--bg-subtle))] rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', getBreakdownBarColor(item.percentage))}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-[rgb(var(--fg-muted))] w-10 text-right">
                          {item.count.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-[rgb(var(--fg-muted))] w-6 text-right">
                          {item.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main score with stars */}
      <div className="flex items-center gap-3">
        <div>
          <p className="text-4xl font-bold text-[rgb(var(--fg-default))]">{score}</p>
        </div>
        <div>
          <div className="flex gap-0.5">
            {Array.from({ length: maxScore }, (_, i) => {
              const starIndex = i + 1
              const isFilled = starIndex <= filledStars || (starIndex === filledStars + 1 && hasPartialStar)
              return (
                <svg
                  key={i}
                  className={cn(
                    'w-5 h-5 transition-transform hover:scale-110 cursor-pointer',
                    isFilled ? 'text-yellow-400' : 'text-yellow-400/30'
                  )}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )
            })}
          </div>
          {reviewCount !== undefined && (
            <p className="text-xs text-[rgb(var(--fg-muted))] mt-1">
              {reviewCount.toLocaleString()} reviews
            </p>
          )}
        </div>
        {status && (
          <div className="ml-auto text-right">
            <span className={cn('text-xs px-2 py-0.5 rounded-full', getStatusStyles(statusType))}>
              {status}
            </span>
          </div>
        )}
      </div>

      {/* Footer with trend and period */}
      {(change !== undefined || periodLabel) && (
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-[rgb(var(--bd-default))]">
          {change !== undefined && (
            <div className="flex items-center gap-1">
              {change > 0 ? (
                <TrendingUp className="w-3 h-3 text-[rgb(var(--color-success))]" />
              ) : change < 0 ? (
                <TrendingDown className="w-3 h-3 text-[rgb(var(--color-error))]" />
              ) : null}
              <span className={cn(
                'text-xs',
                change > 0 ? 'text-[rgb(var(--color-success))]' : change < 0 ? 'text-[rgb(var(--color-error))]' : 'text-[rgb(var(--fg-muted))]'
              )}>
                {change > 0 ? '+' : ''}{change} {changeLabel}
              </span>
            </div>
          )}
          {periodLabel && (
            <span className="text-[10px] text-[rgb(var(--fg-muted))]">{periodLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}
