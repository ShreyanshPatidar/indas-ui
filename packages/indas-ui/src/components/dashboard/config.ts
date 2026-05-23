// Dashboard Configuration
// Centralized config for chart sizes, grid layouts, and responsive breakpoints

/**
 * Chart height presets (in pixels)
 * These ensure consistent sizing across all dashboard charts
 */
export const chartHeights = {
  /** Small charts - KPIs, mini sparklines */
  sm: 180,
  /** Medium charts - Standard dashboard charts */
  md: 240,
  /** Large charts - Featured/hero charts */
  lg: 300,
  /** Extra large - Full-width detailed charts */
  xl: 360,
} as const

/**
 * Grid layout configurations
 * Responsive column layouts for different chart groupings
 */
export const gridLayouts = {
  /** Single chart full width */
  single: 'grid-cols-1',
  /** 2 charts side by side on large screens */
  double: 'grid-cols-1 lg:grid-cols-2',
  /** 3 charts on large screens, 2 on medium */
  triple: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  /** 4 charts - 2x2 on medium, 4 on large */
  quad: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
  /** KPI cards - 4 columns on large, 2 on medium */
  kpi: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
} as const

/**
 * Section spacing
 * Gap between charts and sections
 */
export const spacing = {
  /** Gap between charts in a grid */
  chartGap: 'gap-4 lg:gap-6',
  /** Gap between sections */
  sectionGap: 'space-y-4 lg:space-y-6',
  /** Padding for main content area */
  contentPadding: 'p-4 md:p-6',
} as const

/**
 * Chart card configurations
 */
export const chartCard = {
  /** Default border radius */
  borderRadius: 'rounded-xl',
  /** Default padding */
  padding: 'p-4',
  /** Background */
  background: 'bg-[rgb(var(--bg-surface))]',
  /** Border */
  border: 'border border-[rgb(var(--bd-default))]',
} as const

/**
 * Donut chart configurations
 */
export const donutConfig = {
  /** Inner radius percentage for donut hole */
  innerRadius: 60,
  /** Outer radius percentage */
  outerRadius: 80,
} as const

/**
 * Bar chart configurations
 */
export const barConfig = {
  /** Default bar radius */
  barRadius: 4,
  /** Max bar width */
  maxBarWidth: 40,
} as const

/**
 * Color palette for charts
 * Using CSS variables where possible, hex fallbacks for chart libraries
 */
export const chartColors = {
  primary: '#5470c6',
  success: '#52c41a',
  warning: '#faad14',
  error: '#f5222d',
  info: '#1890ff',
  muted: '#8c8c8c',
  /** Extended palette for multi-series */
  palette: [
    '#5470c6',
    '#91cc75',
    '#fac858',
    '#ee6666',
    '#73c0de',
    '#3ba272',
    '#fc8452',
    '#9a60b4',
    '#ea7ccc',
  ],
} as const

/**
 * Helper to get responsive chart height
 * Returns different heights based on viewport considerations
 */
export function getChartHeight(size: keyof typeof chartHeights = 'md'): number {
  return chartHeights[size]
}

/**
 * Helper to build grid classes
 */
export function getGridClasses(layout: keyof typeof gridLayouts): string {
  return `grid ${gridLayouts[layout]} ${spacing.chartGap}`
}
