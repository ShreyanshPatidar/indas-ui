'use client'

import ReactECharts from 'echarts-for-react'
import { cn } from '@/lib/utils'

export interface ParetoChartDataItem {
  name: string
  value: number
}

export interface ParetoChartProps {
  data: ParetoChartDataItem[]
  height?: number
  showLegend?: boolean
  /** Bar color */
  barColor?: string
  /** Line color for cumulative percentage */
  lineColor?: string
  /** Y-axis label for values */
  valueAxisName?: string
  className?: string
}

/**
 * ParetoChart - Combined bar and line chart showing values and cumulative percentage
 * Used for identifying the "vital few" from the "trivial many" (80/20 rule)
 */
export function ParetoChart({
  data,
  height = 300,
  showLegend = true,
  barColor = '#5470c6',
  lineColor = '#ee6666',
  valueAxisName,
  className
}: ParetoChartProps) {
  // Sort data descending by value
  const sortedData = [...data].sort((a, b) => b.value - a.value)

  // Calculate cumulative percentage
  const total = sortedData.reduce((sum, item) => sum + item.value, 0)
  let cumulative = 0
  const cumulativeData = sortedData.map(item => {
    cumulative += item.value
    return Math.round((cumulative / total) * 100)
  })

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e9ecef',
      borderWidth: 1,
      textStyle: { color: '#344767', fontSize: 12 },
      axisPointer: { type: 'cross' },
      formatter: (params: any) => {
        const bar = params.find((p: any) => p.seriesType === 'bar')
        const line = params.find((p: any) => p.seriesType === 'line')
        return `${bar?.name}<br/>
          Value: ${bar?.value?.toLocaleString()}<br/>
          Cumulative: ${line?.value}%`
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
      top: 40,
      right: 50,
      bottom: showLegend ? 50 : 30,
      left: 50,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: sortedData.map(d => d.name),
      axisLine: { lineStyle: { color: '#dee2e6' } },
      axisLabel: { color: '#6c757d', fontSize: 11, rotate: sortedData.length > 6 ? 30 : 0 },
      axisTick: { show: false }
    },
    yAxis: [
      {
        type: 'value',
        name: valueAxisName,
        nameTextStyle: { color: '#6c757d', fontSize: 11 },
        axisLine: { show: false },
        axisLabel: { color: '#6c757d', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } }
      },
      {
        type: 'value',
        name: '%',
        min: 0,
        max: 100,
        nameTextStyle: { color: '#6c757d', fontSize: 11 },
        axisLine: { show: false },
        axisLabel: { color: '#6c757d', fontSize: 11, formatter: '{value}%' },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: 'Value',
        type: 'bar',
        data: sortedData.map(d => d.value),
        barMaxWidth: 50,
        itemStyle: { color: barColor, borderRadius: [4, 4, 0, 0] }
      },
      {
        name: 'Cumulative %',
        type: 'line',
        yAxisIndex: 1,
        data: cumulativeData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2, color: lineColor },
        itemStyle: { color: lineColor },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: '#faad14', type: 'dashed' },
          data: [{ yAxis: 80, label: { formatter: '80%', position: 'end' } }]
        }
      }
    ]
  }

  return (
    <div className={cn('w-full', className)}>
      <ReactECharts option={option} style={{ height, width: '100%' }} opts={{ renderer: 'canvas' }} />
    </div>
  )
}
