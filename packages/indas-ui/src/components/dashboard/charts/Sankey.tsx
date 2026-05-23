'use client'

import ReactECharts from 'echarts-for-react'
import { cn } from '@/lib/utils'

export interface SankeyNode {
  /** Node name (must be unique) */
  name: string
  /** Optional custom color */
  color?: string
  /** Optional depth level (0 = leftmost) */
  depth?: number
}

export interface SankeyLink {
  /** Source node name */
  source: string
  /** Target node name */
  target: string
  /** Flow value */
  value: number
  /** Optional custom color */
  color?: string
}

export interface SankeyChartProps {
  /** Nodes in the diagram */
  nodes: SankeyNode[]
  /** Links/flows between nodes */
  links: SankeyLink[]
  height?: number
  /** Orientation */
  orient?: 'horizontal' | 'vertical'
  /** Node width */
  nodeWidth?: number
  /** Gap between nodes */
  nodeGap?: number
  /** Show labels */
  showLabels?: boolean
  /** Color palette for nodes */
  colors?: string[]
  /** Link opacity */
  linkOpacity?: number
  className?: string
}

/**
 * SankeyChart - Flow/relationship visualization
 * Great for: Material flow, process flow, cost flow, conversion funnels
 */
export function SankeyChart({
  nodes,
  links,
  height = 300,
  orient = 'horizontal',
  nodeWidth = 20,
  nodeGap = 12,
  showLabels = true,
  colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4'],
  linkOpacity = 0.4,
  className
}: SankeyChartProps) {
  // Assign colors to nodes if not specified
  const nodesWithColors = nodes.map((node, index) => ({
    ...node,
    itemStyle: {
      color: node.color || colors[index % colors.length]
    }
  }))

  const option = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e9ecef',
      borderWidth: 1,
      textStyle: { color: '#344767', fontSize: 12 },
      formatter: (params: any) => {
        if (params.dataType === 'edge') {
          return `<strong>${params.data.source}</strong> → <strong>${params.data.target}</strong><br/>Value: ${params.data.value?.toLocaleString()}`
        }
        return `<strong>${params.name}</strong><br/>Value: ${params.value?.toLocaleString() || '-'}`
      }
    },
    series: [{
      type: 'sankey',
      layout: 'none',
      orient: orient,
      nodeWidth: nodeWidth,
      nodeGap: nodeGap,
      draggable: true,
      emphasis: {
        focus: 'adjacency',
        lineStyle: {
          opacity: 0.8
        }
      },
      lineStyle: {
        color: 'gradient',
        opacity: linkOpacity,
        curveness: 0.5
      },
      label: {
        show: showLabels,
        position: orient === 'horizontal' ? 'right' : 'bottom',
        color: '#344767',
        fontSize: 11,
        formatter: '{b}'
      },
      data: nodesWithColors,
      links: links.map(link => ({
        ...link,
        lineStyle: link.color ? { color: link.color } : undefined
      }))
    }]
  }

  return (
    <div className={cn('w-full', className)}>
      <ReactECharts option={option} style={{ height, width: '100%' }} opts={{ renderer: 'canvas' }} />
    </div>
  )
}
