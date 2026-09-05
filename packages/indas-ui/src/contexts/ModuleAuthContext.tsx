'use client'
import * as React from 'react'
import { useSessionAdapter } from '@/contexts/SessionAdapterContext'
import { usePathname, useRouter } from 'next/navigation'
import { UserMasterAPI } from '@/lib/api/master/user'
// User module permission structure from API
interface UserModulePermission {
  ModuleID: number
  ModuleName?: string
  ModuleDisplayName?: string
  CanView: number | boolean
  CanSave: number | boolean
  CanEdit: number | boolean
  CanDelete: number | boolean
  CanExport: number | boolean
  CanPrint?: number | boolean
  CanCancel?: number | boolean
}
interface ModuleAuthContextType {
  permissions: UserModulePermission[]
  isLoading: boolean
  hasAccess: (modulePath: string) => boolean
  canView: (modulePath: string) => boolean
  canSave: (modulePath: string) => boolean
  canEdit: (modulePath: string) => boolean
  canDelete: (modulePath: string) => boolean
  canExport: (modulePath: string) => boolean
  canPrint: (modulePath: string) => boolean
  canCancel: (modulePath: string) => boolean
  refreshPermissions: () => Promise<void>
}
const ModuleAuthContext = React.createContext<ModuleAuthContextType | undefined>(undefined)
// Map URL paths to module names (from the API)
// These mappings should match the ModuleName returned by the API
const PATH_TO_MODULE_MAP: Record<string, string[]> = {
  // Main modules - can have multiple possible module names
  '/costing/estimation': ['Estimation', 'Costing', 'Cost Estimation'],
  '/costing/estimation/rapid': ['Rapid Estimation', 'Rapid', 'Estimation Steps', 'Step Estimation', 'Dynamic Fill', 'Dynamic Fill Costing', 'Estimation-Mobile', 'Estimation Mobile', 'Estimation', 'Cost Estimation'],
  '/costing/estimation/steps': ['Rapid Estimation', 'Rapid', 'Estimation Steps', 'Step Estimation', 'Dynamic Fill', 'Dynamic Fill Costing', 'Estimation-Mobile', 'Estimation Mobile', 'Estimation', 'Cost Estimation'],
  '/costing/estimation/mobile': ['Rapid Estimation', 'Rapid', 'Estimation Steps', 'Step Estimation', 'Dynamic Fill', 'Dynamic Fill Costing', 'Estimation-Mobile', 'Estimation Mobile', 'Estimation', 'Cost Estimation'],
  '/enquiry': ['Enquiry', 'Inquiry', 'Enquiry Master'],
  '/costing/quote-panel': ['Quote Panel', 'Quotation', 'Quotation Panel', 'Quote'],
  '/dashboard': ['Dashboard', 'Home Dashboard'],
  '/home': ['Home', 'Dashboard'],
  '/report': ['Reports', 'Report', 'MIS Reports'],
  '/settings': ['Settings', 'User Settings'],
  // AI assistant
  '/synthia': ['Synthia', 'Parkbuddy', 'AI Assistant'],
  // Master modules
  '/master/user': ['User Master', 'User', 'Users'],
  '/master/machine': ['Machine Master', 'Machine', 'Machines'],
  '/master/process': ['Process Master', 'Process', 'Processes'],
  '/master/item': ['Item Master', 'Item', 'Items', 'Material Master'],
  '/master/ledger': ['Ledger Master', 'Ledger', 'Ledgers', 'Account Master'],
  '/master/customer': ['Customer Master', 'Customer', 'Customers', 'Lead Master', 'Lead', 'Leads'],
  '/master/company': ['Company Master', 'Company', 'Companies'],
  '/master/category': ['Category Master', 'Category', 'Categories'],
  '/master/material-group': ['Material Group', 'Material Group Master'],
  '/master/rate': ['Rate Master', 'Rate', 'Rates'],
  '/master/other': ['Other Master', 'Other'],
  // Activity modules
  '/activity/email': ['Email', 'Emails', 'Mail'],
  '/activity/notifications': ['Notifications', 'Notification'],
  '/activity/audit-logs': ['Audit Logs', 'Audit Log', 'Audit'],
  '/activity': ['Activity', 'Activities'],
}
// Paths that are always accessible (no permission check needed)
const PUBLIC_PATHS = [
  '/home',
  '/dashboard',
  '/settings',
  '/login',
  '/',
]
// Admin-only paths
const ADMIN_ONLY_PATHS = [
  '/master/user',
  '/activity/audit-logs',
]
export function ModuleAuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSessionAdapter()
  const [permissions, setPermissions] = React.useState<UserModulePermission[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  // Fetch user permissions on mount and when session changes
  const fetchPermissions = React.useCallback(async () => {
    if (status !== 'authenticated' || !session?.user) {
      setIsLoading(false)
      return
    }
    const userId = (session.user as any).UserID || (session.user as any).userID
    if (!userId) {
      setIsLoading(false)
      return
    }
    try {
      setIsLoading(true)
      const response = await UserMasterAPI.getUserModulePermissions(userId, session as any)
      if (response.success && Array.isArray(response.data)) {
        setPermissions(response.data)
      }
    } catch (error) {
      // Silent fail
    } finally {
      setIsLoading(false)
    }
  }, [session, status])
  React.useEffect(() => {
    fetchPermissions()
  }, [fetchPermissions])
  // Find matching module for a given path
  const findModuleForPath = React.useCallback((path: string): UserModulePermission | null => {
    if (!path || permissions.length === 0) return null
    // Normalize path
    const normalizedPath = path.toLowerCase().replace(/\/$/, '')
    // Extract key segment from path
    const pathSegments = normalizedPath.split('/').filter(Boolean)
    const lastSegment = pathSegments[pathSegments.length - 1] || ''
    const firstSegment = pathSegments[0] || ''
    // Strategy 0: DB stores the full route in ModuleName (e.g. "/costing/paper-sensitivity").
    // Exact match on that is the most authoritative — do it first so fuzzy strategies
    // below can't accidentally resolve to a different sibling module.
    const exactByModuleName = permissions.find(
      p => (p.ModuleName || '').toLowerCase().replace(/\/$/, '') === normalizedPath
    )
    if (exactByModuleName) return exactByModuleName
    // Strategy 1: Try exact match from PATH_TO_MODULE_MAP
    let moduleNames = PATH_TO_MODULE_MAP[normalizedPath]
    if (!moduleNames) {
      const pathParts = [...pathSegments]
      while (pathParts.length > 0) {
        const parentPath = '/' + pathParts.join('/')
        moduleNames = PATH_TO_MODULE_MAP[parentPath]
        if (moduleNames) break
        pathParts.pop()
      }
    }
    // Strategy 2: Direct match on ModuleName or ModuleDisplayName
    const getModuleName = (p: UserModulePermission) =>
      (p.ModuleDisplayName || p.ModuleName || '').toLowerCase().replace(/\s+/g, '')
    if (!moduleNames || moduleNames.length === 0) {
      const found = permissions.find(p => {
        const moduleLower = getModuleName(p)
        return moduleLower === lastSegment ||
          moduleLower === firstSegment ||
          moduleLower.includes(lastSegment) ||
          lastSegment.includes(moduleLower)
      })
      if (found) return found
    }
    // Strategy 3: Match from predefined mapping
    if (moduleNames && moduleNames.length > 0) {
      for (const moduleName of moduleNames) {
        const found = permissions.find(p =>
          getModuleName(p) === moduleName.toLowerCase().replace(/\s+/g, '')
        )
        if (found) return found
      }
      // Partial matching
      for (const moduleName of moduleNames) {
        const moduleNameLower = moduleName.toLowerCase().replace(/\s+/g, '')
        const found = permissions.find(p => {
          const pName = getModuleName(p)
          return pName.includes(moduleNameLower) || moduleNameLower.includes(pName)
        })
        if (found) return found
      }
    }
    // Strategy 4: Fuzzy match
    for (const segment of pathSegments) {
      if (segment.length < 3) continue
      const found = permissions.find(p => {
        const pName = getModuleName(p)
        return pName.includes(segment) || segment.includes(pName)
      })
      if (found) return found
    }
    return null
  }, [permissions])
  // Check if user has access to a module path
  const hasAccess = React.useCallback((modulePath: string): boolean => {
    // Public paths are always accessible
    if (PUBLIC_PATHS.some(p => modulePath === p || (p !== '/' && modulePath.startsWith(p + '/')))) {
      return true
    }
    // Exact match for root
    if (modulePath === '/') return true
    // If still loading permissions, allow (will re-check when loaded)
    if (isLoading) return true
    // If no permissions loaded (API failed), allow access - don't block the app
    if (permissions.length === 0) return true
    // Find module permission
    const modulePermission = findModuleForPath(modulePath)
    // If module found, check CanView (handles both boolean and number)
    if (modulePermission) {
      // CanView can be boolean (true/false) or number (1/0)
      const canViewModule = modulePermission.CanView === true || modulePermission.CanView === 1
      return canViewModule
    }
    // Module not found in permissions - allow access (don't block unlisted modules)
    return true
  }, [permissions, isLoading, findModuleForPath])
  // Permission check helpers - handle both number (1/0) and boolean (true/false)
  const toBoolean = (val: number | boolean | undefined): boolean => val === 1 || val === true
  const canView = React.useCallback((modulePath: string): boolean => {
    if (isLoading || permissions.length === 0) return true
    const module = findModuleForPath(modulePath)
    return module ? toBoolean(module.CanView) : true
  }, [findModuleForPath, isLoading, permissions.length])
  const canSave = React.useCallback((modulePath: string): boolean => {
    if (isLoading || permissions.length === 0) return true
    const module = findModuleForPath(modulePath)
    return module ? toBoolean(module.CanSave) : true
  }, [findModuleForPath, isLoading, permissions.length])
  const canEdit = React.useCallback((modulePath: string): boolean => {
    if (isLoading || permissions.length === 0) return true
    const module = findModuleForPath(modulePath)
    return module ? toBoolean(module.CanEdit) : true
  }, [findModuleForPath, isLoading, permissions.length])
  const canDelete = React.useCallback((modulePath: string): boolean => {
    if (isLoading || permissions.length === 0) return true
    const module = findModuleForPath(modulePath)
    return module ? toBoolean(module.CanDelete) : true
  }, [findModuleForPath, isLoading, permissions.length])
  const canExport = React.useCallback((modulePath: string): boolean => {
    if (isLoading || permissions.length === 0) return true
    const module = findModuleForPath(modulePath)
    return module ? toBoolean(module.CanExport) : true
  }, [findModuleForPath, isLoading, permissions.length])
  const canPrint = React.useCallback((modulePath: string): boolean => {
    if (isLoading || permissions.length === 0) return true
    const module = findModuleForPath(modulePath)
    return module ? toBoolean(module.CanPrint) : true
  }, [findModuleForPath, isLoading, permissions.length])
  const canCancel = React.useCallback((modulePath: string): boolean => {
    if (isLoading || permissions.length === 0) return true
    const module = findModuleForPath(modulePath)
    return module ? toBoolean(module.CanCancel) : true
  }, [findModuleForPath, isLoading, permissions.length])
  const value = React.useMemo(() => ({
    permissions,
    isLoading,
    hasAccess,
    canView,
    canSave,
    canEdit,
    canDelete,
    canExport,
    canPrint,
    canCancel,
    refreshPermissions: fetchPermissions,
  }), [permissions, isLoading, hasAccess, canView, canSave, canEdit, canDelete, canExport, canPrint, canCancel, fetchPermissions])
  return (
    <ModuleAuthContext.Provider value={value}>
      {children}
    </ModuleAuthContext.Provider>
  )
}
const PERMISSIVE_DEFAULTS: ModuleAuthContextType = {
  permissions: [],
  isLoading: false,
  hasAccess: () => true,
  canView: () => true,
  canSave: () => true,
  canEdit: () => true,
  canDelete: () => true,
  canExport: () => true,
  canPrint: () => true,
  canCancel: () => true,
  refreshPermissions: async () => { },
}
export function useModuleAuth() {
  const context = React.useContext(ModuleAuthContext)
  // Return permissive defaults if used outside ModuleAuthProvider (e.g. login page, auth routes)
  return context ?? PERMISSIVE_DEFAULTS
}
// Hook to check current page access
export function usePageAccess() {
  const pathname = usePathname()
  const { hasAccess, isLoading, canView, canSave, canEdit, canDelete, canExport, canPrint, canCancel } = useModuleAuth()
  const currentPath = pathname || '/'
  return {
    hasAccess: hasAccess(currentPath),
    isLoading,
    canView: canView(currentPath),
    canSave: canSave(currentPath),
    canEdit: canEdit(currentPath),
    canDelete: canDelete(currentPath),
    canExport: canExport(currentPath),
    canPrint: canPrint(currentPath),
    canCancel: canCancel(currentPath),
  }
}
