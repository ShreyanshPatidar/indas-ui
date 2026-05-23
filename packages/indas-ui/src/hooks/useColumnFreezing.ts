import { useState, useCallback, useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'

export interface FrozenColumnState {
  frozenLeft: string[]
  frozenRight: string[]
  isFrozen: (columnId: string) => boolean
  getFrozenPosition: (columnId: string) => 'left' | 'right' | null
}

export interface UseColumnFreezingOptions {
  columns: ColumnDef<any>[]
  maxFrozenLeft?: number
  maxFrozenRight?: number
  onFreezingChange?: (frozenLeft: string[], frozenRight: string[]) => void
}

/**
 * Hook for managing frozen/pinned columns with advanced positioning
 * Supports both left and right frozen columns
 */
export function useColumnFreezing({
  columns,
  maxFrozenLeft = 3,
  maxFrozenRight = 2,
  onFreezingChange
}: UseColumnFreezingOptions) {
  const [frozenLeft, setFrozenLeft] = useState<string[]>([])
  const [frozenRight, setFrozenRight] = useState<string[]>([])

  // Get column IDs for validation
  const columnIds = useMemo(() =>
    columns.map(col => col.id || (col as any).accessorKey).filter(Boolean),
    [columns]
  )

  // Calculate frozen state
  const frozenState = useMemo<FrozenColumnState>(() => ({
    frozenLeft,
    frozenRight,
    isFrozen: (columnId: string) =>
      frozenLeft.includes(columnId) || frozenRight.includes(columnId),
    getFrozenPosition: (columnId: string) => {
      if (frozenLeft.includes(columnId)) return 'left'
      if (frozenRight.includes(columnId)) return 'right'
      return null
    }
  }), [frozenLeft, frozenRight])

  // Freeze column to the left
  const freezeLeft = useCallback((columnId: string) => {
    if (!columnIds.includes(columnId)) return false

    setFrozenLeft(prev => {
      // Remove from right if it's there
      setFrozenRight(right => right.filter(id => id !== columnId))

      // Add to left if not already there and under limit
      if (!prev.includes(columnId) && prev.length < maxFrozenLeft) {
        const newFrozenLeft = [...prev, columnId]
        onFreezingChange?.(newFrozenLeft, frozenRight)
        return newFrozenLeft
      }
      return prev
    })

    return true
  }, [columnIds, maxFrozenLeft, frozenRight, onFreezingChange])

  // Freeze column to the right
  const freezeRight = useCallback((columnId: string) => {
    if (!columnIds.includes(columnId)) return false

    setFrozenRight(prev => {
      // Remove from left if it's there
      setFrozenLeft(left => left.filter(id => id !== columnId))

      // Add to right if not already there and under limit
      if (!prev.includes(columnId) && prev.length < maxFrozenRight) {
        const newFrozenRight = [...prev, columnId]
        onFreezingChange?.(frozenLeft, newFrozenRight)
        return newFrozenRight
      }
      return prev
    })

    return true
  }, [columnIds, maxFrozenRight, frozenLeft, onFreezingChange])

  // Unfreeze column
  const unfreeze = useCallback((columnId: string) => {
    let changed = false

    setFrozenLeft(prev => {
      if (prev.includes(columnId)) {
        changed = true
        return prev.filter(id => id !== columnId)
      }
      return prev
    })

    setFrozenRight(prev => {
      if (prev.includes(columnId)) {
        changed = true
        return prev.filter(id => id !== columnId)
      }
      return prev
    })

    if (changed) {
      // Use setTimeout to ensure state updates are complete
      setTimeout(() => {
        onFreezingChange?.(
          frozenLeft.filter(id => id !== columnId),
          frozenRight.filter(id => id !== columnId)
        )
      }, 0)
    }

    return changed
  }, [frozenLeft, frozenRight, onFreezingChange])

  // Toggle freeze state (defaults to left)
  const toggleFreeze = useCallback((columnId: string, position: 'left' | 'right' = 'left') => {
    if (frozenState.isFrozen(columnId)) {
      return unfreeze(columnId)
    } else {
      return position === 'left' ? freezeLeft(columnId) : freezeRight(columnId)
    }
  }, [frozenState, unfreeze, freezeLeft, freezeRight])

  // Clear all frozen columns
  const clearAllFrozen = useCallback(() => {
    setFrozenLeft([])
    setFrozenRight([])
    onFreezingChange?.([], [])
  }, [onFreezingChange])

  // Reorder frozen columns
  const reorderFrozen = useCallback((
    columnId: string,
    newIndex: number,
    position: 'left' | 'right'
  ) => {
    const setter = position === 'left' ? setFrozenLeft : setFrozenRight
    const currentList = position === 'left' ? frozenLeft : frozenRight

    if (!currentList.includes(columnId)) return false

    setter(prev => {
      const filtered = prev.filter(id => id !== columnId)
      const clampedIndex = Math.max(0, Math.min(newIndex, filtered.length))
      const newList = [
        ...filtered.slice(0, clampedIndex),
        columnId,
        ...filtered.slice(clampedIndex)
      ]

      // Update callback
      if (position === 'left') {
        onFreezingChange?.(newList, frozenRight)
      } else {
        onFreezingChange?.(frozenLeft, newList)
      }

      return newList
    })

    return true
  }, [frozenLeft, frozenRight, onFreezingChange])

  // Get CSS properties for frozen columns
  const getFrozenStyle = useCallback((columnId: string, columnWidth: number = 150) => {
    const position = frozenState.getFrozenPosition(columnId)
    if (!position) return {}

    let offset = 0
    const targetList = position === 'left' ? frozenLeft : frozenRight

    if (position === 'left') {
      const index = targetList.indexOf(columnId)
      offset = index * columnWidth
      return {
        position: 'sticky' as const,
        left: offset,
        zIndex: 10,
        backgroundColor: 'var(--grid-header-bg)',
        boxShadow: '2px 0 4px rgba(0,0,0,0.1)'
      }
    } else {
      const index = targetList.indexOf(columnId)
      offset = index * columnWidth
      return {
        position: 'sticky' as const,
        right: offset,
        zIndex: 10,
        backgroundColor: 'var(--grid-header-bg)',
        boxShadow: '-2px 0 4px rgba(0,0,0,0.1)'
      }
    }
  }, [frozenState, frozenLeft, frozenRight])

  // Utility functions
  const canFreezeLeft = frozenLeft.length < maxFrozenLeft
  const canFreezeRight = frozenRight.length < maxFrozenRight
  const totalFrozen = frozenLeft.length + frozenRight.length

  return {
    // State
    ...frozenState,
    canFreezeLeft,
    canFreezeRight,
    totalFrozen,

    // Actions
    freezeLeft,
    freezeRight,
    unfreeze,
    toggleFreeze,
    clearAllFrozen,
    reorderFrozen,

    // Utilities
    getFrozenStyle,

    // For integration with table libraries
    getColumnProps: (columnId: string, width?: number) => ({
      style: getFrozenStyle(columnId, width),
      className: frozenState.isFrozen(columnId) ? 'column-frozen' : '',
      'data-frozen': frozenState.getFrozenPosition(columnId) || 'none'
    }),

    // Bulk operations
    bulkOperations: {
      freezeMultiple: (columnIds: string[], position: 'left' | 'right' = 'left') => {
        columnIds.forEach(id => {
          if (position === 'left' && canFreezeLeft) {
            freezeLeft(id)
          } else if (position === 'right' && canFreezeRight) {
            freezeRight(id)
          }
        })
      },

      unfreezeMultiple: (columnIds: string[]) => {
        columnIds.forEach(unfreeze)
      },

      setFrozenColumns: (left: string[], right: string[]) => {
        setFrozenLeft(left.slice(0, maxFrozenLeft))
        setFrozenRight(right.slice(0, maxFrozenRight))
        onFreezingChange?.(left, right)
      }
    }
  }
}