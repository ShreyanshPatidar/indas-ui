'use client'

import ReactECharts from 'echarts-for-react'
import { cn } from '@/lib/utils'

export interface ScatterChartDataItem {
  /** X value */
  x: number
  /** Y value */
  y: number
  /** Optional size value for bubble charts */
  size?: number
  /** Optional label */
  label?: string
}

export interface ScatterChartSeries {
  name: string
  data: ScatterChartDataItem[]
  color?: string
  /** Symbol shape */
  symbol?: 'circle' | 'rect' | 'triangle' | 'diamond' | 'pin' | 'arrow'
  /** Fixed symbol size (ignored if data has size values) */
  symbolSize?: number
}

export interface ScatterChartProps {
  series: ScatterChartSeries[]
  height?: number
  showLegend?: boolean
  showGrid?: boolean
  /** X-axis label */
  xAxisName?: string
  /** Y-axis label */
  yAxisName?: string
  /** Enable bubble mode (size based on data) */
  bubbleMode?: boolean
  /** Size range for bubble mode [min, max] */
  sizeRange?: [number, number]
  className?: string
}

/**
 * ScatterChart - ECharts Scatter/Bubble Chart for correlation data
 */
export function ScatterChart({
  series,
  height = 300,
  showLegend = true,
  showGrid = true,
  xAxisName,
  yAxisName,
  bubbleMode = false,
  sizeRange = [10, 40],
  className
}: ScatterChartProps) {
  const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4']

  // Calculate size range for bubble mode
  const allSizes = bubbleMode
    ? series.flatMap(s => s.data.map(d => d.size || 0)).filter(s => s > 0)
    : []
  const minSize = allSizes.length ? Math.min(...allSizes) : 1
  const maxSize = allSizes.length ? Math.max(...allSizes) : 1

  const getSymbolSize = (dataItem: ScatterChartDataItem, defaultSize: number) => {
    if (!bubbleMode || !dataItem.size) return defaultSize
    // Scale size to range
    const normalized = (dataItem.size - minSize) / (maxSize - minSize || 1)
    return sizeRange[0] + normalized * (sizeRange[1] - sizeRange[0])
  }

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e9ecef',
      borderWidth: 1,
      textStyle: {
        color: '#344767',
        fontSize: 12
      },
      formatter: (params: any) => {
        const data = params.data
        let tip = `${params.seriesName}<br/>`
        if (data.label) tip += `${data.label}<br/>`
        tip += `X: ${data.x}<br/>Y: ${data.y}`
        if (bubbleMode && data.size) tip += `<br/>Size: ${data.size}`
        return tip
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
      nameGap: 25,
      nameTextStyle: {
        color: '#6c757d',
        fontSize: 11
      },
      axisLine: { lineStyle: { color: '#dee2e6' } },
      axisLabel: { color: '#6c757d', fontSize: 11 },
      splitLine: {
        show: showGrid,
        lineStyle: { color: '#f0f0f0', type: 'dashed' }
      }
    },
    yAxis: {
      type: 'value',
      name: yAxisName,
      nameLocation: 'center',
      nameGap: 35,
      nameTextStyle: {
        color: '#6c757d',
        fontSize: 11
      },
      axisLine: { show: false },
      axisLabel: { color: '#6c757d', fontSize: 11 },
      splitLine: {
        show: showGrid,
        lineStyle: { color: '#f0f0f0', type: 'dashed' }
      }
    },
    series: series.map((s, index) => {
      const color = s.color || colors[index % colors.length]
      const defaultSize = s.symbolSize || 12

      return {
        name: s.name,
        type: 'scatter',
        symbol: s.symbol || 'circle',
        symbolSize: (data: any) => getSymbolSize(data, defaultSize),
        itemStyle: {
          color: color,
          opacity: bubbleMode ? 0.7 : 0.9
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        },
        data: s.data.map(d => ({
          value: [d.x, d.y],
          x: d.x,
          y: d.y,
          size: d.size,
          label: d.label
        }))
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
