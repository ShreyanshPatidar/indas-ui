'use client'

import ReactECharts from 'echarts-for-react'
import { cn } from '@/lib/utils'

export interface TreemapDataItem {
  /** Node name */
  name: string
  /** Node value (determines size) */
  value: number
  /** Optional children for hierarchical data */
  children?: TreemapDataItem[]
  /** Optional custom color */
  color?: string
}

export interface TreemapChartProps {
  data: TreemapDataItem[]
  height?: number
  /** Show breadcrumb navigation */
  showBreadcrumb?: boolean
  /** Color palette */
  colors?: string[]
  /** Show labels on leaves */
  showLabels?: boolean
  /** Label position */
  labelPosition?: 'inside' | 'insideTopLeft' | 'insideBottomLeft'
  /** Enable drill-down on click */
  drillDown?: boolean
  className?: string
}

/**
 * TreemapChart - Hierarchical data visualization
 * Great for: Cost breakdown, category distribution, budget allocation
 */
export function TreemapChart({
  data,
  height = 300,
  showBreadcrumb = true,
  colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4'],
  showLabels = true,
  labelPosition = 'insideTopLeft',
  drillDown = true,
  className
}: TreemapChartProps) {
  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e9ecef',
      borderWidth: 1,
      textStyle: { color: '#344767', fontSize: 12 },
      formatter: (params: any) => {
        const path = params.treePathInfo
          .map((node: any) => node.name)
          .filter((name: string) => name)
          .join(' → ')
        return `<strong>${path || params.name}</strong><br/>Value: ${params.value?.toLocaleString() || '-'}`
      }
    },
    series: [{
      type: 'treemap',
      data: data,
      width: '100%',
      height: '100%',
      roam: false,
      nodeClick: drillDown ? 'zoomToNode' : false,
      breadcrumb: showBreadcrumb ? {
        show: true,
        bottom: 5,
        left: 'center',
        itemStyle: {
          color: '#f5f5f5',
          borderColor: '#dee2e6',
          textStyle: { color: '#344767', fontSize: 11 }
        },
        emphasis: {
          itemStyle: { color: '#e8e8e8' }
        }
      } : { show: false },
      label: {
        show: showLabels,
        position: labelPosition,
        formatter: '{b}',
        fontSize: 11,
        color: '#fff',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowBlur: 2
      },
      upperLabel: {
        show: true,
        height: 20,
        color: '#fff',
        fontSize: 11,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowBlur: 2
      },
      itemStyle: {
        borderColor: '#fff',
        borderWidth: 2,
        gapWidth: 2
      },
      levels: [
        {
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 3,
            gapWidth: 3
          }
        },
        {
          colorSaturation: [0.3, 0.6],
          itemStyle: {
            borderColorSaturation: 0.7,
            gapWidth: 2,
            borderWidth: 2
          }
        },
        {
          colorSaturation: [0.3, 0.5],
          itemStyle: {
            borderColorSaturation: 0.6,
            gapWidth: 1,
            borderWidth: 1
          }
        }
      ],
      color: colors
    }]
  }

  return (
    <div className={cn('w-full', className)}>
      <ReactECharts option={option} style={{ height, width: '100%' }} opts={{ renderer: 'canvas' }} />
    </div>
  )
}
