/**
 * ECharts Theme Utility
 *
 * Provides dark mode compatible colors for ECharts components.
 * Uses CSS variables that automatically adapt to light/dark mode.
 */

/**
 * Get computed CSS variable value
 */
function getCSSVar(varName: string): string {
  if (typeof window === 'undefined') return ''
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  return value
}

/**
 * Check if dark mode is active
 */
export function isDarkMode(): boolean {
  if (typeof window === 'undefined') return false
  return document.documentElement.classList.contains('dark')
}

/**
 * Get theme colors for ECharts
 */
export function getChartTheme() {
  const dark = isDarkMode()

  return {
    // Background colors
    backgroundColor: dark ? 'rgb(30, 30, 35)' : 'rgb(255, 255, 255)',

    // Tooltip
    tooltip: {
      backgroundColor: dark ? 'rgba(45, 45, 50, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      borderColor: dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      textColor: dark ? 'rgb(229, 231, 235)' : 'rgb(52, 71, 103)',
    },

    // Text colors
    textColor: dark ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)',
    textColorStrong: dark ? 'rgb(229, 231, 235)' : 'rgb(52, 71, 103)',

    // Axis colors
    axisLine: dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    splitLine: dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',

    // Series colors (work well in both modes)
    colors: [
      '#5470c6', // blue
      '#91cc75', // green
      '#fac858', // yellow
      '#ee6666', // red
      '#73c0de', // cyan
      '#3ba272', // teal
      '#fc8452', // orange
      '#9a60b4', // purple
    ],

    // Status colors
    success: dark ? 'rgb(74, 222, 128)' : 'rgb(34, 197, 94)',
    error: dark ? 'rgb(248, 113, 113)' : 'rgb(239, 68, 68)',
    warning: dark ? 'rgb(251, 191, 36)' : 'rgb(245, 158, 11)',
    info: dark ? 'rgb(96, 165, 250)' : 'rgb(59, 130, 246)',
  }
}

/**
 * Get tooltip config for ECharts
 */
export function getTooltipConfig() {
  const theme = getChartTheme()

  return {
    backgroundColor: theme.tooltip.backgroundColor,
    borderColor: theme.tooltip.borderColor,
    borderWidth: 1,
    textStyle: {
      color: theme.tooltip.textColor,
      fontSize: 12
    }
  }
}

/**
 * Get legend config for ECharts
 */
export function getLegendConfig(position: 'bottom' | 'top' | 'right' = 'bottom') {
  const theme = getChartTheme()

  const baseConfig = {
    itemWidth: 20,
    itemHeight: 3,
    textStyle: {
      fontSize: 12,
      color: theme.textColor
    }
  }

  if (position === 'bottom') {
    return { ...baseConfig, bottom: 0, left: 'center' }
  } else if (position === 'top') {
    return { ...baseConfig, top: 0, left: 'center' }
  } else {
    return { ...baseConfig, right: 0, top: 'center', orient: 'vertical' }
  }
}

/**
 * Get axis config for ECharts
 */
export function getAxisConfig() {
  const theme = getChartTheme()

  return {
    axisLine: { lineStyle: { color: theme.axisLine } },
    axisLabel: { color: theme.textColor, fontSize: 11 },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: theme.splitLine, type: 'dashed' as const } }
  }
}

/**
 * Get grid config for ECharts
 */
export function getGridConfig(showLegend: boolean = true) {
  return {
    top: 20,
    right: 20,
    bottom: showLegend ? 40 : 20,
    left: 40,
    containLabel: true
  }
}
