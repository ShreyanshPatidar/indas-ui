'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home, MessageSquare, ClipboardCheck, Calculator, Menu,
  Receipt, Database, Cog, Layers, Boxes, BookOpen,
  Activity, TrendingUp, Users, Settings,
  Tag, BarChart3, Bell, Sparkles, FileText, FileCheck, Mail, Building,
  type LucideIcon,
} from '@/lib/icons'
import { cn, getModuleRoutePath } from '@/lib/utils'
import { useTranslation } from '@/hooks/useTranslation'
import { useNavigation } from '@/contexts/NavigationContext'

// ── Icon name registry — maps lucide-react icon name strings to components ──
// Add new icons here as the DB starts referencing them.
const ICON_NAME_MAP: Record<string, LucideIcon> = {
  Home, MessageSquare, ClipboardCheck, Calculator, Menu,
  Receipt, Database, Cog, Layers, Boxes, BookOpen,
  Activity, TrendingUp, Users, Settings,
  Tag, BarChart3, Bell, Sparkles, FileText, FileCheck, Mail, Building,
}

/** Resolve a lucide-react icon by name string (from DB IconName column). */
export function getIconByName(name: string | undefined | null): LucideIcon | null {
  if (!name) return null
  return ICON_NAME_MAP[name] || null
}

// ── Path-based fallback (used when DB IconName is missing) ──
const MODULE_ICON_MAP: Record<string, LucideIcon> = {
  '/home': Home,
  '/synthia': Sparkles,
  '/enquiry': FileText,
  '/enquiry/sales': FileText,
  '/enquiry/rate': TrendingUp,
  '/costing/estimation': Calculator,
  '/costing/quote-panel': FileCheck,
  '/costing/price-approval': Receipt,
  '/costing/grid-costing': BarChart3,
  '/activity/notifications': Bell,
  '/activity/email': Mail,
  '/activity/auditlogs': Activity,
  '/activity/messages': MessageSquare,
  '/master/user': Users,
  '/master/customer': Users,
  '/master/item': Boxes,
  '/master/machine': Cog,
  '/master/process': Layers,
  '/master/ledger': BookOpen,
  '/master/category': Tag,
  '/master/material-group': Database,
  '/master/rate': TrendingUp,
  '/master/tool': Settings,
  '/master/company': Building,
  '/report': BarChart3,
  '/dashboard': BarChart3,
  '/dashboard/sales': BarChart3,
  '/settings': Settings,
}

export function getIconForPath(path: string): LucideIcon {
  return MODULE_ICON_MAP[path] || ClipboardCheck
}

// ── Canonical short names for bottom nav display ──
const MODULE_NAME_MAP: Record<string, string> = {
  '/home': 'Home',
  '/synthia': 'Parkbuddy',
  '/enquiry': 'Enquiry',
  '/enquiry/sales': 'Enquiry',
  '/enquiry/rate': 'Rate Enquiry',
  '/costing/estimation': 'Estimation',
  '/costing/quote-panel': 'Approvals',
  '/costing/price-approval': 'Price Appr.',
  '/costing/grid-costing': 'Grid Costing',
  '/activity/notifications': 'Alerts',
  '/activity/email': 'Email',
  '/activity/auditlogs': 'Audit Logs',
  '/activity/messages': 'Messages',
  '/master/user': 'Users',
  '/master/customer': 'Customers',
  '/master/item': 'Items',
  '/master/machine': 'Machines',
  '/master/process': 'Processes',
  '/master/ledger': 'Ledgers',
  '/master/category': 'Categories',
  '/master/material-group': 'Materials',
  '/master/rate': 'Rates',
  '/master/tool': 'Tools',
  '/master/company': 'Company',
  '/report': 'Reports',
  '/dashboard': 'Dashboard',
  '/dashboard/sales': 'Sales',
  '/settings': 'Settings',
}

export function getNameForPath(path: string, fallback: string): string {
  return MODULE_NAME_MAP[path] || fallback
}

// ── Default middle 3 tabs ──
const DEFAULT_QUICK_TABS = [
  { name: 'Enquiry', path: '/enquiry/sales' },
  { name: 'Parkbuddy', path: '/synthia' },
  { name: 'Approvals', path: '/costing/quote-panel' },
]

const STORAGE_KEY = 'bottom-nav-quick-tabs-v4'

export interface QuickTab {
  name: string
  path: string
  iconName?: string // lucide-react icon name from DB
}

/** Read saved quick tabs from localStorage */
export function getQuickTabs(): QuickTab[] {
  if (typeof window === 'undefined') return DEFAULT_QUICK_TABS
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as QuickTab[]
      if (Array.isArray(parsed) && parsed.length === 3) return parsed
    }
  } catch {}
  return DEFAULT_QUICK_TABS
}

/** Save quick tabs to localStorage */
export function setQuickTabs(tabs: QuickTab[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs.slice(0, 3)))
  window.dispatchEvent(new CustomEvent('quick-tabs-changed'))
}

/** Reset to defaults */
export function resetQuickTabs() {
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new CustomEvent('quick-tabs-changed'))
}

// Export icon map + defaults for the home page settings section
export { MODULE_ICON_MAP, DEFAULT_QUICK_TABS }

interface BottomNavProps {
  onOpenMenu?: () => void
  navRef?: React.RefObject<HTMLElement>
}

export function BottomNav({ onOpenMenu, navRef }: BottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useTranslation()
  const { groupedModules } = useNavigation()
  const [quickTabs, setQuickTabsState] = React.useState<QuickTab[]>(DEFAULT_QUICK_TABS)

  // Build a path → module lookup so we can resolve IconName / DisplayName from DB
  const moduleByPath = React.useMemo(() => {
    const map = new Map<string, { displayName: string; iconName?: string }>()
    const visit = (mod: any) => {
      const path = getModuleRoutePath(mod.ModuleName)
      if (path && path !== '#') {
        map.set(path, { displayName: mod.ModuleDisplayName, iconName: mod.IconName })
      }
      if (Array.isArray(mod.children)) for (const c of mod.children) visit(c)
    }
    for (const g of groupedModules) for (const m of g.modules) visit(m)
    return map
  }, [groupedModules])

  // Load from localStorage on mount + listen for changes
  React.useEffect(() => {
    setQuickTabsState(getQuickTabs())
    const handleChange = () => setQuickTabsState(getQuickTabs())
    window.addEventListener('quick-tabs-changed', handleChange)
    window.addEventListener('storage', handleChange)
    return () => {
      window.removeEventListener('quick-tabs-changed', handleChange)
      window.removeEventListener('storage', handleChange)
    }
  }, [])

  const isActive = (path: string) => {
    if (path === '/home') return pathname === '/home' || pathname === '/'
    return pathname === path || pathname?.startsWith(path + '/')
  }

  // Fixed tabs — always present. Filter them out of quickTabs to prevent duplicate keys.
  const FIXED_PATHS = new Set(['/home'])
  const filteredQuickTabs = quickTabs.filter(t => !FIXED_PATHS.has(t.path))

  // Resolve current pathname to a known module path
  const currentModulePath = React.useMemo(() => {
    if (!pathname) return null
    // Try exact match first, then progressively shorter prefixes
    const candidates = Object.keys(MODULE_NAME_MAP)
    // Exact match
    if (candidates.includes(pathname)) return pathname
    // Prefix match — longest wins (e.g. /enquiry/sales before /enquiry)
    const sorted = candidates.sort((a, b) => b.length - a.length)
    for (const c of sorted) {
      if (pathname === c || pathname.startsWith(c + '/')) return c
    }
    return null
  }, [pathname])

  const baseTabs = [
    { name: 'Home', path: '/home' },
    ...filteredQuickTabs,
  ]

  // If user is on a page not in their tabs, show it as a dynamic 5th tab
  const isCurrentInTabs = baseTabs.some(tab => {
    if (tab.path === '/home') return pathname === '/home' || pathname === '/'
    return pathname === tab.path || pathname?.startsWith(tab.path + '/')
  })

  const dynamicTab = (!isCurrentInTabs && currentModulePath)
    ? (() => {
        const mod = moduleByPath.get(currentModulePath)
        return {
          name: mod?.displayName || getNameForPath(currentModulePath, currentModulePath.split('/').pop() || ''),
          path: currentModulePath,
          iconName: mod?.iconName,
          isDynamic: true,
        }
      })()
    : null

  const allTabs = [
    ...baseTabs.map(t => ({ ...t, isDynamic: false })),
    ...(dynamicTab ? [dynamicTab] : []),
  ]

  return (
    <nav
      ref={navRef as React.RefObject<HTMLElement>}
      id="mobile-bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[rgb(var(--bg-surface))] border-t border-[rgb(var(--bd-default))] transition-transform duration-200"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="relative flex h-14 px-1">
        {allTabs.map((tab) => {
          const active = isActive(tab.path)
          const mod = moduleByPath.get(tab.path)
          const Icon = getIconByName((tab as any).iconName) || getIconByName(mod?.iconName) || getIconForPath(tab.path)

          return (
            <button
              key={tab.path}
              onClick={() => router.push(tab.path)}
              className={cn(
                'relative flex items-center justify-center flex-1 transition-all duration-200 touch-manipulation mx-0.5',
                active
                  ? 'flex-col gap-1 -mt-3 h-[68px] rounded-t-2xl border border-b-0 border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))]'
                  : 'flex-col gap-1 h-14 bg-transparent hover:bg-[rgb(var(--bg-hover))]'
              )}
            >
              {/* Curved connectors for active tab */}
              {active && (
                <>
                  {/* Left curve */}
                  <div className="absolute -left-2 bottom-0 w-2 h-2 pointer-events-none">
                    <svg width="8" height="8" viewBox="0 0 8 8" className="absolute bottom-0 right-0">
                      <path d="M8,0 Q8,8 0,8 L0,0 Z" fill="rgb(var(--bg-surface))" />
                    </svg>
                  </div>
                  {/* Right curve */}
                  <div className="absolute -right-2 bottom-0 w-2 h-2 pointer-events-none">
                    <svg width="8" height="8" viewBox="0 0 8 8" className="absolute bottom-0 left-0">
                      <path d="M0,0 Q0,8 8,8 L8,0 Z" fill="rgb(var(--bg-surface))" />
                    </svg>
                  </div>
                </>
              )}

              {/* Dynamic tab indicator dot */}
              {tab.isDynamic && !active && (
                <div className="absolute top-1.5 w-1 h-1 rounded-full bg-[rgb(var(--color-primary))]" />
              )}

              {tab.path === '/synthia' && !mod?.iconName ? (
                <img src="/app/synthia-logo.png" alt="" className={cn('transition-all duration-200 shrink-0 h-5 w-5 rounded object-contain', active && 'h-6 w-6')} />
              ) : (
                <Icon
                  className={cn(
                    'transition-all duration-200 shrink-0',
                    active
                      ? 'h-5 w-5 text-[rgb(var(--color-error-hover))] stroke-[2.5]'
                      : 'h-5 w-5 text-[rgb(var(--fg-muted))]'
                  )}
                />
              )}
              <span className={cn(
                'text-[0.6rem] leading-none mt-0.5 truncate max-w-full px-0.5',
                active ? 'font-semibold text-[rgb(var(--color-error-hover))]' : 'font-medium text-[rgb(var(--fg-muted))]'
              )}>
                {t(mod?.displayName || tab.name)}
              </span>
            </button>
          )
        })}

        {/* Menu tab */}
        <button
          onClick={onOpenMenu}
          className="relative flex flex-col items-center justify-center gap-1 flex-1 h-14 bg-transparent hover:bg-[rgb(var(--bg-hover))] transition-colors touch-manipulation mx-0.5"
        >
          <Menu className="h-5 w-5 text-[rgb(var(--fg-muted))]" />
          <span className="text-[0.6rem] leading-none font-medium text-[rgb(var(--fg-muted))]">
            {t('Menu')}
          </span>
        </button>
      </div>
    </nav>
  )
}
