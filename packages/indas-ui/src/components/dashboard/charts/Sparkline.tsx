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
  /** Optional x-axis category labels (e.g. months) — used in the hover tooltip; rendered on the axis only when showAxis is true */
  labels?: string[]
  /** Render the x-axis labels below the trend */
  showAxis?: boolean
  /** Show hover tooltip with the value (and label) at each point */
  showTooltip?: boolean
  /** Optional value prefix/suffix for the tooltip (e.g. '₹', '%') */
  valuePrefix?: string
  valueSuffix?: string
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
  labels,
  showAxis = false,
  showTooltip = false,
  valuePrefix = '',
  valueSuffix = '',
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

  const hasLabels = !!labels && labels.length > 0
  const showAxisLabels = hasLabels && showAxis

  const option = {
    tooltip: showTooltip ? {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: '#e9ecef',
      borderWidth: 1,
      borderRadius: 8,
      padding: [6, 10],
      extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.12);',
      textStyle: { color: '#344767', fontSize: 12 },
      axisPointer: { type: 'line', lineStyle: { color: '#cbd5e1', width: 1 } },
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params
        const cat = hasLabels && p.axisValue ? `${p.axisValue}<br/>` : ''
        return `${cat}<strong>${valuePrefix}${Number(p.value).toLocaleString()}${valueSuffix}</strong>`
      }
    } : undefined,
    grid: {
      top: showMinMax ? 8 : 4,
      right: showEndDot ? 8 : 4,
      bottom: showAxisLabels ? 20 : 4,
      left: 4,
      containLabel: showAxisLabels
    },
    xAxis: {
      type: 'category',
      data: hasLabels ? labels : undefined,
      show: showAxisLabels,
      boundaryGap: type === 'bar',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: showAxisLabels ? { color: '#94a3b8', fontSize: 10, margin: 6, interval: 0, hideOverlap: true } : { show: false }
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
