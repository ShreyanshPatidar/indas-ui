'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
    Search,
    ChevronDown,
    ChevronRight,
    LucideIcon,
    X,
    MoreVertical,
    PanelLeftClose,
    PanelLeftOpen,
    MessageSquare,
    Plus,
    History
} from '@/lib/icons'
import { Input } from '@/components'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui'
import { cn } from '@/lib/utils'

// --- Interfaces ---

export interface SidePanelItem {
    id: string
    label: React.ReactNode
    /** Plain string used for search filter when label is a ReactNode */
    searchText?: string
    /** Disable row click (e.g. during inline edit so onItemSelect doesn't fire) */
    disableSelect?: boolean
    icon?: LucideIcon | React.ElementType
    badge?: number | string
    onContextMenu?: (e: React.MouseEvent) => void
}

export interface SidePanelCategory {
    id: string
    label: string
    icon?: LucideIcon | React.ElementType
    items: SidePanelItem[]
}

export interface SidePanelProps {
    title: React.ReactNode
    icon?: LucideIcon | React.ElementType
    categories: SidePanelCategory[]
    activeItemId: string
    onItemSelect: (id: string) => void
    className?: string
    defaultOpenCategories?: string[]
    // Chat-specific props
    actionButton?: {
        label: string
        icon?: LucideIcon | React.ElementType
        onClick: () => void
    }
    isOpen?: boolean
    onClose?: () => void
    showSearch?: boolean
    itemContextMenu?: (itemId: string, close: () => void) => React.ReactNode
    collapsible?: boolean
    defaultCollapsed?: boolean
    onCollapseChange?: (collapsed: boolean) => void
    showItemIcons?: boolean
    /** Optional footer content (e.g. KPI stats, summary cards). Hidden when collapsed. */
    footer?: React.ReactNode
    /** When provided, replaces the category/item list with arbitrary content.
     *  Use this when the panel hosts a form or custom UI instead of a nav list. */
    children?: React.ReactNode
    /** Optional element rendered on the right side of the "Recents" header row.
     *  Used by chat to host a grouping-mode toggle next to the section label. */
    recentsAction?: React.ReactNode
}

// --- Component ---

export function SidePanel({
    title,
    icon: Icon,
    categories,
    activeItemId,
    onItemSelect,
    className,
    defaultOpenCategories = [],
    actionButton,
    isOpen = true,
    onClose,
    showSearch = true,
    itemContextMenu,
    collapsible = false,
    defaultCollapsed = false,
    onCollapseChange,
    showItemIcons = true,
    footer,
    children,
    recentsAction
}: SidePanelProps) {
    // State
    const [searchQuery, setSearchQuery] = useState('')
    const [openCategories, setOpenCategories] = useState<string[]>(
        defaultOpenCategories.length > 0 ? defaultOpenCategories : categories.map(c => c.id)
    )
    const [menuOpen, setMenuOpen] = useState<string | null>(null)
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
    const [isAnimating, setIsAnimating] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    // Notify parent of collapse changes
    const handleCollapseToggle = () => {
        const newState = !isCollapsed
        setIsAnimating(true)
        setIsCollapsed(newState)
        onCollapseChange?.(newState)
        // Clear animating flag after transition completes
        setTimeout(() => setIsAnimating(false), 300)
    }

    // Close menu on outside click
    useEffect(() => {
        if (menuOpen === null) return
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(null)
            }
        }
        document.addEventListener('click', handleClick)
        return () => document.removeEventListener('click', handleClick)
    }, [menuOpen])

    // Handlers
    const toggleCategory = (id: string) => {
        setOpenCategories(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        )
    }

    const handleMenuToggle = (e: React.MouseEvent, itemId: string) => {
        e.stopPropagation()

        if (menuOpen === itemId) {
            setMenuOpen(null)
        } else {
            const button = e.currentTarget as HTMLElement
            const rect = button.getBoundingClientRect()
            setMenuPosition({
                top: rect.top + rect.height / 2,
                left: rect.left - 170
            })
            setMenuOpen(itemId)
        }
    }

    // Filter Logic
    const filteredCategories = useMemo(() => {
        if (!searchQuery) return categories

        return categories.map(cat => ({
            ...cat,
            items: cat.items.filter(item => {
                const haystack = item.searchText ?? (typeof item.label === 'string' ? item.label : '')
                return haystack.toLowerCase().includes(searchQuery.toLowerCase())
            })
        })).filter(cat => cat.items.length > 0)
    }, [searchQuery, categories])

    return (
        <TooltipProvider delayDuration={400}>
            <>
                <div className={cn(
                    "bg-[rgb(var(--bg-surface))] border-r border-[rgb(var(--bd-default))] flex flex-col h-full overflow-hidden",
                    "transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                    isCollapsed ? "w-[3.25rem]" : "w-72",
                    // Mobile support
                    onClose && 'fixed md:relative z-50 md:z-0',
                    onClose && (isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'),
                    // Override any passed width classes when collapsible
                    collapsible && !className?.includes('w-full') && (isCollapsed ? "!w-[3.25rem]" : "")
                )}>
                    {/* Header */}
                    <div className={cn(
                        "shrink-0 overflow-hidden",
                        "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                        isCollapsed ? "px-2 pt-3 pb-2" : "px-4 py-3 border-b border-[rgb(var(--bd-default))]"
                    )}>
                        <div className={cn(
                            "flex items-center",
                            isCollapsed ? "justify-center" : "justify-between"
                        )}>
                            {/* Title — fades during transition */}
                            <div className={cn(
                                "flex items-center gap-2 whitespace-nowrap min-w-0",
                                "transition-[opacity,transform] duration-200 ease-out",
                                isCollapsed ? "opacity-0 scale-95 w-0 pointer-events-none" : "opacity-100 scale-100 w-auto"
                            )}>
                                {Icon && <Icon className="w-5 h-5 shrink-0 text-[rgb(var(--fg-default))]" />}
                                <h2 className="font-semibold text-base text-[rgb(var(--fg-default))] truncate">
                                    {title}
                                </h2>
                            </div>

                            {/* Collapse/Expand + Close */}
                            <div className={cn(
                                "flex items-center gap-0.5 shrink-0",
                                isCollapsed && "mx-auto"
                            )}>
                                {collapsible && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={handleCollapseToggle}
                                                className={cn(
                                                    "h-8 w-8 flex items-center justify-center rounded-lg transition-all duration-200",
                                                    "text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))]",
                                                    "hover:bg-[rgb(var(--bg-subtle))] active:scale-95"
                                                )}
                                            >
                                                {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                            {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                                {onClose && !isCollapsed && (
                                    <button
                                        onClick={onClose}
                                        className="md:hidden h-8 w-8 flex items-center justify-center text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-subtle))] rounded-lg transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Action Button + Search — fades during transition */}
                        <div className={cn(
                            "overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                            isCollapsed
                                ? "max-h-0 opacity-0 mt-0"
                                : "max-h-[120px] opacity-100 mt-2.5"
                        )}>
                            {/* Action Button (e.g., New Chat) */}
                            {actionButton && (
                                <button
                                    onClick={actionButton.onClick}
                                    className="w-full px-4 py-2 bg-[rgb(var(--bg-subtle))] border border-[rgb(var(--bd-default))] text-[rgb(var(--fg-default))] rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-[rgb(var(--bg-app))] hover:border-[rgb(var(--color-primary))]/30 active:scale-[0.98] transition-all duration-200"
                                >
                                    {actionButton.icon && <actionButton.icon className="w-4 h-4 shrink-0 text-[rgb(var(--color-primary))]" />}
                                    <span>{actionButton.label}</span>
                                </button>
                            )}

                            {/* Search */}
                            {showSearch && (
                                <div className={cn(actionButton && "mt-2.5")}>
                                    <Input
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        leftIcon={Search}
                                        className="bg-[rgb(var(--bg-surface))]"
                                        data-sidepanel-search
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className={cn(
                        "flex-1 overflow-y-auto overflow-x-hidden",
                        "transition-[padding] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                        isCollapsed ? "px-1.5 py-1" : "px-2 py-1",
                        className?.includes('w-full') && !isCollapsed && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                    )}>
                        {/* Collapsed View */}
                        {isCollapsed ? (
                            <div className="flex flex-col items-center gap-1">
                                {/* Action button collapsed (New Chat) */}
                                {actionButton && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={actionButton.onClick}
                                                className="w-9 h-9 flex items-center justify-center rounded-lg text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-subtle))] active:scale-95 transition-all duration-150"
                                            >
                                                {actionButton.icon ? <actionButton.icon className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                            {actionButton.label}
                                        </TooltipContent>
                                    </Tooltip>
                                )}

                                {showItemIcons ? (
                                    // Show individual item icons with badge count at top-right
                                    filteredCategories.flatMap(cat => cat.items).slice(0, 10).map((item) => (
                                        <Tooltip key={item.id}>
                                            <TooltipTrigger asChild>
                                                <button
                                                    onClick={() => onItemSelect(item.id)}
                                                    className={cn(
                                                        "relative w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-150",
                                                        "active:scale-95",
                                                        activeItemId === item.id
                                                            ? "bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))]"
                                                            : "text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-subtle))]"
                                                    )}
                                                >
                                                    {(() => {
                                                        const ItemIcon = item.icon || MessageSquare
                                                        return <ItemIcon className="w-5 h-5" />
                                                    })()}
                                                    {item.badge !== undefined && item.badge !== 0 && (
                                                        <span className="absolute -top-1 -right-1 min-w-[0.875rem] h-3.5 px-0.5 text-[8px] font-bold rounded-full flex items-center justify-center leading-none bg-[rgb(var(--color-primary))] text-white">
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent side="right">
                                                {item.label}{item.badge !== undefined && item.badge !== 0 ? ` (${item.badge})` : ''}
                                            </TooltipContent>
                                        </Tooltip>
                                    ))
                                ) : (
                                    // Search + Last Chat + All Chats
                                    <>
                                        {showSearch && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        onClick={() => {
                                                            handleCollapseToggle()
                                                            setTimeout(() => {
                                                                const searchInput = document.querySelector<HTMLInputElement>('[data-sidepanel-search]')
                                                                searchInput?.focus()
                                                            }, 350)
                                                        }}
                                                        className="w-9 h-9 flex items-center justify-center rounded-lg text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-subtle))] active:scale-95 transition-all duration-150"
                                                    >
                                                        <Search className="w-5 h-5" />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent side="right">
                                                    Search
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                        {/* Last Chat — jump to most recent conversation */}
                                        {(() => {
                                            const lastItem = filteredCategories.flatMap(cat => cat.items)[0]
                                            if (!lastItem) return null
                                            return (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            onClick={() => onItemSelect(lastItem.id)}
                                                            className={cn(
                                                                "w-9 h-9 flex items-center justify-center rounded-lg active:scale-95 transition-all duration-150",
                                                                activeItemId === lastItem.id
                                                                    ? "bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))]"
                                                                    : "text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-subtle))]"
                                                            )}
                                                        >
                                                            <History className="w-5 h-5" />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="right">
                                                        {lastItem.label}
                                                    </TooltipContent>
                                                </Tooltip>
                                            )
                                        })()}
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    onClick={handleCollapseToggle}
                                                    className="w-9 h-9 flex items-center justify-center rounded-lg text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-subtle))] active:scale-95 transition-all duration-150"
                                                >
                                                    <MessageSquare className="w-5 h-5" />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent side="right">
                                                All Chats
                                            </TooltipContent>
                                        </Tooltip>
                                    </>
                                )}
                                {showItemIcons && filteredCategories.flatMap(cat => cat.items).length > 10 && (
                                    <div className="text-center text-xs text-[rgb(var(--fg-muted))] py-1">
                                        +{filteredCategories.flatMap(cat => cat.items).length - 10}
                                    </div>
                                )}
                            </div>
                        ) : children ? (
                            /* Free-form content slot (forms, custom UI) */
                            <div className={cn(
                                "transition-opacity duration-200 ease-out",
                                isAnimating ? "opacity-0" : "opacity-100"
                            )}>
                                {children}
                            </div>
                        ) : (
                            /* Expanded View */
                            <div className={cn(
                                "transition-opacity duration-200 ease-out",
                                isAnimating ? "opacity-0" : "opacity-100"
                            )}>
                                {/* Recents label */}
                                {!showItemIcons && !searchQuery && filteredCategories.some(c => c.items.length > 0) && (
                                    <div className="px-3 pt-2 pb-1.5 flex items-center justify-between">
                                        <span className="text-[0.65rem] font-semibold text-[rgb(var(--fg-muted))]/70 uppercase tracking-widest">
                                            Recents
                                        </span>
                                        {recentsAction}
                                    </div>
                                )}
                                {filteredCategories.length === 0 ? (
                                    <div className="text-center text-sm text-[rgb(var(--fg-muted))] py-8 col-span-full">
                                        {searchQuery ? 'No results found' : 'No items yet'}
                                    </div>
                                ) : (
                                    filteredCategories.map(category => (
                                        <div key={category.id} className={cn(
                                            className?.includes('w-full') && "bg-[rgb(var(--bg-subtle))] rounded-lg p-2 h-fit"
                                        )}>
                                            {/* Category Header (only show if multiple categories) */}
                                            {filteredCategories.length > 1 && (
                                                <button
                                                    onClick={() => toggleCategory(category.id)}
                                                    className="w-full flex items-center justify-between px-2 py-1.5 text-sm font-semibold text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-subtle))] rounded-md transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {category.icon && <category.icon className="w-4 h-4 text-[rgb(var(--fg-muted))]" />}
                                                        {category.label}
                                                    </div>
                                                    {openCategories.includes(category.id) ? (
                                                        <ChevronDown className="w-3.5 h-3.5 text-[rgb(var(--fg-muted))]" />
                                                    ) : (
                                                        <ChevronRight className="w-3.5 h-3.5 text-[rgb(var(--fg-muted))]" />
                                                    )}
                                                </button>
                                            )}

                                            {/* Items */}
                                            {(filteredCategories.length === 1 || openCategories.includes(category.id)) && (
                                                <div className={cn(
                                                    "space-y-px",
                                                    filteredCategories.length > 1 && "ml-2 mt-1",
                                                    filteredCategories.length > 1 && !className?.includes('w-full') && "border-l border-[rgb(var(--bd-default))] pl-2"
                                                )}>
                                                    {category.items.map(item => (
                                                        <div key={item.id} className="relative group">
                                                            <button
                                                                onClick={() => { if (!item.disableSelect) onItemSelect(item.id) }}
                                                                className={cn(
                                                                    "w-full text-left px-3 py-2 text-[0.8125rem] rounded-lg transition-all duration-150 flex items-center gap-2.5",
                                                                    activeItemId === item.id
                                                                        ? "bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-default))] font-medium border-l-2 border-[rgb(var(--color-primary))] pl-2.5"
                                                                        : "text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-subtle))]/60"
                                                                )}
                                                            >
                                                                {showItemIcons && (() => {
                                                                    const ItemIcon = item.icon || MessageSquare
                                                                    return <ItemIcon className="w-4 h-4 shrink-0 opacity-50" />
                                                                })()}
                                                                <span className="truncate flex-1">
                                                                    {item.label}
                                                                </span>
                                                                {item.badge !== undefined && item.badge !== 0 && (
                                                                    <span className={cn(
                                                                        "text-xs px-1.5 py-0.5 rounded-full shrink-0 tabular-nums",
                                                                        activeItemId === item.id
                                                                            ? "bg-[rgb(var(--color-primary))] text-white"
                                                                            : "bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-muted))]"
                                                                    )}>
                                                                        {item.badge}
                                                                    </span>
                                                                )}
                                                            </button>

                                                            {/* Context Menu Button */}
                                                            {itemContextMenu && (
                                                                <button
                                                                    onClick={(e) => handleMenuToggle(e, item.id)}
                                                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md text-[rgb(var(--fg-muted))]/50 flex items-center justify-center hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-subtle))] transition-all opacity-0 group-hover:opacity-100"
                                                                >
                                                                    <MoreVertical className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer — KPI stats, summary, etc. (hidden when collapsed) */}
                    {footer && !isCollapsed && (
                        <div className={cn(
                            "shrink-0 border-t border-[rgb(var(--bd-default))] transition-opacity duration-200",
                            isAnimating ? "opacity-0" : "opacity-100"
                        )}>
                            {footer}
                        </div>
                    )}
                </div>

                {/* Context Menu Dropdown */}
                {menuOpen !== null && itemContextMenu && (
                    <div
                        ref={menuRef}
                        className="fixed bg-[rgb(var(--bg-surface))] border border-[rgb(var(--bd-default))] rounded-lg min-w-[170px] shadow-lg overflow-hidden z-[9999]"
                        style={{
                            left: `${menuPosition.left}px`,
                            top: `${menuPosition.top}px`,
                            transform: 'translateY(-50%)'
                        }}
                    >
                        {itemContextMenu(menuOpen, () => setMenuOpen(null))}
                    </div>
                )}
            </>
        </TooltipProvider>
    )
}
