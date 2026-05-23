import { useState, useMemo, useCallback } from 'react'
import { useDebouncedValue } from './useDebounce'

export interface SearchFilter {
  id: string
  columnId?: string
  value: string
  operator: 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than'
  caseSensitive?: boolean
}

export interface SearchOptions {
  globalSearch?: boolean
  columnSearch?: boolean
  debounceMs?: number
  caseSensitive?: boolean
  highlightMatches?: boolean
  searchOperator?: 'contains' | 'equals' | 'starts_with' | 'ends_with'
}

export interface SearchState {
  globalTerm: string
  columnFilters: Record<string, string>
  activeFilters: SearchFilter[]
  matchCount: number
  hasActiveSearch: boolean
}

/**
 * Advanced search hook with global and column-specific filtering
 * Supports multiple search operators and debounced performance
 */
export function useBacchaSearch<TData>(
  data: TData[],
  columns: any[],
  options: SearchOptions = {}
) {
  const {
    globalSearch = true,
    columnSearch = true,
    debounceMs = 300,
    caseSensitive = false,
    highlightMatches = true,
    searchOperator = 'contains'
  } = options

  const [globalTerm, setGlobalTerm] = useState('')
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [customFilters, setCustomFilters] = useState<SearchFilter[]>([])

  // Debounced search terms for performance
  const debouncedGlobalTerm = useDebouncedValue(globalTerm, debounceMs)
  const debouncedColumnFilters = useDebouncedValue(columnFilters, debounceMs)

  // Get searchable columns
  const searchableColumns = useMemo(() =>
    columns.filter(col =>
      !col.meta?.skipSearch &&
      col.id !== 'select' &&
      !col.meta?.isSelectColumn
    ),
    [columns]
  )

  // Apply search operator
  const matchesOperator = useCallback((
    cellValue: any,
    searchValue: string,
    operator: string,
    isCaseSensitive: boolean = false
  ): boolean => {
    if (!searchValue) return true
    if (cellValue == null) return false

    const cellStr = isCaseSensitive ? String(cellValue) : String(cellValue).toLowerCase()
    const searchStr = isCaseSensitive ? searchValue : searchValue.toLowerCase()

    switch (operator) {
      case 'contains':
        return cellStr.includes(searchStr)
      case 'equals':
        return cellStr === searchStr
      case 'starts_with':
        return cellStr.startsWith(searchStr)
      case 'ends_with':
        return cellStr.endsWith(searchStr)
      case 'greater_than':
        const cellNum = Number(cellValue)
        const searchNum = Number(searchValue)
        return !isNaN(cellNum) && !isNaN(searchNum) && cellNum > searchNum
      case 'less_than':
        const cellNum2 = Number(cellValue)
        const searchNum2 = Number(searchValue)
        return !isNaN(cellNum2) && !isNaN(searchNum2) && cellNum2 < searchNum2
      default:
        return cellStr.includes(searchStr)
    }
  }, [])

  // Filter data based on search criteria
  const filteredData = useMemo(() => {
    let filtered = data

    // Apply global search
    if (globalSearch && debouncedGlobalTerm) {
      filtered = filtered.filter(row =>
        searchableColumns.some(column => {
          const columnKey = column.accessorKey || column.id
          const cellValue = (row as any)[columnKey]
          return matchesOperator(cellValue, debouncedGlobalTerm, searchOperator, caseSensitive)
        })
      )
    }

    // Apply column-specific filters
    if (columnSearch) {
      Object.entries(debouncedColumnFilters).forEach(([columnId, filterValue]) => {
        if (filterValue) {
          filtered = filtered.filter(row => {
            const cellValue = (row as any)[columnId]
            return matchesOperator(cellValue, filterValue, searchOperator, caseSensitive)
          })
        }
      })
    }

    // Apply custom filters
    customFilters.forEach(filter => {
      if (filter.value) {
        filtered = filtered.filter(row => {
          if (filter.columnId) {
            const cellValue = (row as any)[filter.columnId]
            return matchesOperator(
              cellValue,
              filter.value,
              filter.operator,
              filter.caseSensitive ?? caseSensitive
            )
          } else {
            // Global filter
            return searchableColumns.some(column => {
              const columnKey = column.accessorKey || column.id
              const cellValue = (row as any)[columnKey]
              return matchesOperator(
                cellValue,
                filter.value,
                filter.operator,
                filter.caseSensitive ?? caseSensitive
              )
            })
          }
        })
      }
    })

    return filtered
  }, [
    data,
    debouncedGlobalTerm,
    debouncedColumnFilters,
    customFilters,
    searchableColumns,
    globalSearch,
    columnSearch,
    searchOperator,
    caseSensitive,
    matchesOperator
  ])

  // Search state
  const searchState = useMemo<SearchState>(() => {
    const activeFilters: SearchFilter[] = []

    // Add global filter
    if (debouncedGlobalTerm) {
      activeFilters.push({
        id: 'global',
        value: debouncedGlobalTerm,
        operator: searchOperator,
        caseSensitive
      })
    }

    // Add column filters
    Object.entries(debouncedColumnFilters).forEach(([columnId, value]) => {
      if (value) {
        activeFilters.push({
          id: `column-${columnId}`,
          columnId,
          value,
          operator: searchOperator,
          caseSensitive
        })
      }
    })

    // Add custom filters
    activeFilters.push(...customFilters.filter(f => f.value))

    return {
      globalTerm: debouncedGlobalTerm,
      columnFilters: debouncedColumnFilters,
      activeFilters,
      matchCount: filteredData.length,
      hasActiveSearch: activeFilters.length > 0
    }
  }, [
    debouncedGlobalTerm,
    debouncedColumnFilters,
    customFilters,
    filteredData.length,
    searchOperator,
    caseSensitive
  ])

  // Actions
  const setGlobalSearch = useCallback((value: string) => {
    setGlobalTerm(value)
  }, [])

  const setColumnFilter = useCallback((columnId: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnId]: value
    }))
  }, [])

  const clearColumnFilter = useCallback((columnId: string) => {
    setColumnFilters(prev => {
      const { [columnId]: _, ...rest } = prev
      return rest
    })
  }, [])

  const clearAllFilters = useCallback(() => {
    setGlobalTerm('')
    setColumnFilters({})
    setCustomFilters([])
  }, [])

  const addCustomFilter = useCallback((filter: Omit<SearchFilter, 'id'>) => {
    const newFilter: SearchFilter = {
      ...filter,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    setCustomFilters(prev => [...prev, newFilter])
    return newFilter.id
  }, [])

  const removeCustomFilter = useCallback((filterId: string) => {
    setCustomFilters(prev => prev.filter(f => f.id !== filterId))
  }, [])

  const updateCustomFilter = useCallback((filterId: string, updates: Partial<SearchFilter>) => {
    setCustomFilters(prev =>
      prev.map(f => f.id === filterId ? { ...f, ...updates } : f)
    )
  }, [])

  // Highlight function for matched text
  const highlightText = useCallback((text: string, searchTerm: string) => {
    if (!highlightMatches || !searchTerm || !text) return text

    const regex = new RegExp(
      `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
      caseSensitive ? 'g' : 'gi'
    )

    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>')
  }, [highlightMatches, caseSensitive])

  // Quick search presets
  const quickSearch = {
    // Search for empty values
    findEmpty: (columnId: string) =>
      addCustomFilter({
        columnId,
        value: '',
        operator: 'equals'
      }),

    // Search for numeric ranges
    findInRange: (columnId: string, min: number, max: number) => {
      const minFilterId = addCustomFilter({
        columnId,
        value: min.toString(),
        operator: 'greater_than'
      })
      const maxFilterId = addCustomFilter({
        columnId,
        value: max.toString(),
        operator: 'less_than'
      })
      return [minFilterId, maxFilterId]
    },

    // Search for specific values
    findExact: (columnId: string, value: string) =>
      addCustomFilter({
        columnId,
        value,
        operator: 'equals',
        caseSensitive: true
      }),

    // Search across multiple columns
    findAcrossColumns: (columnIds: string[], value: string) =>
      columnIds.map(columnId =>
        addCustomFilter({
          columnId,
          value,
          operator: 'contains'
        })
      )
  }

  return {
    // Data
    filteredData,
    originalData: data,

    // State
    searchState,

    // Search terms (immediate, not debounced)
    globalTerm,
    columnFilters,

    // Actions
    setGlobalSearch,
    setColumnFilter,
    clearColumnFilter,
    clearAllFilters,
    addCustomFilter,
    removeCustomFilter,
    updateCustomFilter,

    // Utilities
    highlightText,
    quickSearch,
    matchesOperator,

    // Configuration
    searchableColumns,
    options: {
      globalSearch,
      columnSearch,
      debounceMs,
      caseSensitive,
      highlightMatches,
      searchOperator
    }
  }
}