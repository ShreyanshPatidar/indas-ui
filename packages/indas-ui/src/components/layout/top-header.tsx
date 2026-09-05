'use client'

import * as React from 'react'
import { ChevronDown, Search, Bell, Sidebar, X, Mail, PanelLeftOpen, PanelLeftClose, CheckCheck, ExternalLink, Trash2, Calendar, Clock, Settings, Building2, User, Factory, MessageSquare, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { useSessionAdapter } from '@/contexts/SessionAdapterContext'
import { useRouter } from 'next/navigation'
import { ProductionUnitsAPI } from '@/lib/api'
import { Dropdown, type DropdownOption } from '@/components/forms/dropdown'
import { EmailPanelContent as EmailInboxPanel } from '@/app/(main)/activity/email/components/InboxPanel'
import { UserDropdown } from './userprofile-dropdown'
import { useAppConfig } from '@/contexts/AppConfigContext'
import { useNavigation } from '@/contexts/NavigationContext'
import { useEmail } from '@/contexts/EmailContext'
import { useMessaging } from '@/contexts/MessagingContext'
import { MessagingPanelContent } from '@/components/messaging/messaging-panel-content'
import { useNotifications, formatTimeAgo, getNotificationIcon, getIconBoxColors } from '@/hooks/useNotifications'
import { getModuleRoutePath } from '@/lib/utils'

export interface TopHeaderProps {
  className?: string
  sidebarCollapsed?: boolean
  onToggleSidebar?: () => void
  onToggleMobileSidebar?: () => void
}

// Fallback production units if API fails
const fallbackProductionUnits: { value: string; label: string }[] = [
  { value: 'default', label: 'Default Unit' }
]

// Empty initial state - data comes from API only
const defaultProductionUnits: { value: string; label: string }[] = []

export function TopHeader({ className, sidebarCollapsed = true, onToggleSidebar, onToggleMobileSidebar }: TopHeaderProps) {
  const { data: session } = useSessionAdapter()
  const companyName = (session?.user as any)?.CompanyName || ''
  // Dynamic company logo: /app/{CompanyName}.png, fallback to /app/company-logo.png
  const companyLogoSrc = companyName ? `/app/${companyName}.png` : '/app/company-logo.png'
  const router = useRouter()
  const appConfig = useAppConfig()
  const { state: emailState } = useEmail()
  const { state: messagingState } = useMessaging()
  const [productionUnits, setProductionUnits] = React.useState(defaultProductionUnits)
  const [selectedUnit, setSelectedUnit] = React.useState('')
  const [unitsLoading, setUnitsLoading] = React.useState(false)
  const [apiCallMade, setApiCallMade] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [showSearchModal, setShowSearchModal] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const [showEmailDropdown, setShowEmailDropdown] = React.useState(false)
  const [commsPanelTab, setCommsPanelTab] = React.useState<'email' | 'messages'>('messages')

  // Notifications — extracted to useNotifications hook
  const {
    notificationsLoading,
    showNotificationDropdown,
    setShowNotificationDropdown,
    activeNotificationCategory,
    setActiveNotificationCategory,
    notificationSearchQuery,
    setNotificationSearchQuery,
    getFilteredNotifications,
    getNotificationCounts,
    getUnreadCount,
    getUnreadCategoryCounts,
    markNotificationAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(session)

  // Fetch production units from API
  React.useEffect(() => {
    const fetchProductionUnits = async () => {
      if (!session?.user) {
        setUnitsLoading(false)
        return
      }

      // Prevent multiple simultaneous calls
      if (unitsLoading || apiCallMade) {
        return
      }

      setUnitsLoading(true)
      setApiCallMade(true)

      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        setUnitsLoading(false)
        setProductionUnits([])
      }, 10000)

      try {
        const response = await ProductionUnitsAPI.getProductionUnits(session)

        if (response.success && response.data) {

          // Handle the nested ProductionUnits structure
          let unitsArray = response.data
          if (response.data.ProductionUnits) {
            unitsArray = response.data.ProductionUnits
          }

          if (Array.isArray(unitsArray)) {
            // Transform API data to match the expected format
            const units = unitsArray.map((unit: any) => {
              return {
                value: unit.ProductionUnitID || unit.Value || unit.value || unit.UnitCode || unit.unitCode || unit.id || unit.Id || unit.Code,
                label: unit.ProductionUnitName || unit.Label || unit.label || unit.UnitName || unit.unitName || unit.name || unit.Name || unit.Description
              }
            })

            if (units.length > 0) {
              setProductionUnits(units)
              // Set the first unit as default if no selection or current selection doesn't exist
              const unitExists = selectedUnit && units.some((unit: any) => unit.value === selectedUnit)
              if (!unitExists) {
                setSelectedUnit(units[0].value)
              }
            } else {
              setProductionUnits([])
            }
          } else {
            setProductionUnits([])
          }
        } else {
          setProductionUnits(fallbackProductionUnits)
          setSelectedUnit(fallbackProductionUnits[0].value)
        }
      } catch (error) {
        // Use fallback production units on any error
        setProductionUnits(fallbackProductionUnits)
        setSelectedUnit(fallbackProductionUnits[0].value)
      } finally {
        clearTimeout(timeoutId)
        setUnitsLoading(false)
      }
    }

    fetchProductionUnits()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, selectedUnit]) // apiCallMade and unitsLoading are intentionally excluded - they're internal guards to prevent re-fetching

  const { groupedModules, loading: navLoading } = useNavigation()

  // Flatten all modules for search
  const allModules = React.useMemo(() => {
    const modules: { name: string; href: string; group: string }[] = []

    groupedModules.forEach(group => {
      group.modules?.forEach(module => {
        const href = getModuleRoutePath(module.ModuleName)
        if (href !== '#') { // Skip non-clickable items
          modules.push({
            name: module.ModuleName,
            href,
            group: group.groupName
          })
        }
      })
    })

    return modules
  }, [groupedModules])

  const filteredResults = React.useMemo(() => {
    if (!searchQuery.trim()) return { all: [], byGroup: {} }

    const query = searchQuery.toLowerCase()
    const filtered = allModules.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.group.toLowerCase().includes(query)
    )

    // Group results by group name
    const byGroup: Record<string, typeof filtered> = {}
    filtered.forEach(item => {
      if (!byGroup[item.group]) {
        byGroup[item.group] = []
      }
      byGroup[item.group].push(item)
    })

    return { all: filtered, byGroup }
  }, [searchQuery, allModules])

  const handleSearchItemClick = (item: any) => {
    setShowSearchModal(false)
    setSearchQuery('')
    router.push(item.href)
  }

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      <header className={cn(
        "sticky top-0 z-50 w-full",
        // Mobile: off-white surface with strong bottom depth
        "bg-[rgb(var(--bg-subtle))] border-b border-[rgb(var(--bd-default))] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12)]",
        // Desktop: unchanged dark blue
        "lg:bg-primary-hover lg:border-b lg:border-primary/20 lg:shadow-sm",
        className
      )}>
        <div className="flex h-14 lg:h-14 items-center justify-between px-2 pr-0 lg:px-6 gap-2 lg:gap-4">
          {/* Left side - Sidebar toggle and Company info */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink min-w-0">
            {/* Mobile Sidebar Toggle Button — hidden on mobile (bottom nav replaces it), shown on tablet */}
            {/* Desktop Sidebar Toggle Button */}
            {onToggleSidebar && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleSidebar()
                }}
                className="hidden lg:block p-2 text-white/60 hover:text-white transition-colors focus:outline-none flex-shrink-0"
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen className="h-5 w-5" />
                ) : (
                  <PanelLeftClose className="h-5 w-5" />
                )}
              </button>
            )}

            {/* Company Name — hover shows details, click goes to home */}
            <div className="relative group/company flex-shrink">
              <button
                onClick={() => router.push('/home')}
                className="text-[rgb(var(--color-primary))] lg:text-white font-bold text-lg lg:text-base lg:font-semibold hover:opacity-80 transition-colors cursor-pointer max-w-[200px] sm:max-w-[240px] md:max-w-[280px] lg:max-w-xs truncate"
              >
                {(session?.user as any)?.CompanyName || 'Loading...'}
              </button>
              {/* Hover popover — fluent company card */}
              <div className="absolute top-full left-0 mt-2 opacity-0 scale-95 pointer-events-none group-hover/company:opacity-100 group-hover/company:scale-100 group-hover/company:pointer-events-auto transition-all duration-200 z-50">
                <div className="bg-[rgb(var(--bg-surface))] rounded-xl shadow-xl border border-[rgb(var(--bd-default))] overflow-hidden w-64">
                  {/* Header — logo + company name */}
                  <div className="flex items-center gap-3 p-3.5 bg-[rgb(var(--bg-subtle))]">
                    <img src={companyLogoSrc} onError={(e) => { (e.target as HTMLImageElement).src = '/app/company-logo.png' }} alt="" className="h-10 w-10 rounded-lg object-contain bg-white p-1 shadow-sm border border-[rgb(var(--bd-default))]" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[rgb(var(--fg-default))] truncate">{(session?.user as any)?.CompanyName || '-'}</p>
                      <p className="text-[0.65rem] text-[rgb(var(--color-primary))] font-medium">{(session?.user as any)?.FYear || '-'}</p>
                    </div>
                  </div>
                  {/* Details — icon rows */}
                  <div className="p-3 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <Factory className="h-3.5 w-3.5 text-[rgb(var(--fg-muted))] flex-shrink-0" />
                      <span className="text-xs text-[rgb(var(--fg-default))]">{productionUnits.find(u => u.value === selectedUnit)?.label || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <User className="h-3.5 w-3.5 text-[rgb(var(--fg-muted))] flex-shrink-0" />
                      <span className="text-xs text-[rgb(var(--fg-default))]">{session?.user?.name || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Production Unit Dropdown — hidden on small mobile */}
            <div className="hidden sm:block w-20 sm:w-28 md:w-36 lg:w-40 flex-shrink-0">
              {mounted ? (
                <Dropdown
                  options={unitsLoading ? [{ value: '', label: 'Loading...', disabled: true }] : productionUnits}
                  value={selectedUnit}
                  onValueChange={(value) => {
                    const unitValue = Array.isArray(value) ? value[0] : String(value || '')
                    setSelectedUnit(unitValue)
                    appConfig.setSelectedProductionUnit(unitValue)
                  }}
                  placeholder="Unit"
                  disabled={unitsLoading}
                  triggerClassName="bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-default))] lg:bg-white/10 lg:text-white text-[10px] sm:text-xs border-[rgb(var(--bd-default))] lg:border-white/20 lg:hover:bg-white/15 lg:focus:bg-white/15 lg:focus:ring-white/30 py-1 px-1.5 sm:px-2 min-h-0 h-6 sm:h-7"
                />
              ) : (
                <div className="bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-muted))] lg:bg-white/10 lg:text-white text-[10px] sm:text-xs border border-[rgb(var(--bd-default))] lg:border-white/20 rounded-md py-1 px-1.5 sm:px-2 h-6 sm:h-7 flex items-center">
                  <span className="text-[rgb(var(--fg-muted))] lg:text-white/60">Loading...</span>
                </div>
              )}
            </div>

            {/* FY Year Display - Compact on mobile */}
            <div className="hidden sm:block w-fit flex-shrink-0">
              <div className="bg-[rgb(var(--bg-subtle))] lg:bg-white/10 text-[10px] sm:text-xs border border-[rgb(var(--bd-default))] lg:border-white/20 rounded-md py-1 px-2 sm:px-3 h-6 sm:h-7 flex items-center justify-center">
                <span className="text-[rgb(var(--fg-default))] lg:text-white font-medium whitespace-nowrap">
                  {(session?.user as any)?.FYear || 'N/A'}
                </span>
              </div>
            </div>

            {/* Greet User - Desktop only (xl+) */}
            <div className="hidden xl:flex items-center text-[rgb(var(--fg-default))] lg:text-white/90 text-sm font-medium max-w-48 flex-shrink">
              <span className="truncate">Hello {session?.user?.name || 'User'}</span>
              {!unitsLoading && apiCallMade && productionUnits.length === 0 && session && (
                <span className="ml-2 text-xs text-red-300">(Units unavailable)</span>
              )}
            </div>
          </div>

          {/* Right side - Search, actions and user */}
          <div className="flex items-center gap-1.5 lg:gap-3 flex-shrink-0 ml-auto">
            {/* Global Search - Icon on mobile, full search on desktop */}
            <div className="relative">
              {/* Mobile: Search icon button */}
              <button
                onClick={() => setShowSearchModal(!showSearchModal)}
                className="hidden sm:inline-flex md:hidden p-2 rounded-lg text-[rgb(var(--fg-muted))] lg:text-white/80 hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-hover))] lg:hover:text-white lg:hover:bg-white/10 transition-colors"
              >
                <Search className="h-[1.125rem] w-[1.125rem]" />
              </button>

              {/* Desktop: Full search bar */}
              <div className="hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[rgb(var(--fg-muted))] lg:text-white/60" />
                  <input
                    type="text"
                    placeholder="Search modules..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      if (e.target.value.length > 0) {
                        setShowSearchModal(true)
                      } else {
                        setShowSearchModal(false)
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowSearchModal(false), 200)}
                    className="pl-10 pr-3 py-1 w-56 lg:w-72 h-8 text-xs rounded-md border bg-[rgb(var(--bg-subtle))] lg:bg-white/10 border-[rgb(var(--bd-default))] lg:border-white/20 text-[rgb(var(--fg-default))] lg:text-white placeholder:text-[rgb(var(--fg-muted))] lg:placeholder:text-white/60 focus:outline-none lg:focus:bg-white/15 lg:focus:border-white/30 lg:focus:ring-2 lg:focus:ring-white/20 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Search Dropdown - Simple and clean */}
              {showSearchModal && filteredResults.all.length > 0 && (
                <>
                  {/* Backdrop for mobile */}
                  <div
                    className="fixed inset-0 z-40 md:hidden bg-black/20"
                    onClick={() => {
                      setShowSearchModal(false)
                      setSearchQuery('')
                    }}
                  />

                  {/* Search Results */}
                  <div className={cn(
                    "absolute z-50 bg-[rgb(var(--bg-surface))] rounded-lg shadow-xl border border-[rgb(var(--bd-default))] overflow-hidden",
                    "md:top-full md:left-0 md:mt-2 md:w-80",
                    "max-md:fixed max-md:inset-x-4 max-md:top-16 max-md:max-w-md max-md:mx-auto"
                  )}>
                    {/* Mobile: Search input */}
                    <div className="md:hidden p-3 border-b border-[rgb(var(--bd-default))]">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[rgb(var(--fg-muted))]" />
                        <input
                          type="text"
                          placeholder="Search modules..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          autoFocus
                          className="pl-10 pr-3 py-2 w-full text-sm rounded-md border border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-default))] placeholder:text-[rgb(var(--fg-muted))] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Results List */}
                    <div className="max-h-96 overflow-y-auto">
                      {filteredResults.all.length === 0 ? (
                        <div className="p-8 text-center">
                          <Search className="h-10 w-10 text-[rgb(var(--fg-muted))] mx-auto mb-2 opacity-30" />
                          <p className="text-sm text-[rgb(var(--fg-muted))]">
                            {navLoading ? 'Loading...' : 'No results found'}
                          </p>
                        </div>
                      ) : (
                        <>
                          {Object.entries(filteredResults.byGroup).map(([groupName, items]) => (
                            <div key={groupName} className="py-2">
                              <div className="px-4 py-1.5 bg-[rgb(var(--bg-subtle))]">
                                <h4 className="text-xs font-semibold text-[rgb(var(--fg-muted))] uppercase tracking-wide">
                                  {groupName}
                                </h4>
                              </div>
                              <div className="px-2 py-1">
                                {items.map((item, index) => (
                                  <div
                                    key={index}
                                    onClick={() => handleSearchItemClick(item)}
                                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[rgb(var(--bg-hover))] cursor-pointer group"
                                  >
                                    <Search className="h-4 w-4 text-[rgb(var(--fg-muted))] group-hover:text-[rgb(var(--color-primary))] flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm text-[rgb(var(--fg-default))] group-hover:text-[rgb(var(--color-primary))]">
                                        {item.name}
                                      </div>
                                      <div className="text-xs text-[rgb(var(--fg-muted))] truncate">{item.href}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>

                    {/* Footer with count */}
                    {filteredResults.all.length > 0 && (
                      <div className="px-4 py-2 border-t border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-subtle))] flex items-center justify-between">
                        <span className="text-xs text-[rgb(var(--fg-muted))]">
                          {filteredResults.all.length} result{filteredResults.all.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-[rgb(var(--fg-muted))]">Click to navigate</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Mobile pill container for action icons */}
            <div className="flex lg:hidden items-center gap-3 overflow-visible">
              {/* Mail */}
              <div className="relative flex items-center justify-center w-5 h-5">
                <button
                  className="text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--color-primary))] transition-colors"
                  onClick={() => setShowEmailDropdown(!showEmailDropdown)}
                >
                  <Mail className="h-[1.1rem] w-[1.1rem]" />
                </button>
                {(emailState.unreadCount + messagingState.totalUnreadCount) > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[1rem] h-4 px-0.5 text-[9px] font-bold rounded-full flex items-center justify-center pointer-events-none z-10 bg-[rgb(var(--color-primary))] text-[rgb(var(--color-primary-foreground))]">
                    {(emailState.unreadCount + messagingState.totalUnreadCount) > 99 ? '99+' : (emailState.unreadCount + messagingState.totalUnreadCount)}
                  </span>
                )}
              </div>

              {/* Bell */}
              <div className="relative flex items-center justify-center w-5 h-5">
                <button
                  className="text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--color-primary))] transition-colors"
                  onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                >
                  <Bell className="h-[1.1rem] w-[1.1rem]" />
                </button>
                {getUnreadCount() > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[1rem] h-4 px-0.5 text-[9px] font-bold rounded-full flex items-center justify-center pointer-events-none z-10 bg-[rgb(var(--color-primary))] text-[rgb(var(--color-primary-foreground))]">
                    {getUnreadCount() > 99 ? '99+' : getUnreadCount()}
                  </span>
                )}
              </div>

              {/* Divider */}
              <div className="w-px h-4 bg-[rgb(var(--bd-default))]" />

              {/* User avatar */}
              <UserDropdown />
            </div>

            {/* Communications — Email + Messages */}
            <div className="relative">
              {/* Desktop button */}
              <Button
                iconOnly
                variant="ghost"
                size="sm"
                icon={<Mail className="h-4 w-4" />}
                className="relative hidden lg:inline-flex p-1.5 sm:p-2 text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => setShowEmailDropdown(!showEmailDropdown)}
              >
                {(emailState.unreadCount + messagingState.totalUnreadCount) > 0 && (
                  <>
                    <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-[rgb(var(--color-primary))]">
                      {(emailState.unreadCount + messagingState.totalUnreadCount) > 99 ? '99+' : (emailState.unreadCount + messagingState.totalUnreadCount)}
                    </span>
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-600 rounded-full animate-ping"></span>
                  </>
                )}
                <span className="sr-only">Communications</span>
              </Button>

              {/* Communications Dropdown */}
              {showEmailDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowEmailDropdown(false)}
                  />

                  <div className={cn(
                    "z-50",
                    "fixed top-14 left-2 right-2 sm:absolute sm:top-auto sm:left-auto sm:right-0 sm:mt-2 sm:w-[28rem]"
                  )}>
                    <div className="bg-[rgb(var(--bg-surface))] rounded-xl shadow-xl border border-[rgb(var(--bd-default))] overflow-hidden">
                      {/* Segmented tab control */}
                      <div className="px-3 pt-3 pb-2">
                        <div className="flex rounded-lg bg-[rgb(var(--bg-subtle))] p-0.5">
                          <button
                            onClick={() => setCommsPanelTab('messages')}
                            className={cn(
                              'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150',
                              commsPanelTab === 'messages'
                                ? 'bg-[rgb(var(--bg-surface))] text-[rgb(var(--fg-default))] shadow-sm'
                                : 'text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))]'
                            )}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Messages
                            {messagingState.totalUnreadCount > 0 && (
                              <span className="min-w-[1rem] h-4 px-1 rounded-full bg-[rgb(var(--color-primary))] text-white text-[9px] font-bold flex items-center justify-center">
                                {messagingState.totalUnreadCount > 99 ? '99+' : messagingState.totalUnreadCount}
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => setCommsPanelTab('email')}
                            className={cn(
                              'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150',
                              commsPanelTab === 'email'
                                ? 'bg-[rgb(var(--bg-surface))] text-[rgb(var(--fg-default))] shadow-sm'
                                : 'text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))]'
                            )}
                          >
                            <Mail className="w-3.5 h-3.5" />
                            Email
                            {emailState.unreadCount > 0 && (
                              <span className="min-w-[1rem] h-4 px-1 rounded-full bg-[rgb(var(--color-primary))] text-white text-[9px] font-bold flex items-center justify-center">
                                {emailState.unreadCount > 99 ? '99+' : emailState.unreadCount}
                              </span>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Tab content */}
                      {commsPanelTab === 'email' ? (
                        <EmailInboxPanel onClose={() => setShowEmailDropdown(false)} />
                      ) : (
                        <MessagingPanelContent onClose={() => setShowEmailDropdown(false)} />
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              {/* Desktop button */}
              <Button
                iconOnly
                variant="ghost"
                size="sm"
                icon={<Bell className="h-4 w-4" />}
                className="relative hidden lg:inline-flex p-1.5 sm:p-2 text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
              />
              {/* Notification badge — outside Button because iconOnly ignores children */}
              {getUnreadCount() > 0 && (() => {
                const catCounts = getUnreadCategoryCounts()
                return (
                  <>
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full items-center justify-center shadow-lg pointer-events-none z-10 bg-[rgb(var(--fg-default))] text-[rgb(var(--bg-surface))] hidden lg:flex">
                      {getUnreadCount() > 99 ? '99+' : getUnreadCount()}
                    </span>
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 gap-0.5 pointer-events-none hidden lg:flex">
                      {catCounts.escalations > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                      {catCounts.pending > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                      {catCounts.updates > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                    </span>
                  </>
                )
              })()}

              {/* Notification Dropdown */}
              {showNotificationDropdown && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => {
                      setShowNotificationDropdown(false)
                      setNotificationSearchQuery('')
                    }}
                  />

                  {/* Dropdown Content - Modern design with all features */}
                  <div className={cn(
                    "z-50 bg-[rgb(var(--bg-surface))] rounded-2xl shadow-2xl border border-[rgb(var(--bd-default))] overflow-hidden",
                    "fixed top-14 left-2 right-2 sm:absolute sm:top-auto sm:left-auto sm:right-0 sm:mt-2 sm:w-[28rem]"
                  )}>
                    {/* Header */}
                    <div className="px-5 pt-5 pb-0 bg-[rgb(var(--bg-surface))]">
                      {/* Title, Search and Settings in same row */}
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-lg font-bold text-[rgb(var(--fg-default))] flex-shrink-0">Notifications</h3>
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(var(--fg-muted))]" />
                          <input
                            type="text"
                            placeholder="Search..."
                            value={notificationSearchQuery}
                            onChange={(e) => setNotificationSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-default))] placeholder:text-[rgb(var(--fg-muted))] focus:outline-none focus:border-[rgb(var(--color-primary))] focus:bg-[rgb(var(--bg-surface))] transition-colors"
                          />
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowNotificationDropdown(false)
                            router.push('/settings?tab=notifications')
                          }}
                          className="p-2 rounded-lg text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-hover))] transition-colors flex-shrink-0"
                          title="Notification Settings"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Category Toggle Buttons - Pill style */}
                      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
                        {[
                          { key: 'all', label: 'All', count: getNotificationCounts().all, activeClass: 'bg-[rgb(var(--fg-default))] text-white' },
                          { key: 'pending', label: 'Pending', count: getNotificationCounts().pending, activeClass: 'bg-amber-500 text-white' },
                          { key: 'escalations', label: 'Escalations', count: getNotificationCounts().escalations, activeClass: 'bg-red-500 text-white' },
                          { key: 'updates', label: 'Updates', count: getNotificationCounts().updates, activeClass: 'bg-blue-500 text-white' }
                        ].map((category) => {
                          const isActive = activeNotificationCategory === category.key

                          return (
                            <button
                              key={category.key}
                              onClick={() => setActiveNotificationCategory(category.key as any)}
                              className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap border",
                                isActive
                                  ? `${category.activeClass} border-transparent shadow-sm`
                                  : "bg-transparent text-[rgb(var(--fg-muted))] border-[rgb(var(--bd-default))] hover:bg-[rgb(var(--bg-hover))]"
                              )}
                            >
                              {category.label}
                              <span className={cn(
                                "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] leading-none rounded-full font-bold",
                                isActive
                                  ? 'bg-white/20 text-inherit'
                                  : 'bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-muted))]'
                              )}>
                                {category.count}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[400px] overflow-y-auto bg-[rgb(var(--bg-subtle))]">
                      {notificationsLoading ? (
                        <div className="p-8 text-center bg-[rgb(var(--bg-surface))]">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(var(--color-primary))] mx-auto"></div>
                          <p className="text-sm text-[rgb(var(--fg-muted))] mt-3">Loading...</p>
                        </div>
                      ) : getFilteredNotifications().length === 0 ? (
                        <div className="p-10 text-center bg-[rgb(var(--bg-surface))]">
                          <Bell className="h-12 w-12 mx-auto mb-3 text-[rgb(var(--fg-muted))] opacity-30" />
                          <p className="text-sm text-[rgb(var(--fg-muted))]">
                            {notificationSearchQuery ? 'No matching notifications' : 'All caught up! No notifications here.'}
                          </p>
                        </div>
                      ) : (
                        <div>
                          {getFilteredNotifications().map((notification) => {
                            const IconComponent = getNotificationIcon(notification)
                            const iconBoxColors = getIconBoxColors(notification)

                            return (
                              <div
                                key={notification.notificationId}
                                className={cn(
                                  "group px-5 py-4 flex gap-4 border-b border-[rgb(var(--bd-subtle))] transition-colors cursor-pointer relative",
                                  "hover:bg-[rgb(var(--bg-hover))]",
                                  !notification.isRead
                                    ? "bg-[rgb(var(--bg-surface))]"
                                    : "bg-[rgb(var(--bg-subtle))]/60"
                                )}
                                onClick={() => {
                                  if (!notification.isRead) {
                                    markNotificationAsRead(notification.notificationId)
                                  }
                                  if (notification.actionUrl) {
                                    setShowNotificationDropdown(false)
                                    router.push(notification.actionUrl)
                                  }
                                }}
                              >
                                {/* Icon Box */}
                                <div className={cn(
                                  "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
                                  iconBoxColors
                                )}>
                                  <IconComponent className="h-5 w-5" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className={cn(
                                      "text-sm leading-snug",
                                      notification.isRead
                                        ? "text-[rgb(var(--fg-default))] font-medium"
                                        : "text-[rgb(var(--fg-default))] font-bold"
                                    )}>
                                      {notification.title}
                                    </p>
                                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                      <span className="text-[11px] text-[rgb(var(--fg-muted))] whitespace-nowrap">
                                        {formatTimeAgo(notification.createdAt)}
                                      </span>
                                      {!notification.isRead && (
                                        <span className="w-2 h-2 rounded-full bg-[rgb(var(--color-primary))]" />
                                      )}
                                    </div>
                                  </div>
                                  {notification.message && (
                                    <p className="text-xs text-[rgb(var(--fg-muted))] mt-1 line-clamp-2 leading-relaxed">
                                      {notification.message}
                                    </p>
                                  )}
                                </div>

                                {/* Hover Actions */}
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-[rgb(var(--bd-default))]">
                                  {!notification.isRead && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        markNotificationAsRead(notification.notificationId)
                                      }}
                                      className="w-7 h-7 rounded-md border border-[rgb(var(--bd-default))] bg-white flex items-center justify-center text-[rgb(var(--fg-muted))] hover:text-emerald-500 hover:border-emerald-500 transition-colors"
                                      title="Mark as read"
                                    >
                                      <CheckCheck className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      deleteNotification(notification.notificationId)
                                    }}
                                    className="w-7 h-7 rounded-md border border-[rgb(var(--bd-default))] bg-white flex items-center justify-center text-[rgb(var(--fg-muted))] hover:text-red-500 hover:border-red-500 transition-colors"
                                    title="Dismiss"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 border-t border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))] flex items-center justify-between">
                      {getUnreadCount() > 0 ? (
                        <button
                          className="text-sm text-[rgb(var(--color-primary))] hover:underline font-semibold transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            markAllAsRead()
                          }}
                        >
                          Mark all as read
                        </button>
                      ) : (
                        <span />
                      )}
                      <button
                        className="text-sm text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] font-medium transition-colors"
                        onClick={() => {
                          setShowNotificationDropdown(false)
                          setNotificationSearchQuery('')
                          router.push('/activity/notifications')
                        }}
                      >
                        View History
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Profile Dropdown — desktop only (mobile has it in pill) */}
            <div className="hidden lg:block">
              <UserDropdown />
            </div>
          </div>
        </div>
      </header>

    </>
  )
}
