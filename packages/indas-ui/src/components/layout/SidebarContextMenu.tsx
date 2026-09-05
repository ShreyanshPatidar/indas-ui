'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { Star, ExternalLink, EyeOff, HelpCircle, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebarPreferences } from '@/contexts/SidebarPreferencesContext'
import { useTranslation } from '@/hooks/useTranslation'

interface SidebarContextMenuProps {
  children: React.ReactNode
  modulePath: string
  moduleDisplayName: string
  onOpenNewTab?: () => void
}

export function SidebarContextMenu({
  children,
  modulePath,
  moduleDisplayName,
  onOpenNewTab
}: SidebarContextMenuProps) {
  const { t } = useTranslation()
  const { isFavorite, toggleFavorite, hideItem } = useSidebarPreferences()
  const [open, setOpen] = React.useState(false)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const menuRef = React.useRef<HTMLDivElement>(null)

  const isPinned = isFavorite(modulePath)

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setPosition({ x: e.clientX, y: e.clientY })
    setOpen(true)
  }

  // Close menu when clicking outside
  React.useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const handlePinToFavorites = () => {
    toggleFavorite(modulePath)
    setOpen(false)
  }

  const handleOpenNewTab = () => {
    if (modulePath && modulePath !== '#') {
      window.open(modulePath, '_blank')
    }
    onOpenNewTab?.()
    setOpen(false)
  }

  const handleHide = () => {
    hideItem(modulePath)
    setOpen(false)
  }

  const handleHelp = () => {
    window.open('https://docs.indusanalytics.co.in/help', '_blank')
    setOpen(false)
  }

  const handleFeedback = () => {
    window.open('https://forms.indusanalytics.co.in/feedback', '_blank')
    setOpen(false)
  }

  const menuItemClass = cn(
    "relative flex cursor-pointer select-none items-center rounded-md px-2 py-2 text-sm outline-none",
    "text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-hover))]"
  )

  return (
    <>
      <div className="w-full" onContextMenu={handleContextMenu}>
        {children}
      </div>

      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[500] min-w-[180px] overflow-hidden rounded-lg border border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))] p-1 shadow-xl"
          style={{ left: position.x, top: position.y }}
        >
          {/* Pin to Favorites */}
          <button className={menuItemClass} onClick={handlePinToFavorites}>
            <Star className={cn(
              "mr-3 h-4 w-4",
              isPinned ? "fill-yellow-400 text-yellow-400" : "text-[rgb(var(--color-icon))]"
            )} />
            <span>{isPinned ? t('Unpin from Favorites') : t('Pin to Favorites')}</span>
          </button>

          {/* Open in New Tab */}
          <button
            className={cn(menuItemClass, modulePath === '#' && "opacity-50 cursor-not-allowed")}
            onClick={handleOpenNewTab}
            disabled={modulePath === '#'}
          >
            <ExternalLink className="mr-3 h-4 w-4 text-[rgb(var(--color-icon))]" />
            <span>{t('Open in New Tab')}</span>
          </button>

          {/* Hide */}
          <button className={menuItemClass} onClick={handleHide}>
            <EyeOff className="mr-3 h-4 w-4 text-[rgb(var(--color-icon))]" />
            <span>{t('Hide')}</span>
          </button>

          <div className="my-1 h-px bg-[rgb(var(--bd-default))]" />

          {/* Help */}
          <button className={menuItemClass} onClick={handleHelp}>
            <HelpCircle className="mr-3 h-4 w-4 text-[rgb(var(--color-icon))]" />
            <span>{t('Help')}</span>
          </button>

          {/* Provide Feedback */}
          <button className={menuItemClass} onClick={handleFeedback}>
            <MessageSquare className="mr-3 h-4 w-4 text-[rgb(var(--color-icon))]" />
            <span>{t('Provide Feedback')}</span>
          </button>
        </div>,
        document.body
      )}
    </>
  )
}

/**
 * Context menu for group headers (parent items with children)
 */
interface SidebarGroupContextMenuProps {
  children: React.ReactNode
  groupName: string
  modulePaths: string[]
}

export function SidebarGroupContextMenu({
  children,
  groupName,
  modulePaths
}: SidebarGroupContextMenuProps) {
  const { t } = useTranslation()
  const { hideItem, isFavorite, toggleFavorite } = useSidebarPreferences()
  const [open, setOpen] = React.useState(false)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const menuRef = React.useRef<HTMLDivElement>(null)

  const allPinned = modulePaths.filter(p => p && p !== '#').every(path => isFavorite(path))

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setPosition({ x: e.clientX, y: e.clientY })
    setOpen(true)
  }

  React.useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const handlePinAll = () => {
    modulePaths.forEach(path => {
      if (path && path !== '#' && !isFavorite(path)) {
        toggleFavorite(path)
      }
    })
    setOpen(false)
  }

  const handleUnpinAll = () => {
    modulePaths.forEach(path => {
      if (path && path !== '#' && isFavorite(path)) {
        toggleFavorite(path)
      }
    })
    setOpen(false)
  }

  const handleOpenAllNewTabs = () => {
    modulePaths.forEach(path => {
      if (path && path !== '#') {
        window.open(path, '_blank')
      }
    })
    setOpen(false)
  }

  const handleHideGroup = () => {
    modulePaths.forEach(path => {
      if (path && path !== '#') {
        hideItem(path)
      }
    })
    setOpen(false)
  }

  const handleHelp = () => {
    window.open('https://docs.indusanalytics.co.in/help', '_blank')
    setOpen(false)
  }

  const handleFeedback = () => {
    window.open('https://forms.indusanalytics.co.in/feedback', '_blank')
    setOpen(false)
  }

  const menuItemClass = cn(
    "relative flex cursor-pointer select-none items-center rounded-md px-2 py-2 text-sm outline-none w-full",
    "text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-hover))]"
  )

  return (
    <>
      <div className="w-full" onContextMenu={handleContextMenu}>
        {children}
      </div>

      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[500] min-w-[180px] overflow-hidden rounded-lg border border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))] p-1 shadow-xl"
          style={{ left: position.x, top: position.y }}
        >
          {/* Pin/Unpin All */}
          <button className={menuItemClass} onClick={allPinned ? handleUnpinAll : handlePinAll}>
            <Star className={cn(
              "mr-3 h-4 w-4",
              allPinned ? "fill-yellow-400 text-yellow-400" : "text-[rgb(var(--color-icon))]"
            )} />
            <span>{allPinned ? t('Unpin All from Favorites') : t('Pin All to Favorites')}</span>
          </button>

          {/* Open All in New Tabs */}
          <button className={menuItemClass} onClick={handleOpenAllNewTabs}>
            <ExternalLink className="mr-3 h-4 w-4 text-[rgb(var(--color-icon))]" />
            <span>{t('Open All in New Tabs')}</span>
          </button>

          {/* Hide Group */}
          <button className={menuItemClass} onClick={handleHideGroup}>
            <EyeOff className="mr-3 h-4 w-4 text-[rgb(var(--color-icon))]" />
            <span>{t('Hide Group')}</span>
          </button>

          <div className="my-1 h-px bg-[rgb(var(--bd-default))]" />

          {/* Help */}
          <button className={menuItemClass} onClick={handleHelp}>
            <HelpCircle className="mr-3 h-4 w-4 text-[rgb(var(--color-icon))]" />
            <span>{t('Help')}</span>
          </button>

          {/* Provide Feedback */}
          <button className={menuItemClass} onClick={handleFeedback}>
            <MessageSquare className="mr-3 h-4 w-4 text-[rgb(var(--color-icon))]" />
            <span>{t('Provide Feedback')}</span>
          </button>
        </div>,
        document.body
      )}
    </>
  )
}
