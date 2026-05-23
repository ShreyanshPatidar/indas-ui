'use client'

import ReactECharts from 'echarts-for-react'
import { cn } from '@/lib/utils'

// Convert any color (hex, rgb(), rgba(), space-separated rgb()) to rgba() with given alpha (0–1).
// Hex+alpha-suffix concat (e.g. color + '40') breaks for non-hex inputs and crashes canvas gradients.
function withAlpha(color: string, alpha: number): string {
  if (!color) return 'rgba(0,0,0,' + alpha + ')'
  const trimmed = color.trim()
  if (trimmed.startsWith('#')) {
    let hex = trimmed.slice(1)
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')'
    }
  }
  const m = trimmed.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i)
  if (m) {
    return 'rgba(' + m[1] + ',' + m[2] + ',' + m[3] + ',' + alpha + ')'
  }
  return trimmed
}

export interface SparklineProps {
  /** Data points */
  data: number[]
  /** Chart type */
  type?: 'line' | 'area' | 'bar'
  /** Height in pixels */
  height?: number
  /** Width (can be percentage or pixels) */
  width?: number | string
  /** Line/bar color */
  color?: string
  /** Area fill color (for area type) */
  fillColor?: string
  /** Show end dot */
  showEndDot?: boolean
  /** Show min/max markers */
  showMinMax?: boolean
  /** Smooth line */
  smooth?: boolean
  /** Reference line value */
  referenceLine?: number
  className?: string
}

/**
 * Sparkline - Compact inline trend visualization
 * Great for: KPI cards, table cells, compact trend indicators
 */
export function Sparkline({
  data,
  type = 'line',
  height = 40,
  width = '100%',
  color = '#5470c6',
  fillColor,
  showEndDot = true,
  showMinMax = false,
  smooth = true,
  referenceLine,
  className
}: SparklineProps) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const lastValue = data[data.length - 1]

  // Determine trend for color coding
  const firstValue = data[0]
  const isUpward = lastValue > firstValue
  const trendColor = isUpward ? '#52c41a' : lastValue < firstValue ? '#f5222d' : color

  const markPointData: any[] = []
  if (showMinMax) {
    const minIndex = data.indexOf(min)
    const maxIndex = data.indexOf(max)
    markPointData.push(
      { coord: [minIndex, min], symbol: 'circle', symbolSize: 6, itemStyle: { color: '#ee6666' } },
      { coord: [maxIndex, max], symbol: 'circle', symbolSize: 6, itemStyle: { color: '#91cc75' } }
    )
  }
  if (showEndDot) {
    markPointData.push({
      coord: [data.length - 1, lastValue],
      symbol: 'circle',
      symbolSize: 6,
      itemStyle: { color: trendColor }
    })
  }

  const series: any = {
    type: type === 'bar' ? 'bar' : 'line',
    data: data,
    symbol: 'none',
    smooth: smooth,
    lineStyle: type !== 'bar' ? { color: color, width: 1.5 } : undefined,
    itemStyle: { color: color },
    areaStyle: type === 'area' ? {
      color: {
        type: 'linear',
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: fillColor ? withAlpha(fillColor, 1) : withAlpha(color, 0.25) },
          { offset: 1, color: fillColor ? withAlpha(fillColor, 0.06) : 'transparent' }
        ]
      }
    } : undefined,
    markPoint: markPointData.length > 0 ? {
      data: markPointData,
      animation: false
    } : undefined,
    markLine: referenceLine !== undefined ? {
      silent: true,
      symbol: 'none',
      lineStyle: { color: '#adb5bd', type: 'dashed', width: 1 },
      data: [{ yAxis: referenceLine }],
      label: { show: false }
    } : undefined,
    barWidth: type === 'bar' ? '60%' : undefined
  }

  const option = {
    grid: {
      top: showMinMax ? 8 : 4,
      right: showEndDot ? 8 : 4,
      bottom: 4,
      left: 4
    },
    xAxis: {
      type: 'category',
      show: false,
      boundaryGap: type === 'bar'
    },
    yAxis: {
      type: 'value',
      show: false,
      min: min - (max - min) * 0.1,
      max: max + (max - min) * 0.1
    },
    series: [series]
  }

  return (
    <div className={cn('inline-block', className)} style={{ width, height }}>
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  )
}
