'use client'

import * as React from 'react'
import { getDynamicNavigation, GroupedModule, DynamicModule } from '@/lib/api'
import { getModuleRoutePath } from '@/lib/utils'

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
 * Whether the module at the given route path has IsIntegrationRequired = 1 in ModuleMaster.
 * Used to gate customer-specific external integrations (e.g. legacy costing in Estimation).
 */
export function useModuleIntegrationRequired(path: string): boolean {
  const { groupedModules } = useNavigation()
  return React.useMemo(() => {
    const norm = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p).toLowerCase()
    const target = norm(path)

    const matches = (mod: DynamicModule) => {
      const modPath = norm(getModuleRoutePath(mod.ModuleName))
      if (modPath === '#' || modPath === '/') return false
      return modPath === target
    }

    for (const group of groupedModules) {
      for (const mod of group.modules) {
        if (matches(mod)) return mod.IsIntegrationRequired === 1 || mod.IsIntegrationRequired === true
        if (mod.children) {
          for (const child of mod.children) {
            if (matches(child)) return child.IsIntegrationRequired === 1 || child.IsIntegrationRequired === true
          }
        }
      }
    }
    return false
  }, [groupedModules, path])
}

/**
 * Look up a module's ModuleDisplayName by its route path (e.g. '/synthia').
 * Walks the full navigation tree including children.
 */
export function useModuleDisplayName(path: string, fallback: string = ''): string {
  const { groupedModules } = useNavigation()
  return React.useMemo(() => {
    const norm = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p).toLowerCase()
    const target = norm(path)

    let exactName = ''
    let prefixName = ''
    let prefixLen = -1

    const consider = (moduleName: string, displayName: string) => {
      const modPath = norm(getModuleRoutePath(moduleName))
      if (modPath === '#' || modPath === '/') return
      if (target === modPath) {
        exactName = displayName
      } else if (target.startsWith(modPath + '/') && modPath.length > prefixLen) {
        prefixLen = modPath.length
        prefixName = displayName
      }
    }

    for (const group of groupedModules) {
      for (const mod of group.modules) {
        consider(mod.ModuleName, mod.ModuleDisplayName)
        if (mod.children) {
          for (const child of mod.children) {
            consider(child.ModuleName, child.ModuleDisplayName)
          }
        }
      }
    }
    return exactName || prefixName || fallback
  }, [groupedModules, path, fallback])
}
