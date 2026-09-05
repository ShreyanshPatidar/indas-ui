'use client'

import { useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { cn } from '@/lib/utils'

export interface GaugeSeriesItem {
  label: string
  value: number
  color?: string
}

export interface GaugeChartProps {
  /** One or more series — concentric half-donut rings sharing one dial. Pass a single item for a one-ring gauge. */
  series: GaugeSeriesItem[]
  /** Maximum value */
  max?: number
  /** Minimum value */
  min?: number
  /** Chart height in pixels */
  height?: number
  /** Unit suffix (%, $, etc.) */
  unit?: string
  /** Class name for wrapper */
  className?: string
}

/**
 * GaugeChart - Half-donut gauge with one or more concentric rings.
 * The active ring (innermost by default, or hovered) is emphasised and its value
 * shows in the center. Colors auto-resolve to red/amber/green by value unless set.
 */
export function GaugeChart({
  series,
  max = 100,
  min = 0,
  height = 200,
  unit = '%',
  className
}: GaugeChartProps) {
  // Which ring is emphasised (widest). Defaults to the innermost ring (the main metric); hover overrides.
  const [activeIndex, setActiveIndex] = useState(series.length - 1)

  // Traffic-light color from a value's position in [min, max]: red → amber → green.
  const trafficColor = (v: number) => {
    const pct = ((v - min) / (max - min)) * 100
    if (pct >= 75) return '#22c55e'
    if (pct >= 40) return '#f59e0b'
    return '#ef4444'
  }

  const seriesColor = (item: GaugeSeriesItem) => item.color || trafficColor(item.value)

  const getOption = () => {
    const items = series
    const n = items.length
    const outerRadius = 150
    const active = Math.min(Math.max(activeIndex, 0), n - 1)
    // Active ring is wider; the rest are slimmer so it stands out.
    const baseWidth = Math.max(8, Math.min(Math.round(height * 0.07), Math.floor((outerRadius - 50) / (n + 0.6))))
    const activeWidth = Math.round(baseWidth * 1.7)
    const widthAt = (i: number) => (i === active ? activeWidth : baseWidth)
    const ringGap = 2
    // Each ring's outer edge = running sum of all rings above it, plus a small gap.
    const outerEdgeAt = (i: number) => {
      let edge = outerRadius
      for (let k = 0; k < i; k++) edge -= widthAt(k) + ringGap
      return edge
    }
    const activeItem = items[active]
    const activeColor = seriesColor(activeItem)
    const titleFontSize = Math.max(11, Math.round(height * 0.06))
    const valueFontSize = Math.max(20, Math.round(height * 0.16))

    // Hidden pie supplies the in-canvas legend with named, colored items (gauges
    // don't feed the native legend on their own).
    const legendSeries = {
      type: 'pie' as const,
      radius: [0, 0] as [number, number],
      center: ['50%', '50%'] as [string, string],
      silent: true,
      label: { show: false },
      labelLine: { show: false },
      data: items.map((item) => ({ name: item.label, value: item.value, itemStyle: { color: seriesColor(item) } })),
    }

    return {
      legend: items.length > 1 ? {
        bottom: 0,
        left: 'center',
        itemWidth: 10,
        itemHeight: 10,
        icon: 'circle',
        textStyle: { fontSize: 12, color: '#6c757d' },
        formatter: (name: string) => {
          const it = items.find(x => x.label === name)
          return it ? `${name}  ${it.value}${unit}` : name
        },
      } : undefined,
      series: [legendSeries, ...items.flatMap((item, i) => {
        const w = widthAt(i)
        const radius = `${outerEdgeAt(i)}%`
        const common = {
          type: 'gauge' as const,
          startAngle: 180,
          endAngle: 0,
          min, max,
          radius,
          center: ['50%', n > 1 ? '80%' : '96%'] as [string, string],
          pointer: { show: false },
          splitLine: { show: false },
          axisTick: { show: false },
          axisLabel: { show: false },
          anchor: { show: false },
          z: i + 1,
          animationDurationUpdate: 300,
        }
        const isActive = i === active
        return [
          {
            ...common,
            axisLine: { lineStyle: { width: w, color: [[1, 'rgba(0,0,0,0.05)']] } },
            detail: { show: false },
            title: { show: false },
            silent: true,
            data: [{ value: max }],
          },
          {
            ...common,
            axisLine: { show: false },
            progress: {
              show: true, roundCap: true, clip: false, width: w,
              itemStyle: { color: seriesColor(item), opacity: isActive ? 1 : 0.85 },
            },
            // Center value/label always reflects the active (hovered/default) ring.
            title: isActive ? { show: true, fontSize: titleFontSize, fontWeight: 500, color: '#64748b', offsetCenter: [0, '-8%'] } : { show: false },
            detail: isActive
              ? { valueAnimation: true, fontSize: valueFontSize, fontWeight: 700, color: activeColor, offsetCenter: [0, '-30%'], formatter: `{value}${unit}` }
              : { show: false },
            data: [{ value: item.value, name: isActive ? activeItem.label : '' }],
          },
        ]
      })]
    }
  }

  // Series layout: [0] hidden legend pie, then each ring = 2 series (track + progress).
  // So ring index for a gauge series = floor((seriesIndex - 1) / 2).
  const onEvents = {
    mouseover: (p: any) => {
      if (p.seriesType === 'gauge' && typeof p.seriesIndex === 'number') {
        setActiveIndex(Math.floor((p.seriesIndex - 1) / 2))
      }
    },
    legendselectchanged: (p: any) => {
      const i = series.findIndex(s => s.label === p.name)
      if (i >= 0) setActiveIndex(i)
    },
    highlight: (p: any) => {
      if (Array.isArray(p.batch) && p.batch[0]?.name) {
        const i = series.findIndex(s => s.label === p.batch[0].name)
        if (i >= 0) setActiveIndex(i)
      }
    },
  }

  return (
    <div className={cn('w-full', className)}>
      <ReactECharts
        option={getOption()}
        style={{ height: Math.round(height * (series.length > 1 ? 0.92 : 0.82)), width: '100%' }}
        opts={{ renderer: 'canvas' }}
        onEvents={onEvents}
        notMerge
      />
    </div>
  )
}
