/**
 * 3D Modal
 * Preview card with inline Three.js content + expand to fullscreen modal.
 * The 3D content renders directly in the preview card and also in the expanded modal.
 *
 * Usage:
 *   <ThreeDModal title={t('Box View')} previewHeight="13.75rem" details={[...]}
 *     renderContent={() => <ShipperBox3D ... className="w-full h-full" />}
 *   />
 */

'use client'

import React, { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui'
import { X, Maximize2, Box, RotateCw } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export interface ThreeDModalDetail {
  label: string
  value: string | number
}

interface ThreeDModalProps {
  /** Card title shown above the preview */
  title?: string
  /** @deprecated Pass renderContent instead */
  children?: React.ReactNode
  /** Render function for 3D content */
  renderContent?: () => React.ReactNode
  /** Fallback when there's no data to render */
  placeholder?: string
  /** Whether to show the 3D content (false = show placeholder) */
  hasData?: boolean
  /** Preview card height — default 13.75rem to match planning modal cards */
  previewHeight?: string
  /** Additional className for the preview card container */
  className?: string
  /** Metadata row shown below the header in the expanded modal */
  details?: ThreeDModalDetail[]
  /** Extra actions rendered next to the expand/close icon in headers */
  headerActions?: React.ReactNode
  /** When provided, shows a refresh button next to the expand icon */
  onRefresh?: () => void
}

export function ThreeDModal({
  title,
  children,
  renderContent,
  placeholder,
  hasData = true,
  previewHeight = '13.75rem',
  className = '',
  details,
  headerActions,
  onRefresh,
}: ThreeDModalProps) {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const handleOpen = useCallback(() => {
    if (hasData) setIsOpen(true)
  }, [hasData])

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  // 3D content — rendered in both preview and expanded modal
  const previewContent = hasData ? (renderContent ? renderContent() : children) : null
  const expandedContent = isOpen && hasData ? (renderContent ? renderContent() : children) : null

  return (
    <>
      {/* Preview Card */}
      <div
        className={`border border-[rgb(var(--bd-default))] rounded bg-[rgb(var(--bg-surface))] flex flex-col overflow-hidden ${className}`}
        style={{ height: previewHeight }}
      >
        {/* Card Header */}
        {title && (
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-subtle))] flex-shrink-0">
            <span className="text-xs font-semibold text-[rgb(var(--fg-default))] truncate">{title}</span>
            {hasData && (
              <div className="flex items-center gap-1">
                {headerActions}
                {onRefresh && (
                  <button
                    onClick={onRefresh}
                    className="p-0.5 rounded hover:bg-[rgb(var(--bg-hover))] transition-colors text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))]"
                    title={t('Refresh 3D view')}
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={handleOpen}
                  className="p-0.5 rounded hover:bg-[rgb(var(--bg-hover))] transition-colors text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))]"
                  title={t('Expand')}
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Preview Area — shows 3D content inline */}
        <div className="flex-1 min-h-0">
          {previewContent ? (
            <div className="w-full h-full">{previewContent}</div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-[rgb(var(--fg-muted))]">
              <Box className="h-6 w-6 opacity-40" />
              <span className="text-xs">{placeholder || t('No data to display')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Modal */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent
          className="flex flex-col p-0 bg-[rgb(var(--bg-surface))] z-[100] overflow-hidden w-[90vw] max-w-[90vw] h-[90vh]"
          hideCloseButton
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 md:px-6 py-2.5 border-b border-[rgb(var(--bd-default))] flex-shrink-0 bg-[rgb(var(--bg-surface))]">
            <DialogTitle className="flex-shrink-0">{title || t('3D View')}</DialogTitle>
            <div className="flex items-center gap-2">
              {headerActions}
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="p-1 rounded hover:bg-[rgb(var(--bg-hover))] transition-colors text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))]"
                  title={t('Refresh 3D view')}
                >
                  <RotateCw className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={handleClose}
                className="close-btn-md flex-shrink-0"
                aria-label={t('Close')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Details row */}
          {details && details.length > 0 && (
            <div className="px-6 py-2 bg-[rgb(var(--bg-subtle))] border-b border-[rgb(var(--bd-default))] flex-shrink-0">
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-[rgb(var(--fg-default))]">
                {details.map((detail, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <span className="font-medium text-[rgb(var(--fg-muted))]">{detail.label}:</span>
                    <span className="font-normal">{detail.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3D Content — separate instance for fullscreen */}
          <div className="flex-1 min-h-0 bg-[rgb(var(--bg-surface))]">
            {expandedContent && (
              <div className="w-full h-full">{expandedContent}</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
