import { useState, useCallback, useEffect, useRef } from 'react'
import { Row } from '@tanstack/react-table'

interface NavigationPosition {
  rowIndex: number
  columnIndex: number
}

interface KeyboardNavigationOptions {
  enableNavigation?: boolean
  enableCellEdit?: boolean
  onCellEdit?: (rowIndex: number, columnIndex: string) => void
  onCellSelect?: (rowIndex: number, columnIndex: string) => void
  onRowSelect?: (rowIndex: number, isMultiSelect: boolean) => void
}

/**
 * Hook for keyboard navigation in data grids
 * Supports arrow keys, Enter for editing, Space for selection
 */
export function useKeyboardNavigation<TData>(
  rows: Row<TData>[],
  columns: any[],
  options: KeyboardNavigationOptions = {}
) {
  const {
    enableNavigation = true,
    enableCellEdit = true,
    onCellEdit,
    onCellSelect,
    onRowSelect
  } = options

  const [focusedCell, setFocusedCell] = useState<NavigationPosition | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Get navigable columns (exclude select columns)
  const navigableColumns = columns.filter(col =>
    !col.meta?.isSelectColumn && col.id !== 'select'
  )

  // Move focus to a specific cell
  const moveFocus = useCallback((rowIndex: number, columnIndex: number) => {
    const maxRow = rows.length - 1
    const maxCol = navigableColumns.length - 1

    const newRowIndex = Math.max(0, Math.min(rowIndex, maxRow))
    const newColIndex = Math.max(0, Math.min(columnIndex, maxCol))

    setFocusedCell({ rowIndex: newRowIndex, columnIndex: newColIndex })

    const columnId = navigableColumns[newColIndex]?.id || navigableColumns[newColIndex]?.accessorKey
    onCellSelect?.(newRowIndex, columnId)
  }, [rows.length, navigableColumns, onCellSelect])

  // Start editing current cell
  const startEditing = useCallback(() => {
    if (!focusedCell || !enableCellEdit) return

    setIsEditing(true)
    const columnId = navigableColumns[focusedCell.columnIndex]?.id ||
                    navigableColumns[focusedCell.columnIndex]?.accessorKey
    onCellEdit?.(focusedCell.rowIndex, columnId)
  }, [focusedCell, enableCellEdit, navigableColumns, onCellEdit])

  // Stop editing
  const stopEditing = useCallback(() => {
    setIsEditing(false)
  }, [])

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enableNavigation || !focusedCell) return

    // Don't handle keys when editing (let the edit component handle them)
    if (isEditing) return

    const { rowIndex, columnIndex } = focusedCell

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        moveFocus(rowIndex - 1, columnIndex)
        break

      case 'ArrowDown':
        event.preventDefault()
        moveFocus(rowIndex + 1, columnIndex)
        break

      case 'ArrowLeft':
        event.preventDefault()
        moveFocus(rowIndex, columnIndex - 1)
        break

      case 'ArrowRight':
        event.preventDefault()
        moveFocus(rowIndex, columnIndex + 1)
        break

      case 'Home':
        event.preventDefault()
        if (event.ctrlKey) {
          // Ctrl+Home: Go to first cell
          moveFocus(0, 0)
        } else {
          // Home: Go to first column of current row
          moveFocus(rowIndex, 0)
        }
        break

      case 'End':
        event.preventDefault()
        if (event.ctrlKey) {
          // Ctrl+End: Go to last cell
          moveFocus(rows.length - 1, navigableColumns.length - 1)
        } else {
          // End: Go to last column of current row
          moveFocus(rowIndex, navigableColumns.length - 1)
        }
        break

      case 'PageUp':
        event.preventDefault()
        moveFocus(Math.max(0, rowIndex - 10), columnIndex)
        break

      case 'PageDown':
        event.preventDefault()
        moveFocus(Math.min(rows.length - 1, rowIndex + 10), columnIndex)
        break

      case 'Enter':
        event.preventDefault()
        if (enableCellEdit) {
          startEditing()
        }
        break

      case ' ':
        event.preventDefault()
        // Space for row selection
        onRowSelect?.(rowIndex, event.ctrlKey || event.metaKey)
        break

      case 'Tab':
        event.preventDefault()
        if (event.shiftKey) {
          // Shift+Tab: Move to previous cell
          if (columnIndex > 0) {
            moveFocus(rowIndex, columnIndex - 1)
          } else if (rowIndex > 0) {
            moveFocus(rowIndex - 1, navigableColumns.length - 1)
          }
        } else {
          // Tab: Move to next cell
          if (columnIndex < navigableColumns.length - 1) {
            moveFocus(rowIndex, columnIndex + 1)
          } else if (rowIndex < rows.length - 1) {
            moveFocus(rowIndex + 1, 0)
          }
        }
        break

      case 'Escape':
        event.preventDefault()
        // Clear focus or stop editing
        if (isEditing) {
          stopEditing()
        } else {
          setFocusedCell(null)
        }
        break
    }
  }, [
    enableNavigation,
    focusedCell,
    isEditing,
    rows.length,
    navigableColumns.length,
    moveFocus,
    startEditing,
    stopEditing,
    onRowSelect,
    enableCellEdit
  ])

  // Attach keyboard event listeners
  useEffect(() => {
    const container = containerRef.current
    if (!container || !enableNavigation) return

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, enableNavigation])

  // Scroll focused cell into view
  useEffect(() => {
    if (!focusedCell || !containerRef.current) return

    const container = containerRef.current
    const cell = container.querySelector(
      `[data-row-index="${focusedCell.rowIndex}"][data-column-index="${focusedCell.columnIndex}"]`
    ) as HTMLElement

    if (cell) {
      cell.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      })
    }
  }, [focusedCell])

  // Public API
  return {
    containerRef,
    focusedCell,
    isEditing,
    moveFocus,
    startEditing,
    stopEditing,
    setFocusedCell,

    // Helper functions
    isCellFocused: (rowIndex: number, columnIndex: number) =>
      focusedCell?.rowIndex === rowIndex && focusedCell?.columnIndex === columnIndex,

    getCellProps: (rowIndex: number, columnIndex: number) => ({
      'data-row-index': rowIndex,
      'data-column-index': columnIndex,
      tabIndex: focusedCell?.rowIndex === rowIndex && focusedCell?.columnIndex === columnIndex ? 0 : -1,
      className: focusedCell?.rowIndex === rowIndex && focusedCell?.columnIndex === columnIndex
        ? 'ring-2 ring-blue-500 ring-inset'
        : ''
    })
  }
}