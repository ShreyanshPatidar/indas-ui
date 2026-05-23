'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { DynamicSidebar, DynamicSidebarProps } from "./sidebar"
import { Footer, FooterProps } from "./footer"

export interface AppShellProps {
  children: React.ReactNode
  sidebar?: DynamicSidebarProps
  footer?: FooterProps
  className?: string
}

export function AppShell({
  children,
  sidebar,
  footer,
  className
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false)

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen)
  }

  return (
    <div className={cn("flex h-screen bg-bg-app", className)}>
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-bg-overlay/25 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Desktop sidebar overlay - shows when sidebar is expanded */}
      {sidebar && !sidebarCollapsed && (
        <div
          className="fixed inset-0 z-[39] bg-black/20 backdrop-blur-[2px] hidden lg:block transition-opacity duration-300"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      {sidebar && (
        <>
          {/* Desktop sidebar */}
          <div className="hidden lg:flex lg:flex-shrink-0 relative z-40">
            <DynamicSidebar
              {...sidebar}
              isCollapsed={sidebarCollapsed}
              onMenuItemClick={() => setSidebarCollapsed(true)}
              onToggleSidebar={toggleSidebar}
            />
          </div>

          {/* Mobile sidebar */}
          <div
            className={cn(
              "fixed inset-y-0 left-0 z-40 flex w-70 transform transition-transform duration-300 ease-in-out lg:hidden",
              mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <DynamicSidebar
              {...sidebar}
              isCollapsed={false}
              onMenuItemClick={() => setMobileSidebarOpen(false)}
              className="w-full"
            />
          </div>
        </>
      )}

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="h-full">
            {children}
          </div>
        </main>

        {/* Footer */}
        {footer && <Footer {...footer} />}
      </div>
    </div>
  )
}

// Page wrapper component for consistent content padding
export interface PageProps {
  children: React.ReactNode
  title?: string
  description?: string
  actions?: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: boolean
}

export function Page({
  children,
  title,
  description,
  actions,
  className,
  maxWidth = 'full',
  padding = true
}: PageProps) {
  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-none'
  }

  return (
    <div className={cn(
      "h-full",
      padding && "p-6 sm:p-8",
      className
    )}>
      <div className={cn("mx-auto", maxWidths[maxWidth])}>
        {/* Page header */}
        {(title || description || actions) && (
          <div className="mb-8">
            <div className="sm:flex sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                {title && (
                  <h1 className="text-3xl font-semibold text-fg-default">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="mt-2 text-sm text-fg-muted">
                    {description}
                  </p>
                )}
              </div>
              {actions && (
                <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                  {actions}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Page content */}
        <div>{children}</div>
      </div>
    </div>
  )
}

// Grid layout helper for responsive layouts
export interface GridProps {
  children: React.ReactNode
  columns?: {
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: number
  className?: string
}

export function Grid({
  children,
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 6,
  className
}: GridProps) {
  const getGridCols = () => {
    const classes: string[] = []
    if (columns.sm) classes.push(`grid-cols-${columns.sm}`)
    if (columns.md) classes.push(`md:grid-cols-${columns.md}`)
    if (columns.lg) classes.push(`lg:grid-cols-${columns.lg}`)
    if (columns.xl) classes.push(`xl:grid-cols-${columns.xl}`)
    return classes.join(' ')
  }

  return (
    <div className={cn(
      "grid",
      getGridCols(),
      `gap-${gap}`,
      className
    )}>
      {children}
    </div>
  )
}