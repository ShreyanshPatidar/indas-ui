'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  X, Search, ChevronRight, Home, MessageSquare, Calculator, Receipt,
  Database, Cog, Layers, Boxes, BookOpen, PieChart, Activity, ClipboardCheck,
  TrendingUp, DollarSign, Factory, Users, Settings, Tag, Shield, Target,
  ShoppingCart, BarChart3, UserCog, Building, Gauge
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigation } from '@/contexts/NavigationContext'
import { useModuleAuth } from '@/contexts/ModuleAuthContext'
import { useTranslation } from '@/hooks/useTranslation'
import { useNotifications } from '@/hooks/useNotifications'
import { getModuleRoutePath } from '@/lib/utils'

// Reuse sidebar icon mapping
function getGroupIcon(groupName: string) {
  const name = groupName.toLowerCase()
  if (name.includes('dashboard') || name.includes('home')) return Gauge
  if (name.includes('sales')) return TrendingUp
  if (name.includes('enquiry') || name.includes('inquiry') || name.includes('lead')) return MessageSquare
  if (name.includes('estimation') || name.includes('estimate') || name.includes('costing')) return Calculator
  if (name.includes('quotation') || name.includes('quote')) return Receipt
  if (name.includes('masters') || name.includes('master')) return Database
  if (name.includes('user') && name.includes('management')) return UserCog
  if (name.includes('company') || name.includes('branch')) return Building
  if (name.includes('category') || name.includes('tag')) return Tag
  if (name.includes('process')) return Layers
  if (name.includes('machine') || name.includes('equipment')) return Cog
  if (name.includes('item') || name.includes('product') || name.includes('inventory')) return Boxes
  if (name.includes('ledger') || name.includes('account')) return BookOpen
  if (name.includes('mis') || name.includes('report')) return PieChart
  if (name.includes('analytics') || name.includes('analysis')) return BarChart3
  if (name.includes('order') || name.includes('purchase')) return ShoppingCart
  if (name.includes('price') || name.includes('material')) return DollarSign
  if (name.includes('quality') || name.includes('control')) return Shield
  if (name.includes('production') || name.includes('manufacturing')) return Factory
  if (name.includes('customer') || name.includes('client')) return Users
  if (name.includes('setting') || name.includes('config')) return Settings
  if (name.includes('target') || name.includes('goal')) return Target
  if (name.includes('activity') || name.includes('email') || name.includes('notification') || name.includes('audit')) return Activity
  return ClipboardCheck
}

interface MobileMenuSheetProps {
  open: boolean
  onClose: () => void
}

export function MobileMenuSheet({ open, onClose }: MobileMenuSheetProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const { t } = useTranslation()
  const { mobileModules } = useNavigation()
  const { hasAccess } = useModuleAuth()
  const { getUnreadCount } = useNotifications(session)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [expandedGroups, setExpandedGroups] = React.useState<string[]>([])
  const searchRef = React.useRef<HTMLInputElement>(null)

  // Reset search when sheet opens — expand only the active group
  React.useEffect(() => {
    if (open) {
      setSearchQuery('')
      const activeGroups = mobileModules
        .filter(group => group.modules.some(mod => {
          const path = getModuleRoutePath(mod.ModuleName)
          return pathname === path || pathname?.startsWith(path + '/')
        }))
        .map(g => g.groupName)
      setExpandedGroups(activeGroups.length > 0 ? activeGroups : [mobileModules[0]?.groupName].filter(Boolean))
    }
  }, [open, mobileModules, pathname])

  // Prevent body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupName)
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    )
  }

  // Filter modules by search query and permissions
  const filteredGroups = React.useMemo(() => {
    const query = searchQuery.toLowerCase().trim()

    return mobileModules
      .map(group => ({
        ...group,
        modules: group.modules.filter(mod => {
          const path = getModuleRoutePath(mod.ModuleName)
          if (path === '#') return false
          if (!hasAccess(path)) return false
          if (!query) return true
          const displayName = (mod.ModuleDisplayName || mod.ModuleName).toLowerCase()
          return displayName.includes(query) || group.groupName.toLowerCase().includes(query)
        }),
      }))
      .filter(group => group.modules.length > 0)
  }, [mobileModules, searchQuery, hasAccess])

  // When searching, expand all matching groups
  React.useEffect(() => {
    if (searchQuery.trim()) {
      setExpandedGroups(filteredGroups.map(g => g.groupName))
    }
  }, [searchQuery, filteredGroups])

  const handleNavigate = (path: string) => {
    onClose()
    router.push(path)
  }

  const userName = session?.user?.name || 'User'
  const userRole = (session?.user as any)?.RoleName || (session?.user as any)?.roleName || ''
  const notifCount = getUnreadCount()

  const isModuleActive = (path: string) => {
    if (!pathname) return false
    if (pathname === path) return true
    return pathname.startsWith(path + '/')
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 lg:hidden',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Sheet — slides up from bottom */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-[61] lg:hidden',
          'bg-[rgb(var(--bg-surface))] rounded-t-2xl shadow-2xl',
          'transform transition-transform duration-300 ease-out',
          'max-h-[85vh] flex flex-col',
          open ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-9 h-1 rounded-full bg-[rgb(var(--bd-default))]" />
        </div>

        {/* Header — user + close */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[rgb(var(--bd-default))]">
          <div className="w-8 h-8 rounded-full bg-[rgb(var(--bg-subtle))] border border-[rgb(var(--bd-default))] flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-[rgb(var(--fg-muted))]">{getInitials(userName)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[rgb(var(--fg-default))] truncate leading-tight">{userName}</p>
            {userRole && (
              <p className="text-[0.65rem] text-[rgb(var(--fg-muted))] truncate">{userRole}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-1 rounded-lg text-[rgb(var(--fg-muted))] hover:bg-[rgb(var(--bg-hover))] transition-colors"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[rgb(var(--fg-muted))]" />
            <input
              ref={searchRef}
              type="text"
              placeholder={t('Search modules...')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-default))] placeholder:text-[rgb(var(--fg-muted))] focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); searchRef.current?.focus() }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Module list — scrollable */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {filteredGroups.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="h-8 w-8 mx-auto mb-2 text-[rgb(var(--fg-muted))] opacity-30" />
              <p className="text-sm text-[rgb(var(--fg-muted))]">{t('No modules found')}</p>
            </div>
          ) : (
            filteredGroups.map(group => {
              const GroupIcon = getGroupIcon(group.groupName)
              const isExpanded = expandedGroups.includes(group.groupName)

              return (
                <div key={group.groupName} className="mb-0.5">
                  {/* Group header — mirrors sidebar style: icon + name + chevron */}
                  <button
                    onClick={() => toggleGroup(group.groupName)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left hover:bg-[rgb(var(--bg-hover))] transition-colors min-h-[2.75rem]"
                  >
                    <GroupIcon className="h-4 w-4 text-[rgb(var(--fg-muted))] flex-shrink-0" />
                    <span className="text-xs font-semibold text-[rgb(var(--fg-muted))] uppercase tracking-wide flex-1">
                      {t(group.groupName)}
                    </span>
                    <ChevronRight className={cn(
                      'h-3.5 w-3.5 text-[rgb(var(--fg-muted))]/50 transition-transform duration-200',
                      isExpanded && 'rotate-90'
                    )} />
                  </button>

                  {/* Module items — left border like sidebar child items */}
                  {isExpanded && (
                    <div className="ml-5 pl-3 border-l-2 border-[rgb(var(--bd-default))]/50 mb-1">
                      {group.modules.map(mod => {
                        const path = getModuleRoutePath(mod.ModuleName)
                        const displayName = mod.ModuleDisplayName || mod.ModuleName
                        const isActive = isModuleActive(path)
                        const isNotif = path === '/activity/notifications'

                        return (
                          <button
                            key={mod.ModuleName}
                            onClick={() => handleNavigate(path)}
                            className={cn(
                              'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors min-h-[2.5rem]',
                              isActive
                                ? 'bg-[rgb(var(--bg-subtle))] font-semibold'
                                : 'hover:bg-[rgb(var(--bg-hover))]'
                            )}
                          >
                            <span className={cn(
                              'text-sm flex-1 text-[rgb(var(--fg-default))]',
                              isActive && 'font-semibold'
                            )}>
                              {t(displayName)}
                            </span>
                            {isActive && (
                              <div className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--fg-default))] flex-shrink-0" />
                            )}
                            {isNotif && notifCount > 0 && (
                              <span className="min-w-[1.25rem] h-5 px-1 text-[10px] font-bold rounded-full bg-[rgb(var(--color-error))] text-white flex items-center justify-center">
                                {notifCount > 99 ? '99+' : notifCount}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer — settings only */}
        <div
          className="border-t border-[rgb(var(--bd-default))] px-4"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <button
            onClick={() => handleNavigate('/settings')}
            className="w-full flex items-center gap-2.5 px-3 py-3 text-[rgb(var(--fg-muted))] hover:bg-[rgb(var(--bg-hover))] rounded-lg transition-colors min-h-[2.75rem]"
          >
            <Settings className="h-4 w-4" />
            <span className="text-sm font-medium">{t('Settings')}</span>
          </button>
        </div>
      </div>
    </>
  )
}
