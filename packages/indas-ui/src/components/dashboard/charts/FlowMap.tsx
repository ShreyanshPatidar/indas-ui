'use client'

import { useEffect, useRef, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts/core'
import { cn } from '@/lib/utils'
import { INDIA_GEOJSON } from './india-map'
import { getChartTheme } from './theme'

export interface FlowMapMarker {
  name: string
  coords: [number, number] // [longitude, latitude]
  value?: number
}

export interface FlowMapLine {
  name?: string
  from: [number, number] // [longitude, latitude]
  to: [number, number]   // [longitude, latitude]
  value?: number
  color?: string
}

export interface FlowMapProps {
  markers?: FlowMapMarker[]
  lines?: FlowMapLine[]
  height?: number
  markerColor?: string
  lineColor?: string
  markerSizeRange?: [number, number]
  lineWidth?: number
  showRipple?: boolean
  showLineEffect?: boolean
  effectSymbol?: 'circle' | 'arrow' | 'plane' | 'pin'
  mapColor?: string
  borderColor?: string
  showLabels?: boolean
  curveness?: number
  className?: string
}

/**
 * FlowMap - Geographic flow/route visualization
 *
 * Combines scatter markers with animated flow lines between locations.
 * Perfect for logistics, shipping routes, migration, trade flows.
 *
 * Uses ECharts Lines series for flow visualization.
 */
export function FlowMap({
  markers = [],
  lines = [],
  height = 400,
  markerColor = '#5470c6',
  lineColor = '#fac858',
  markerSizeRange = [8, 30],
  lineWidth = 2,
  showRipple = true,
  showLineEffect = true,
  effectSymbol = 'arrow',
  mapColor,
  borderColor,
  showLabels = true,
  curveness = 0.2,
  className
}: FlowMapProps) {
  const chartRef = useRef<ReactECharts>(null)
  const [mapReady, setMapReady] = useState(false)
  const theme = getChartTheme()

  // Use theme colors if not provided
  const finalMapColor = mapColor || (theme.backgroundColor === 'rgb(30, 30, 35)' ? '#2d3748' : '#e8f4f8')
  const finalBorderColor = borderColor || (theme.backgroundColor === 'rgb(30, 30, 35)' ? '#4a5568' : '#b0c4de')

  useEffect(() => {
    try {
      echarts.registerMap('India', INDIA_GEOJSON as any)
      setMapReady(true)
    } catch {
      setMapReady(true)
    }
  }, [])

  // Calculate size scaling for markers
  const markerValues = markers.map(m => m.value || 0).filter(v => v > 0)
  const minVal = markerValues.length > 0 ? Math.min(...markerValues) : 0
  const maxVal = markerValues.length > 0 ? Math.max(...markerValues) : 1

  const getMarkerSize = (value: number | undefined) => {
    if (!value || maxVal === minVal) return markerSizeRange[0]
    const normalized = (value - minVal) / (maxVal - minVal)
    return markerSizeRange[0] + normalized * (markerSizeRange[1] - markerSizeRange[0])
  }

  // Effect symbols
  const effectSymbols: Record<string, string> = {
    circle: 'circle',
    arrow: 'arrow',
    plane: 'path://M1705.06,1318.313v-89.254l-319.9-221.799l0.073-208.063c0.521-84.662-26.629-121.796-63.961-121.491c-37.332-0.305-64.482,36.829-63.961,121.491l0.073,208.063l-319.9,221.799v89.254l330.343-157.288l12.238,241.308l-134.449,92.931l0.531,42.034l175.125-42.917l175.125,42.917l0.531-42.034l-134.449-92.931l12.238-241.308L1705.06,1318.313z',
    pin: 'pin'
  }

  if (!mapReady) {
    return (
      <div className={cn('w-full flex items-center justify-center', className)} style={{ height }}>
        <div className="text-sm text-[rgb(var(--fg-muted))]">Loading map...</div>
      </div>
    )
  }

  const series: any[] = []

  // Lines series (flow routes)
  if (lines.length > 0) {
    // Static lines
    series.push({
      name: 'Routes',
      type: 'lines',
      coordinateSystem: 'geo',
      zlevel: 1,
      effect: showLineEffect ? {
        show: true,
        period: 6,
        trailLength: 0.7,
        color: '#fff',
        symbolSize: 3
      } : undefined,
      lineStyle: {
        color: lineColor,
        width: lineWidth,
        opacity: 0.6,
        curveness: curveness
      },
      data: lines.map(line => ({
        name: line.name || '',
        coords: [line.from, line.to],
        lineStyle: line.color ? { color: line.color } : undefined
      }))
    })

    // Animated effect on lines
    if (showLineEffect) {
      series.push({
        name: 'Route Effects',
        type: 'lines',
        coordinateSystem: 'geo',
        zlevel: 2,
        symbol: ['none', effectSymbols[effectSymbol] || 'arrow'],
        symbolSize: effectSymbol === 'plane' ? 15 : 10,
        effect: {
          show: true,
          period: 4,
          trailLength: 0,
          symbol: effectSymbols[effectSymbol] || 'arrow',
          symbolSize: effectSymbol === 'plane' ? 15 : 10,
          color: '#fff'
        },
        lineStyle: {
          width: 0,
          curveness: curveness
        },
        data: lines.map(line => ({
          coords: [line.from, line.to]
        }))
      })
    }
  }

  // Scatter markers
  if (markers.length > 0) {
    series.push({
      name: 'Locations',
      type: showRipple ? 'effectScatter' : 'scatter',
      coordinateSystem: 'geo',
      zlevel: 3,
      symbol: 'circle',
      symbolSize: (val: any) => getMarkerSize(val?.[2]),
      showEffectOn: 'render',
      rippleEffect: showRipple ? {
        brushType: 'stroke',
        scale: 2.5,
        period: 4
      } : undefined,
      itemStyle: {
        color: markerColor,
        shadowBlur: 10,
        shadowColor: markerColor + '80'
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 20,
          borderColor: '#fff',
          borderWidth: 3
        }
      },
      label: showLabels ? {
        show: true,
        position: 'right',
        formatter: '{b}',
        fontSize: 11,
        color: theme.textColorStrong,
        fontWeight: 600,
        textBorderColor: theme.backgroundColor,
        textBorderWidth: 2
      } : { show: false },
      data: markers.map(m => ({
        name: m.name,
        value: [...m.coords, m.value || 0]
      }))
    })
  }

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: theme.tooltip.backgroundColor,
      borderColor: theme.tooltip.borderColor,
      borderWidth: 1,
      textStyle: { color: theme.tooltip.textColor, fontSize: 12 },
      formatter: (params: any) => {
        if (params.seriesType === 'lines') {
          return params.name ? `<strong>${params.name}</strong>` : ''
        }
        if (params.seriesType === 'effectScatter' || params.seriesType === 'scatter') {
          const value = params.value?.[2]
          return `<strong>${params.name}</strong>${value ? `<br/>Value: ${value.toLocaleString()}` : ''}`
        }
        return `<strong>${params.name}</strong>`
      }
    },
    geo: {
      map: 'India',
      roam: true,
      zoom: 1.15,
      center: [82, 22],
      aspectScale: 0.9,
      selectedMode: false,
      itemStyle: {
        areaColor: finalMapColor,
        borderColor: finalBorderColor,
        borderWidth: 1
      },
      emphasis: {
        itemStyle: {
          areaColor: theme.backgroundColor === 'rgb(30, 30, 35)' ? '#4a5568' : '#cce5ff',
          borderColor: '#5470c6',
          borderWidth: 2
        },
        label: {
          show: true,
          color: theme.textColorStrong,
          fontSize: 11,
          fontWeight: 500
        }
      },
      label: { show: false }
    },
    series
  }

  return (
    <div className={cn('w-full', className)}>
      <ReactECharts
        ref={chartRef}
        option={option}
        style={{ height, width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  )
}
