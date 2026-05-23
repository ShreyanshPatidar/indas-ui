'use client'

import * as React from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'

import { cn } from '@/lib/utils'

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: '', dark: '.dark' } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />')
  }

  return context
}

interface ChartContainerProps extends React.ComponentProps<'div'> {
  config: ChartConfig
  children: React.ReactNode
}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ id, className, children, config, ...props }, ref) => {
    const uniqueId = React.useId()
    const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`

    return (
      <ChartContext.Provider value={{ config }}>
        <div
          data-chart={chartId}
          ref={ref}
          className={cn('flex aspect-video justify-center text-xs', className)}
          {...props}
        >
          <ChartStyle id={chartId} config={config} />
          {children}
        </div>
      </ChartContext.Provider>
    )
  }
)
ChartContainer.displayName = 'Chart'

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join('\n')}
}
`
          )
          .join('\n'),
      }}
    />
  )
}

// ECharts wrapper component
interface EChartsWrapperProps {
  option: EChartsOption
  height?: number | string
  width?: number | string
  className?: string
  onEvents?: Record<string, (params: any) => void>
  loading?: boolean
}

const EChartsWrapper = React.forwardRef<any, EChartsWrapperProps>(
  ({ option, height = 300, width = '100%', className, onEvents, loading }, ref) => {
    return (
      <div className={cn('w-full', className)}>
        <ReactECharts
          ref={ref}
          option={option}
          style={{ height, width }}
          opts={{ renderer: 'canvas' }}
          onEvents={onEvents}
          showLoading={loading}
        />
      </div>
    )
  }
)
EChartsWrapper.displayName = 'EChartsWrapper'

// Tooltip component for ECharts (using ECharts' built-in tooltip)
interface ChartTooltipProps {
  trigger?: 'item' | 'axis' | 'none'
  formatter?: string | ((params: any) => string)
  backgroundColor?: string
  borderColor?: string
  textStyle?: {
    color?: string
    fontSize?: number
  }
}

const createTooltipConfig = ({
  trigger = 'axis',
  formatter,
  backgroundColor = 'rgba(255, 255, 255, 0.95)',
  borderColor = '#e5e7eb',
  textStyle = { color: '#344767', fontSize: 12 }
}: ChartTooltipProps = {}): EChartsOption['tooltip'] => {
  return {
    trigger,
    formatter,
    backgroundColor,
    borderColor,
    borderWidth: 1,
    textStyle,
    axisPointer: trigger === 'axis' ? { type: 'shadow' } : undefined
  }
}

// Legend component for ECharts
interface ChartLegendProps {
  position?: 'top' | 'bottom' | 'left' | 'right'
  orient?: 'horizontal' | 'vertical'
  itemWidth?: number
  itemHeight?: number
  textStyle?: {
    color?: string
    fontSize?: number
  }
}

const createLegendConfig = ({
  position = 'bottom',
  orient = 'horizontal',
  itemWidth = 12,
  itemHeight = 12,
  textStyle = { color: '#6c757d', fontSize: 12 }
}: ChartLegendProps = {}): EChartsOption['legend'] => {
  const positionConfig: Record<string, any> = {
    top: { top: 0 },
    bottom: { bottom: 0 },
    left: { left: 0 },
    right: { right: 0 }
  }

  return {
    ...positionConfig[position],
    left: position === 'left' || position === 'right' ? undefined : 'center',
    orient,
    itemWidth,
    itemHeight,
    textStyle
  }
}

// Grid configuration helper
interface ChartGridProps {
  top?: number | string
  right?: number | string
  bottom?: number | string
  left?: number | string
  containLabel?: boolean
}

const createGridConfig = ({
  top = 20,
  right = 20,
  bottom = 40,
  left = 40,
  containLabel = true
}: ChartGridProps = {}): EChartsOption['grid'] => {
  return {
    top,
    right,
    bottom,
    left,
    containLabel
  }
}

// Helper to get colors from config
function getColorsFromConfig(config: ChartConfig): string[] {
  return Object.values(config)
    .map(item => item.color || item.theme?.light)
    .filter((color): color is string => !!color)
}

// Helper to extract item config from a payload
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== 'object' || payload === null) {
    return undefined
  }

  const payloadPayload =
    'payload' in payload &&
    typeof payload.payload === 'object' &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === 'string'
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === 'string'
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

export {
  ChartContainer,
  ChartStyle,
  EChartsWrapper,
  createTooltipConfig,
  createLegendConfig,
  createGridConfig,
  getColorsFromConfig,
  getPayloadConfigFromPayload,
  useChart,
}

export type {
  ChartContainerProps,
  EChartsWrapperProps,
  ChartTooltipProps,
  ChartLegendProps,
  ChartGridProps,
}
