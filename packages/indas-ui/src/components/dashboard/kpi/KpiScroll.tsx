'use client'

import * as React from 'react'
import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ArrowRight, ChevronDown, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface KpiScrollItem {
  /** Unique identifier */
  id: string
  /** Icon component */
  icon?: LucideIcon
  /** Icon background color */
  iconBg?: string
  /** Icon color */
  iconColor?: string
  /** Custom icon element (for images/svgs/avatars) */
  customIcon?: React.ReactNode
  /** Main title */
  title: string
  /** Subtitle/description */
  subtitle?: string
  /** Metric value */
  value: string | number
  /** Metric prefix (e.g., +, -, ₹) */
  prefix?: string
  /** Metric suffix (e.g., %, k, m) */
  suffix?: string
  /** Whether the value is positive (green), negative (red), or neutral */
  sentiment?: 'positive' | 'negative' | 'neutral'
  /** Secondary value (shown below main value) */
  secondaryValue?: string
  /** Click handler */
  onClick?: () => void
}

export interface KpiScrollProps {
  /** Section title */
  title?: string
  /** Section description */
  description?: string
  /** Period options for dropdown */
  periodOptions?: { value: string; label: string }[]
  /** Selected period value */
  periodValue?: string
  /** Period change handler */
  onPeriodChange?: (value: string) => void
  /** Items to display */
  items: KpiScrollItem[]
  /** Show "View All" button */
  showViewAll?: boolean
  /** View All click handler */
  onViewAll?: () => void
  /** View All label */
  viewAllLabel?: string
  /** Card variant */
  variant?: 'default' | 'compact' | 'detailed'
  /** Additional class names */
  className?: string
}

/**
 * KpiScroll - Horizontal scrollable KPI cards
 *
 * Great for: Channel stats, customer metrics, quick summaries
 */
export function KpiScroll({
  title,
  description,
  periodOptions,
  periodValue,
  onPeriodChange,
  items,
  showViewAll = true,
  onViewAll,
  viewAllLabel = 'Full Stats',
  variant = 'default',
  className
}: KpiScrollProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false)
  const periodDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(e.target as Node)) {
        setPeriodDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const checkScrollability = () => {
    const container = scrollContainerRef.current
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0)
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 1
      )
    }
  }

  useEffect(() => {
    checkScrollability()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScrollability)
      window.addEventListener('resize', checkScrollability)
      return () => {
        container.removeEventListener('scroll', checkScrollability)
        window.removeEventListener('resize', checkScrollability)
      }
    }
  }, [items])

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (container) {
      const scrollAmount = variant === 'compact' ? 200 : 280
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const getSentimentColor = (sentiment?: 'positive' | 'negative' | 'neutral') => {
    switch (sentiment) {
      case 'positive':
        return 'text-[rgb(var(--color-success))]'
      case 'negative':
        return 'text-[rgb(var(--color-error))]'
      default:
        return 'text-[rgb(var(--fg-default))]'
    }
  }

  const getCardWidth = () => {
    switch (variant) {
      case 'compact':
        return 'w-[120px] sm:w-[140px]'
      case 'detailed':
        return 'w-[180px] sm:w-[200px]'
      default:
        return 'w-[140px] sm:w-[160px]'
    }
  }

  return (
    <div className={cn(
      'bg-[rgb(var(--bg-surface))] rounded-2xl border border-[rgb(var(--bd-default))] overflow-hidden',
      className
    )}>
      {/* Header */}
      {(title || description || periodOptions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            {title && (
              <h3 className="text-base font-semibold text-[rgb(var(--fg-default))]">{title}</h3>
            )}
            {/* Period Dropdown */}
            {periodOptions && periodOptions.length > 0 && (
              <div ref={periodDropdownRef} className="relative">
                <button
                  onClick={() => setPeriodDropdownOpen(!periodDropdownOpen)}
                  className="flex items-center gap-1 text-xs text-[rgb(var(--fg-muted))] bg-[rgb(var(--bg-subtle))] hover:bg-[rgb(var(--bg-hover))] px-2.5 py-1 rounded-full transition-colors"
                >
                  {periodOptions.find(o => o.value === periodValue)?.label || periodOptions[0]?.label}
                  <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', periodDropdownOpen && 'rotate-180')} />
                </button>
                {periodDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--bd-default))] rounded-lg shadow-lg py-1 min-w-[100px] z-20">
                    {periodOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          onPeriodChange?.(option.value)
                          setPeriodDropdownOpen(false)
                        }}
                        className={cn(
                          'w-full text-left px-3 py-1.5 text-xs hover:bg-[rgb(var(--bg-hover))] transition-colors',
                          periodValue === option.value ? 'text-[rgb(var(--color-primary))] font-medium' : 'text-[rgb(var(--fg-default))]'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          {description && (
            <p className="text-sm text-[rgb(var(--fg-muted))]">{description}</p>
          )}
        </div>
      )}

      {/* Scrollable Container */}
      <div className="relative group px-5 pb-5">
        {/* Left Scroll Button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className={cn(
              'absolute left-2 top-1/2 -translate-y-1/2 z-10',
              'w-9 h-9 rounded-full flex items-center justify-center',
              'bg-[rgb(var(--bg-surface))] border border-[rgb(var(--bd-default))] shadow-lg',
              'text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--color-primary))] hover:border-[rgb(var(--color-primary))]',
              'transition-all duration-200',
              'opacity-0 group-hover:opacity-100'
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Right Scroll Button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 z-10',
              'w-9 h-9 rounded-full flex items-center justify-center',
              'bg-[rgb(var(--bg-surface))] border border-[rgb(var(--bd-default))] shadow-lg',
              'text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--color-primary))] hover:border-[rgb(var(--color-primary))]',
              'transition-all duration-200',
              'opacity-0 group-hover:opacity-100'
            )}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Cards Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              onClick={item.onClick}
              className={cn(
                'flex-shrink-0',
                getCardWidth(),
                'bg-[rgb(var(--bg-subtle))] rounded-xl p-4',
                'border border-transparent',
                'transition-all duration-200',
                'hover:bg-[rgb(var(--bg-hover))] hover:shadow-md',
                item.onClick && 'cursor-pointer hover:border-[rgb(var(--color-primary))]'
              )}
            >
              {/* Icon */}
              {(item.icon || item.customIcon) && (
                <div className="mb-3">
                  {item.customIcon ? (
                    item.customIcon
                  ) : item.icon ? (
                    <div
                      className={cn(
                        'w-11 h-11 rounded-xl flex items-center justify-center',
                        item.iconBg || 'bg-[rgb(var(--color-primary))]/10'
                      )}
                    >
                      <item.icon
                        className={cn('w-5 h-5', item.iconColor || 'text-[rgb(var(--color-primary))]')}
                      />
                    </div>
                  ) : null}
                </div>
              )}

              {/* Title & Subtitle */}
              <p className="text-sm font-semibold text-[rgb(var(--fg-default))] truncate">{item.title}</p>
              {item.subtitle && (
                <p className="text-xs text-[rgb(var(--fg-muted))] truncate mt-0.5">{item.subtitle}</p>
              )}

              {/* Value */}
              <p className={cn(
                'text-xl font-bold mt-2',
                getSentimentColor(item.sentiment)
              )}>
                {item.prefix}{item.value}{item.suffix}
              </p>

              {/* Secondary Value */}
              {item.secondaryValue && (
                <p className="text-xs text-[rgb(var(--fg-muted))] mt-1">{item.secondaryValue}</p>
              )}
            </div>
          ))}

          {/* View All Card */}
          {showViewAll && onViewAll && (
            <button
              onClick={onViewAll}
              className={cn(
                'flex-shrink-0',
                getCardWidth(),
                'bg-[rgb(var(--color-primary))] rounded-xl p-4',
                'flex flex-col items-center justify-center gap-2',
                'cursor-pointer hover:brightness-110 hover:shadow-lg transition-all duration-200',
                'min-h-[140px]'
              )}
            >
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-1">
                <ArrowRight className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-semibold text-white text-center leading-tight">{viewAllLabel}</p>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
