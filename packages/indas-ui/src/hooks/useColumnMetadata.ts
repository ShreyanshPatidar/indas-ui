import { useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'

export interface ColumnMetadata {
  isNumeric: boolean
  isFrozen: boolean
  isSelectColumn: boolean
  isMainColumn: boolean
  columnKey: string
  alignment: 'left' | 'right' | 'center'
}

/**
 * Pre-compute column metadata to avoid repeated calculations during renders
 */
export function useColumnMetadata<TData>(
  columns: ColumnDef<TData>[],
  mainColumnsArray: string[],
  frozenColumnPositions: Map<string, { left: number; width: number }>
): Map<string, ColumnMetadata> {
  return useMemo(() => {
    const metadataMap = new Map<string, ColumnMetadata>()

    columns.forEach((column) => {
      const columnKey = column.id || (column as any).accessorKey || ''
      const isSelectColumn = (column.meta as any)?.isSelectColumn ||
                            (column.meta as any)?.skipSearch ||
                            column.id === 'select' ||
                            columnKey === 'select'

      const isMainColumn = !isSelectColumn && columnKey && mainColumnsArray.includes(columnKey)
      const isFrozen = frozenColumnPositions.has(columnKey)

      metadataMap.set(columnKey, {
        isNumeric: false, // Will be determined per cell value
        isFrozen,
        isSelectColumn,
        isMainColumn,
        columnKey,
        alignment: 'left' // Default alignment
      })
    })

    return metadataMap
  }, [columns, mainColumnsArray, frozenColumnPositions])
}

/**
 * Check if a cell value should be right-aligned (numeric content)
 */
export function isNumericContent(cellValue: any): boolean {
  const cellString = String(cellValue || '').trim()

  return typeof cellValue === 'number' ||
         (!isNaN(Number(cellString)) && cellString !== '' && cellString !== 'null' && cellString !== 'undefined') ||
         /^\d*\.?\d+%$/.test(cellString) ||
         /^[\$€£¥₹₽]\s?\d/.test(cellString) ||
         /^\d[\d,]*\.?\d*\s?[\$€£¥₹₽]$/.test(cellString) ||
         /^\(\d/.test(cellString) ||
         /^\d{1,3}(,\d{3})*(\.\d+)?$/.test(cellString) ||
         /^\d+\.?\d*[eE][+-]?\d+$/.test(cellString) ||
         /^\d+\/\d+$/.test(cellString) ||
         /^[+\-=<>≤≥≠±∞]/.test(cellString)
}