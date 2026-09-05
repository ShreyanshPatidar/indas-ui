'use client'

import ReactECharts from 'echarts-for-react'
import { cn } from '@/lib/utils'

// Convert any color (hex, rgb(), rgba(), space-separated rgb()) to rgba() with given alpha (0–1).
// Hex+alpha-suffix concat (e.g. color + 'cc') breaks for non-hex inputs and crashes canvas gradients.
function withAlpha(color: string, alpha: number): string {
  if (!color) return 'rgba(0,0,0,' + alpha + ')'
  const trimmed = color.trim()
  // Hex #rgb or #rrggbb
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
  // rgb()/rgba() — handle both comma and space syntax
  const m = trimmed.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i)
  if (m) {
    return 'rgba(' + m[1] + ',' + m[2] + ',' + m[3] + ',' + alpha + ')'
  }
  // Fallback — let canvas try to parse it (named colors, etc.)
  return trimmed
}

export interface AreaChartDataItem {
  [key: string]: string | number
}

export interface AreaChartSeries {
  key: string
  name: string
  color?: string
  /** Render as a plain line (no area fill). Default: filled area. */
  line?: boolean
  /** Render as bars instead of a line/area. */
  bar?: boolean
  /** Plot against the secondary (right) Y-axis — use when series have different scales. */
  secondaryAxis?: boolean
}

export interface AreaChartProps {
  data: AreaChartDataItem[]
  xKey: string
  series: AreaChartSeries[]
  height?: number
  showLegend?: boolean
  showGrid?: boolean
  smooth?: boolean
  className?: string
}

/**
 * AreaChart - ECharts Area Chart component
 */
export function AreaChart({
  data,
  xKey,
  series,
  height = 300,
  showLegend = true,
  showGrid = true,
  smooth = true,
  className
}: AreaChartProps) {
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e9ecef',
      borderWidth: 1,
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
      type: 'category',
      boundaryGap: series.some(s => s.bar),
      data: data.map(item => item[xKey]),
      axisLine: { lineStyle: { color: '#dee2e6' } },
      axisLabel: { color: '#6c757d', fontSize: 11 },
      axisTick: { show: false }
    },
    yAxis: series.some(s => s.secondaryAxis)
      ? [
          { type: 'value', axisLine: { show: false }, axisLabel: { color: '#6c757d', fontSize: 11 }, splitLine: { show: showGrid, lineStyle: { color: '#f0f0f0', type: 'dashed' } } },
          { type: 'value', axisLine: { show: false }, axisLabel: { color: '#6c757d', fontSize: 11 }, splitLine: { show: false } },
        ]
      : {
          type: 'value',
          axisLine: { show: false },
          axisLabel: { color: '#6c757d', fontSize: 11 },
          splitLine: { show: showGrid, lineStyle: { color: '#f0f0f0', type: 'dashed' } }
        },
    series: series.map((s, index) => {
      const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de']
      const color = s.color || colors[index % colors.length]

      if (s.bar) {
        return {
          name: s.name,
          type: 'bar',
          barMaxWidth: 36,
          yAxisIndex: s.secondaryAxis ? 1 : 0,
          itemStyle: { color: color, borderRadius: [4, 4, 0, 0] },
          data: data.map(item => item[s.key])
        }
      }

      return {
        name: s.name,
        type: 'line',
        smooth: smooth,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        yAxisIndex: s.secondaryAxis ? 1 : 0,
        lineStyle: { width: 2, color: color },
        ...(s.line ? {} : {
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: withAlpha(color, 0.8) },
                { offset: 1, color: withAlpha(color, 0.06) }
              ]
            }
          }
        }),
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
