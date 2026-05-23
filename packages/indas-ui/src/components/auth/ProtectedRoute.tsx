'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { useModuleAuth } from '@/contexts/ModuleAuthContext'
import { useDevice } from '@/contexts/DeviceContext'
import { useNavigation } from '@/contexts/NavigationContext'
import { getModuleRoutePath } from '@/lib/utils'
import { UnauthorizedPage, MobileUnavailablePage } from './UnauthorizedPage'

// Paths that always work on mobile (no MobileSupported check needed)
const MOBILE_PUBLIC_PATHS = ['/home', '/dashboard', '/settings', '/login', '/']

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const pathname = usePathname()
  const { hasAccess } = useModuleAuth()
  const { isMobile } = useDevice()
  const { groupedModules, loading } = useNavigation()

  // Check permission access for current path
  if (!pathname || !hasAccess(pathname)) {
    return <UnauthorizedPage />
  }

  // Mobile gate: block modules where MobileSupported is falsy
  if (isMobile && !loading && groupedModules.length > 0) {
    const isPublicPath = MOBILE_PUBLIC_PATHS.some(
      p => pathname === p || (p !== '/' && pathname.startsWith(p + '/'))
    )

    if (!isPublicPath) {
      const normalizedPath = pathname.toLowerCase()
      let isMobileSupported = false
      let moduleExists = false

      for (const group of groupedModules) {
        for (const mod of group.modules) {
          const modulePath = getModuleRoutePath(mod.ModuleName).toLowerCase()

          if (normalizedPath === modulePath || normalizedPath.startsWith(modulePath + '/')) {
            moduleExists = true
            isMobileSupported = mod.MobileSupported === 1 || mod.MobileSupported === true
            break
          }
        }
        if (moduleExists) break
      }

      if (moduleExists && !isMobileSupported) {
        return <MobileUnavailablePage />
      }
    }
  }

  return <>{children}</>
}
