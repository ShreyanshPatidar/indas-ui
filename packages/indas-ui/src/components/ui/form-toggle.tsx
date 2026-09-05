'use client'

import React from 'react'
import { ChevronDown, ChevronUp, Plus, X } from '@/lib/icons'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

export interface FormToggleProps {
  /** Whether the form section is expanded */
  isExpanded: boolean
  /** Callback when toggle state changes */
  onToggle: (expanded: boolean) => void
  /** Title to display in the header */
  title?: string
  /** Title when creating new record */
  createTitle?: string
  /** Title when editing existing record */
  editTitle?: string
  /** Whether currently editing a record */
  isEditing?: boolean
  /** Form content to display when expanded */
  children: React.ReactNode
  /** Additional actions to show in header (right side) */
  headerActions?: React.ReactNode
  /** Show "New" button when collapsed */
  showNewButton?: boolean
  /** Custom "New" button text */
  newButtonText?: string
  /** Custom class for the container */
  className?: string
  /** Custom class for the content area */
  contentClassName?: string
  /** Disable the toggle */
  disabled?: boolean
  /** Show close button when expanded */
  showCloseButton?: boolean
  /** Callback when close button is clicked (optional - defaults to just toggling) */
  onClose?: () => void
}

/**
 * Reusable form toggle component for master modules
 *
 * Features:
 * - Smooth expand/collapse animation
 * - "New" button when collapsed
 * - Customizable titles for create/edit modes
 * - Header actions support
 * - Fully themed with CSS variables
 *
 * @example
 * ```tsx
 * <FormToggle
 *   isExpanded={isFormExpanded}
 *   onToggle={setIsFormExpanded}
 *   createTitle="Create New Company"
 *   editTitle="Edit Company"
 *   isEditing={!!editingCompany}
 * >
 *   <form>...</form>
 * </FormToggle>
 * ```
 */
export function FormToggle({
  isExpanded,
  onToggle,
  title,
  createTitle = 'Create New Record',
  editTitle = 'Edit Record',
  isEditing = false,
  children,
  headerActions,
  showNewButton = true,
  newButtonText = 'New',
  className,
  contentClassName,
  disabled = false,
  showCloseButton = true,
  onClose
}: FormToggleProps) {
  // Determine the title to display
  const displayTitle = title || (isEditing ? editTitle : createTitle)

  return (
    <div className={cn(
      "flex-shrink-0 bg-[rgb(var(--bg-surface))]",
      className
    )}>
      {/* Header - Always Visible */}
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left: Toggle with Title */}
        <div
          className={cn(
            "flex items-center gap-2 group",
            !disabled && "cursor-pointer"
          )}
          onClick={() => !disabled && onToggle(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-[rgb(var(--fg-subtle))] group-hover:text-[rgb(var(--fg-default))] transition-colors" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[rgb(var(--fg-subtle))] group-hover:text-[rgb(var(--fg-default))] transition-colors" />
          )}
          <h3 className="text-sm font-semibold text-[rgb(var(--fg-default))] group-hover:text-[rgb(var(--color-primary))] transition-colors">
            {displayTitle}
          </h3>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Show New button when collapsed */}
          {!isExpanded && showNewButton && (
            <Button
              variant="action-create"
              onClick={(e) => {
                e.stopPropagation()
                onToggle(true)
              }}
              icon={Plus}
              disabled={disabled}
              fab
            >
              {newButtonText}
            </Button>
          )}

          {/* Custom header actions */}
          {headerActions}

          {/* Close button when expanded */}
          {isExpanded && showCloseButton && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (onClose) {
                  onClose()
                } else {
                  onToggle(false)
                }
              }}
              className="rounded-sm opacity-70 ring-offset-[rgb(var(--bg-surface))] transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-2"
              title="Close form"
            >
              <X className="h-5 w-5 text-[rgb(var(--color-icon))]" />
              <span className="sr-only">Close</span>
            </button>
          )}
        </div>
      </div>

      {/* Content - Collapsible with Animation */}
      {isExpanded && (
        <div className={cn(
          "px-6 pb-4 pt-2 space-y-4 animate-in slide-in-from-top duration-200",
          contentClassName
        )}>
          {children}
        </div>
      )}
    </div>
  )
}