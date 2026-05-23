'use client'

import * as React from 'react'
import { useRef, useEffect, useState, useCallback } from 'react'
import { X, RotateCcw, FileBarChart, ListFilter, Lightbulb, FileOutput, Printer, FileSpreadsheet, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dropdown } from '@/components/forms/dropdown'
import { DatePicker, DateRange } from '@/components/forms/date-picker'
import { Tabs } from '@/components/ui/navigation/tabs'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
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
  /** Insights button */
  showInsights?: boolean
  insightsActive?: boolean
  onInsightsClick?: () => void
  /** Additional content */
  children?: React.ReactNode
  className?: string
  /** Layout variant: 'default' or 'centered' (title in center) */
  layout?: 'default' | 'centered'
}


// ============================================================================
// FilterBar Component
// ============================================================================

// Time filter dropdown options
const DAY_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7', label: 'Last 7 Days' },
  { value: 'last14', label: 'Last 14 Days' },
  { value: 'last30', label: 'Last 30 Days' },
]

const WEEK_OPTIONS = [
  { value: 'this', label: 'This Week' },
  { value: 'last', label: 'Last Week' },
  { value: 'last2', label: 'Last 2 Weeks' },
  { value: 'last4', label: 'Last 4 Weeks' },
  { value: 'W1', label: 'Week 1' },
  { value: 'W2', label: 'Week 2' },
  { value: 'W3', label: 'Week 3' },
  { value: 'W4', label: 'Week 4' },
  { value: 'W5', label: 'Week 5' },
]

const MONTH_OPTIONS = [
  { value: 'this', label: 'This Month' },
  { value: 'last', label: 'Last Month' },
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

const QUARTER_OPTIONS = [
  { value: 'this', label: 'This Quarter' },
  { value: 'last', label: 'Last Quarter' },
  { value: 'Q1', label: 'Q1 (Apr-Jun)' },
  { value: 'Q2', label: 'Q2 (Jul-Sep)' },
  { value: 'Q3', label: 'Q3 (Oct-Dec)' },
  { value: 'Q4', label: 'Q4 (Jan-Mar)' },
]

const currentYear = new Date().getFullYear()
const YEAR_OPTIONS = [
  { value: 'this', label: 'This Year' },
  { value: 'last', label: 'Last Year' },
  { value: String(currentYear), label: String(currentYear) },
  { value: String(currentYear - 1), label: String(currentYear - 1) },
  { value: String(currentYear - 2), label: String(currentYear - 2) },
  { value: String(currentYear - 3), label: String(currentYear - 3) },
]

// Time filter toggle options with dropdown configs
const TIME_FILTER_OPTIONS = [
  { value: 'Day', label: 'Day', dropdownOptions: DAY_OPTIONS },
  { value: 'Week', label: 'Week', dropdownOptions: WEEK_OPTIONS },
  { value: 'Month', label: 'Month', dropdownOptions: MONTH_OPTIONS },
  { value: 'Quarter', label: 'Quarter', dropdownOptions: QUARTER_OPTIONS },
  { value: 'Year', label: 'Year', dropdownOptions: YEAR_OPTIONS },
]

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
  showInsights = false,
  insightsActive = false,
  onInsightsClick,
  children,
  className,
  layout = 'default'
}: FilterBarProps) {
  const [popoverOpen, setPopoverOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
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
                  tabs={TIME_FILTER_OPTIONS.map(opt => ({ id: opt.value, label: opt.label, dropdownOptions: opt.dropdownOptions }))}
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
                                  value={filterValues[filter.id] as string}
                                  onValueChange={(value) => onFilterChange?.(filter.id, String(value))}
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

              {/* Export Dropdown */}
              {onExport && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        'w-8 h-8 rounded-md flex items-center justify-center transition-colors',
                        'border border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))]',
                        'text-[rgb(var(--fg-muted))] hover:bg-[rgb(var(--bg-subtle))] hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))]'
                      )}
                      title="Export"
                    >
                      <FileOutput className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => onExport('print')}>
                      <Printer className="w-4 h-4 mr-2" />
                      Print
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onExport('excel')}>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onExport('pdf')}>
                      <FileText className="w-4 h-4 mr-2" />
                      PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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

              {/* Reports Dropdown */}
              {reports.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        'w-8 h-8 rounded-md flex items-center justify-center transition-colors',
                        'border border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))]',
                        'text-[rgb(var(--fg-muted))] hover:bg-[rgb(var(--bg-subtle))] hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))]'
                      )}
                      title="Reports"
                    >
                      <FileBarChart className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {reports.map((report) => (
                      <React.Fragment key={report.value}>
                        <DropdownMenuItem onClick={() => onReportSelect?.(report.value)}>
                          {report.label}
                        </DropdownMenuItem>
                        {report.dividerAfter && <DropdownMenuSeparator />}
                      </React.Fragment>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
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

      {/* Row 1 (always): Left (Reports/Insights) | Center (Title) | Right (icon buttons) */}
      <div className="flex items-center gap-3">
        {/* Left: Reports & Insights */}
        <div className="flex items-center gap-2">
          {/* Reports Dropdown */}
          {reports.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'w-8 h-8 rounded-md flex items-center justify-center transition-colors',
                    'border border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))]',
                    'text-[rgb(var(--fg-muted))] hover:bg-[rgb(var(--bg-subtle))] hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))]'
                  )}
                  title="Reports"
                >
                  <FileBarChart className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {reports.map((report) => (
                  <React.Fragment key={report.value}>
                    <DropdownMenuItem onClick={() => onReportSelect?.(report.value)}>
                      {report.label}
                    </DropdownMenuItem>
                    {report.dividerAfter && <DropdownMenuSeparator />}
                  </React.Fragment>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Insights Button */}
          {showInsights && (
            <button
              onClick={onInsightsClick}
              className={cn(
                'w-8 h-8 rounded-md flex items-center justify-center transition-colors',
                'border border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))]',
                insightsActive
                  ? 'bg-[rgb(var(--color-warning))]/10 border-[rgb(var(--color-warning))] text-[rgb(var(--color-warning))]'
                  : 'text-[rgb(var(--fg-muted))] hover:bg-[rgb(var(--bg-subtle))] hover:border-[rgb(var(--color-warning))] hover:text-[rgb(var(--color-warning))]'
              )}
              title="Insights"
            >
              <Lightbulb className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Center: Title — takes all remaining space on mobile */}
        <div className="flex-1 text-center">
          <h1 className="text-base sm:text-xl font-bold text-[rgb(var(--fg-default))] leading-tight">{title}</h1>
          {contextLabel && (
            <p className="text-xs sm:text-sm text-[rgb(var(--fg-muted))]">{contextLabel}</p>
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
                tabs={TIME_FILTER_OPTIONS.map(opt => ({ id: opt.value, label: opt.label, dropdownOptions: opt.dropdownOptions }))}
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

          {/* Divider — desktop only */}
          {(!hideTimeFilter || secondaryToggle) && (!hideFilterButton || reports.length > 0) && (
            <div className="hidden sm:block h-6 w-px bg-[rgb(var(--bd-default))]" />
          )}

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
                            value={filterValues[filter.id] as string}
                            onValueChange={(value) => onFilterChange?.(filter.id, String(value))}
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

        {/* Export Dropdown */}
        {onExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'w-8 h-8 rounded-md flex items-center justify-center transition-colors',
                  'border border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))]',
                  'text-[rgb(var(--fg-muted))] hover:bg-[rgb(var(--bg-subtle))] hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))]'
                )}
                title="Export"
              >
                <FileOutput className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onExport('print')}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('excel')}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('pdf')}>
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
        </div>
      </div>

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
              tabs={TIME_FILTER_OPTIONS.map(opt => ({ id: opt.value, label: opt.label, dropdownOptions: opt.dropdownOptions }))}
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
