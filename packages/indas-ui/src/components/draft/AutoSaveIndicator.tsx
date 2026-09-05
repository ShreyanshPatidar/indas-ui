/**
 * Auto-Save Indicator Component
 *
 * Displays save status in the footer:
 * - "Saved 2 mins ago" (green)
 * - "Saving..." (blue)
 * - "Unsaved changes" (orange)
 * - "Auto-save: ON/OFF" toggle
 *
 * Clicking opens Draft Manager modal
 */

import React from 'react'
import { Clock, Save, AlertCircle } from 'lucide-react'

interface AutoSaveIndicatorProps {
  /** Whether auto-save is enabled */
  enabled: boolean

  /** Last saved timestamp */
  lastSaved: Date | null

  /** Whether there are unsaved changes */
  isDirty: boolean

  /** Whether currently saving */
  isSaving: boolean

  /** Callback when clicked (opens draft manager) */
  onOpenDraftManager?: () => void

  /** Callback to toggle auto-save */
  onToggleAutoSave?: (enabled: boolean) => void
}

export function AutoSaveIndicator({
  enabled,
  lastSaved,
  isDirty,
  isSaving,
  onOpenDraftManager,
  onToggleAutoSave
}: AutoSaveIndicatorProps) {
  /**
   * Format relative time (e.g., "2 mins ago")
   */
  const formatRelativeTime = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    const days = Math.floor(hours / 24)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }

  /**
   * Get status color and icon
   */
  const getStatus = () => {
    if (isSaving) {
      return {
        color: 'text-[rgb(var(--color-primary))]',
        bg: 'bg-[rgb(var(--color-primary)_/_0.1)]',
        icon: <Save className="w-3.5 h-3.5 animate-pulse" />,
        text: 'Saving...'
      }
    }

    if (isDirty) {
      return {
        color: 'text-orange-600',
        bg: 'bg-orange-100',
        icon: <AlertCircle className="w-3.5 h-3.5" />,
        text: 'Unsaved changes'
      }
    }

    if (lastSaved) {
      return {
        color: 'text-green-600',
        bg: 'bg-green-100',
        icon: <Save className="w-3.5 h-3.5" />,
        text: `Saved ${formatRelativeTime(lastSaved)}`
      }
    }

    return {
      color: 'text-[rgb(var(--fg-muted))]',
      bg: 'bg-[rgb(var(--bg-muted))]',
      icon: <Clock className="w-3.5 h-3.5" />,
      text: 'Not saved yet'
    }
  }

  const status = getStatus()

  return (
    <div className="flex items-center gap-3">
      {/* Auto-save toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[rgb(var(--fg-muted))]">Auto-save:</span>
        <button
          onClick={() => onToggleAutoSave?.(!enabled)}
          className={`
            relative inline-flex h-5 w-9 items-center rounded-full transition-colors
            ${enabled ? 'bg-[rgb(var(--color-primary))]' : 'bg-[rgb(var(--bg-muted))]'}
          `}
          title={enabled ? 'Disable auto-save' : 'Enable auto-save'}
        >
          <span
            className={`
              inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform
              ${enabled ? 'translate-x-5' : 'translate-x-1'}
            `}
          />
        </button>
        <span className="text-xs font-medium text-[rgb(var(--fg-default))]">
          {enabled ? 'ON' : 'OFF'}
        </span>
      </div>

      {/* Separator */}
      <div className="h-4 w-px bg-[rgb(var(--bd-default))]" />

      {/* Status indicator */}
      <button
        onClick={onOpenDraftManager}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors
          ${status.bg} ${status.color} hover:opacity-80
        `}
        title="Click to manage drafts"
      >
        {status.icon}
        <span className="text-xs font-medium">{status.text}</span>
      </button>
    </div>
  )
}
