'use client'

import * as React from 'react'
import { getDynamicNavigation, GroupedModule, DynamicModule } from '@/lib/api'

interface NavigationContextValue {
  groupedModules: GroupedModule[]
  loading: boolean
  error: string | null
  refreshNavigation: () => void
  mobileModules: GroupedModule[]
}

/**
 * Filter grouped modules to only those with MobileSupported = 1/true.
 * Returns grouped structure with empty groups removed.
 */
function filterMobileModules(groups: GroupedModule[]): GroupedModule[] {
  return groups
    .map(group => ({
      ...group,
      modules: group.modules.filter(m => m.MobileSupported === 1 || m.MobileSupported === true),
    }))
    .filter(group => group.modules.length > 0)
}

const NavigationContext = React.createContext<NavigationContextValue | undefined>(undefined)

export function NavigationProvider({
  children,
  companyId,
  userId
}: {
  children: React.ReactNode
  companyId?: number
  userId?: number
}) {
  const [groupedModules, setGroupedModules] = React.useState<GroupedModule[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchNavigation = React.useCallback(async () => {
    if (!companyId || !userId) {
      setLoading(false)
      return
    }

    const cacheKey = `navigation_${companyId}_${userId}`
    const cacheTimeKey = `${cacheKey}_time`
    const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

    try {
      // Check cache first
      const cachedData = localStorage.getItem(cacheKey)
      const cacheTime = localStorage.getItem(cacheTimeKey)

      if (cachedData && cacheTime) {
        const age = Date.now() - parseInt(cacheTime)
        if (age < CACHE_DURATION) {
          setGroupedModules(JSON.parse(cachedData))
          setLoading(false)
          return
        }
      }

      setLoading(true)
      const navigation = await getDynamicNavigation(companyId, userId)

      setGroupedModules(navigation)
      localStorage.setItem(cacheKey, JSON.stringify(navigation))
      localStorage.setItem(cacheTimeKey, Date.now().toString())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load navigation'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [companyId, userId])

  React.useEffect(() => {
    fetchNavigation()
  }, [fetchNavigation])

  const mobileModules = React.useMemo(
    () => filterMobileModules(groupedModules),
    [groupedModules]
  )

  const value = React.useMemo(
    () => ({
      groupedModules,
      loading,
      error,
      refreshNavigation: fetchNavigation,
      mobileModules,
    }),
    [groupedModules, loading, error, fetchNavigation, mobileModules]
  )

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = React.useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider')
  }
  return context
}

/**
 * Look up a module's ModuleDisplayName by its route path (e.g. '/synthia').
 * Walks the full navigation tree including children.
 */
export function useModuleDisplayName(path: string, fallback: string = ''): string {
  const { groupedModules } = useNavigation()
  return React.useMemo(() => {
    for (const group of groupedModules) {
      for (const mod of group.modules) {
        const modPath = mod.ModuleName.startsWith('/') ? mod.ModuleName : `/${mod.ModuleName.toLowerCase().trim().replace(/\s+/g, '-')}`
        if (modPath === path) return mod.ModuleDisplayName
        if (mod.children) {
          for (const child of mod.children) {
            const childPath = child.ModuleName.startsWith('/') ? child.ModuleName : `/${child.ModuleName.toLowerCase().trim().replace(/\s+/g, '-')}`
            if (childPath === path) return child.ModuleDisplayName
          }
        }
      }
    }
    return fallback
  }, [groupedModules, path, fallback])
}
