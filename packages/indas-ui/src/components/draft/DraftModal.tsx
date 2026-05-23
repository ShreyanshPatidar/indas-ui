/**
 * Draft Modal
 *
 * Modern, useful modal for managing saved drafts with:
 * - Draft name, date, client, job name, category
 * - Progress indicator
 * - Search and sort
 * - Quick load/delete actions
 */

import React, { useState, useMemo } from 'react'
import { FileText, Trash2, Download, Search, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Dropdown } from '@/components/forms/dropdown'
import { useCurrency } from '@/contexts/CurrencyContext'
import type { DraftMetadata } from '@/types/draft'

const PAGE_SIZE = 15

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Newest first' },
  { value: 'date-asc', label: 'Oldest first' },
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' }
]

interface DraftModalProps {
  /** Whether modal is open */
  open: boolean

  /** Close modal callback */
  onClose: () => void

  /** Array of available drafts */
  drafts: DraftMetadata[]

  /** Callback when draft is loaded */
  onLoad: (draftId: number) => Promise<void>

  /** Callback when draft is deleted */
  onDelete: (draftId: number) => Promise<void>

  /** Whether drafts are being loaded */
  isLoading?: boolean
}

type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc'

export function DraftModal({
  open,
  onClose,
  drafts,
  onLoad,
  onDelete,
  isLoading = false
}: DraftModalProps) {
  const { getCurrencyInfo, selectedCurrency } = useCurrency()
  const currencySymbol = getCurrencyInfo(selectedCurrency)?.symbol || ''

  const [searchQuery, setSearchQuery] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('date-desc')
  const [currentPage, setCurrentPage] = useState(1)

  /**
   * Filter and sort drafts
   */
  const filteredAndSortedDrafts = useMemo(() => {
    // If no search query, return all drafts
    if (!searchQuery.trim()) {
      const sorted = [...drafts]
      sorted.sort((a, b) => {
        switch (sortBy) {
          case 'date-desc':
            return new Date(b.lastSaved).getTime() - new Date(a.lastSaved).getTime()
          case 'date-asc':
            return new Date(a.lastSaved).getTime() - new Date(b.lastSaved).getTime()
          case 'name-asc':
            return (a.draftName || '').localeCompare(b.draftName || '')
          case 'name-desc':
            return (b.draftName || '').localeCompare(a.draftName || '')
          default:
            return 0
        }
      })
      return sorted
    }

    // Filter by search query
    let filtered = drafts.filter((draft) => {
      const searchLower = searchQuery.toLowerCase()
      return (
        (draft.draftName && draft.draftName.toLowerCase().includes(searchLower)) ||
        (draft.previewData?.jobName && draft.previewData.jobName.toLowerCase().includes(searchLower)) ||
        (draft.previewData?.clientName && draft.previewData.clientName.toLowerCase().includes(searchLower)) ||
        (draft.previewData?.category && draft.previewData.category.toLowerCase().includes(searchLower))
      )
    })

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.lastSaved).getTime() - new Date(a.lastSaved).getTime()
        case 'date-asc':
          return new Date(a.lastSaved).getTime() - new Date(b.lastSaved).getTime()
        case 'name-asc':
          return (a.draftName || '').localeCompare(b.draftName || '')
        case 'name-desc':
          return (b.draftName || '').localeCompare(a.draftName || '')
        default:
          return 0
      }
    })

    return filtered
  }, [drafts, searchQuery, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedDrafts.length / PAGE_SIZE)
  const paginatedDrafts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredAndSortedDrafts.slice(start, start + PAGE_SIZE)
  }, [filteredAndSortedDrafts, currentPage])

  // Reset to page 1 when search or sort changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, sortBy])

  /**
   * Format relative time
   */
  const formatRelativeTime = (dateStr: string | Date): string => {
    const date = new Date(dateStr)
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
    return new Date(dateStr).toLocaleDateString()
  }

  /**
   * Format full date
   */
  const formatFullDate = (dateStr: string | Date): string => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Calculate draft progress (0-100)
   * Based on how many fields are filled
   */
  const calculateProgress = (draft: DraftMetadata): number => {
    const preview = draft.previewData
    if (!preview) return 0

    const fields = [
      preview.jobName,
      preview.clientName,
      preview.category,
      preview.quoteNumber,
      preview.totalCost
    ]

    const filledFields = fields.filter(f => f !== undefined && f !== null && f !== '').length
    return Math.round((filledFields / fields.length) * 100)
  }

  /**
   * Handle load draft
   */
  const handleLoad = async (draftId: number) => {
    await onLoad(draftId)
    onClose()
  }

  /**
   * Handle delete draft
   */
  const handleDelete = async (draftId: number) => {
    setDeletingId(draftId)
    try {
      await onDelete(draftId)
    } finally {
      setDeletingId(null)
    }
  }

  // Early return after all hooks to comply with Rules of Hooks
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[rgb(var(--bg-surface))] rounded-lg shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        {/* Header - Single Line */}
        <div className="px-6 py-3 border-b border-[rgb(var(--bd-default))] flex items-center gap-4">
          {/* Title */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <FileText className="w-5 h-5 text-[rgb(var(--color-primary))]" />
            <h2 className="text-base font-semibold text-[rgb(var(--fg-default))]">
              Saved Drafts
            </h2>
            <span className="text-xs text-[rgb(var(--fg-muted))]">
              ({drafts.length})
            </span>
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[rgb(var(--fg-muted))]" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full pl-9 pr-3 py-1.5 rounded-lg text-sm
                bg-[rgb(var(--bg-default))]
                border border-[rgb(var(--bd-default))]
                text-[rgb(var(--fg-default))]
                placeholder:text-[rgb(var(--fg-muted))]
                focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]
              "
            />
          </div>

          {/* Sort */}
          <div className="flex-shrink-0 w-36">
            <Dropdown
              options={SORT_OPTIONS}
              value={sortBy}
              onValueChange={(val) => setSortBy(val as SortOption)}
              size="sm"
              autoWidth
            />
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[rgb(var(--bg-muted))] text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Draft List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full border-4 border-[rgb(var(--color-primary)_/_0.2)] border-t-[rgb(var(--color-primary))] animate-spin mx-auto mb-3"></div>
                <p className="text-[rgb(var(--fg-muted))]">Loading drafts...</p>
              </div>
            </div>
          ) : filteredAndSortedDrafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="w-16 h-16 text-[rgb(var(--fg-muted))] mb-4 opacity-50" />
              <p className="text-lg font-medium text-[rgb(var(--fg-default))] mb-1">
                {searchQuery ? 'No matching drafts' : 'No drafts saved yet'}
              </p>
              <p className="text-sm text-[rgb(var(--fg-muted))]">
                {searchQuery ? 'Try a different search term' : 'Start by clicking "Save Draft" button'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedDrafts.map((draft) => {
                const progress = calculateProgress(draft)
                const preview = draft.previewData || {}

                return (
                  <div
                    key={draft.draftId}
                    className="
                      group relative p-3 rounded-lg
                      bg-[rgb(var(--bg-default))]
                      border border-[rgb(var(--bd-default))]
                      hover:border-[rgb(var(--color-primary))]
                      hover:shadow-lg
                      transition-all duration-200
                    "
                  >
                    {/* Main Content */}
                    <div className="flex items-start gap-4">
                      {/* Draft Info */}
                      <div className="flex-1 min-w-0">
                        {/* Title Row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-[rgb(var(--fg-default))] truncate text-base">
                              {draft.draftName || 'Untitled Draft'}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-xs text-[rgb(var(--fg-muted))]">
                              <span>{formatRelativeTime(draft.lastSaved)}</span>
                              <span className="hidden group-hover:inline">• {formatFullDate(draft.lastSaved)}</span>
                              {draft.isAutoSave && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgb(var(--color-primary)_/_0.1)] text-[rgb(var(--color-primary))] font-medium">
                                  AUTO-SAVE
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleLoad(draft.draftId)}
                              className="
                                px-4 py-2 rounded-lg text-sm font-medium
                                bg-[rgb(var(--color-primary))]
                                text-white
                                hover:opacity-90
                                transition-opacity
                                flex items-center gap-2
                              "
                            >
                              <Download className="w-4 h-4" />
                              Load
                            </button>
                            <button
                              onClick={() => handleDelete(draft.draftId)}
                              disabled={deletingId === draft.draftId}
                              className="
                                p-2 rounded-lg
                                text-[rgb(var(--fg-muted))]
                                hover:text-red-600
                                hover:bg-red-50
                                transition-colors
                                disabled:opacity-50
                              "
                              title="Delete draft"
                            >
                              {deletingId === draft.draftId ? (
                                <div className="w-4 h-4 rounded-full border-2 border-red-200 border-t-red-600 animate-spin"></div>
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 text-sm">
                          {preview.jobName && (
                            <div key="job" className="text-[rgb(var(--fg-muted))] truncate">
                              {preview.jobName}
                            </div>
                          )}
                          {preview.clientName && (
                            <div key="client" className="text-[rgb(var(--fg-muted))] truncate">
                              {preview.clientName}
                            </div>
                          )}
                          {preview.category && (
                            <div key="category" className="text-[rgb(var(--fg-muted))] truncate">
                              {preview.category}
                            </div>
                          )}
                          {preview.totalCost !== undefined && preview.totalCost > 0 && (
                            <div key="cost" className="font-medium text-[rgb(var(--color-primary))]">
                              {currencySymbol}{preview.totalCost.toLocaleString('en-IN')}
                            </div>
                          )}
                        </div>

                        {/* Progress Bar */}
                        {progress > 0 && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-[rgb(var(--fg-muted))] mb-1">
                              <span>Progress</span>
                              <span className="font-medium">{progress}%</span>
                            </div>
                            <div className="h-1.5 bg-[rgb(var(--bg-muted))] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[rgb(var(--color-primary))] transition-all duration-500 rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer with Pagination */}
        <div className="px-6 py-4 border-t border-[rgb(var(--bd-default))] flex justify-between items-center bg-[rgb(var(--bg-muted)_/_0.3)]">
          <div className="text-sm text-[rgb(var(--fg-muted))]">
            {filteredAndSortedDrafts.length > 0 ? (
              <>
                Showing {((currentPage - 1) * PAGE_SIZE) + 1}-{Math.min(currentPage * PAGE_SIZE, filteredAndSortedDrafts.length)} of {filteredAndSortedDrafts.length}
                {filteredAndSortedDrafts.length !== drafts.length && ` (filtered from ${drafts.length})`}
              </>
            ) : (
              `0 of ${drafts.length} drafts`
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded text-[rgb(var(--fg-muted))] hover:bg-[rgb(var(--bg-default))] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`
                        w-8 h-8 rounded text-sm font-medium transition-colors
                        ${currentPage === pageNum
                          ? 'bg-[rgb(var(--color-primary))] text-white'
                          : 'text-[rgb(var(--fg-muted))] hover:bg-[rgb(var(--bg-default))]'
                        }
                      `}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded text-[rgb(var(--fg-muted))] hover:bg-[rgb(var(--bg-default))] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="
              px-5 py-2 rounded-lg text-sm font-medium
              bg-[rgb(var(--bg-default))]
              text-[rgb(var(--fg-default))]
              border border-[rgb(var(--bd-default))]
              hover:bg-[rgb(var(--bg-muted))]
              transition-colors
            "
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
