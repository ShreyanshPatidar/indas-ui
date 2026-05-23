'use client'

import ReactECharts from 'echarts-for-react'
import { cn } from '@/lib/utils'

export interface WaterfallDataItem {
  /** Category/step name */
  name: string
  /** Value (positive = increase, negative = decrease) */
  value: number
  /** Mark as total/subtotal (shows cumulative value) */
  isTotal?: boolean
}

export interface WaterfallChartProps {
  data: WaterfallDataItem[]
  height?: number
  /** Color for positive values */
  increaseColor?: string
  /** Color for negative values */
  decreaseColor?: string
  /** Color for total bars */
  totalColor?: string
  /** Show values on bars */
  showValues?: boolean
  /** Horizontal orientation */
  horizontal?: boolean
  /** Y-axis label */
  yAxisName?: string
  className?: string
}

/**
 * WaterfallChart - Cumulative effect visualization
 * Great for: Profit/loss analysis, cost breakdown, variance analysis
 */
export function WaterfallChart({
  data,
  height = 300,
  increaseColor = '#91cc75',
  decreaseColor = '#ee6666',
  totalColor = '#5470c6',
  showValues = true,
  horizontal = false,
  yAxisName,
  className
}: WaterfallChartProps) {
  // Calculate cumulative values and build stacked bar data
  let cumulative = 0
  const baseData: (number | string)[] = []
  const increaseData: (number | string)[] = []
  const decreaseData: (number | string)[] = []
  const totalData: (number | string)[] = []

  data.forEach((item) => {
    if (item.isTotal) {
      // Total bar shows full height from 0
      baseData.push(0)
      increaseData.push('-')
      decreaseData.push('-')
      totalData.push(cumulative)
    } else if (item.value >= 0) {
      // Positive value
      baseData.push(cumulative)
      increaseData.push(item.value)
      decreaseData.push('-')
      totalData.push('-')
      cumulative += item.value
    } else {
      // Negative value
      cumulative += item.value
      baseData.push(cumulative)
      increaseData.push('-')
      decreaseData.push(Math.abs(item.value))
      totalData.push('-')
    }
  })

  const categoryAxis = {
    type: 'category',
    data: data.map(d => d.name),
    axisLine: { lineStyle: { color: '#dee2e6' } },
    axisLabel: {
      color: '#6c757d',
      fontSize: 11,
      rotate: horizontal ? 0 : (data.length > 6 ? 45 : 0),
      interval: 0
    },
    axisTick: { show: false }
  }

  const valueAxis = {
    type: 'value',
    name: yAxisName,
    nameTextStyle: { color: '#6c757d', fontSize: 11 },
    axisLine: { show: false },
    axisLabel: { color: '#6c757d', fontSize: 11 },
    splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } }
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e9ecef',
      borderWidth: 1,
      textStyle: { color: '#344767', fontSize: 12 },
      formatter: (params: any) => {
        const index = params[0]?.dataIndex
        if (index === undefined) return ''
        const item = data[index]
        const displayValue = item.isTotal ? cumulative : item.value
        const sign = item.isTotal ? '' : (item.value >= 0 ? '+' : '')
        return `<strong>${item.name}</strong><br/>Value: ${sign}${displayValue?.toLocaleString()}`
      }
    },
    grid: {
      top: 30,
      right: 20,
      bottom: data.length > 6 ? 60 : 30,
      left: 60,
      containLabel: true
    },
    xAxis: horizontal ? valueAxis : categoryAxis,
    yAxis: horizontal ? categoryAxis : valueAxis,
    series: [
      // Transparent base (for stacking)
      {
        name: 'Base',
        type: 'bar',
        stack: 'waterfall',
        silent: true,
        itemStyle: {
          borderColor: 'transparent',
          color: 'transparent'
        },
        emphasis: { itemStyle: { borderColor: 'transparent', color: 'transparent' } },
        data: baseData
      },
      // Increase bars
      {
        name: 'Increase',
        type: 'bar',
        stack: 'waterfall',
        itemStyle: { color: increaseColor, borderRadius: [4, 4, 0, 0] },
        label: showValues ? {
          show: true,
          position: 'top',
          formatter: (params: any) => params.value !== '-' ? `+${params.value?.toLocaleString()}` : '',
          color: '#6c757d',
          fontSize: 10
        } : undefined,
        data: increaseData
      },
      // Decrease bars
      {
        name: 'Decrease',
        type: 'bar',
        stack: 'waterfall',
        itemStyle: { color: decreaseColor, borderRadius: [4, 4, 0, 0] },
        label: showValues ? {
          show: true,
          position: 'top',
          formatter: (params: any) => {
            if (params.value === '-') return ''
            const item = data[params.dataIndex]
            return item.value?.toLocaleString()
          },
          color: '#6c757d',
          fontSize: 10
        } : undefined,
        data: decreaseData
      },
      // Total bars
      {
        name: 'Total',
        type: 'bar',
        stack: 'waterfall',
        itemStyle: { color: totalColor, borderRadius: [4, 4, 0, 0] },
        label: showValues ? {
          show: true,
          position: 'top',
          formatter: (params: any) => params.value !== '-' ? params.value?.toLocaleString() : '',
          color: '#6c757d',
          fontSize: 10
        } : undefined,
        data: totalData
      }
    ]
  }

  return (
    <div className={cn('w-full', className)}>
      <ReactECharts option={option} style={{ height, width: '100%' }} opts={{ renderer: 'canvas' }} />
    </div>
  )
}
