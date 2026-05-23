'use client'

import ReactECharts from 'echarts-for-react'
import { cn } from '@/lib/utils'

export interface RadarChartIndicator {
  /** Dimension name */
  name: string
  /** Maximum value for this dimension */
  max: number
  /** Minimum value (default 0) */
  min?: number
}

export interface RadarChartSeries {
  name: string
  values: number[]
  color?: string
  /** Fill area opacity (0-1) */
  areaOpacity?: number
}

export interface RadarChartProps {
  /** Dimensions/axes of the radar */
  indicators: RadarChartIndicator[]
  /** Data series to plot */
  series: RadarChartSeries[]
  height?: number
  showLegend?: boolean
  /** Radar shape: polygon or circle */
  shape?: 'polygon' | 'circle'
  /** Number of split rings */
  splitNumber?: number
  className?: string
}

/**
 * RadarChart - ECharts Radar/Spider Chart for multi-dimensional data
 */
export function RadarChart({
  indicators,
  series,
  height = 300,
  showLegend = true,
  shape = 'polygon',
  splitNumber = 4,
  className
}: RadarChartProps) {
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
    radar: {
      shape: shape,
      splitNumber: splitNumber,
      center: ['50%', showLegend ? '45%' : '50%'],
      radius: showLegend ? '60%' : '70%',
      indicator: indicators.map(ind => ({
        name: ind.name,
        max: ind.max,
        min: ind.min || 0
      })),
      axisName: {
        color: '#6c757d',
        fontSize: 11
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(240, 240, 240, 0.3)', 'rgba(255, 255, 255, 0.3)']
        }
      },
      splitLine: {
        lineStyle: {
          color: '#e9ecef'
        }
      },
      axisLine: {
        lineStyle: {
          color: '#e9ecef'
        }
      }
    },
    series: [
      {
        type: 'radar',
        data: series.map((s, index) => {
          const color = s.color || colors[index % colors.length]
          return {
            name: s.name,
            value: s.values,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: {
              width: 2,
              color: color
            },
            itemStyle: {
              color: color
            },
            areaStyle: {
              color: color,
              opacity: s.areaOpacity ?? 0.2
            }
          }
        })
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
