'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

export interface FunnelChartDataItem {
  name: string
  value: number
  color?: string
}

export interface FunnelChartProps {
  data: FunnelChartDataItem[]
  height?: number
  /** Sort order of stages */
  sort?: 'ascending' | 'descending' | 'none'
  className?: string
  /** @deprecated kept for backward-compat; no longer affects rendering */
  showLegend?: boolean
  /** @deprecated kept for backward-compat; no longer affects rendering */
  showLabels?: boolean
  /** @deprecated kept for backward-compat; no longer affects rendering */
  labelPosition?: 'left' | 'right' | 'inside' | 'center'
  /** @deprecated kept for backward-compat; no longer affects rendering */
  orient?: 'vertical' | 'horizontal'
  /** @deprecated kept for backward-compat; no longer affects rendering */
  gap?: number
  /** @deprecated kept for backward-compat; only the bar style is rendered now */
  variant?: 'classic' | 'bars'
}

const FUNNEL_COLORS = ['#5470c6', '#3ba272', '#fac858', '#ee6666', '#73c0de', '#9a60b4', '#fc8452', '#91cc75']

/**
 * FunnelChart — centered, tapering stage-bar funnel for conversion/process flows.
 * Each stage shows a % badge, a width-proportional centered bar (truthful to value) with
 * name + value, and the stage-to-stage drop-off. Bars lift on hover.
 */
export function FunnelChart({ data, height = 300, sort = 'descending', className }: FunnelChartProps) {
  const [hovered, setHovered] = useState<number | null>(null)

  const rows = sort === 'ascending'
    ? [...data].sort((a, b) => a.value - b.value)
    : sort === 'descending'
      ? [...data].sort((a, b) => b.value - a.value)
      : data
  const top = rows[0]?.value || 1

  return (
    <div
      className={cn('w-full flex flex-col justify-center', className)}
      style={{ minHeight: height }}
    >
      {rows.map((item, index) => {
        const pct = (item.value / top) * 100
        const color = item.color || FUNNEL_COLORS[index % FUNNEL_COLORS.length]
        const barWidth = Math.max(pct, 16)
        const isHover = hovered === index

        return (
          <div
            key={item.name}
            className="flex items-center gap-3 py-1"
            onMouseEnter={() => setHovered(index)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Percentage badge */}
            <div
              className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-[0.7rem] font-semibold tabular-nums transition-transform"
              style={{
                backgroundColor: `${color}1f`,
                color,
                transform: isHover ? 'scale(1.08)' : 'scale(1)',
              }}
            >
              {pct.toFixed(0)}%
            </div>

            {/* Centered, width-proportional bar */}
            <div className="flex-1 min-w-0 flex justify-center">
              <div
                className="rounded-md px-3 py-2.5 flex items-baseline justify-between gap-2 transition-all duration-300"
                style={{
                  width: `${barWidth}%`,
                  background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                  transform: isHover ? 'translateY(-1px)' : 'none',
                  boxShadow: isHover ? `0 4px 14px ${color}55` : `0 1px 2px rgba(0,0,0,0.06)`,
                }}
                title={`${item.name}: ${item.value.toLocaleString()} (${pct.toFixed(1)}%)`}
              >
                <span className="text-sm font-semibold text-white truncate">{item.name}</span>
                <span className="text-xs font-medium text-white/90 tabular-nums shrink-0">
                  {item.value.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
