'use client'

import ReactECharts from 'echarts-for-react'
import { cn } from '@/lib/utils'

export interface BubbleChartDataItem {
  /** X-axis value */
  x: number
  /** Y-axis value */
  y: number
  /** Bubble size value */
  size: number
  /** Optional label */
  label?: string
}

export interface BubbleChartSeries {
  name: string
  data: BubbleChartDataItem[]
  color?: string
}

export interface BubbleChartProps {
  series: BubbleChartSeries[]
  height?: number
  showLegend?: boolean
  /** X-axis label */
  xAxisName?: string
  /** Y-axis label */
  yAxisName?: string
  /** Size axis label (for tooltip) */
  sizeAxisName?: string
  /** Size range [min, max] in pixels */
  sizeRange?: [number, number]
  /** Bubble opacity (0-1) */
  opacity?: number
  className?: string
}

/**
 * BubbleChart - Three-dimensional scatter plot with size encoding
 * Shows relationship between X, Y, and Size dimensions
 */
export function BubbleChart({
  series,
  height = 300,
  showLegend = true,
  xAxisName,
  yAxisName,
  sizeAxisName = 'Size',
  sizeRange = [10, 60],
  opacity = 0.7,
  className
}: BubbleChartProps) {
  const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272']

  // Calculate global min/max for size scaling
  const allSizes = series.flatMap(s => s.data.map(d => d.size))
  const minSize = Math.min(...allSizes)
  const maxSize = Math.max(...allSizes)
  const sizeScale = (size: number) => {
    if (maxSize === minSize) return (sizeRange[0] + sizeRange[1]) / 2
    const normalized = (size - minSize) / (maxSize - minSize)
    return sizeRange[0] + normalized * (sizeRange[1] - sizeRange[0])
  }

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e9ecef',
      borderWidth: 1,
      textStyle: { color: '#344767', fontSize: 12 },
      formatter: (params: any) => {
        const d = params.data
        let tip = `<strong>${params.seriesName}</strong><br/>`
        if (d.label) tip += `${d.label}<br/>`
        tip += `${xAxisName || 'X'}: ${d.value[0]}<br/>`
        tip += `${yAxisName || 'Y'}: ${d.value[1]}<br/>`
        tip += `${sizeAxisName}: ${d.size}`
        return tip
      }
    },
    legend: showLegend ? {
      bottom: 0,
      left: 'center',
      itemWidth: 12,
      itemHeight: 12,
      textStyle: { fontSize: 12, color: '#6c757d' }
    } : undefined,
    grid: {
      top: 30,
      right: 30,
      bottom: showLegend ? 50 : 30,
      left: 50,
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: xAxisName,
      nameLocation: 'center',
      nameGap: 30,
      nameTextStyle: { color: '#6c757d', fontSize: 11 },
      axisLine: { lineStyle: { color: '#dee2e6' } },
      axisLabel: { color: '#6c757d', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } }
    },
    yAxis: {
      type: 'value',
      name: yAxisName,
      nameLocation: 'center',
      nameGap: 40,
      nameTextStyle: { color: '#6c757d', fontSize: 11 },
      axisLine: { show: false },
      axisLabel: { color: '#6c757d', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } }
    },
    series: series.map((s, index) => ({
      name: s.name,
      type: 'scatter',
      symbolSize: (data: any) => sizeScale(data[2]),
      itemStyle: {
        color: s.color || colors[index % colors.length],
        opacity: opacity
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.3)',
          opacity: 1
        }
      },
      data: s.data.map(d => ({
        value: [d.x, d.y, d.size],
        size: d.size,
        label: d.label
      }))
    }))
  }

  return (
    <div className={cn('w-full', className)}>
      <ReactECharts option={option} style={{ height, width: '100%' }} opts={{ renderer: 'canvas' }} />
    </div>
  )
}
