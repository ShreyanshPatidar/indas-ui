'use client'

import ReactECharts from 'echarts-for-react'
import { cn } from '@/lib/utils'

export interface BarChartDataItem {
  [key: string]: string | number
}

export interface BarChartSeries {
  key: string
  name: string
  color?: string
}

export interface BarChartProps {
  data: BarChartDataItem[]
  xKey: string
  series: BarChartSeries[]
  height?: number
  showLegend?: boolean
  showGrid?: boolean
  horizontal?: boolean
  /**
   * Bullet mode: with `horizontal`, supply a data key holding each row's target.
   * Renders a KPI-vs-target bullet (track + actual fill + target marker + achievement %).
   */
  targetKey?: string
  className?: string
}

/**
 * BarChart - ECharts Bar Chart component
 */
export function BarChart({
  data,
  xKey,
  series,
  height = 300,
  showLegend = true,
  showGrid = true,
  horizontal = false,
  targetKey,
  className
}: BarChartProps) {
  // Bullet mode: horizontal KPI-vs-target rows (CSS-rendered, not ECharts).
  if (horizontal && targetKey) {
    const actualKey = series[0]?.key
    const actualColor = series[0]?.color
    return (
      <div
        className={cn('w-full flex flex-col justify-center gap-3', className)}
        style={height ? { minHeight: height } : undefined}
      >
        {data.map((item, idx) => {
          const name = String(item[xKey])
          const actual = Number(item[actualKey]) || 0
          const target = Number(item[targetKey]) || 0
          const scaleMax = Math.max(actual, target) * 1.05 || 1
          const actualPct = Math.min((actual / scaleMax) * 100, 100)
          const targetPct = Math.min((target / scaleMax) * 100, 100)
          const achievement = target > 0 ? (actual / target) * 100 : 0
          const met = actual >= target
          const barColor = actualColor || (met ? '#10b981' : '#f59e0b')
          const barGradient = actualColor
            ? actualColor
            : met
              ? 'linear-gradient(90deg, #34d399 0%, #10b981 100%)'
              : 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)'
          return (
            <div key={`${name}-${idx}`} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-medium text-[rgb(var(--fg-default))] truncate">{name}</span>
                <span className="text-xs font-semibold tabular-nums shrink-0" style={{ color: barColor }}>
                  {achievement.toFixed(0)}%
                </span>
              </div>
              <div className="relative h-2.5 rounded-full bg-[rgb(var(--bg-subtle))] overflow-visible">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
                  style={{ width: `${actualPct}%`, background: barGradient }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1 h-4 rounded-full ring-2 ring-[rgb(var(--bg-surface))]"
                  style={{ left: `${targetPct}%`, backgroundColor: '#475569' }}
                  title={`Target: ${target.toLocaleString()}`}
                />
              </div>
              <div className="flex items-baseline justify-between gap-2 text-[0.65rem] text-[rgb(var(--fg-muted))] tabular-nums">
                <span>{actual.toLocaleString()}</span>
                <span>{`Target ${target.toLocaleString()}`}</span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const categoryData = data.map(item => item[xKey])

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: '#e9ecef',
      borderWidth: 1,
      borderRadius: 8,
      padding: [8, 12],
      extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.12);',
      textStyle: {
        color: '#344767',
        fontSize: 12
      }
    },
    legend: showLegend ? {
      top: 0,
      left: 'center',
      itemWidth: 12,
      itemHeight: 12,
      textStyle: {
        fontSize: 12,
        color: '#6c757d'
      }
    } : undefined,
    grid: {
      top: showLegend ? 36 : 12,
      right: 12,
      bottom: 4,
      left: 4,
      containLabel: true
    },
    xAxis: {
      type: horizontal ? 'value' : 'category',
      data: horizontal ? undefined : categoryData,
      axisLine: { lineStyle: { color: '#dee2e6' } },
      axisLabel: { color: '#6c757d', fontSize: 11 },
      axisTick: { show: false },
      splitLine: horizontal && showGrid ? {
        lineStyle: { color: '#f0f0f0', type: 'dashed' }
      } : { show: false }
    },
    yAxis: {
      type: horizontal ? 'category' : 'value',
      data: horizontal ? categoryData : undefined,
      axisLine: { show: false },
      axisLabel: { color: '#6c757d', fontSize: 11 },
      splitLine: !horizontal && showGrid ? {
        lineStyle: { color: '#f0f0f0', type: 'dashed' }
      } : { show: false }
    },
    series: series.map((s, index) => {
      const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de']
      const color = s.color || colors[index % colors.length]

      return {
        name: s.name,
        type: 'bar',
        barMaxWidth: 40,
        barGap: '10%',
        itemStyle: {
          color: color,
          borderRadius: [4, 4, 0, 0]
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.2)'
          }
        },
        data: data.map(item => item[s.key])
      }
    })
  }

  return (
    <div className={cn('w-full', className)}>
      <ReactECharts
        option={option}
        style={{ height, width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  )
}
