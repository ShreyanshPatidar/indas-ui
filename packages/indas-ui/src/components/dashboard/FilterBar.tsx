'use client'

import * as React from 'react'
import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { X, RotateCcw, FileBarChart, ListFilter, Lightbulb, FileOutput, Printer, FileSpreadsheet, FileText, TrendingUp, Minus, Plus, Share2, CalendarDays, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dropdown } from '@/components/forms/dropdown'
import { DatePicker, DateRange } from '@/components/forms/date-picker'
import { Tabs } from '@/components/ui/navigation/tabs'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  Switch
} from '@/components/ui'

// ============================================================================
// Types
// ============================================================================

export interface FilterConfig {
  id: string
  label: string
  type: 'dropdown' | 'multiselect'
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

export interface ReportOption {
  value: string
  label: string
  dividerAfter?: boolean
}

export interface ToggleOption {
  value: string
  label: string
}

export type ForecastMethod = 'ma' | 'wma' | 'es' | 'holt'

export interface ForecastSelection {
  enabled: boolean
  method: ForecastMethod
  period: number
  horizon: number
}

export const FORECAST_METHODS: Array<{ value: ForecastMethod; label: string; hint: string }> = [
  { value: 'ma', label: 'Moving Avg', hint: 'Averages the last N values, all counted equally. Smooths out spikes but lags behind real shifts.' },
  { value: 'wma', label: 'Weighted', hint: 'Averages the last N values, newer ones weighted higher. Picks up recent changes sooner.' },
  { value: 'es', label: 'Exponential', hint: 'Blends all history, with influence fading the older a value gets. Smooth yet quick to adapt.' },
  { value: 'holt', label: 'Trend', hint: 'Exponential smoothing plus a trend component. The only method that projects the slope into future periods.' },
]

const FORECAST_PERIOD_LIMITS: Record<'Day' | 'Week' | 'Month' | 'Quarter' | 'Year', { min: number; max: number }> = {
  Day: { min: 2, max: 60 },
  Week: { min: 2, max: 52 },
  Month: { min: 2, max: 24 },
  Quarter: { min: 2, max: 12 },
  Year: { min: 2, max: 10 },
}

const FORECAST_HORIZON_LIMITS: Record<'Day' | 'Week' | 'Month' | 'Quarter' | 'Year', { min: number; max: number }> = {
  Day: { min: 1, max: 30 },
  Week: { min: 1, max: 26 },
  Month: { min: 1, max: 12 },
  Quarter: { min: 1, max: 8 },
  Year: { min: 1, max: 5 },
}

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function labelForUnit(timeFilter: 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year', offset: number): string {
  const now = new Date()
  switch (timeFilter) {
    case 'Day': {
      const d = new Date(now)
      d.setDate(now.getDate() + offset)
      return `${d.getDate()} ${SHORT_MONTHS[d.getMonth()]}`
    }
    case 'Week': {
      const d = new Date(now)
      d.setDate(now.getDate() + offset * 7)
      const oneJan = new Date(d.getFullYear(), 0, 1)
      const week = Math.ceil((((d.getTime() - oneJan.getTime()) / 86400000) + oneJan.getDay() + 1) / 7)
      return `W${week}`
    }
    case 'Month': {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1)
      return `${SHORT_MONTHS[d.getMonth()]} ${d.getFullYear()}`
    }
    case 'Quarter': {
      const d = new Date(now.getFullYear(), now.getMonth() + offset * 3, 1)
      return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`
    }
    case 'Year':
      return String(now.getFullYear() + offset)
  }
}

/** Range covering `count` periods. dir=-1 means the last N (ending this period), dir=+1 means next N (starting next period). */
function resolvePeriodRange(timeFilter: 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year', count: number, dir: -1 | 1): string {
  if (count < 1) return ''
  const start = dir === -1 ? -(count - 1) : 1
  const end = dir === -1 ? 0 : count
  const startLabel = labelForUnit(timeFilter, start)
  const endLabel = labelForUnit(timeFilter, end)
  return count === 1 ? endLabel : `${startLabel} – ${endLabel}`
}

const HOLT_BETA = 0.3

function holtState(values: number[], period: number): { level: number; trend: number } {
  const alpha = 2 / (period + 1)
  let level = values[0]
  let trend = values.length > 1 ? values[1] - values[0] : 0
  for (let i = 1; i < values.length; i++) {
    const prevLevel = level
    level = alpha * values[i] + (1 - alpha) * (level + trend)
    trend = HOLT_BETA * (level - prevLevel) + (1 - HOLT_BETA) * trend
  }
  return { level, trend }
}

export function computeForecast(values: number[], method: ForecastMethod, period: number): Array<number | null> {
  if (period < 1 || values.length === 0) return values.map(() => null)

  if (method === 'es' || method === 'holt') {
    const alpha = 2 / (period + 1)
    const out: number[] = [values[0]]
    if (method === 'es') {
      for (let i = 1; i < values.length; i++) {
        out.push(alpha * values[i] + (1 - alpha) * out[i - 1])
      }
    } else {
      let level = values[0]
      let trend = values.length > 1 ? values[1] - values[0] : 0
      for (let i = 1; i < values.length; i++) {
        const prevLevel = level
        level = alpha * values[i] + (1 - alpha) * (level + trend)
        trend = HOLT_BETA * (level - prevLevel) + (1 - HOLT_BETA) * trend
        out.push(level)
      }
    }
    return out
  }

  return values.map((_, i) => {
    if (i < period - 1) return null
    const window = values.slice(i - period + 1, i + 1)
    if (method === 'wma') {
      const denom = (period * (period + 1)) / 2
      return window.reduce((sum, v, j) => sum + v * (j + 1), 0) / denom
    }
    return window.reduce((sum, v) => sum + v, 0) / period
  })
}

export function projectForecast(values: number[], method: ForecastMethod, period: number, horizon: number): number[] {
  if (values.length === 0 || horizon < 1 || period < 1) return []

  if (method === 'holt') {
    const { level, trend } = holtState(values, period)
    return Array.from({ length: horizon }, (_, h) => level + trend * (h + 1))
  }

  let next: number
  if (method === 'es') {
    const smoothed = computeForecast(values, 'es', period)
    next = smoothed[smoothed.length - 1] as number
  } else {
    const window = values.slice(-period)
    if (method === 'wma') {
      const n = window.length
      const denom = (n * (n + 1)) / 2
      next = window.reduce((sum, v, j) => sum + v * (j + 1), 0) / denom
    } else {
      next = window.reduce((sum, v) => sum + v, 0) / window.length
    }
  }
  return Array.from({ length: horizon }, () => next)
}

export interface TimeFilterSelection {
  type: 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year'
  /** For Day type: selected days like ['today', 'yesterday', 'last7'] */
  days?: string[]
  /** For Week type: selected weeks like ['this', 'last', 'last2'] */
  weeks?: string[]
  /** For Month type: selected months like ['this', 'last', 'jan', 'feb'] */
  months?: string[]
  /** For Quarter type: selected quarters like ['Q1', 'Q2'] */
  quarters?: string[]
  /** For Year type: selected years */
  years?: string[]
}

export interface FilterBarProps {
  /** Dashboard title */
  title: string
  /** Dynamic context label (shown as subtitle) */
  contextLabel?: string
  /** Secondary toggle (e.g., Job/Value) */
  secondaryToggle?: {
    options: ToggleOption[]
    value: string
    onChange: (value: string) => void
  }
  /** Time filter */
  timeFilter?: 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year'
  onTimeFilterChange?: (filter: 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year') => void
  /** Time filter selection (for dropdown selections) */
  timeFilterSelection?: TimeFilterSelection
  onTimeFilterSelectionChange?: (selection: TimeFilterSelection) => void
  /** Hide time filter toggle */
  hideTimeFilter?: boolean
  /** Filter configurations */
  filters?: FilterConfig[]
  /** Filter values (controlled) */
  filterValues?: Record<string, string | string[]>
  onFilterChange?: (filterId: string, value: string | string[]) => void
  /** Date range */
  dateFrom?: Date
  dateTo?: Date
  onDateFromChange?: (date: Date | undefined) => void
  onDateToChange?: (date: Date | undefined) => void
  /** Apply/Reset handlers */
  onApply?: () => void
  onReset?: () => void
  /** Reports dropdown */
  reports?: ReportOption[]
  onReportSelect?: (reportValue: string) => void
  /** Export dropdown (Print, Excel, PDF) - shows automatically when onExport is provided */
  onExport?: (exportType: 'print' | 'excel' | 'pdf') => void
  /** Hide filter button */
  hideFilterButton?: boolean
  /** Hide date range picker */
  hideDateRange?: boolean
  /** Show Apply button */
  showApplyButton?: boolean
  /** Forecast selector — shows automatically when provided */
  forecast?: ForecastSelection
  onForecastChange?: (forecast: ForecastSelection) => void
  /** Share button — shows next to the forecast control when provided */
  onShare?: () => void
  /** Insights button */
  showInsights?: boolean
  insightsActive?: boolean
  onInsightsClick?: () => void
  /** Fiscal-year start year (e.g. 2026 for FY 2026-2027). Drives fiscal Week/Month/Quarter/Year options. */
  fiscalStartYear?: number
  /** Additional content */
  children?: React.ReactNode
  className?: string
  /** Layout variant: 'default' or 'centered' (title in center) */
  layout?: 'default' | 'centered'
}


// ============================================================================
// FilterBar Component
// ============================================================================

// Time filter dropdown options — quick = relative shortcuts (pinned footer), options = explicit list
const DAY_QUICK = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7', label: 'Last 7 Days' },
  { value: 'last14', label: 'Last 14 Days' },
  { value: 'last30', label: 'Last 30 Days' },
]
const DAY_OPTIONS = DAY_QUICK

const WEEK_QUICK = [
  { value: 'this', label: 'This Week' },
  { value: 'last', label: 'Last Week' },
  { value: 'last2', label: 'Last 2 Weeks' },
  { value: 'last4', label: 'Last 4 Weeks' },
]
// Fallback static list; the live options are built fiscal-year-aware in buildTimeOptions().
const WEEK_OPTIONS = [
  { value: 'W1', label: 'Week 1' },
  { value: 'W2', label: 'Week 2' },
  { value: 'W3', label: 'Week 3' },
  { value: 'W4', label: 'Week 4' },
  { value: 'W5', label: 'Week 5' },
]

const MONTH_QUICK = [
  { value: 'this', label: 'This Month' },
  { value: 'last', label: 'Last Month' },
]
const MONTH_OPTIONS = [
  { value: 'jan', label: 'Jan' },
  { value: 'feb', label: 'Feb' },
  { value: 'mar', label: 'Mar' },
  { value: 'apr', label: 'Apr' },
  { value: 'may', label: 'May' },
  { value: 'jun', label: 'Jun' },
  { value: 'jul', label: 'Jul' },
  { value: 'aug', label: 'Aug' },
  { value: 'sep', label: 'Sep' },
  { value: 'oct', label: 'Oct' },
  { value: 'nov', label: 'Nov' },
  { value: 'dec', label: 'Dec' },
]

const QUARTER_QUICK = [
  { value: 'this', label: 'This Quarter' },
  { value: 'last', label: 'Last Quarter' },
]
const QUARTER_OPTIONS = [
  { value: 'Q1', label: 'Q1 (Apr-Jun)' },
  { value: 'Q2', label: 'Q2 (Jul-Sep)' },
  { value: 'Q3', label: 'Q3 (Oct-Dec)' },
  { value: 'Q4', label: 'Q4 (Jan-Mar)' },
]

const currentYear = new Date().getFullYear()
const YEAR_QUICK = [
  { value: 'this', label: 'This Year' },
  { value: 'last', label: 'Last Year' },
]
const YEAR_OPTIONS = [
  { value: String(currentYear), label: String(currentYear) },
  { value: String(currentYear - 1), label: String(currentYear - 1) },
  { value: String(currentYear - 2), label: String(currentYear - 2) },
  { value: String(currentYear - 3), label: String(currentYear - 3) },
]

// Time filter toggle options with dropdown configs (static fallback)
const TIME_FILTER_OPTIONS = [
  { value: 'Day', label: 'Day', dropdownOptions: DAY_OPTIONS, quickOptions: DAY_QUICK },
  { value: 'Week', label: 'Week', dropdownOptions: WEEK_OPTIONS, quickOptions: WEEK_QUICK },
  { value: 'Month', label: 'Month', dropdownOptions: MONTH_OPTIONS, quickOptions: MONTH_QUICK },
  { value: 'Quarter', label: 'Quarter', dropdownOptions: QUARTER_OPTIONS, quickOptions: QUARTER_QUICK },
  { value: 'Year', label: 'Year', dropdownOptions: YEAR_OPTIONS, quickOptions: YEAR_QUICK },
]

const fmtFiscalDay = (d: Date) => `${String(d.getDate()).padStart(2, '0')} ${SHORT_MONTHS[d.getMonth()]}`

// Fiscal-year-aware dropdown options. FY runs 1 Apr (fyStart) → 31 Mar (fyStart+1).
// Weeks are W1..W52/53 counting 7-day spans from 1 Apr; months ordered Apr→Mar;
// quarters Q1 Apr-Jun … Q4 Jan-Mar; year shown as "YYYY-YYYY".
function buildTimeOptions(fyStart: number) {
  const fyOpen = new Date(fyStart, 3, 1)
  const fyClose = new Date(fyStart + 1, 2, 31)
  // Monday-aligned weeks clamped to the FY: W1 = 1 Apr → first Sunday (partial),
  // then each week runs Mon–Sun; the last week is clamped to 31 Mar.
  const firstSunday = new Date(fyStart, 3, 1 + ((7 - fyOpen.getDay()) % 7))
  const weeks: Array<{ value: string; label: string }> = []
  let from = new Date(fyOpen)
  let sunday = new Date(firstSunday)
  let wk = 1
  while (from <= fyClose) {
    const to = sunday > fyClose ? fyClose : sunday
    weeks.push({ value: `W${wk}`, label: `Week ${wk} (${fmtFiscalDay(from)} – ${fmtFiscalDay(to)})` })
    from = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + 1)
    sunday = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 6)
    wk++
  }
  const months = Array.from({ length: 12 }, (_, i) => {
    const mo = (3 + i) % 12
    const yr = mo >= 3 ? fyStart : fyStart + 1
    return { value: `${mo}`, label: `${SHORT_MONTHS[mo]} ${yr}` }
  })
  const quarters = [
    { value: 'Q1', label: `Q1 (Apr – Jun ${fyStart})` },
    { value: 'Q2', label: `Q2 (Jul – Sep ${fyStart})` },
    { value: 'Q3', label: `Q3 (Oct – Dec ${fyStart})` },
    { value: 'Q4', label: `Q4 (Jan – Mar ${fyStart + 1})` },
  ]
  const years = [{ value: `${fyStart}`, label: `${fyStart}-${fyStart + 1}` }]
  return [
    { value: 'Day', label: 'Day', dropdownOptions: DAY_OPTIONS, quickOptions: DAY_QUICK },
    { value: 'Week', label: 'Week', dropdownOptions: weeks, quickOptions: WEEK_QUICK },
    { value: 'Month', label: 'Month', dropdownOptions: months, quickOptions: MONTH_QUICK },
    { value: 'Quarter', label: 'Quarter', dropdownOptions: quarters, quickOptions: QUARTER_QUICK },
    { value: 'Year', label: 'Year', dropdownOptions: years, quickOptions: YEAR_QUICK },
  ]
}

function Stepper({
  value,
  min,
  max,
  onChange
}: {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  const [text, setText] = useState(String(value))

  useEffect(() => {
    setText(String(value))
  }, [value])

  const commit = () => {
    const parsed = parseInt(text, 10)
    const clamped = isNaN(parsed) ? value : Math.min(max, Math.max(min, parsed))
    setText(String(clamped))
    if (clamped !== value) onChange(clamped)
  }

  const buttonClasses = cn(
    'w-7 h-7 rounded-md flex items-center justify-center transition-colors shrink-0',
    'border border-[rgb(var(--bd-default))] text-[rgb(var(--fg-muted))]',
    'hover:bg-[rgb(var(--bg-subtle))] disabled:opacity-40 disabled:pointer-events-none'
  )
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={() => onChange(value - 1)} disabled={value <= min} className={buttonClasses}>
        <Minus className="w-3.5 h-3.5" />
      </button>
      <input
        value={text}
        onChange={(e) => setText(e.target.value.replace(/\D/g, ''))}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        inputMode="numeric"
        className={cn(
          'flex-1 h-7 w-full min-w-0 rounded-md border border-[rgb(var(--bd-default))] bg-transparent',
          'text-center text-xs font-semibold text-[rgb(var(--fg-default))]',
          'focus:outline-none focus:border-[rgb(var(--color-primary))]'
        )}
      />
      <button onClick={() => onChange(value + 1)} disabled={value >= max} className={buttonClasses}>
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function OverflowMenu({
  showInsights,
  insightsActive,
  onInsightsClick,
  reports,
  onReportSelect,
  onShare,
  onExport
}: {
  showInsights?: boolean
  insightsActive?: boolean
  onInsightsClick?: () => void
  reports: ReportOption[]
  onReportSelect?: (reportValue: string) => void
  onShare?: () => void
  onExport?: (exportType: 'print' | 'excel' | 'pdf') => void
}) {
  const { t } = useLanguage()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'w-7 h-7 rounded-md flex items-center justify-center transition-colors',
            'text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-subtle))]'
          )}
          title={t('More')}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 [&_[role=menuitem]]:cursor-pointer">
        {showInsights && (
          <DropdownMenuItem onClick={onInsightsClick}>
            <Lightbulb className={cn('w-4 h-4 mr-2', insightsActive && 'text-[rgb(var(--color-warning))]')} />
            {t('Sahay Insights')}
          </DropdownMenuItem>
        )}

        {reports.length > 0 && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FileBarChart className="w-4 h-4 mr-2" />
              {t('Reports')}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {reports.map((report) => (
                <DropdownMenuItem key={report.value} onClick={() => onReportSelect?.(report.value)}>
                  {report.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        {onShare && (
          <DropdownMenuItem onClick={onShare}>
            <Share2 className="w-4 h-4 mr-2" />
            {t('Share')}
          </DropdownMenuItem>
        )}

        {onExport && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FileOutput className="w-4 h-4 mr-2" />
              {t('Export')}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => onExport('print')}>
                <Printer className="w-4 h-4 mr-2" />
                {t('Print')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('excel')}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                {t('Excel')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('pdf')}>
                <FileText className="w-4 h-4 mr-2" />
                {t('PDF')}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ForecastControl({
  forecast,
  onForecastChange,
  timeFilter,
  onTimeFilterChange,
  bare = false
}: {
  forecast: ForecastSelection
  onForecastChange: (forecast: ForecastSelection) => void
  timeFilter: 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year'
  onTimeFilterChange?: (filter: 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year') => void
  bare?: boolean
}) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const limits = FORECAST_PERIOD_LIMITS[timeFilter]
  const horizonLimits = FORECAST_HORIZON_LIMITS[timeFilter]

  useEffect(() => {
    const period = Math.min(limits.max, Math.max(limits.min, forecast.period))
    const horizon = Math.min(horizonLimits.max, Math.max(horizonLimits.min, forecast.horizon))
    if (period !== forecast.period || horizon !== forecast.horizon) {
      onForecastChange({ ...forecast, period, horizon })
    }
  }, [timeFilter])

  const setPeriod = (p: number) => {
    onForecastChange({ ...forecast, period: Math.min(limits.max, Math.max(limits.min, p)) })
  }

  const setHorizon = (h: number) => {
    onForecastChange({ ...forecast, horizon: Math.min(horizonLimits.max, Math.max(horizonLimits.min, h)) })
  }

  const activeMethod = FORECAST_METHODS.find(m => m.value === forecast.method)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element
      if (target?.closest?.('[data-radix-popper-content-wrapper],[role="listbox"]')) return
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center justify-center transition-colors relative',
          bare ? 'w-7 h-7 rounded-md' : 'w-8 h-8 rounded-md border border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))]',
          open
            ? 'bg-[rgb(var(--color-primary))] text-white shadow-sm'
            : bare
              ? 'text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-subtle))]'
              : 'text-[rgb(var(--fg-muted))] hover:bg-[rgb(var(--bg-subtle))] hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))]'
        )}
        title={t('Forecast')}
      >
        <TrendingUp className="w-4 h-4" />
        {forecast.enabled && !open && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-[rgb(var(--color-primary))] rounded-full" />
        )}
      </button>

      {open && (
        <div
          className={cn(
            'absolute top-full right-0 mt-2 z-50 w-96 max-w-[calc(100vw-2rem)]',
            'bg-[rgb(var(--bg-surface))] rounded-xl shadow-xl border border-[rgb(var(--bd-default))]',
            'overflow-hidden'
          )}
        >
          <div className="px-3 py-2 border-b border-[rgb(var(--bd-default))] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold text-[rgb(var(--fg-default))] shrink-0">{t('Forecast')}</span>
              {onTimeFilterChange ? (
                <Dropdown
                  options={TIME_FILTER_OPTIONS.map(o => ({ value: o.value, label: t(o.label) }))}
                  value={timeFilter}
                  onValueChange={(v) => onTimeFilterChange(v as 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year')}
                  searchable={false}
                  size="sm"
                  triggerClassName="h-6 text-[11px] min-w-[6.5rem]"
                />
              ) : (
                <span className="text-[10px] text-[rgb(var(--fg-muted))]">· {t(timeFilter)}</span>
              )}
            </div>
            <Switch
              checked={forecast.enabled}
              onCheckedChange={(enabled) => onForecastChange({ ...forecast, enabled })}
            />
          </div>

          <div className={cn('p-3 space-y-3', !forecast.enabled && 'opacity-50 pointer-events-none')}>
            <Tabs
              tabs={FORECAST_METHODS.map(m => ({ id: m.value, label: t(m.label) }))}
              activeTab={forecast.method}
              onTabChange={(tabId) => onForecastChange({ ...forecast, method: tabId as ForecastMethod })}
              variant="rounded"
              size="sm"
              fullWidth
            />
            {activeMethod && (
              <p className="text-[10px] text-[rgb(var(--fg-muted))]">{t(activeMethod.hint)}</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-[rgb(var(--fg-muted))] uppercase tracking-wider mb-1 block">
                  {t('Based On Last')}
                </label>
                <Stepper value={forecast.period} min={limits.min} max={limits.max} onChange={setPeriod} />
                <p className="mt-1 text-[10px] text-[rgb(var(--fg-muted))] truncate">{resolvePeriodRange(timeFilter, forecast.period, -1)}</p>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[rgb(var(--fg-muted))] uppercase tracking-wider mb-1 block">
                  {t('Forecast Ahead')}
                </label>
                <Stepper value={forecast.horizon} min={horizonLimits.min} max={horizonLimits.max} onChange={setHorizon} />
                <p className="mt-1 text-[10px] text-[rgb(var(--fg-muted))] truncate">{resolvePeriodRange(timeFilter, forecast.horizon, 1)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function FilterBar({
  title,
  contextLabel,
  secondaryToggle,
  timeFilter = 'Week',
  onTimeFilterChange,
  timeFilterSelection,
  onTimeFilterSelectionChange,
  hideTimeFilter = false,
  filters = [],
  filterValues = {},
  onFilterChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onApply,
  onReset,
  reports = [],
  onReportSelect,
  onExport,
  hideFilterButton = false,
  hideDateRange = false,
  showApplyButton = false,
  forecast,
  onForecastChange,
  onShare,
  showInsights = false,
  insightsActive = false,
  onInsightsClick,
  children,
  className,
  layout = 'default',
  fiscalStartYear
}: FilterBarProps) {
  const [popoverOpen, setPopoverOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const timeOptions = useMemo(
    () => (fiscalStartYear ? buildTimeOptions(fiscalStartYear) : TIME_FILTER_OPTIONS),
    [fiscalStartYear]
  )

  // Handle click outside. Ignore clicks landing inside a portalled dropdown/select
  // list (rendered to document.body, outside popoverRef) so selecting a filter
  // option doesn't close this popover before the value commits.
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element
      if (target?.closest?.('[data-radix-popper-content-wrapper],[role="listbox"]')) return
      if (
        popoverOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setPopoverOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [popoverOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && popoverOpen) {
        setPopoverOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [popoverOpen])

  const handleDateRangeChange = useCallback((value: Date | DateRange | string | undefined) => {
    if (value && typeof value === 'object' && 'from' in value) {
      const range = value as DateRange
      onDateFromChange?.(range.from)
      onDateToChange?.(range.to)
    }
  }, [onDateFromChange, onDateToChange])

  const handleReset = () => {
    onDateFromChange?.(undefined)
    onDateToChange?.(undefined)
    onReset?.()
  }

  const hasActiveFilters = Object.values(filterValues).some(v => v && v.length > 0) || dateFrom || dateTo

  const dateRangeValue: DateRange = { from: dateFrom, to: dateTo }

  // Centered layout: Title in center, controls on left and right
  if (layout === 'centered') {
    return (
      <div className={cn('bg-[rgb(var(--bg-surface))] border-b border-[rgb(var(--bd-default))]', className)}>
        {/* Filter Panel - White card style */}
        <div className="px-4 py-3 lg:px-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Left side: Secondary toggle + Time filter */}
            <div className="flex items-center gap-3">
              {/* Secondary Toggle */}
              {secondaryToggle && (
                <Tabs
                  tabs={secondaryToggle.options.map(opt => ({ id: opt.value, label: opt.label }))}
                  activeTab={secondaryToggle.value}
                  onTabChange={secondaryToggle.onChange}
                  size="sm"
                />
              )}

              {/* Time Filter Buttons with Dropdowns */}
              {!hideTimeFilter && (
                <Tabs
                  tabs={timeOptions.map(opt => ({ id: opt.value, label: opt.label, dropdownOptions: opt.dropdownOptions, quickOptions: opt.quickOptions }))}
                  activeTab={timeFilter}
                  onTabChange={(tabId) => onTimeFilterChange?.(tabId as 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year')}
                  variant="rounded"
                  size="sm"
                  dropdownValues={{
                    Day: timeFilterSelection?.days || [],
                    Week: timeFilterSelection?.weeks || [],
                    Month: timeFilterSelection?.months || [],
                    Quarter: timeFilterSelection?.quarters || [],
                    Year: timeFilterSelection?.years || [],
                  }}
                  onDropdownChange={(tabId, selectedValues) => {
                    const filter = tabId as 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year'
                    const newSelection: TimeFilterSelection = {
                      type: filter,
                      ...(filter === 'Day' && { days: selectedValues }),
                      ...(filter === 'Week' && { weeks: selectedValues }),
                      ...(filter === 'Month' && { months: selectedValues }),
                      ...(filter === 'Quarter' && { quarters: selectedValues }),
                      ...(filter === 'Year' && { years: selectedValues }),
                    }
                    onTimeFilterSelectionChange?.(newSelection)
                  }}
                />
              )}
            </div>

            {/* Center: Title + Context */}
            <div className="flex-1 text-center">
              <h1 className="text-sm font-semibold text-[rgb(var(--fg-default))]">{title}</h1>
              {contextLabel && (
                <span className="text-xs text-[rgb(var(--fg-muted))]">{contextLabel}</span>
              )}
            </div>

            {/* Right side: Filter + Apply + Reports */}
            <div className="flex items-center gap-3">
              {/* Filter Button + Popover */}
              {!hideFilterButton && (
                <div className="relative">
                  <button
                    ref={buttonRef}
                    onClick={() => setPopoverOpen(!popoverOpen)}
                    className={cn(
                      'w-8 h-8 rounded-md flex items-center justify-center transition-colors relative',
                      'border border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))]',
                      'text-[rgb(var(--fg-muted))] hover:bg-[rgb(var(--bg-subtle))] hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))]',
                      popoverOpen && 'bg-[rgb(var(--color-primary))] text-white border-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary))]'
                    )}
                    title="Filters"
                  >
                    <ListFilter className="w-4 h-4" />
                    {hasActiveFilters && !popoverOpen && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-[rgb(var(--color-primary))] rounded-full" />
                    )}
                  </button>

                  {/* Filter Popover with Inline DatePicker */}
                  {popoverOpen && (
                    <div
                      ref={popoverRef}
                      className={cn(
                        'absolute top-full right-0 mt-2 z-50',
                        'w-[95vw] sm:w-auto',
                        'bg-[rgb(var(--bg-surface))] rounded-xl shadow-xl border border-[rgb(var(--bd-default))]',
                        'overflow-hidden'
                      )}
                    >
                      {/* Popover Header */}
                      <div className="px-3 py-2 border-b border-[rgb(var(--bd-default))] flex items-center justify-between">
                        <span className="text-xs font-semibold text-[rgb(var(--fg-default))]">Filters</span>
                        <button
                          onClick={() => setPopoverOpen(false)}
                          className="w-5 h-5 rounded flex items-center justify-center hover:bg-[rgb(var(--bg-subtle))] transition-colors"
                        >
                          <X className="w-3 h-3 text-[rgb(var(--fg-muted))]" />
                        </button>
                      </div>

                      {/* Popover Body */}
                      <div className="p-3 space-y-3">
                        {/* Dropdown Filters - Single Row */}
                        {filters.length > 0 && (
                          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${filters.length}, minmax(140px, 1fr))` }}>
                            {filters.map((filter) => (
                              <div key={filter.id}>
                                <label className="text-[10px] font-semibold text-[rgb(var(--fg-muted))] uppercase tracking-wider mb-1 block">
                                  {filter.label}
                                </label>
                                <Dropdown
                                  options={filter.options}
                                  multiSelect={filter.type === 'multiselect'}
                                  value={filterValues[filter.id] ?? (filter.type === 'multiselect' ? [] : '')}
                                  onValueChange={(value) => onFilterChange?.(filter.id, value as string | string[])}
                                  placeholder={filter.placeholder || `All ${filter.label}s`}
                                  searchable
                                  className="w-full"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {children}

                        {/* Inline DatePicker - Calendar Always Visible */}
                        {!hideDateRange && (
                          <DatePicker
                            mode="range"
                            value={dateRangeValue}
                            onChange={handleDateRangeChange}
                            inline
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Forecast Selector */}
              {forecast && onForecastChange && (
                <ForecastControl forecast={forecast} onForecastChange={onForecastChange} timeFilter={timeFilter} onTimeFilterChange={onTimeFilterChange} />
              )}

              {/* Apply Button */}
              {showApplyButton && (
                <button
                  onClick={onApply}
                  className={cn(
                    'h-8 px-4 rounded-md flex items-center gap-1.5',
                    'bg-[rgb(var(--color-primary))] text-white',
                    'text-xs font-semibold',
                    'shadow-sm hover:shadow-md transition-all',
                    'hover:brightness-110'
                  )}
                >
                  Apply
                </button>
              )}

              {/* Overflow Menu: Reports · Share · Export */}
              {(reports.length > 0 || onShare || onExport) && (
                <OverflowMenu
                  reports={reports}
                  onReportSelect={onReportSelect}
                  onShare={onShare}
                  onExport={onExport}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Default layout: Title centered, controls on right
  return (
    <header
      className={cn(
        'bg-[rgb(var(--bg-surface))] border-b border-[rgb(var(--bd-default))]',
        'px-4 py-3 lg:px-6',
        className
      )}
    >
      {/* Mobile: Title row + Controls row stacked. Desktop: single row */}

      {/* Row 1 (always): Left (Title) | Right (icon buttons) */}
      <div className="flex items-center gap-3">
        {/* Left: Title + period badge — takes all remaining space */}
        <div className="flex-1 min-w-0 flex items-center gap-2.5">
          <h1 className="text-base sm:text-xl font-bold text-[rgb(var(--fg-default))] leading-tight truncate">{title}</h1>
          {contextLabel && (
            <span className="hidden sm:inline-flex items-center gap-1.5 shrink-0 h-6 px-2.5 rounded-full border border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-subtle))] text-xs font-medium text-[rgb(var(--fg-muted))]">
              <CalendarDays className="w-3.5 h-3.5" />
              {contextLabel}
            </span>
          )}
        </div>

        {/* Right: Secondary toggle + time filter hidden on mobile, icon buttons always visible */}
        <div className="flex items-center gap-3">
          {/* Secondary Toggle — desktop only */}
          {secondaryToggle && (
            <>
              <div className="hidden sm:block">
                <Tabs
                  tabs={secondaryToggle.options.map(opt => ({ id: opt.value, label: opt.label }))}
                  activeTab={secondaryToggle.value}
                  onTabChange={secondaryToggle.onChange}
                  size="sm"
                />
              </div>
              <div className="hidden sm:block h-4 w-px bg-[rgb(var(--bd-default))] self-center" />
            </>
          )}

          {/* Time Filter — desktop only (shown in row 2 on mobile) */}
          {!hideTimeFilter && (
            <div className="hidden sm:block">
              <Tabs
                tabs={timeOptions.map(opt => ({ id: opt.value, label: opt.label, dropdownOptions: opt.dropdownOptions, quickOptions: opt.quickOptions }))}
                activeTab={timeFilter}
                onTabChange={(tabId) => onTimeFilterChange?.(tabId as 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year')}
                variant="rounded"
                size="sm"
                dropdownValues={{
                  Day: timeFilterSelection?.days || [],
                  Week: timeFilterSelection?.weeks || [],
                  Month: timeFilterSelection?.months || [],
                  Quarter: timeFilterSelection?.quarters || [],
                  Year: timeFilterSelection?.years || [],
                }}
                onDropdownChange={(tabId, selectedValues) => {
                  const filter = tabId as 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year'
                  const newSelection: TimeFilterSelection = {
                    type: filter,
                    ...(filter === 'Day' && { days: selectedValues }),
                    ...(filter === 'Week' && { weeks: selectedValues }),
                    ...(filter === 'Month' && { months: selectedValues }),
                    ...(filter === 'Quarter' && { quarters: selectedValues }),
                    ...(filter === 'Year' && { years: selectedValues }),
                  }
                  onTimeFilterSelectionChange?.(newSelection)
                }}
              />
            </div>
          )}

          {/* Control Bar: Filter · Forecast · More — matches time-filter pill group */}
          <div className="flex items-center gap-0.5 rounded-lg border border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))] p-0.5">

          {/* Filter Button + Popover */}
        {!hideFilterButton && (
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={() => setPopoverOpen(!popoverOpen)}
              className={cn(
                'w-7 h-7 rounded-md flex items-center justify-center transition-colors relative',
                popoverOpen
                  ? 'bg-[rgb(var(--color-primary))] text-white shadow-sm'
                  : 'text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-subtle))]'
              )}
              title="Filters"
            >
              <ListFilter className="w-4 h-4" />
              {hasActiveFilters && !popoverOpen && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-[rgb(var(--color-primary))] rounded-full" />
              )}
            </button>

            {/* Filter Popover with Inline DatePicker */}
            {popoverOpen && (
              <div
                ref={popoverRef}
                className={cn(
                  'absolute top-full right-0 mt-2 z-50',
                  'w-[95vw] sm:w-auto',
                  'bg-[rgb(var(--bg-surface))] rounded-xl shadow-xl border border-[rgb(var(--bd-default))]',
                  'overflow-hidden'
                )}
              >
                {/* Popover Header */}
                <div className="px-3 py-2 border-b border-[rgb(var(--bd-default))] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[rgb(var(--fg-default))]">Filters</span>
                  <button
                    onClick={() => setPopoverOpen(false)}
                    className="w-5 h-5 rounded flex items-center justify-center hover:bg-[rgb(var(--bg-subtle))] transition-colors"
                  >
                    <X className="w-3 h-3 text-[rgb(var(--fg-muted))]" />
                  </button>
                </div>

                {/* Popover Body */}
                <div className="p-3 space-y-3">
                  {/* Dropdown Filters — up to 3 per row, wraps to additional rows */}
                  {filters.length > 0 && (
                    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(filters.length, 3)}, minmax(140px, 1fr))` }}>
                      {filters.map((filter) => (
                        <div key={filter.id}>
                          <label className="text-[10px] font-semibold text-[rgb(var(--fg-muted))] uppercase tracking-wider mb-1 block">
                            {filter.label}
                          </label>
                          <Dropdown
                            options={filter.options}
                            multiSelect={filter.type === 'multiselect'}
                            value={filterValues[filter.id] ?? (filter.type === 'multiselect' ? [] : '')}
                            onValueChange={(value) => onFilterChange?.(filter.id, value as string | string[])}
                            placeholder={filter.placeholder || `All ${filter.label}s`}
                            searchable
                            className="w-full"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {children}

                  {/* Inline DatePicker - Calendar Always Visible */}
                  {!hideDateRange && (
                    <DatePicker
                      mode="range"
                      value={dateRangeValue}
                      onChange={handleDateRangeChange}
                      inline
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Forecast Selector */}
        {forecast && onForecastChange && (
          <ForecastControl forecast={forecast} onForecastChange={onForecastChange} timeFilter={timeFilter} onTimeFilterChange={onTimeFilterChange} bare />
        )}

        {/* Overflow Menu: Insights · Reports · Share · Export */}
        {(showInsights || reports.length > 0 || onShare || onExport) && (
          <OverflowMenu
            showInsights={showInsights}
            insightsActive={insightsActive}
            onInsightsClick={onInsightsClick}
            reports={reports}
            onReportSelect={onReportSelect}
            onShare={onShare}
            onExport={onExport}
          />
        )}

          </div>

        {/* Apply Button */}
        {showApplyButton && (
          <button
            onClick={onApply}
            className={cn(
              'h-8 px-4 rounded-md flex items-center gap-1.5',
              'bg-[rgb(var(--color-primary))] text-white',
              'text-xs font-semibold',
              'shadow-sm hover:shadow-md transition-all',
              'hover:brightness-110'
            )}
          >
            Apply
          </button>
        )}
        </div>
      </div>

      {/* Mobile period badge */}
      {contextLabel && (
        <span className="sm:hidden mt-2 inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full border border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-subtle))] text-xs font-medium text-[rgb(var(--fg-muted))]">
          <CalendarDays className="w-3.5 h-3.5" />
          {contextLabel}
        </span>
      )}

      {/* Row 2 — mobile only: time filter tabs + secondary toggle */}
      {(!hideTimeFilter || secondaryToggle) && (
        <div className="sm:hidden mt-2 flex items-center gap-2 overflow-x-auto">
          {secondaryToggle && (
            <Tabs
              tabs={secondaryToggle.options.map(opt => ({ id: opt.value, label: opt.label }))}
              activeTab={secondaryToggle.value}
              onTabChange={secondaryToggle.onChange}
              size="sm"
            />
          )}
          {!hideTimeFilter && (
            <Tabs
              tabs={timeOptions.map(opt => ({ id: opt.value, label: opt.label, dropdownOptions: opt.dropdownOptions, quickOptions: opt.quickOptions }))}
              activeTab={timeFilter}
              onTabChange={(tabId) => onTimeFilterChange?.(tabId as 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year')}
              variant="rounded"
              size="sm"
              dropdownValues={{
                Day: timeFilterSelection?.days || [],
                Week: timeFilterSelection?.weeks || [],
                Month: timeFilterSelection?.months || [],
                Quarter: timeFilterSelection?.quarters || [],
                Year: timeFilterSelection?.years || [],
              }}
              onDropdownChange={(tabId, selectedValues) => {
                const filter = tabId as 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year'
                const newSelection: TimeFilterSelection = {
                  type: filter,
                  ...(filter === 'Day' && { days: selectedValues }),
                  ...(filter === 'Week' && { weeks: selectedValues }),
                  ...(filter === 'Month' && { months: selectedValues }),
                  ...(filter === 'Quarter' && { quarters: selectedValues }),
                  ...(filter === 'Year' && { years: selectedValues }),
                }
                onTimeFilterSelectionChange?.(newSelection)
              }}
            />
          )}
        </div>
      )}
    </header>
  )
}
