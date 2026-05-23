'use client'

import ReactECharts from 'echarts-for-react'
import { cn } from '@/lib/utils'

export interface BulletChartDataItem {
  /** Category name */
  name: string
  /** Actual value */
  actual: number
  /** Target value */
  target: number
  /** Range thresholds [poor, satisfactory, good] */
  ranges?: [number, number, number]
}

export interface BulletChartProps {
  data: BulletChartDataItem[]
  height?: number
  /** Actual bar color */
  actualColor?: string
  /** Target marker color */
  targetColor?: string
  /** Range colors [poor, satisfactory, good] */
  rangeColors?: [string, string, string]
  /** Show values on bars */
  showValues?: boolean
  /** Horizontal orientation (default) */
  horizontal?: boolean
  className?: string
}

/**
 * BulletChart - Compact KPI vs Target visualization
 * Great for: KPI dashboards, performance metrics, goal tracking
 * Alternative to gauge charts when space is limited
 */
export function BulletChart({
  data,
  height,
  actualColor = '#5470c6',
  targetColor = '#344767',
  rangeColors = ['#f0f0f0', '#e0e0e0', '#d0d0d0'],
  showValues = true,
  horizontal = true,
  className
}: BulletChartProps) {
  // Calculate max value for axis
  const allValues = data.flatMap(d => [d.actual, d.target, ...(d.ranges || [])])
  const maxValue = Math.max(...allValues) * 1.1

  // Calculate default height based on data length if not provided
  const chartHeight = height || Math.max(150, data.length * 60 + 40)

  // Build series for ranges, actual, and target
  const series: any[] = []

  // Background ranges (if provided)
  if (data.some(d => d.ranges)) {
    // Good range (full width)
    series.push({
      type: 'bar',
      silent: true,
      barWidth: 24,
      barGap: '-100%',
      data: data.map(d => d.ranges?.[2] || maxValue),
      itemStyle: { color: rangeColors[2], borderRadius: 2 },
      z: 1
    })
    // Satisfactory range
    series.push({
      type: 'bar',
      silent: true,
      barWidth: 24,
      barGap: '-100%',
      data: data.map(d => d.ranges?.[1] || maxValue * 0.7),
      itemStyle: { color: rangeColors[1], borderRadius: 2 },
      z: 2
    })
    // Poor range
    series.push({
      type: 'bar',
      silent: true,
      barWidth: 24,
      barGap: '-100%',
      data: data.map(d => d.ranges?.[0] || maxValue * 0.4),
      itemStyle: { color: rangeColors[0], borderRadius: 2 },
      z: 3
    })
  }

  // Actual value bar
  series.push({
    name: 'Actual',
    type: 'bar',
    barWidth: 10,
    barGap: '-100%',
    data: data.map(d => d.actual),
    itemStyle: { color: actualColor, borderRadius: 2 },
    label: showValues ? {
      show: true,
      position: horizontal ? 'right' : 'top',
      formatter: '{c}',
      color: '#6c757d',
      fontSize: 11
    } : undefined,
    z: 10
  })

  // Target marker
  series.push({
    name: 'Target',
    type: 'scatter',
    symbol: horizontal ? 'rect' : 'rect',
    symbolSize: horizontal ? [3, 20] : [20, 3],
    data: data.map(d => d.target),
    itemStyle: { color: targetColor },
    z: 11
  })

  const categoryAxis = {
    type: 'category',
    data: data.map(d => d.name),
    axisLine: { show: false },
    axisLabel: { color: '#344767', fontSize: 12, fontWeight: 500 },
    axisTick: { show: false }
  }

  const valueAxis = {
    type: 'value',
    max: maxValue,
    axisLine: { show: false },
    axisLabel: { show: false },
    splitLine: { show: false }
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'none' },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e9ecef',
      borderWidth: 1,
      textStyle: { color: '#344767', fontSize: 12 },
      formatter: (params: any) => {
        const index = params[0]?.dataIndex
        if (index === undefined) return ''
        const item = data[index]
        const percent = ((item.actual / item.target) * 100).toFixed(1)
        return `<strong>${item.name}</strong><br/>
          Actual: ${item.actual.toLocaleString()}<br/>
          Target: ${item.target.toLocaleString()}<br/>
          Achievement: ${percent}%`
      }
    },
    grid: {
      top: 10,
      right: showValues ? 50 : 20,
      bottom: 10,
      left: 10,
      containLabel: true
    },
    xAxis: horizontal ? valueAxis : categoryAxis,
    yAxis: horizontal ? { ...categoryAxis, inverse: true } : valueAxis,
    series: series
  }

  return (
    <div className={cn('w-full', className)}>
      <ReactECharts option={option} style={{ height: chartHeight, width: '100%' }} opts={{ renderer: 'canvas' }} />
    </div>
  )
}
