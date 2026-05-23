'use client'

import ReactECharts from 'echarts-for-react'
import { cn } from '@/lib/utils'

export interface HeatmapChartDataItem {
  /** X-axis index or value */
  x: number | string
  /** Y-axis index or value */
  y: number | string
  /** Heat value */
  value: number
}

export interface HeatmapChartProps {
  data: HeatmapChartDataItem[]
  /** X-axis categories */
  xCategories: string[]
  /** Y-axis categories */
  yCategories: string[]
  height?: number
  /** Show value labels in cells */
  showLabels?: boolean
  /** Color range [min, max] */
  colorRange?: [string, string]
  /** Min value for color scale */
  minValue?: number
  /** Max value for color scale */
  maxValue?: number
  /** Show visual map legend */
  showVisualMap?: boolean
  className?: string
}

/**
 * HeatmapChart - ECharts Heatmap for time/category based data visualization
 */
export function HeatmapChart({
  data,
  xCategories,
  yCategories,
  height = 300,
  showLabels = true,
  colorRange = ['#f0f9eb', '#67c23a'],
  minValue,
  maxValue,
  showVisualMap = true,
  className
}: HeatmapChartProps) {
  // Calculate min/max from data if not provided
  const values = data.map(d => d.value)
  const min = minValue ?? Math.min(...values)
  const max = maxValue ?? Math.max(...values)

  // Convert data to ECharts format [xIndex, yIndex, value]
  const echartsData = data.map(d => {
    const xIndex = typeof d.x === 'number' ? d.x : xCategories.indexOf(d.x)
    const yIndex = typeof d.y === 'number' ? d.y : yCategories.indexOf(d.y)
    return [xIndex, yIndex, d.value]
  })

  const option = {
    tooltip: {
      position: 'top',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e9ecef',
      borderWidth: 1,
      textStyle: {
        color: '#344767',
        fontSize: 12
      },
      formatter: (params: any) => {
        return `${xCategories[params.data[0]]} × ${yCategories[params.data[1]]}<br/>Value: ${params.data[2]}`
      }
    },
    grid: {
      top: 20,
      right: showVisualMap ? 80 : 20,
      bottom: 40,
      left: 60,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xCategories,
      position: 'bottom',
      axisLine: { lineStyle: { color: '#dee2e6' } },
      axisLabel: {
        color: '#6c757d',
        fontSize: 11,
        rotate: xCategories.length > 10 ? 45 : 0
      },
      axisTick: { show: false },
      splitArea: { show: false }
    },
    yAxis: {
      type: 'category',
      data: yCategories,
      axisLine: { show: false },
      axisLabel: { color: '#6c757d', fontSize: 11 },
      axisTick: { show: false },
      splitArea: { show: false }
    },
    visualMap: showVisualMap ? {
      min: min,
      max: max,
      calculable: true,
      orient: 'vertical',
      right: 10,
      top: 'center',
      itemHeight: 120,
      itemWidth: 12,
      textStyle: {
        color: '#6c757d',
        fontSize: 10
      },
      inRange: {
        color: colorRange
      }
    } : {
      show: false,
      min: min,
      max: max,
      inRange: {
        color: colorRange
      }
    },
    series: [
      {
        type: 'heatmap',
        data: echartsData,
        label: {
          show: showLabels,
          fontSize: 10,
          color: '#344767',
          formatter: (params: any) => params.data[2]
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 1,
          borderRadius: 2
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        }
      }
    ]
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
