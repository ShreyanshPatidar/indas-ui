'use client'

import { useState, useEffect, useCallback } from 'react'
import { StandardModal } from '@/components'
import { DataGrid } from '@/components'
import { useLanguage } from '@/contexts/LanguageContext'
import type { ColumnDef } from '@tanstack/react-table'

export interface DrillContext {
  key: string
  label: string
}

interface DrillDownModalProps<T> {
  drill: DrillContext | null
  onClose: () => void
  columns: ColumnDef<T>[]
  getRowId: (row: T) => string
  // Lazily called ONLY when a drill context is set (i.e. on open). Receives the clicked segment.
  fetcher: (drill: DrillContext) => Promise<T[]>
  titlePrefix?: string
}

export function DrillDownModal<T>({ drill, onClose, columns, getRowId, fetcher, titlePrefix }: DrillDownModalProps<T>) {
  const { t } = useLanguage()
  const [rows, setRows] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (ctx: DrillContext) => {
    setLoading(true)
    setError(null)
    try {
      setRows(await fetcher(ctx))
    } catch {
      setError(t('Failed to load details'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [fetcher, t])

  useEffect(() => {
    if (drill) load(drill)
    else setRows([])
  }, [drill, load])

  return (
    <StandardModal
      isOpen={!!drill}
      onClose={onClose}
      title={drill?.label || ''}
      subtitle={titlePrefix}
      size="xl"
      showFooter={false}
    >
      {loading ? (
        <div className="h-64 flex items-center justify-center text-sm text-[rgb(var(--fg-muted))]">{t('Loading...')}</div>
      ) : error ? (
        <div className="h-64 flex items-center justify-center text-sm text-[rgb(var(--color-error))]">{error}</div>
      ) : (
        <DataGrid
          data={rows}
          columns={columns}
          getRowId={getRowId}
          pageSize={15}
          enablePagination
          enableSorting
          enableFilterRow
          title={`${drill?.label || ''} (${rows.length})`}
        />
      )}
    </StandardModal>
  )
}
