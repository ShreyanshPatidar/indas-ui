'use client'

import ReactECharts from 'echarts-for-react'
import { cn } from '@/lib/utils'

export interface HistogramChartProps {
  /** Raw data values to create histogram from */
  data: number[]
  /** Number of bins (default: auto-calculated) */
  bins?: number
  height?: number
  showLegend?: boolean
  /** Bar color */
  color?: string
  /** X-axis label */
  xAxisName?: string
  /** Y-axis label */
  yAxisName?: string
  /** Show normal distribution curve overlay */
  showNormalCurve?: boolean
  className?: string
}

/**
 * HistogramChart - Frequency distribution chart
 * Automatically bins data and shows distribution
 */
export function HistogramChart({
  data,
  bins,
  height = 300,
  showLegend = false,
  color = '#5470c6',
  xAxisName,
  yAxisName = 'Frequency',
  showNormalCurve = false,
  className
}: HistogramChartProps) {
  // Calculate histogram bins
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min

  // Auto-calculate bins using Sturges' formula if not provided
  const numBins = bins || Math.ceil(Math.log2(data.length) + 1)
  const binWidth = range / numBins

  // Create bins
  const binData: { range: string; count: number; start: number; end: number }[] = []
  for (let i = 0; i < numBins; i++) {
    const start = min + i * binWidth
    const end = start + binWidth
    const count = data.filter(v => v >= start && (i === numBins - 1 ? v <= end : v < end)).length
    binData.push({
      range: `${start.toFixed(1)}-${end.toFixed(1)}`,
      count,
      start,
      end
    })
  }

  // Calculate normal curve if needed
  const mean = data.reduce((a, b) => a + b, 0) / data.length
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
  const stdDev = Math.sqrt(variance)
  const maxCount = Math.max(...binData.map(b => b.count))

  const normalCurveData = showNormalCurve
    ? Array.from({ length: 50 }, (_, i) => {
        const x = min + (i / 49) * range
        const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) *
          Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2))
        // Scale to match histogram height
        const scaledY = y * data.length * binWidth
        return [x, scaledY]
      })
    : []

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e9ecef',
      borderWidth: 1,
      textStyle: { color: '#344767', fontSize: 12 },
      formatter: (params: any) => {
        const bar = params.find((p: any) => p.seriesType === 'bar')
        if (bar) {
          const bin = binData[bar.dataIndex]
          return `Range: ${bin.range}<br/>Count: ${bin.count}`
        }
        return ''
      }
    },
    legend: showLegend ? {
      bottom: 0,
      left: 'center',
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
      type: 'category',
      name: xAxisName,
      nameLocation: 'center',
      nameGap: 30,
      nameTextStyle: { color: '#6c757d', fontSize: 11 },
      data: binData.map(b => b.range),
      axisLine: { lineStyle: { color: '#dee2e6' } },
      axisLabel: { color: '#6c757d', fontSize: 10, rotate: 30 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: yAxisName,
      nameTextStyle: { color: '#6c757d', fontSize: 11 },
      axisLine: { show: false },
      axisLabel: { color: '#6c757d', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } }
    },
    series: [
      {
        name: 'Frequency',
        type: 'bar',
        data: binData.map(b => b.count),
        barWidth: '90%',
        itemStyle: {
          color: color,
          borderRadius: [2, 2, 0, 0]
        }
      },
      ...(showNormalCurve ? [{
        name: 'Normal Distribution',
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: normalCurveData,
        lineStyle: { width: 2, color: '#ee6666' }
      }] : [])
    ]
  }

  return (
    <div className={cn('w-full', className)}>
      <ReactECharts option={option} style={{ height, width: '100%' }} opts={{ renderer: 'canvas' }} />
    </div>
  )
}
