'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ChartCardProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  headerAction?: React.ReactNode
}

/**
 * ChartCard - Container for chart components with title and description
 */
export function ChartCard({
  title,
  description,
  children,
  className,
  headerAction
}: ChartCardProps) {
  return (
    <div
      className={cn(
        'bg-[rgb(var(--bg-surface))] rounded-xl shadow-sm border border-[rgb(var(--bd-default))]',
        'p-4 md:p-5',
        className
      )}
    >
      {(title || description || headerAction) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-[rgb(var(--fg-default))]">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-[rgb(var(--fg-muted))] mt-0.5">
                {description}
              </p>
            )}
          </div>
          {headerAction && (
            <div className="flex-shrink-0">
              {headerAction}
            </div>
          )}
        </div>
      )}
      <div className="w-full">
        {children}
      </div>
    </div>
  )
}
