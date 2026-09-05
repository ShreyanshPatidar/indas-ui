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
  colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'],
  linkOpacity = 0.45,
  className
}: SankeyChartProps) {
  // Node value = total flow through it (incoming for non-source nodes, else outgoing).
  const nodeValue = (name: string) => {
    const incoming = links.filter(l => l.target === name).reduce((s, l) => s + l.value, 0)
    if (incoming > 0) return incoming
    return links.filter(l => l.source === name).reduce((s, l) => s + l.value, 0)
  }

  // Assign colors to nodes if not specified
  const nodesWithColors = nodes.map((node, index) => ({
    ...node,
    value: nodeValue(node.name),
    itemStyle: {
      color: node.color || colors[index % colors.length]
    }
  }))

  const option = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: '#e9ecef',
      borderWidth: 1,
      borderRadius: 8,
      padding: [8, 12],
      extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.12);',
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
      orient: orient,
      nodeWidth: nodeWidth,
      nodeGap: nodeGap,
      draggable: false,
      left: 8,
      right: 64,
      top: 12,
      bottom: 12,
      nodeAlign: 'justify',
      layoutIterations: 0,
      emphasis: {
        focus: 'adjacency',
        lineStyle: {
          opacity: 0.7
        }
      },
      itemStyle: {
        borderWidth: 0,
        borderRadius: 3
      },
      lineStyle: {
        color: 'gradient',
        opacity: linkOpacity,
        curveness: 0.55
      },
      label: {
        show: showLabels,
        position: orient === 'horizontal' ? 'right' : 'bottom',
        color: '#344767',
        fontSize: 11,
        fontWeight: 500,
        formatter: (p: any) => `${p.name} (${p.value?.toLocaleString() ?? '-'})`
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
