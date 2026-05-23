'use client'

import ReactECharts from 'echarts-for-react'
import { cn } from '@/lib/utils'
import { getChartTheme, getTooltipConfig, getLegendConfig, getAxisConfig, getGridConfig } from './theme'

export interface LineChartDataItem {
  [key: string]: string | number
}

export interface LineChartSeries {
  key: string
  name: string
  color?: string
  /** Line style: solid, dashed, dotted */
  lineStyle?: 'solid' | 'dashed' | 'dotted'
  /** Show data points */
  showSymbol?: boolean
}

export interface LineChartProps {
  data: LineChartDataItem[]
  xKey: string
  series: LineChartSeries[]
  height?: number
  showLegend?: boolean
  showGrid?: boolean
  /** Smooth curve or straight lines */
  smooth?: boolean
  /** Show data labels on points */
  showLabels?: boolean
  /** Y-axis minimum value */
  yMin?: number
  /** Y-axis maximum value */
  yMax?: number
  className?: string
}

/**
 * LineChart - ECharts Line Chart component (no area fill)
 */
export function LineChart({
  data,
  xKey,
  series,
  height = 300,
  showLegend = true,
  showGrid = true,
  smooth = false,
  showLabels = false,
  yMin,
  yMax,
  className
}: LineChartProps) {
  const theme = getChartTheme()
  const axisConfig = getAxisConfig()

  const option = {
    tooltip: {
      trigger: 'axis',
      ...getTooltipConfig()
    },
    legend: showLegend ? getLegendConfig('bottom') : undefined,
    grid: getGridConfig(showLegend),
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map(item => item[xKey]),
      ...axisConfig
    },
    yAxis: {
      type: 'value',
      min: yMin,
      max: yMax,
      axisLine: { show: false },
      axisLabel: axisConfig.axisLabel,
      splitLine: {
        show: showGrid,
        ...axisConfig.splitLine
      }
    },
    series: series.map((s, index) => {
      const color = s.color || theme.colors[index % theme.colors.length]

      return {
        name: s.name,
        type: 'line',
        smooth: smooth,
        symbol: s.showSymbol !== false ? 'circle' : 'none',
        symbolSize: 6,
        showSymbol: s.showSymbol !== false,
        lineStyle: {
          width: 2,
          color: color,
          type: s.lineStyle || 'solid'
        },
        itemStyle: { color },
        label: {
          show: showLabels,
          position: 'top',
          fontSize: 10,
          color: theme.textColor
        },
        emphasis: {
          focus: 'series',
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
