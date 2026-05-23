'use client'

import ReactECharts from 'echarts-for-react'
import { cn } from '@/lib/utils'

export interface FunnelChartDataItem {
  name: string
  value: number
  color?: string
}

export interface FunnelChartProps {
  data: FunnelChartDataItem[]
  height?: number
  showLegend?: boolean
  /** Show labels on funnel stages */
  showLabels?: boolean
  /** Label position */
  labelPosition?: 'left' | 'right' | 'inside' | 'center'
  /** Funnel orientation */
  orient?: 'vertical' | 'horizontal'
  /** Sort order */
  sort?: 'ascending' | 'descending' | 'none'
  /** Gap between stages */
  gap?: number
  className?: string
}

/**
 * FunnelChart - ECharts Funnel Chart for conversion/process flows
 */
export function FunnelChart({
  data,
  height = 300,
  showLegend = true,
  showLabels = true,
  labelPosition = 'right',
  orient = 'vertical',
  sort = 'descending',
  gap = 2,
  className
}: FunnelChartProps) {
  const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4']

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
        const total = data[0]?.value || 1
        const percentage = ((params.value / total) * 100).toFixed(1)
        return `${params.name}<br/>Value: ${params.value.toLocaleString()}<br/>Rate: ${percentage}%`
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
    series: [
      {
        type: 'funnel',
        left: '15%',
        right: '15%',
        top: 20,
        bottom: showLegend ? 45 : 20,
        width: '70%',
        minSize: '10%',
        maxSize: '100%',
        sort: sort,
        orient: orient,
        gap: gap,
        label: {
          show: showLabels,
          position: labelPosition,
          fontSize: 12,
          color: '#344767',
          formatter: (params: any) => {
            const total = data[0]?.value || 1
            const percentage = ((params.value / total) * 100).toFixed(0)
            return `${params.name}: ${percentage}%`
          }
        },
        labelLine: {
          show: showLabels && (labelPosition === 'left' || labelPosition === 'right'),
          length: 15,
          lineStyle: {
            color: '#dee2e6'
          }
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 1
        },
        emphasis: {
          label: {
            fontSize: 14,
            fontWeight: 600
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)'
          }
        },
        data: data.map((item, index) => ({
          name: item.name,
          value: item.value,
          itemStyle: {
            color: item.color || colors[index % colors.length]
          }
        }))
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
