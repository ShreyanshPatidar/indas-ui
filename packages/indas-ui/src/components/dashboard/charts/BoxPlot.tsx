'use client'

import ReactECharts from 'echarts-for-react'
import { cn } from '@/lib/utils'

export interface BoxPlotChartDataItem {
  /** Category name */
  name: string
  /** Raw data values to calculate box plot from */
  values: number[]
}

export interface BoxPlotChartProps {
  data: BoxPlotChartDataItem[]
  height?: number
  showLegend?: boolean
  /** Box color */
  color?: string
  /** Orientation */
  horizontal?: boolean
  /** Show outliers */
  showOutliers?: boolean
  className?: string
}

/**
 * BoxPlotChart - Statistical box and whisker plot
 * Shows min, Q1, median, Q3, max and outliers
 */
export function BoxPlotChart({
  data,
  height = 300,
  showLegend = false,
  color = '#5470c6',
  horizontal = false,
  showOutliers = true,
  className
}: BoxPlotChartProps) {
  // Calculate box plot statistics for each category
  const calculateBoxPlot = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b)
    const n = sorted.length

    const q1Index = Math.floor(n * 0.25)
    const q2Index = Math.floor(n * 0.5)
    const q3Index = Math.floor(n * 0.75)

    const q1 = sorted[q1Index]
    const median = sorted[q2Index]
    const q3 = sorted[q3Index]
    const iqr = q3 - q1

    const lowerFence = q1 - 1.5 * iqr
    const upperFence = q3 + 1.5 * iqr

    const min = sorted.find(v => v >= lowerFence) || sorted[0]
    const max = [...sorted].reverse().find(v => v <= upperFence) || sorted[n - 1]

    const outliers = sorted.filter(v => v < lowerFence || v > upperFence)

    return { min, q1, median, q3, max, outliers }
  }

  const boxPlotData = data.map(d => calculateBoxPlot(d.values))
  const categories = data.map(d => d.name)

  // Format data for ECharts boxplot: [min, Q1, median, Q3, max]
  const boxData = boxPlotData.map(bp => [bp.min, bp.q1, bp.median, bp.q3, bp.max])

  // Collect outliers with category index
  const outlierData = showOutliers
    ? boxPlotData.flatMap((bp, index) =>
        bp.outliers.map(v => [index, v])
      )
    : []

  const categoryAxis = {
    type: 'category',
    data: categories,
    axisLine: { lineStyle: { color: '#dee2e6' } },
    axisLabel: { color: '#6c757d', fontSize: 11 },
    axisTick: { show: false }
  }

  const valueAxis = {
    type: 'value',
    axisLine: { show: false },
    axisLabel: { color: '#6c757d', fontSize: 11 },
    splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } }
  }

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e9ecef',
      borderWidth: 1,
      textStyle: { color: '#344767', fontSize: 12 },
      formatter: (params: any) => {
        if (params.seriesType === 'boxplot') {
          const [min, q1, median, q3, max] = params.data
          return `<strong>${categories[params.dataIndex]}</strong><br/>
            Max: ${max}<br/>
            Q3: ${q3}<br/>
            Median: ${median}<br/>
            Q1: ${q1}<br/>
            Min: ${min}`
        }
        return `Outlier: ${params.data[1]}`
      }
    },
    legend: showLegend ? {
      bottom: 0,
      textStyle: { fontSize: 12, color: '#6c757d' }
    } : undefined,
    grid: {
      top: 20,
      right: 30,
      bottom: showLegend ? 40 : 20,
      left: 50,
      containLabel: true
    },
    xAxis: horizontal ? valueAxis : categoryAxis,
    yAxis: horizontal ? categoryAxis : valueAxis,
    series: [
      {
        name: 'Box Plot',
        type: 'boxplot',
        data: boxData,
        itemStyle: {
          color: color,
          borderColor: color
        },
        emphasis: {
          itemStyle: {
            borderWidth: 2,
            shadowBlur: 5,
            shadowColor: 'rgba(0, 0, 0, 0.2)'
          }
        }
      },
      ...(showOutliers && outlierData.length > 0 ? [{
        name: 'Outliers',
        type: 'scatter',
        data: outlierData,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: {
          color: '#ee6666'
        }
      }] : [])
    ]
  }

  return (
    <div className={cn('w-full', className)}>
      <ReactECharts option={option} style={{ height, width: '100%' }} opts={{ renderer: 'canvas' }} />
    </div>
  )
}
