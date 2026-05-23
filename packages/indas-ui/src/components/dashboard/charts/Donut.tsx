'use client'

import React, { useRef, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import { cn } from '@/lib/utils'

export interface DonutChartDataItem {
  name: string
  value: number
  color?: string
}

export interface DonutChartProps {
  data: DonutChartDataItem[]
  height?: number
  showLegend?: boolean
  centerLabel?: string
  centerValue?: string
  innerRadius?: string
  outerRadius?: string
  className?: string
}

/**
 * DonutChart - ECharts Donut/Pie Chart component
 * On hover: shows slice name + value in the center of the donut.
 * On mouseout: restores the default centerLabel / centerValue.
 */
export function DonutChart({
  data,
  height = 300,
  showLegend = true,
  centerLabel,
  centerValue,
  innerRadius = '50%',
  outerRadius = '70%',
  className
}: DonutChartProps) {
  const chartRef = useRef<any>(null)
  const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4']

  const buildGraphic = useCallback((topText: string, bottomText: string) => [
    {
      type: 'group',
      left: 'center',
      top: 'center',
      children: [
        {
          type: 'text',
          style: {
            text: topText,
            fontSize: 16,
            fontWeight: 600,
            fill: '#344767',
            textAlign: 'center'
          },
          top: -10
        },
        {
          type: 'text',
          style: {
            text: bottomText,
            fontSize: 11,
            fill: '#6c757d',
            textAlign: 'center'
          },
          top: 12
        }
      ]
    }
  ], [])

  const defaultGraphic = (centerLabel || centerValue)
    ? buildGraphic(centerValue ?? '', centerLabel ?? '')
    : undefined

  const option = {
    tooltip: { show: false },
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
    graphic: defaultGraphic,
    series: [
      {
        type: 'pie',
        radius: [innerRadius, outerRadius],
        center: ['50%', showLegend ? '45%' : '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          scale: true,
          scaleSize: 5,
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

  const onEvents = {
    mouseover: (params: any) => {
      if (params.componentType !== 'series') return
      const chart = chartRef.current?.getEchartsInstance?.()
      if (!chart) return
      const total = data.reduce((s, d) => s + d.value, 0)
      const pct = total > 0 ? ((params.value / total) * 100).toFixed(1) + '%' : ''
      const valStr = typeof params.value === 'number'
        ? params.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : String(params.value)
      chart.setOption({
        graphic: buildGraphic(valStr, `${params.name}  ${pct}`)
      })
    },
    mouseout: () => {
      const chart = chartRef.current?.getEchartsInstance?.()
      if (!chart) return
      chart.setOption({
        graphic: defaultGraphic ?? []
      })
    }
  }

  return (
    <div className={cn('w-full', className)}>
      <ReactECharts
        ref={chartRef}
        option={option}
        style={{ height, width: '100%' }}
        opts={{ renderer: 'canvas' }}
        onEvents={onEvents}
      />
    </div>
  )
}
