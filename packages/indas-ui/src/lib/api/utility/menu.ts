// Dynamic Menu API
// Handles dynamic menu and navigation

import { buildApiUrl, createApiHeaders } from '@/config/api'
import APIClient from '../core/client'
import { getSession } from 'next-auth/react'

export interface DynamicModule {
  ModuleHeadName: string
  ModuleDisplayName: string
  SetGroupIndex: number
  NumberOfChild: number
  ModuleName: string
  ModuleDisplayOrder: number
  ParentModuleName?: string // For sub-modules
  children?: DynamicModule[] // Nested sub-modules
  MobileSupported?: number | boolean // From ModuleMaster — controls mobile visibility
  IconName?: string // From ModuleMaster — lucide-react icon name (e.g. 'Home', 'FileText')
}

export interface GroupedModule {
  groupName: string
  modules: DynamicModule[]
  groupIndex: number
}

/**
 * Fetch dynamic menu modules from external API
 * Now uses APIClient for proper authentication with company credentials
 */
export async function fetchDynamicMenuModules(companyId: number, userId: number): Promise<DynamicModule[]> {
  try {
    // Get session to pass to APIClient for company credentials
    const session = await getSession()

    if (!session) {
      return []
    }

    // Use APIClient which handles company credentials from session
    const response = await APIClient.get('api/othermaster/createdynamicmenuwithsubmenu', session)

    if (!response.success || !response.data) {
      return []
    }

    const data = response.data

    // Handle different response formats
    let parsedData = data

    // Handle multiple levels of JSON encoding
    if (typeof data === 'string') {
      try {
        parsedData = JSON.parse(data)

        // If still a string, parse again (triple-encoded JSON)
        if (typeof parsedData === 'string') {
          parsedData = JSON.parse(parsedData)
        }
      } catch (parseError) {
        return []
      }
    }

    // Handle the response structure - might be wrapped in a success object
    if (Array.isArray(parsedData)) {
      return parsedData as DynamicModule[]
    } else if (parsedData.data && Array.isArray(parsedData.data)) {
      return parsedData.data as DynamicModule[]
    } else if (parsedData.success && parsedData.data && Array.isArray(parsedData.data)) {
      return parsedData.data as DynamicModule[]
    }

    return []
  } catch (error) {
    return []
  }
}

/**
 * Build hierarchical structure for modules with children
 */
function buildModuleHierarchy(modules: DynamicModule[]): DynamicModule[] {
  // Create a map for quick lookup
  const moduleMap = new Map<string, DynamicModule>()
  const rootModules: DynamicModule[] = []

  // First pass: create module map
  modules.forEach(module => {
    moduleMap.set(module.ModuleName, { ...module, children: [] })
  })

  // Second pass: build hierarchy
  modules.forEach(module => {
    const currentModule = moduleMap.get(module.ModuleName)
    if (!currentModule) return

    if (module.ParentModuleName && moduleMap.has(module.ParentModuleName)) {
      // This is a child module, add to parent's children
      const parent = moduleMap.get(module.ParentModuleName)
      if (parent && parent.children) {
        parent.children.push(currentModule)
      }
    } else {
      // This is a root module
      rootModules.push(currentModule)
    }
  })

  // Sort children by display order
  const sortChildren = (module: DynamicModule) => {
    if (module.children && module.children.length > 0) {
      module.children.sort((a, b) => a.ModuleDisplayOrder - b.ModuleDisplayOrder)
      module.children.forEach(sortChildren)
    }
  }

  rootModules.forEach(sortChildren)
  return rootModules.sort((a, b) => a.ModuleDisplayOrder - b.ModuleDisplayOrder)
}

/**
 * Group modules by ModuleHeadName and sort by ModuleDisplayOrder
 * Now supports hierarchical sub-modules
 */
export function groupAndSortModules(modules: DynamicModule[]): GroupedModule[] {
  // Group by ModuleHeadName
  const grouped = modules.reduce((acc, module) => {
    const groupName = module.ModuleHeadName
    if (!acc[groupName]) {
      acc[groupName] = {
        modules: [],
        groupIndex: module.SetGroupIndex
      }
    }
    acc[groupName].modules.push(module)
    return acc
  }, {} as Record<string, { modules: DynamicModule[], groupIndex: number }>)

  // Convert to array, build hierarchy, and sort
  return Object.entries(grouped)
    .map(([groupName, { modules, groupIndex }]) => ({
      groupName,
      modules: buildModuleHierarchy(modules),
      groupIndex
    }))
    // Sort groups by SetGroupIndex
    .sort((a, b) => a.groupIndex - b.groupIndex)
}

/**
 * Get dynamic navigation structure for sidebar
 */
export async function getDynamicNavigation(companyId?: number, userId?: number): Promise<GroupedModule[]> {
  if (!companyId || !userId) {
    return []
  }
  const modules = await fetchDynamicMenuModules(companyId, userId)
  return groupAndSortModules(modules)
}
