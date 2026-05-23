'use client'

import ReactECharts from 'echarts-for-react'
import { cn } from '@/lib/utils'
import { getChartTheme, getTooltipConfig } from './theme'

export interface GanttTask {
  id: string
  name: string
  start: string | Date  // ISO date string or Date object
  end: string | Date    // ISO date string or Date object
  progress?: number     // 0-100 percentage
  color?: string
  category?: string     // For grouping tasks
  dependencies?: string[] // IDs of tasks this depends on
}

export interface GanttChartProps {
  tasks: GanttTask[]
  height?: number
  showProgress?: boolean
  showToday?: boolean
  showGrid?: boolean
  dateFormat?: 'short' | 'medium' | 'long'
  className?: string
}

/**
 * GanttChart - ECharts Gantt Chart component
 *
 * Displays project timelines with tasks, progress, and dependencies.
 * Built on ECharts custom series for flexibility.
 */
export function GanttChart({
  tasks,
  height = 400,
  showProgress = true,
  showToday = true,
  showGrid = true,
  dateFormat = 'short',
  className
}: GanttChartProps) {
  const theme = getChartTheme()
  const tooltipConfig = getTooltipConfig()

  // Default colors for tasks
  const defaultColors = theme.colors

  // Parse dates and calculate min/max
  const parsedTasks = tasks.map((task, index) => {
    const start = typeof task.start === 'string' ? new Date(task.start) : task.start
    const end = typeof task.end === 'string' ? new Date(task.end) : task.end
    return {
      ...task,
      startDate: start,
      endDate: end,
      color: task.color || defaultColors[index % defaultColors.length]
    }
  })

  // Find date range
  const allDates = parsedTasks.flatMap(t => [t.startDate, t.endDate])
  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())))
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())))

  // Add padding to date range (5% on each side)
  const dateRange = maxDate.getTime() - minDate.getTime()
  const paddedMinDate = new Date(minDate.getTime() - dateRange * 0.05)
  const paddedMaxDate = new Date(maxDate.getTime() + dateRange * 0.05)

  // Today's date for marker
  const today = new Date()

  // Format date based on preference
  const formatDate = (date: Date): string => {
    if (dateFormat === 'short') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else if (dateFormat === 'medium') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    }
  }

  // Calculate duration in days
  const getDuration = (start: Date, end: Date): number => {
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }

  // Task names for Y-axis
  const taskNames = parsedTasks.map(t => t.name)

  // Build series data - bar representing each task
  const barData = parsedTasks.map((task, index) => ({
    name: task.name,
    value: [
      index,
      task.startDate.getTime(),
      task.endDate.getTime(),
      getDuration(task.startDate, task.endDate)
    ],
    itemStyle: {
      color: task.color,
      borderRadius: 4
    },
    task: task // Store full task for tooltip
  }))

  // Progress overlay data
  const progressData = showProgress ? parsedTasks.map((task, index) => {
    const progress = task.progress ?? 0
    const duration = task.endDate.getTime() - task.startDate.getTime()
    const progressEnd = task.startDate.getTime() + (duration * progress / 100)

    return {
      name: task.name,
      value: [
        index,
        task.startDate.getTime(),
        progressEnd,
        progress
      ],
      itemStyle: {
        color: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 4
      }
    }
  }) : []

  const option = {
    tooltip: {
      ...tooltipConfig,
      trigger: 'item',
      formatter: (params: any) => {
        const task = params.data.task as GanttTask & { startDate: Date; endDate: Date }
        if (!task) return ''

        const duration = getDuration(task.startDate, task.endDate)
        const progress = task.progress ?? 0

        return `
          <div style="padding: 8px; min-width: 180px;">
            <div style="font-weight: 600; margin-bottom: 6px; color: ${theme.textColorStrong};">${task.name}</div>
            <div style="display: grid; gap: 4px; font-size: 12px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: ${theme.textColor};">Start:</span>
                <span style="font-weight: 500;">${formatDate(task.startDate)}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: ${theme.textColor};">End:</span>
                <span style="font-weight: 500;">${formatDate(task.endDate)}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: ${theme.textColor};">Duration:</span>
                <span style="font-weight: 500;">${duration} day${duration !== 1 ? 's' : ''}</span>
              </div>
              ${showProgress ? `
              <div style="display: flex; justify-content: space-between;">
                <span style="color: ${theme.textColor};">Progress:</span>
                <span style="font-weight: 500; color: ${progress >= 100 ? theme.success : progress >= 50 ? theme.warning : theme.info};">${progress}%</span>
              </div>
              ` : ''}
              ${task.category ? `
              <div style="display: flex; justify-content: space-between;">
                <span style="color: ${theme.textColor};">Category:</span>
                <span style="font-weight: 500;">${task.category}</span>
              </div>
              ` : ''}
            </div>
          </div>
        `
      }
    },
    grid: {
      top: 30,
      right: 30,
      bottom: 30,
      left: 20,
      containLabel: true
    },
    xAxis: {
      type: 'time',
      min: paddedMinDate.getTime(),
      max: paddedMaxDate.getTime(),
      position: 'top',
      axisLine: { lineStyle: { color: theme.axisLine } },
      axisLabel: {
        color: theme.textColor,
        fontSize: 11,
        formatter: (value: number) => formatDate(new Date(value))
      },
      axisTick: { show: false },
      splitLine: showGrid ? {
        lineStyle: { color: theme.splitLine, type: 'dashed' }
      } : { show: false }
    },
    yAxis: {
      type: 'category',
      data: taskNames,
      inverse: true, // First task at top
      axisLine: { show: false },
      axisLabel: {
        color: theme.textColor,
        fontSize: 12,
        width: 120,
        overflow: 'truncate'
      },
      axisTick: { show: false },
      splitLine: showGrid ? {
        lineStyle: { color: theme.splitLine, type: 'dashed' }
      } : { show: false }
    },
    series: [
      // Main task bars
      {
        type: 'custom',
        renderItem: (params: any, api: any) => {
          const categoryIndex = api.value(0)
          const start = api.coord([api.value(1), categoryIndex])
          const end = api.coord([api.value(2), categoryIndex])
          const height = api.size([0, 1])[1] * 0.6

          const rectShape = {
            x: start[0],
            y: start[1] - height / 2,
            width: end[0] - start[0],
            height: height
          }

          return {
            type: 'rect',
            shape: rectShape,
            style: {
              ...api.style(),
              fill: api.style().fill || defaultColors[categoryIndex % defaultColors.length]
            },
            emphasis: {
              style: {
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.3)'
              }
            }
          }
        },
        encode: {
          x: [1, 2],
          y: 0
        },
        data: barData
      },
      // Progress overlay
      ...(showProgress ? [{
        type: 'custom',
        renderItem: (params: any, api: any) => {
          const categoryIndex = api.value(0)
          const start = api.coord([api.value(1), categoryIndex])
          const end = api.coord([api.value(2), categoryIndex])
          const height = api.size([0, 1])[1] * 0.6

          // Only render if there's progress
          if (api.value(3) <= 0) return null

          const rectShape = {
            x: start[0],
            y: start[1] - height / 2,
            width: Math.max(0, end[0] - start[0]),
            height: height
          }

          return {
            type: 'rect',
            shape: rectShape,
            style: {
              fill: 'rgba(255, 255, 255, 0.35)'
            },
            silent: true
          }
        },
        encode: {
          x: [1, 2],
          y: 0
        },
        data: progressData,
        z: 2
      }] : []),
      // Today marker
      ...(showToday && today >= paddedMinDate && today <= paddedMaxDate ? [{
        type: 'line',
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: {
            color: theme.error,
            width: 2,
            type: 'solid'
          },
          label: {
            show: true,
            position: 'start',
            formatter: 'Today',
            fontSize: 10,
            color: theme.error
          },
          data: [{ xAxis: today.getTime() }]
        }
      }] : [])
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
