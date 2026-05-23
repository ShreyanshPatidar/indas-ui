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
  stacked?: boolean
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
  stacked = false,
  className
}: BarChartProps) {
  const categoryData = data.map(item => item[xKey])

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e9ecef',
      borderWidth: 1,
      textStyle: {
        color: '#344767',
        fontSize: 12
      },
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: showLegend ? {
      bottom: 0,
      left: 'center',
      itemWidth: 12,
      itemHeight: 12,
      textStyle: {
        fontSize: 12,
        color: '#6c757d'
      }
    } : undefined,
    grid: {
      top: 20,
      right: 20,
      bottom: showLegend ? 40 : 20,
      left: 40,
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
        stack: stacked ? 'total' : undefined,
        barMaxWidth: 40,
        barGap: '10%',
        itemStyle: {
          color: color,
          borderRadius: stacked ? 0 : [4, 4, 0, 0]
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
