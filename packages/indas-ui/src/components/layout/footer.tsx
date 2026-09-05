import * as React from "react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/hooks/useTranslation";
import { LucideIcon } from "lucide-react"

export interface FooterKPI {
  id: string
  label: string
  value: string | number
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
  onClick?: () => void
}

export interface FooterIconButton {
  id: string
  icon: LucideIcon
  label: string
  onClick: () => void
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
  disabled?: boolean
}

export interface FooterProps {
  kpis?: FooterKPI[]
  actions?: React.ReactNode
  iconButtons?: FooterIconButton[]
  leftContent?: React.ReactNode
  className?: string
  sticky?: boolean
  compact?: boolean
  padding?: 'compact' | 'normal' | 'medium'
  variant?: 'page' | 'modal' // NEW: Distinguish between page and modal footers
  gradient?: boolean // NEW: Enable gradient background
}

export function Footer({
  kpis,
  actions,
  iconButtons,
  leftContent,
  className,
  sticky = false,
  compact = false,
  padding,
  variant = 'page',
  gradient = false
}: FooterProps) {
  if (!kpis && !actions && !leftContent && !iconButtons) {
    return null
  }

  const isModal = variant === 'modal'

  // Get variant colors — CSS variables only (theme-safe)
  const getVariantColors = (variant: FooterIconButton['variant'] = 'default') => {
    switch (variant) {
      case 'primary':
        return 'bg-[rgb(var(--color-primary))]/10 hover:bg-[rgb(var(--color-primary))]/20 text-[rgb(var(--color-primary))]'
      case 'success':
        return 'bg-[rgb(var(--color-success))]/10 hover:bg-[rgb(var(--color-success))]/20 text-[rgb(var(--color-success))]'
      case 'warning':
        return 'bg-[rgb(var(--color-warning))]/10 hover:bg-[rgb(var(--color-warning))]/20 text-[rgb(var(--color-warning))]'
      case 'error':
        return 'bg-[rgb(var(--color-error))]/10 hover:bg-[rgb(var(--color-error))]/20 text-[rgb(var(--color-error))]'
      case 'info':
        return 'bg-[rgb(var(--color-info))]/10 hover:bg-[rgb(var(--color-info))]/20 text-[rgb(var(--color-info))]'
      default:
        return 'bg-[rgb(var(--bg-subtle))] hover:bg-[rgb(var(--bg-surface))] text-[rgb(var(--fg-default))]'
    }
  }

  return (
    <footer
      className={cn(
        "border-t border-[rgb(var(--bd-default))]",
        // Background variants
        !gradient && "bg-[rgb(var(--bg-surface))]",
        // Shadow
        !isModal && "shadow-lg",
        // Mobile (< lg): sit ABOVE the fixed bottom nav (h-16, lg:hidden) and span the
        // full width — there is no sidebar, so no left offset. Desktop: bottom edge,
        // left margin for the collapsed sidebar.
        sticky && "fixed right-0 z-[25] bottom-16 lg:bottom-0",
        sticky && !isModal && "left-0 lg:left-14",
        // Shrink behavior for modal
        isModal && "flex-shrink-0",
        className
      )}
    >
      <div className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4",
        // Responsive padding
        isModal ? "px-3 sm:px-4 md:px-6" : "px-2 sm:px-4",
        padding === 'compact' ? "py-1" :
          padding === 'medium' ? "py-1.5 sm:py-2" :
            padding === 'normal' ? "py-3 sm:py-4" :
              compact ? "py-1" :
                isModal ? "py-1.5 sm:py-2" : "py-3 sm:py-4"
      )}>
        {/* Left Content (e.g., AutoSaveIndicator) or KPIs */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
          {leftContent}
          {kpis && kpis.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 md:gap-8">
              {kpis.map((kpi) => (
                <div
                  key={kpi.id}
                  className={cn(
                    "flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm",
                    kpi.onClick && "cursor-pointer hover:text-[rgb(var(--color-primary-hover))] transition-colors"
                  )}
                  onClick={kpi.onClick}
                >
                  <span className="text-[rgb(var(--fg-muted))] whitespace-nowrap">
                    {kpi.label}:
                  </span>
                  <span className="font-medium text-[rgb(var(--fg-default))]">
                    {typeof kpi.value === 'number'
                      ? kpi.value.toLocaleString()
                      : kpi.value
                    }
                  </span>
                  {kpi.trend && (
                    <span
                      className={cn(
                        "text-xs font-medium",
                        kpi.trend.direction === 'up'
                          ? "text-[rgb(var(--color-success))]"
                          : "text-[rgb(var(--color-error))]"
                      )}
                    >
                      {kpi.trend.direction === 'up' ? '↑' : '↓'}
                      {Math.abs(kpi.trend.value)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Icon Buttons */}
        {iconButtons && iconButtons.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {iconButtons.map((button) => {
              const Icon = button.icon
              return (
                <button
                  key={button.id}
                  onClick={button.onClick}
                  disabled={button.disabled}
                  className={cn(
                    "group relative flex flex-col items-center justify-center gap-0.5 sm:gap-1 rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 min-w-[48px] sm:min-w-[64px] transition-all duration-200",
                    getVariantColors(button.variant),
                    button.disabled && "opacity-50 cursor-not-allowed",
                    !button.disabled && "hover:scale-105 active:scale-95"
                  )}
                  title={button.label}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-[9px] sm:text-[10px] font-medium">
                    {button.label}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Actions - Responsive gap and wrapping */}
        {actions && (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 w-full sm:w-auto justify-end">
            {actions}
          </div>
        )}
      </div>
    </footer>
  )
}

// Compact footer variant for minimal footprints
export function CompactFooter({
  className,
  children
}: {
  className?: string
  children?: React.ReactNode
}) {
  const { t } = useTranslation();
  return (
    <footer
      className={cn(
        "bg-[rgb(var(--bg-subtle))] border-t border-[rgb(var(--bd-default))] py-2 px-4",
        className
      )}
    >
      <div className="flex items-center justify-center">
        <div className="text-xs text-[rgb(var(--fg-muted))]">
          {children || t("Indas Estimo 3.0 ©2025")}
        </div>
      </div>
    </footer>
  )
}