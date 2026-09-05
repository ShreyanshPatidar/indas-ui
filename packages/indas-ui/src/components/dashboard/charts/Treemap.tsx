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
  showBreadcrumb = false,
  colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'],
  showLabels = true,
  labelPosition = 'insideTopLeft',
  drillDown = true,
  className
}: TreemapChartProps) {
  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: '#e9ecef',
      borderWidth: 1,
      borderRadius: 8,
      padding: [8, 12],
      extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.12);',
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
      top: 0,
      left: 0,
      right: 0,
      bottom: showBreadcrumb ? 22 : 0,
      roam: false,
      nodeClick: drillDown ? 'zoomToNode' : false,
      breadcrumb: showBreadcrumb ? {
        show: true,
        bottom: 0,
        left: 'center',
        height: 18,
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
        fontSize: 12,
        fontWeight: 500,
        color: '#fff',
        textShadowColor: 'rgba(0,0,0,0.35)',
        textShadowBlur: 3
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
        borderWidth: 3,
        gapWidth: 3,
        borderRadius: 4
      },
      levels: [
        {
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 4,
            gapWidth: 4,
            borderRadius: 6
          }
        },
        {
          colorSaturation: [0.45, 0.7],
          itemStyle: {
            borderColorSaturation: 0.6,
            gapWidth: 2,
            borderWidth: 2,
            borderRadius: 3
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
