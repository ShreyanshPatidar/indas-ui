'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  X, Plus, Trash2, ListFilter, Eye, EyeOff,
  ArrowUpDown, GripVertical, Layers,
  Check, XCircle,
} from 'lucide-react'
import { ColumnDef, Table, SortingState, Column } from '@tanstack/react-table'
import type { LucideIcon } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { restrictToParentElement } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui'
import { Button } from '@/components/ui'
import { Tabs } from '@/components/ui'
import { Input } from '@/components/ui'
import { Label } from '@/components/ui'
import { Dropdown } from '@/components'
import { Separator } from '@/components/ui'
import { DatePicker, DateRange } from '@/components/forms/date-picker/DatePicker'
import { Footer } from '@/components/layout/footer'
import { useLanguage } from '@/contexts/LanguageContext'

// ─── Types ─────────────────────────────────────────────────────

export interface FilterCondition {
  id: string
  column: string
  operator: string
  value: any
  type: 'string' | 'number' | 'date' | 'boolean' | 'multi-select'
  /** How this condition joins the previous one. Ignored for the first condition. */
  connector?: 'AND' | 'OR'
}

type TabId = 'filters' | 'columns' | 'sort'

// UI-only columns that must never appear as filterable / sortable data fields.
const NON_DATA_COLUMN_IDS = new Set(['select', 'selection', 'actions', 'expand', 'drag'])

interface AdvancedFilterModalProps<TData> {
  isOpen: boolean
  onClose: () => void
  onApply: (filters: FilterCondition[]) => void
  columns: ColumnDef<TData>[]
  data: TData[]
  // Columns tab
  table?: Table<TData>
  // Sort tab
  sorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
  // Grouping
  enableGrouping?: boolean
  grouping?: string[]
  onGroupingChange?: (columnId: string) => void
  onClearGrouping?: () => void
  // Initial tab
  initialTab?: TabId
}

// ─── Operators ─────────────────────────────────────────────────

const STRING_OPERATORS = [
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does not contain' },
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Does not equal' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'ends_with', label: 'Ends with' },
  { value: 'is_empty', label: 'Is empty' },
  { value: 'is_not_empty', label: 'Is not empty' },
]

const NUMBER_OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Does not equal' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'greater_than_equal', label: 'Greater than or equal' },
  { value: 'less_than', label: 'Less than' },
  { value: 'less_than_equal', label: 'Less than or equal' },
  { value: 'between', label: 'Between' },
  { value: 'not_between', label: 'Not between' },
]

const DATE_OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Does not equal' },
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
  { value: 'between', label: 'Between' },
  { value: 'last_7_days', label: 'Last 7 days' },
  { value: 'last_30_days', label: 'Last 30 days' },
  { value: 'this_month', label: 'This month' },
  { value: 'this_year', label: 'This year' },
]

const BOOLEAN_OPERATORS = [
  { value: 'is_true', label: 'Is true' },
  { value: 'is_false', label: 'Is false' },
]

// ─── Tab definitions ───────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'filters', label: 'Filters', icon: ListFilter },
  { id: 'columns', label: 'Columns', icon: Eye },
  { id: 'sort', label: 'Sort', icon: ArrowUpDown },
]

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function AdvancedFilterModal<TData>({
  isOpen,
  onClose,
  onApply,
  columns,
  data,
  table,
  sorting = [],
  onSortingChange,
  enableGrouping = false,
  grouping = [],
  onGroupingChange,
  onClearGrouping,
  initialTab = 'filters',
}: AdvancedFilterModalProps<TData>) {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<TabId>(initialTab)
  const [filters, setFilters] = useState<FilterCondition[]>([])
  const [matchType, setMatchType] = useState<'all' | 'any'>('all')

  // Reset tab when modal opens
  React.useEffect(() => {
    if (isOpen) setActiveTab(initialTab)
  }, [isOpen, initialTab])

  // ─── Filterable columns ──────────────────────────────────────

  const filterableColumns = useMemo(() => {
    return columns
      .filter((col) => {
        // Exclude UI-only columns (selection checkbox, actions, expand toggle) — they
        // hold no data to filter on and shouldn't appear as filterable fields.
        const id = (col as any).accessorKey || col.id
        if (NON_DATA_COLUMN_IDS.has(id)) return false
        return !!id
      })
      .map((col) => {
        const key = (col as any).accessorKey as string || col.id!
        const sampleValues = data.slice(0, 100).map(row => (row as any)[key]).filter(val => val != null)
        let type: FilterCondition['type'] = 'string'

        if (sampleValues.length > 0) {
          const firstValue = sampleValues[0]
          if (typeof firstValue === 'boolean') type = 'boolean'
          else if (typeof firstValue === 'number') type = 'number'
          else if (firstValue instanceof Date || (typeof firstValue === 'string' && !isNaN(Date.parse(firstValue)))) type = 'date'
        }

        const uniqueValues = [...new Set(sampleValues.map(val => String(val)))].sort()
        let label = key
        if (typeof col.header === 'string') label = col.header

        return { key, label, type, uniqueValues: uniqueValues.slice(0, 50) }
      })
  }, [columns, data])

  // ─── Sortable columns from table ─────────────────────────────

  const sortableColumns = useMemo(() => {
    if (!table) return filterableColumns.map(c => ({ id: c.key, label: c.label }))
    return table.getAllColumns()
      .filter(col => col.getCanSort() && !NON_DATA_COLUMN_IDS.has(col.id))
      .map(col => {
        let label = col.id
        if (typeof col.columnDef.header === 'string') label = col.columnDef.header
        return { id: col.id, label }
      })
  }, [table, filterableColumns])

  // ─── Hideable columns from table ─────────────────────────────

  const hideableColumns = useMemo(() => {
    if (!table) return []
    return table.getAllColumns()
      .filter(col => col.getCanHide() && !NON_DATA_COLUMN_IDS.has(col.id))
      .map(col => {
        let label = col.id
        if (typeof col.columnDef.header === 'string') label = col.columnDef.header
        return { id: col.id, label, visible: col.getIsVisible() }
      })
  }, [table, table?.getState().columnVisibility])

  // ─── Groupable columns ───────────────────────────────────────

  const groupableColumns = useMemo(() => {
    if (!table || !enableGrouping) return []
    return table.getAllColumns()
      .filter(col => !NON_DATA_COLUMN_IDS.has(col.id) && col.getCanGroup?.() !== false)
      .map(col => {
        let label = col.id
        if (typeof col.columnDef.header === 'string') label = col.columnDef.header
        return { id: col.id, label }
      })
  }, [table, enableGrouping])

  // ─── Filter handlers ─────────────────────────────────────────

  const addFilter = () => {
    setFilters([...filters, {
      id: Date.now().toString(),
      column: filterableColumns[0]?.key || '',
      operator: 'contains',
      value: '',
      type: filterableColumns[0]?.type || 'string',
    }])
  }

  const removeFilter = (filterId: string) => setFilters(filters.filter(f => f.id !== filterId))
  const updateFilter = (filterId: string, updates: Partial<FilterCondition>) => setFilters(filters.map(f => f.id === filterId ? { ...f, ...updates } : f))

  const getOperators = (type: FilterCondition['type']) => {
    switch (type) {
      case 'number': return NUMBER_OPERATORS
      case 'date': return DATE_OPERATORS
      case 'boolean': return BOOLEAN_OPERATORS
      default: return STRING_OPERATORS
    }
  }

  // ─── Sort handlers ────────────────────────────────────────────

  const handleSort = (columnId: string) => {
    if (!onSortingChange) return
    const existing = sorting.find(s => s.id === columnId)
    if (existing) {
      if (existing.desc) {
        // desc → remove
        onSortingChange(sorting.filter(s => s.id !== columnId))
      } else {
        // asc → desc
        onSortingChange(sorting.map(s => s.id === columnId ? { ...s, desc: true } : s))
      }
    } else {
      // append so the drag-ordered sort priority is preserved
      onSortingChange([...sorting, { id: columnId, desc: false }])
    }
  }

  const clearSort = () => onSortingChange?.([])

  const reorderSorting = (from: number, to: number) => {
    if (!onSortingChange) return
    onSortingChange(arrayMove(sorting, from, to))
  }

  // ─── Render value input ───────────────────────────────────────

  const renderValueInput = (filter: FilterCondition) => {
    const columnInfo = filterableColumns.find(col => col.key === filter.column)
    if (!columnInfo) return null

    if (['is_empty', 'is_not_empty', 'is_true', 'is_false', 'last_7_days', 'last_30_days', 'this_month', 'this_year'].includes(filter.operator)) {
      return null
    }

    switch (filter.type) {
      case 'boolean':
        return (
          <Dropdown
            options={[{ value: 'true', label: 'True' }, { value: 'false', label: 'False' }]}
            value={filter.value?.toString()}
            onValueChange={(value) => updateFilter(filter.id, { value: value === 'true' })}
            placeholder={t('Select value')}
          />
        )
      case 'number':
        if (['between', 'not_between'].includes(filter.operator)) {
          return (
            <div className="flex items-center gap-2">
              <Input type="number" placeholder="Min" value={filter.value?.min || ''} onChange={(e) => updateFilter(filter.id, { value: { ...filter.value, min: parseFloat(e.target.value) } })} />
              <span className="text-[rgb(var(--fg-muted))] text-xs">to</span>
              <Input type="number" placeholder="Max" value={filter.value?.max || ''} onChange={(e) => updateFilter(filter.id, { value: { ...filter.value, max: parseFloat(e.target.value) } })} />
            </div>
          )
        }
        return <Input type="number" placeholder={t('Enter value')} value={filter.value || ''} onChange={(e) => updateFilter(filter.id, { value: parseFloat(e.target.value) })} />
      case 'date':
        if (filter.operator === 'between') {
          return <DatePicker mode="range" value={filter.value || {}} onChange={(range) => updateFilter(filter.id, { value: range })} placeholder={t('Select date range...')} showFromTo={true} />
        }
        return <DatePicker mode="single" value={filter.value ? new Date(filter.value) : undefined} onChange={(date) => updateFilter(filter.id, { value: date })} placeholder={t('Select date...')} />
      default:
        if (columnInfo.uniqueValues.length <= 20 && columnInfo.uniqueValues.length > 2) {
          return (
            <Dropdown
              options={columnInfo.uniqueValues.map(v => ({ value: v, label: v }))}
              value={Array.isArray(filter.value) ? filter.value[0] || '' : filter.value || ''}
              onValueChange={(value) => updateFilter(filter.id, { value })}
              placeholder={t('Select value...')}
            />
          )
        }
        return <Input type="text" placeholder={t('Enter value')} value={filter.value || ''} onChange={(e) => updateFilter(filter.id, { value: e.target.value })} />
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[100dvh] sm:h-[80vh] sm:max-h-[720px] flex flex-col p-0 bg-[rgb(var(--bg-surface))] overflow-hidden border-0 shadow-2xl" hideCloseButton>
        {/* Hidden title for accessibility */}
        <DialogTitle className="sr-only">{t('Table Settings')}</DialogTitle>

        {/* ─── Tab Bar with close button ──────────────────────── */}
        <div className="flex-shrink-0 border-b border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))] flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5">
          <Tabs
            tabs={TABS.map(tab => {
              const count = tab.id === 'filters' ? filters.length
                : tab.id === 'sort' ? sorting.length
                : tab.id === 'columns' ? hideableColumns.filter(c => !c.visible).length
                : 0
              return {
                id: tab.id,
                label: count > 0 ? `${t(tab.label)} (${count})` : t(tab.label),
                icon: tab.icon,
              }
            })}
            activeTab={activeTab}
            onTabChange={(id) => setActiveTab(id as TabId)}
            variant="pill"
            size="md"
          />
          <button onClick={onClose} className="close-btn-md flex-shrink-0" aria-label={t('Close')}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ─── Tab Content ────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'filters' && (
            <FiltersTab
              filters={filters}
              setFilters={setFilters}
              matchType={matchType}
              setMatchType={setMatchType}
              filterableColumns={filterableColumns}
              addFilter={addFilter}
              removeFilter={removeFilter}
              updateFilter={updateFilter}
              getOperators={getOperators}
              renderValueInput={renderValueInput}
              t={t}
            />
          )}

          {activeTab === 'columns' && (
            <ColumnsTab
              hideableColumns={hideableColumns}
              table={table}
              enableGrouping={enableGrouping}
              groupableColumns={groupableColumns}
              grouping={grouping}
              onGroupingChange={onGroupingChange}
              onClearGrouping={onClearGrouping}
              t={t}
            />
          )}

          {activeTab === 'sort' && (
            <SortTab
              sortableColumns={sortableColumns}
              sorting={sorting}
              handleSort={handleSort}
              clearSort={clearSort}
              reorderSorting={reorderSorting}
              t={t}
            />
          )}

        </div>

        {/* ─── Footer ─────────────────────────────────────────── */}
        {activeTab === 'filters' && (
          <Footer
            variant="modal"
            gradient={true}
            actions={
              <>
                <Button variant="action-cancel" onClick={onClose} icon={XCircle}>
                  {t('Cancel')}
                </Button>
                <Button
                  variant="action-apply"
                  icon={Check}
                  onClick={() => onApply(filters.map((f, i) => ({
                    ...f,
                    // First condition has no connector; the rest default to the global match type.
                    connector: i === 0 ? undefined : (f.connector || (matchType === 'any' ? 'OR' : 'AND')),
                  })))}
                  disabled={filters.length === 0}
                >
                  {t('Apply Filters')} ({filters.length})
                </Button>
              </>
            }
          />
        )}

        {activeTab !== 'filters' && (
          <Footer
            variant="modal"
            gradient={true}
            actions={
              <Button variant="action-apply" icon={Check} onClick={onClose}>
                {t('Apply')}
              </Button>
            }
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

// ═══════════════════════════════════════════════════════════════
// FILTERS TAB
// ═══════════════════════════════════════════════════════════════

function FiltersTab({
  filters, setFilters, matchType, setMatchType,
  filterableColumns, addFilter, removeFilter, updateFilter,
  getOperators, renderValueInput, t,
}: any) {
  return (
    <div className="px-4 sm:px-6 pt-3 pb-4 space-y-3">
      {/* Quick Filters */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-[rgb(var(--fg-muted))] uppercase tracking-wider">{t('Quick Add')}</h3>
          <span className="text-xs text-[rgb(var(--fg-subtle))]">{t('Click column to add filter')}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {filterableColumns.slice(0, 12).map((col: any) => {
            const isActive = filters.some((f: any) => f.column === col.key)
            return (
              <Button
                key={col.key}
                variant={isActive ? 'primary' : 'outline'}
                size="sm"
                onClick={() => {
                  if (!isActive) {
                    setFilters([...filters, {
                      id: Date.now().toString(),
                      column: col.key,
                      operator: col.type === 'string' ? 'contains' : 'equals',
                      value: '',
                      type: col.type,
                    }])
                  }
                }}
                className={`justify-start text-xs h-8 px-2.5 font-medium ${isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isActive}
              >
                <span className="truncate">{col.label}</span>
              </Button>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* Filter Conditions */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <h3 className="text-xs font-semibold text-[rgb(var(--fg-muted))] uppercase tracking-wider">
              {t('Conditions')}{filters.length > 0 ? ` (${filters.length})` : ''}
            </h3>
            {/* Match Conditions — compact ALL/ANY toggle, sets the connector for every condition */}
            {filters.length > 1 && (
              <div className="inline-flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-[rgb(var(--fg-subtle))] uppercase">{t('Match')}</span>
                <div className="inline-flex rounded-md border border-[rgb(var(--bd-default))] overflow-hidden text-[10px] font-bold">
                  {([
                    { id: 'all', label: t('ALL'), connector: 'AND' },
                    { id: 'any', label: t('ANY'), connector: 'OR' },
                  ] as const).map((opt) => {
                    const isActive = matchType === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setMatchType(opt.id)
                          setFilters(filters.map((f: FilterCondition) => ({ ...f, connector: opt.connector })))
                        }}
                        aria-pressed={isActive}
                        className={`px-2 py-0.5 transition-colors ${
                          isActive
                            ? 'bg-[rgb(var(--color-primary))] text-white'
                            : 'bg-[rgb(var(--bg-surface))] text-[rgb(var(--fg-muted))] hover:bg-[rgb(var(--bg-subtle))]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {filters.length > 0 && (
              <Button
                onClick={() => setFilters([])}
                size="sm"
                variant="ghost"
                className="h-8 text-xs font-medium text-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error))]/10"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                {t('Clear all')}
              </Button>
            )}
            <Button onClick={addFilter} size="sm" variant="outline" className="h-8 text-xs font-medium">
              <Plus className="h-4 w-4 mr-1" />
              {t('Add')}
            </Button>
          </div>
        </div>
        <div className="space-y-2.5">
          {filters.length === 0 ? (
            <div className="text-center py-8 px-4 border-2 border-dashed border-[rgb(var(--bd-default))] rounded-lg bg-[rgb(var(--bg-subtle))]">
              <p className="text-sm text-[rgb(var(--fg-muted))]">{t('No filters added')}</p>
              <p className="text-xs text-[rgb(var(--fg-subtle))] mt-1">{t('Use Quick Add above or click "Add"')}</p>
            </div>
          ) : (
            filters.map((filter: FilterCondition, index: number) => (
              <motion.div
                key={filter.id}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:gap-2.5 p-3 border border-[rgb(var(--bd-default))] rounded-md bg-[rgb(var(--bg-surface))] hover:border-[rgb(var(--bd-hover))] transition-all"
              >
                {/* AND/OR Connector — per-condition, clickable toggle */}
                <div className="hidden sm:flex col-span-1 items-center justify-center">
                  {index > 0 ? (
                    <ConnectorToggle
                      value={filter.connector || (matchType === 'any' ? 'OR' : 'AND')}
                      onChange={(c) => updateFilter(filter.id, { connector: c })}
                      t={t}
                    />
                  ) : (
                    <span className="text-[10px] font-medium text-[rgb(var(--fg-subtle))] uppercase">{t('Where')}</span>
                  )}
                </div>

                {/* Mobile: connector toggle inline */}
                {index > 0 && (
                  <div className="sm:hidden">
                    <ConnectorToggle
                      value={filter.connector || (matchType === 'any' ? 'OR' : 'AND')}
                      onChange={(c) => updateFilter(filter.id, { connector: c })}
                      t={t}
                    />
                  </div>
                )}

                {/* Column */}
                <div className="sm:col-span-4">
                  <Label className="text-xs font-medium text-[rgb(var(--fg-muted))] mb-1">{t('Column')}</Label>
                  <Dropdown
                    options={filterableColumns.map((col: any) => ({ value: col.key, label: col.label }))}
                    value={filter.column}
                    onValueChange={(value: any) => {
                      const columnValue = typeof value === 'string' ? value : value[0] || ''
                      const columnInfo = filterableColumns.find((col: any) => col.key === columnValue)
                      updateFilter(filter.id, { column: columnValue, type: columnInfo?.type || 'string', operator: 'contains', value: '' })
                    }}
                    placeholder={t('Select column')}
                  />
                </div>

                {/* Operator */}
                <div className="sm:col-span-3">
                  <Label className="text-xs font-medium text-[rgb(var(--fg-muted))] mb-1">{t('Operator')}</Label>
                  <Dropdown
                    options={getOperators(filter.type)}
                    value={filter.operator}
                    onValueChange={(value: any) => updateFilter(filter.id, { operator: typeof value === 'string' ? value : value[0] || '', value: '' })}
                    placeholder={t('Select')}
                  />
                </div>

                {/* Value */}
                <div className="sm:col-span-3">
                  <Label className="text-xs font-medium text-[rgb(var(--fg-muted))] mb-1">{t('Value')}</Label>
                  {renderValueInput(filter)}
                </div>

                {/* Remove */}
                <div className="sm:col-span-1 flex sm:items-end sm:justify-center sm:pb-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFilter(filter.id)}
                    className="h-8 w-8 p-0 text-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error))]/10 transition-colors"
                    aria-label={t('Remove filter')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// Per-condition AND/OR toggle: a tiny two-segment pill.
function ConnectorToggle({ value, onChange, t }: { value: 'AND' | 'OR'; onChange: (c: 'AND' | 'OR') => void; t: (k: string) => string }) {
  return (
    <div className="inline-flex rounded-md border border-[rgb(var(--bd-default))] overflow-hidden text-[10px] font-bold">
      {(['AND', 'OR'] as const).map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`px-1.5 py-0.5 transition-colors ${
            value === c
              ? 'bg-[rgb(var(--color-primary))] text-white'
              : 'bg-[rgb(var(--bg-surface))] text-[rgb(var(--fg-muted))] hover:bg-[rgb(var(--bg-subtle))]'
          }`}
        >
          {t(c)}
        </button>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// COLUMNS TAB (Parkbuddy-inspired)
// ═══════════════════════════════════════════════════════════════

function ColumnsTab({
  hideableColumns, table, enableGrouping, groupableColumns,
  grouping, onGroupingChange, onClearGrouping, t,
}: any) {
  return (
    <div className="px-4 sm:px-6 pt-3 pb-4 space-y-4">
      {/* Columns — order (drag) + visibility (eye) in one list */}
      {table && (
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="text-xs font-semibold text-[rgb(var(--fg-muted))] uppercase tracking-wider flex items-center gap-2">
              <Eye className="h-3.5 w-3.5" />
              {t('Columns')}
              <span className="text-[10px] font-bold bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-muted))] px-1.5 py-0.5 rounded-full normal-case tracking-normal">
                {hideableColumns.filter((c: any) => c.visible).length}/{hideableColumns.length}
              </span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => table.toggleAllColumnsVisible(true)}
                className="text-xs text-[rgb(var(--color-primary))] hover:underline font-medium"
              >
                {t('Show All')}
              </button>
              <span className="text-[rgb(var(--fg-subtle))]">|</span>
              <button
                onClick={() => table.toggleAllColumnsVisible(false)}
                className="text-xs text-[rgb(var(--fg-muted))] hover:underline font-medium"
              >
                {t('Hide All')}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-[rgb(var(--fg-muted))] mb-2">
            {t('Drag to reorder. The number is the column sequence in the grid.')}
          </p>
          <ColumnOrderVisibilityList table={table} hideableColumns={hideableColumns} t={t} />
        </div>
      )}

      {/* Grouping */}
      {enableGrouping && groupableColumns.length > 0 && onGroupingChange && (
        <>
          <Separator />
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-[rgb(var(--fg-muted))] uppercase tracking-wider flex items-center gap-2">
                <Layers className="h-3.5 w-3.5" />
                {t('Group By')}
                {grouping.length > 0 && (
                  <span className="text-[10px] font-bold bg-[rgb(var(--color-primary))] text-white px-1.5 py-0.5 rounded-full">{grouping.length}</span>
                )}
              </h3>
              {grouping.length > 0 && onClearGrouping && (
                <button onClick={onClearGrouping} className="text-xs text-[rgb(var(--color-error))] hover:underline font-medium">
                  {t('Clear')}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {groupableColumns.map((col: any) => {
                const isGrouped = grouping.includes(col.id)
                return (
                  <button
                    key={col.id}
                    onClick={() => onGroupingChange(col.id)}
                    className={`px-3 py-2 text-xs rounded-md border flex items-center gap-2 transition-colors ${
                      isGrouped
                        ? 'bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))] border-[rgb(var(--color-primary))]/30'
                        : 'bg-[rgb(var(--bg-surface))] text-[rgb(var(--fg-default))] border-[rgb(var(--bd-default))] hover:border-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary))]/5'
                    }`}
                  >
                    <Layers className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{col.label}</span>
                    {isGrouped && <Check className="h-3 w-3 ml-auto flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Merged column order + visibility list ─────────────────────

function ColumnOrderVisibilityList({ table, hideableColumns, t }: { table: any; hideableColumns: any[]; t: (key: string) => string }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const columnOrder = table.getState().columnOrder as string[]
  const allColumns = table.getAllColumns()
  const hideableIds = useMemo(() => new Set(hideableColumns.map((c: any) => c.id)), [hideableColumns])

  const orderedIds: string[] = useMemo(() => {
    const base = columnOrder.length > 0 ? columnOrder : allColumns.map((c: any) => c.id)
    const dataIds = base.filter((id: string) => !NON_DATA_COLUMN_IDS.has(id))
    // A column missing from a stale columnOrder would otherwise be unreachable in this list.
    const missing = allColumns
      .map((c: any) => c.id)
      .filter((id: string) => !NON_DATA_COLUMN_IDS.has(id) && !dataIds.includes(id))
    return [...dataIds, ...missing]
  }, [columnOrder, allColumns])

  const commitOrder = (nextDataIds: string[]) => {
    const base = columnOrder.length > 0 ? columnOrder : allColumns.map((c: any) => c.id)
    const leading = base.filter((id: string) => NON_DATA_COLUMN_IDS.has(id) && id !== 'actions')
    const trailing = base.filter((id: string) => id === 'actions')
    table.setColumnOrder([...leading, ...nextDataIds, ...trailing])
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = orderedIds.indexOf(active.id as string)
    const to = orderedIds.indexOf(over.id as string)
    if (from === -1 || to === -1) return
    commitOrder(arrayMove(orderedIds, from, to))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToParentElement]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={orderedIds} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 content-start">
          {orderedIds.map((columnId, index) => {
            const col = allColumns.find((c: any) => c.id === columnId)
            if (!col) return null
            let label = col.id
            if (typeof col.columnDef.header === 'string') label = col.columnDef.header
            return (
              <SortableColumnRow
                key={columnId}
                id={columnId}
                label={label}
                seq={index + 1}
                isVisible={col.getIsVisible()}
                canHide={hideableIds.has(columnId)}
                onToggleVisibility={() => col.toggleVisibility()}
                t={t}
              />
            )
          })}
        </div>
      </SortableContext>
    </DndContext>
  )
}

function SortableColumnRow({
  id, label, seq, isVisible, canHide, onToggleVisibility, t,
}: {
  id: string
  label: string
  seq: number
  isVisible: boolean
  canHide: boolean
  onToggleVisibility: () => void
  t: (key: string) => string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-1.5 px-2 py-2 text-xs rounded-md border transition-colors ${
        isDragging
          ? 'relative z-10 shadow-lg border-[rgb(var(--color-primary))] bg-[rgb(var(--bg-surface))]'
          : isVisible
          ? 'bg-[rgb(var(--bg-surface))] border-[rgb(var(--bd-default))]'
          : 'bg-[rgb(var(--bg-subtle))] border-[rgb(var(--bd-default))]'
      }`}
    >
      <button
        type="button"
        className="p-1 rounded cursor-grab active:cursor-grabbing text-[rgb(var(--fg-subtle))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-hover))] touch-none flex-shrink-0"
        aria-label={t('Drag to reorder')}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <span className="w-5 text-right tabular-nums text-[rgb(var(--fg-subtle))] flex-shrink-0">{seq}</span>

      <span className={`truncate flex-1 ${isVisible ? 'text-[rgb(var(--fg-default))]' : 'text-[rgb(var(--fg-muted))]'}`}>
        {label}
      </span>

      <button
        type="button"
        onClick={onToggleVisibility}
        disabled={!canHide}
        aria-pressed={isVisible}
        aria-label={isVisible ? t('Hide column') : t('Show column')}
        className={`p-1.5 rounded transition-colors flex-shrink-0 ${
          !canHide
            ? 'opacity-30 cursor-not-allowed text-[rgb(var(--fg-muted))]'
            : isVisible
            ? 'text-[rgb(var(--color-success))] hover:bg-[rgb(var(--color-success))]/10'
            : 'text-[rgb(var(--fg-muted))] hover:bg-[rgb(var(--bg-hover))]'
        }`}
      >
        {isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SORT TAB (Parkbuddy-inspired)
// ═══════════════════════════════════════════════════════════════

function SortTab({ sortableColumns, sorting, handleSort, clearSort, reorderSorting, t }: any) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const activeIds = sorting.map((s: any) => s.id)
  const inactiveColumns = sortableColumns.filter((c: any) => !activeIds.includes(c.id))
  const labelFor = (id: string) => sortableColumns.find((c: any) => c.id === id)?.label || id

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = activeIds.indexOf(active.id as string)
    const to = activeIds.indexOf(over.id as string)
    if (from === -1 || to === -1) return
    reorderSorting(from, to)
  }

  return (
    <div className="px-4 sm:px-6 pt-3 pb-4 space-y-4">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="text-xs font-semibold text-[rgb(var(--fg-muted))] uppercase tracking-wider flex items-center gap-2">
            <ArrowUpDown className="h-3.5 w-3.5" />
            {t('Sort By')}
            {sorting.length > 0 && (
              <span className="text-[10px] font-bold bg-[rgb(var(--color-primary))] text-white px-1.5 py-0.5 rounded-full normal-case tracking-normal">
                {sorting.length}
              </span>
            )}
          </h3>
          {sorting.length > 0 && (
            <button onClick={clearSort} className="text-xs text-[rgb(var(--color-error))] hover:underline font-medium">
              {t('Clear')}
            </button>
          )}
        </div>

        {sorting.length > 0 ? (
          <>
            <p className="text-[11px] text-[rgb(var(--fg-muted))] mb-2">
              {t('Drag to reorder. The number is the sort priority.')}
            </p>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToParentElement]}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={activeIds} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 content-start">
                  {sorting.map((s: any, index: number) => (
                    <SortableSortRow
                      key={s.id}
                      id={s.id}
                      label={labelFor(s.id)}
                      seq={index + 1}
                      desc={s.desc}
                      onToggleDirection={() => handleSort(s.id)}
                      t={t}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </>
        ) : (
          <div className="text-center py-6 border-2 border-dashed border-[rgb(var(--bd-default))] rounded-lg bg-[rgb(var(--bg-subtle))]">
            <p className="text-sm text-[rgb(var(--fg-muted))]">{t('No sorting applied')}</p>
            <p className="text-xs text-[rgb(var(--fg-subtle))] mt-1">{t('Tap a column to sort')}</p>
          </div>
        )}
      </div>

      {inactiveColumns.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-xs font-semibold text-[rgb(var(--fg-muted))] uppercase tracking-wider flex items-center gap-2 mb-2">
              <Plus className="h-3.5 w-3.5" />
              {t('Add Sort Column')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 content-start">
              {inactiveColumns.map((col: any) => (
                <button
                  key={col.id}
                  onClick={() => handleSort(col.id)}
                  className="px-3 py-2 text-xs rounded-md border text-left flex items-center gap-1.5 transition-colors bg-[rgb(var(--bg-surface))] text-[rgb(var(--fg-default))] border-[rgb(var(--bd-default))] hover:border-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary))]/5"
                >
                  <Plus className="h-3 w-3 flex-shrink-0 text-[rgb(var(--fg-subtle))]" />
                  <span className="truncate">{col.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function SortableSortRow({
  id, label, seq, desc, onToggleDirection, t,
}: {
  id: string
  label: string
  seq: number
  desc: boolean
  onToggleDirection: () => void
  t: (key: string) => string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-1.5 px-2 py-2 text-xs rounded-md border transition-colors ${
        isDragging
          ? 'relative z-10 shadow-lg border-[rgb(var(--color-primary))] bg-[rgb(var(--bg-surface))]'
          : 'bg-[rgb(var(--color-primary))]/10 border-[rgb(var(--color-primary))]/30'
      }`}
    >
      <button
        type="button"
        className="p-1 rounded cursor-grab active:cursor-grabbing text-[rgb(var(--fg-subtle))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-hover))] touch-none flex-shrink-0"
        aria-label={t('Drag to reorder')}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <span className="w-5 text-right tabular-nums text-[rgb(var(--fg-subtle))] flex-shrink-0">{seq}</span>

      <span className="truncate flex-1 font-semibold text-[rgb(var(--color-primary))]">{label}</span>

      <button
        type="button"
        onClick={onToggleDirection}
        aria-label={desc ? t('Sort descending') : t('Sort ascending')}
        className="px-1.5 py-1 rounded text-[10px] font-bold flex-shrink-0 text-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary))]/15 transition-colors"
      >
        {desc ? '↓ Z-A' : '↑ A-Z'}
      </button>
    </div>
  )
}

