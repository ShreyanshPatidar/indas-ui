'use client'

import ReactECharts from 'echarts-for-react'
import { cn } from '@/lib/utils'

export interface GaugeChartProps {
  /** Current value (0-100 or custom max) */
  value: number
  /** Maximum value */
  max?: number
  /** Minimum value */
  min?: number
  /** Chart height in pixels */
  height?: number
  /** Title shown below the value */
  title?: string
  /** Unit suffix (%, $, etc.) */
  unit?: string
  /** Color or gradient stops */
  color?: string | { offset: number; color: string }[]
  /** Show axis ticks */
  showAxis?: boolean
  /** Gauge style variant */
  variant?: 'default' | 'progress' | 'meter'
  /** Class name for wrapper */
  className?: string
}

/**
 * GaugeChart - ECharts Gauge component
 *
 * Variants:
 * - default: Half-donut arc, no pointer, value centered — clean and modern
 * - progress: Full ring progress with rounded cap
 * - meter: Speedometer with pointer needle
 */
export function GaugeChart({
  value,
  max = 100,
  min = 0,
  height = 200,
  title,
  unit = '%',
  color,
  showAxis = false,
  variant = 'default',
  className
}: GaugeChartProps) {
  const percentage = ((value - min) / (max - min)) * 100

  const getValueColor = () => {
    if (percentage >= 80) return '#22c55e'
    if (percentage >= 60) return '#f59e0b'
    if (percentage >= 40) return '#3b82f6'
    return '#ef4444'
  }

  const resolvedColor = typeof color === 'string' ? color : getValueColor()

  const getOption = () => {
    switch (variant) {
      case 'progress':
        // Full ring
        return {
          series: [{
            type: 'gauge',
            startAngle: 90,
            endAngle: -270,
            min, max,
            pointer: { show: false },
            progress: {
              show: true,
              overlap: false,
              roundCap: true,
              clip: false,
              itemStyle: { color: resolvedColor }
            },
            axisLine: { lineStyle: { width: 14, color: [[1, 'rgba(0,0,0,0.06)']] } },
            splitLine: { show: false },
            axisTick: { show: false },
            axisLabel: { show: false },
            anchor: { show: false },
            title: {
              show: !!title,
              fontSize: 12, fontWeight: 500, color: '#64748b',
              offsetCenter: [0, '30%']
            },
            detail: {
              valueAnimation: true,
              fontSize: 28, fontWeight: 700,
              color: resolvedColor,
              offsetCenter: [0, '-5%'],
              formatter: `{value}${unit}`
            },
            data: [{ value: Number(value.toFixed(1)), name: title || '' }]
          }]
        }

      case 'meter':
        // Speedometer with pointer
        return {
          series: [{
            type: 'gauge',
            min, max,
            splitNumber: 5,
            radius: '90%',
            axisLine: {
              lineStyle: {
                width: 18,
                color: color
                  ? (typeof color === 'string' ? [[1, color]] : color.map(c => [c.offset, c.color]))
                  : [[0.3, '#ef4444'], [0.6, '#f59e0b'], [1, '#22c55e']]
              }
            },
            pointer: {
              icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
              length: '55%', width: 8,
              offsetCenter: [0, '-10%'],
              itemStyle: { color: '#334155' }
            },
            axisTick: { distance: -18, length: 5, lineStyle: { color: '#fff', width: 1 } },
            splitLine: { distance: -18, length: 18, lineStyle: { color: '#fff', width: 2.5 } },
            axisLabel: { color: '#94a3b8', distance: 28, fontSize: 10, fontWeight: 500 },
            anchor: { show: true, size: 10, showAbove: true, itemStyle: { color: '#334155', borderWidth: 0 } },
            title: { show: !!title, fontSize: 12, fontWeight: 500, color: '#64748b', offsetCenter: [0, '75%'] },
            detail: {
              valueAnimation: true,
              fontSize: 22, fontWeight: 700, color: '#0f172a',
              offsetCenter: [0, '50%'],
              formatter: `{value}${unit}`
            },
            data: [{ value: Number(value.toFixed(1)), name: title || '' }]
          }]
        }

      default: {
        // Scale sizes based on height
        const arcWidth = Math.max(12, Math.round(height * 0.14))
        const valueFontSize = Math.max(14, Math.round(height * 0.14))
        const titleFontSize = Math.max(10, Math.round(height * 0.07))

        // Half-donut: semi-circle arc filled to value, no pointer
        return {
          series: [
            // Background track (full semi-circle, subtle gray)
            {
              type: 'gauge',
              startAngle: 180,
              endAngle: 0,
              min, max,
              radius: '90%',
              center: ['50%', '65%'],
              pointer: { show: false },
              axisLine: {
                lineStyle: {
                  width: arcWidth,
                  color: [[1, 'rgba(0,0,0,0.06)']]
                }
              },
              splitLine: { show: false },
              axisTick: { show: false },
              axisLabel: { show: false },
              detail: { show: false },
              title: { show: false },
              anchor: { show: false },
              data: [{ value: max }]
            },
            // Foreground fill (arc up to value)
            {
              type: 'gauge',
              startAngle: 180,
              endAngle: 0,
              min, max,
              radius: '90%',
              center: ['50%', '65%'],
              pointer: { show: false },
              progress: {
                show: true,
                roundCap: true,
                clip: false,
                width: arcWidth,
                itemStyle: { color: resolvedColor }
              },
              axisLine: { show: false, lineStyle: { width: 0, color: [[1, 'transparent']] } },
              splitLine: { show: false },
              axisTick: { show: false },
              axisLabel: { show: false },
              anchor: { show: false },
              title: {
                show: !!title,
                fontSize: titleFontSize,
                fontWeight: 500,
                color: '#64748b',
                offsetCenter: [0, '35%']
              },
              detail: {
                valueAnimation: true,
                fontSize: valueFontSize,
                fontWeight: 700,
                color: resolvedColor,
                offsetCenter: [0, '5%'],
                formatter: `{value}${unit}`
              },
              data: [{ value: Number(value.toFixed(1)), name: title || '' }]
            }
          ]
        }
      }
    }
  }

  return (
    <div className={cn('w-full', className)}>
      <ReactECharts
        option={getOption()}
        style={{ height, width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  )
}
