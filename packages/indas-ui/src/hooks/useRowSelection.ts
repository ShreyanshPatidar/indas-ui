import { useState, useCallback, useMemo } from 'react'

export interface RowSelectionState<TData> {
  selectedRows: Set<string>
  selectedData: TData[]
  isAllSelected: boolean
  isIndeterminate: boolean
}

export interface UseRowSelectionOptions<TData> {
  data: TData[]
  getRowId?: (row: TData) => string
  enableMultiSelect?: boolean
  onSelectionChange?: (selectedRows: TData[]) => void
}

/**
 * Hook for managing row selection state with batch operations
 * Optimized for performance with large datasets
 */
export function useRowSelection<TData>({
  data,
  getRowId = (row: TData) => (row as any).id || Math.random().toString(),
  enableMultiSelect = true,
  onSelectionChange
}: UseRowSelectionOptions<TData>) {
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set())

  // Memoized row ID map for performance
  const rowIdMap = useMemo(() => {
    const map = new Map<string, TData>()
    data.forEach((row) => {
      const id = getRowId(row)
      map.set(id, row)
    })
    return map
  }, [data, getRowId])

  // Calculate selection state
  const selectionState = useMemo<RowSelectionState<TData>>(() => {
    const selectedData = Array.from(selectedRowIds)
      .map(id => rowIdMap.get(id))
      .filter(Boolean) as TData[]

    const isAllSelected = data.length > 0 && selectedRowIds.size === data.length
    const isIndeterminate = selectedRowIds.size > 0 && selectedRowIds.size < data.length

    return {
      selectedRows: selectedRowIds,
      selectedData,
      isAllSelected,
      isIndeterminate
    }
  }, [selectedRowIds, rowIdMap, data.length])

  // Select/deselect a single row
  const toggleRowSelection = useCallback((rowOrId: TData | string, forceValue?: boolean) => {
    const id = typeof rowOrId === 'string' ? rowOrId : getRowId(rowOrId)

    setSelectedRowIds(prev => {
      const newSet = new Set(prev)
      const isCurrentlySelected = newSet.has(id)
      const shouldSelect = forceValue !== undefined ? forceValue : !isCurrentlySelected

      if (shouldSelect) {
        if (!enableMultiSelect) {
          newSet.clear()
        }
        newSet.add(id)
      } else {
        newSet.delete(id)
      }

      // Trigger callback with new selection
      const selectedData = Array.from(newSet)
        .map(id => rowIdMap.get(id))
        .filter(Boolean) as TData[]

      onSelectionChange?.(selectedData)

      return newSet
    })
  }, [getRowId, enableMultiSelect, rowIdMap, onSelectionChange])

  // Select multiple rows
  const selectRows = useCallback((rows: TData[], replace = false) => {
    setSelectedRowIds(prev => {
      const newSet = replace ? new Set<string>() : new Set(prev)

      rows.forEach(row => {
        const id = getRowId(row)
        newSet.add(id)
      })

      // Trigger callback
      const selectedData = Array.from(newSet)
        .map(id => rowIdMap.get(id))
        .filter(Boolean) as TData[]

      onSelectionChange?.(selectedData)

      return newSet
    })
  }, [getRowId, rowIdMap, onSelectionChange])

  // Select all rows
  const selectAll = useCallback(() => {
    const allIds = data.map((row) => getRowId(row))
    setSelectedRowIds(new Set(allIds))
    onSelectionChange?.(data)
  }, [data, getRowId, onSelectionChange])

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedRowIds(new Set())
    onSelectionChange?.([])
  }, [onSelectionChange])

  // Toggle all selection
  const toggleAllSelection = useCallback(() => {
    if (selectionState.isAllSelected) {
      clearSelection()
    } else {
      selectAll()
    }
  }, [selectionState.isAllSelected, clearSelection, selectAll])

  // Check if a row is selected
  const isRowSelected = useCallback((rowOrId: TData | string) => {
    const id = typeof rowOrId === 'string' ? rowOrId : getRowId(rowOrId)
    return selectedRowIds.has(id)
  }, [selectedRowIds, getRowId])

  // Select rows by condition
  const selectWhere = useCallback((predicate: (row: TData) => boolean, replace = false) => {
    const matchingRows = data.filter(predicate)
    selectRows(matchingRows, replace)
  }, [data, selectRows])

  // Batch operations
  const batchOperations = {
    selectRange: (startIndex: number, endIndex: number) => {
      const start = Math.max(0, Math.min(startIndex, endIndex))
      const end = Math.min(data.length - 1, Math.max(startIndex, endIndex))
      const rangeRows = data.slice(start, end + 1)
      selectRows(rangeRows)
    },

    invertSelection: () => {
      const unselectedRows = data.filter(row => !isRowSelected(row))
      selectRows(unselectedRows, true)
    },

    selectByIndices: (indices: number[]) => {
      const rows = indices
        .filter(i => i >= 0 && i < data.length)
        .map(i => data[i])
      selectRows(rows)
    }
  }

  return {
    // State
    ...selectionState,

    // Actions
    toggleRowSelection,
    selectRows,
    selectAll,
    clearSelection,
    toggleAllSelection,
    selectWhere,

    // Utilities
    isRowSelected,
    batchOperations,

    // For integration with table libraries
    getRowSelectionProps: (row: TData) => ({
      checked: isRowSelected(row),
      onChange: (checked: boolean) => toggleRowSelection(row, checked),
      'aria-label': `Select row ${getRowId(row)}`
    }),

    getSelectAllProps: () => ({
      checked: selectionState.isAllSelected,
      indeterminate: selectionState.isIndeterminate,
      onChange: toggleAllSelection,
      'aria-label': 'Select all rows'
    })
  }
}