'use client'

import { useEffect, useRef, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts/core'
import { cn } from '@/lib/utils'
import { INDIA_GEOJSON } from './india-map'

export interface GeoMapDataItem {
  /** Location name */
  name: string
  /** Value for this location */
  value: number
}

export interface GeoMapMarker {
  /** Marker name/label */
  name: string
  /** Coordinates [longitude, latitude] */
  coords: [number, number]
  /** Optional value (affects size) */
  value?: number
}

export interface GeoMapProps {
  /** Point markers on the map */
  markers?: GeoMapMarker[]
  height?: number
  /** Marker color */
  markerColor?: string
  /** Marker size range [min, max] */
  markerSizeRange?: [number, number]
  /** Show ripple effect */
  showRipple?: boolean
  /** Map background color */
  mapColor?: string
  /** Map border color */
  borderColor?: string
  /** Show state labels on hover */
  showStateLabels?: boolean
  className?: string
}

/**
 * GeoMap - Geographic scatter/bubble map for India
 * Shows location markers with optional size based on values
 * Includes all Indian states and union territories
 */
export function GeoMap({
  markers = [],
  height = 400,
  markerColor = '#5470c6',
  markerSizeRange = [10, 35],
  showRipple = true,
  mapColor = '#e8f4f8',
  borderColor = '#b0c4de',
  showStateLabels = true,
  className
}: GeoMapProps) {
  const chartRef = useRef<ReactECharts>(null)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    // Register India map GeoJSON
    try {
      echarts.registerMap('India', INDIA_GEOJSON as any)
      setMapReady(true)
    } catch (e) {
      // Map might already be registered
      setMapReady(true)
    }
  }, [])

  // Calculate min/max for size scaling
  const values = markers.map(m => m.value || 0).filter(v => v > 0)
  const minVal = values.length > 0 ? Math.min(...values) : 0
  const maxVal = values.length > 0 ? Math.max(...values) : 1

  const getMarkerSize = (value: number | undefined) => {
    if (!value || maxVal === minVal) return markerSizeRange[0]
    const normalized = (value - minVal) / (maxVal - minVal)
    return markerSizeRange[0] + normalized * (markerSizeRange[1] - markerSizeRange[0])
  }

  if (!mapReady) {
    return (
      <div className={cn('w-full flex items-center justify-center', className)} style={{ height }}>
        <div className="text-sm text-[rgb(var(--fg-muted))]">Loading map...</div>
      </div>
    )
  }

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e9ecef',
      borderWidth: 1,
      textStyle: { color: '#344767', fontSize: 12 },
      formatter: (params: any) => {
        if (params.seriesType === 'effectScatter' || params.seriesType === 'scatter') {
          const value = params.value?.[2]
          return `<strong>${params.name}</strong>${value ? `<br/>Production: ${value.toLocaleString()} units` : ''}`
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
        areaColor: mapColor,
        borderColor: borderColor,
        borderWidth: 1
      },
      emphasis: {
        itemStyle: {
          areaColor: '#cce5ff',
          borderColor: '#5470c6',
          borderWidth: 2
        },
        label: {
          show: showStateLabels,
          color: '#344767',
          fontSize: 11,
          fontWeight: 500
        }
      },
      label: {
        show: false
      }
    },
    series: markers.length > 0 ? [{
      name: 'Locations',
      type: showRipple ? 'effectScatter' : 'scatter',
      coordinateSystem: 'geo',
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
      label: {
        show: true,
        position: 'right',
        formatter: '{b}',
        fontSize: 12,
        color: '#344767',
        fontWeight: 600,
        textBorderColor: '#fff',
        textBorderWidth: 2
      },
      data: markers.map(m => ({
        name: m.name,
        value: [...m.coords, m.value || 0]
      }))
    }] : []
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
