'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface DashboardTooltipProps {
  /** Tooltip content */
  content: React.ReactNode

  /** Position of tooltip relative to trigger */
  position?: 'top' | 'bottom' | 'left' | 'right'

  /** Delay before showing tooltip (ms) */
  delay?: number

  /** Children element that triggers tooltip */
  children: React.ReactElement

  /** Additional class for tooltip container */
  className?: string

  /** Disable tooltip */
  disabled?: boolean
}

/**
 * DashboardTooltip - Hover tooltip for dashboard elements
 *
 * Usage:
 * <DashboardTooltip content="This is a tooltip">
 *   <button>Hover me</button>
 * </DashboardTooltip>
 */
export function DashboardTooltip({
  content,
  position = 'top',
  delay = 200,
  children,
  className,
  disabled = false
}: DashboardTooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const showTooltip = () => {
    if (disabled) return
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-[rgb(var(--fg-default))] border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[rgb(var(--fg-default))] border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-[rgb(var(--fg-default))] border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-[rgb(var(--fg-default))] border-y-transparent border-l-transparent'
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 px-2.5 py-1.5',
              'bg-[rgb(var(--fg-default))] text-[rgb(var(--bg-surface))] text-xs font-medium',
              'rounded-md shadow-lg whitespace-nowrap',
              positionClasses[position],
              className
            )}
            role="tooltip"
          >
            {content}
            {/* Arrow */}
            <span
              className={cn(
                'absolute w-0 h-0 border-4',
                arrowClasses[position]
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
