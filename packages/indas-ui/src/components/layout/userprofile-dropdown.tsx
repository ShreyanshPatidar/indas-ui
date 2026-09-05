"use client"

import { useSessionAdapter } from "@/contexts/SessionAdapterContext"
import { useState, useEffect } from "react"
import { LogOut, Settings, Shield, CircleUser } from "@/lib/icons"
import { useRouter } from "next/navigation"
import { LogoutModal, DeviceInfo } from "@/components/modals/logout-modal"
import { detectDevice, getDeviceId, getDeviceName } from "@/lib/utils/device-detection"
import { performLogoutCleanup } from "@/lib/utils/logout-cleanup"
import { useNotifications } from "@/hooks/useNotifications"

export function UserDropdown() {
  const { data: session, signOut } = useSessionAdapter()
  const { getNotificationCounts } = useNotifications(session)
  const [isOpen, setIsOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [sessionDuration, setSessionDuration] = useState('0h 0m')
  const router = useRouter()

  // Pending tasks = notifications in the "Pending" section (category === 'Pending')
  const pendingCount = getNotificationCounts().pending

  // Calculate session duration
  useEffect(() => {
    const calculateSessionDuration = () => {
      const loginTime = (session?.user as any)?.loginTime || sessionStorage.getItem('loginTime')
      if (!loginTime) return
      const diffMs = Date.now() - new Date(loginTime).getTime()
      const hours = Math.floor(diffMs / (1000 * 60 * 60))
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      setSessionDuration(`${hours}h ${minutes}m`)
    }
    calculateSessionDuration()
    const interval = setInterval(calculateSessionDuration, 60000)
    return () => clearInterval(interval)
  }, [session])

  // Profile picture from localStorage
  const [profilePicture, setProfilePicture] = useState<string | null>(null)

  useEffect(() => {
    const savedPicture = localStorage.getItem('userProfilePicture')
    if (savedPicture) setProfilePicture(savedPicture)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userProfilePicture') setProfilePicture(e.newValue)
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const handleOpenLogoutModal = () => {
    setShowLogoutModal(true)
  }

  const profileAvatarSmall = (
    <div className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center">
      {profilePicture ? (
        <img src={profilePicture} alt="Profile" className="h-full w-full object-cover" />
      ) : (
        <CircleUser className="h-8 w-8 text-[rgb(var(--fg-muted))] lg:text-white/80" strokeWidth={1.5} />
      )}
    </div>
  )

  const profileAvatarLarge = (
    <div className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
      {profilePicture ? (
        <img src={profilePicture} alt="Profile" className="h-full w-full object-cover border border-[rgb(var(--bd-default))] rounded-full" />
      ) : (
        <CircleUser className="h-10 w-10 text-[rgb(var(--fg-muted))]" strokeWidth={1.5} />
      )}
    </div>
  )

  const getSessionData = () => {
    const device = detectDevice()
    const currentDevice: DeviceInfo = {
      id: getDeviceId(),
      name: getDeviceName(),
      type: device.deviceType,
      browser: device.browser,
      os: device.os,
      lastUsed: new Date(),
      isCurrent: true
    }
    return {
      duration: sessionDuration,
      startTime: new Date((session?.user as any)?.loginTime || sessionStorage.getItem('loginTime') || new Date().toISOString()),
      tasks: { overdue: 0, dueSoon: pendingCount, total: pendingCount },
      activeDevices: [currentDevice],
      isInactivityWarning: false
    }
  }

  const handleLogout = async () => {
    try {
      await performLogoutCleanup()
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      await signOut({ callbackUrl: `${origin}/login`, redirect: true })
    } catch {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      await signOut({ callbackUrl: `${origin}/login`, redirect: true })
    }
  }

  if (!session?.user) return null
  const { user } = session

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center h-10 w-10 rounded-full text-[rgb(var(--fg-muted))] lg:text-white/80 hover:text-[rgb(var(--color-primary))] lg:hover:text-white lg:hover:bg-white/10 transition-colors"
      >
        {profileAvatarSmall}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-60 bg-[rgb(var(--bg-surface))] rounded-xl shadow-xl border border-[rgb(var(--bd-default))] z-50 overflow-hidden">
            {/* User Profile */}
            <div className="p-3.5 border-b border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-subtle))]">
              <div className="flex items-center gap-3">
                {profileAvatarLarge}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[rgb(var(--fg-default))] truncate">{user.name}</p>
                  <p className="text-xs text-[rgb(var(--fg-muted))] truncate">{user.email}</p>
                  <div
                    className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[0.65rem] font-medium border"
                    style={{
                      background: `rgb(var(${(user as any).IsAdmin ? '--color-error' : '--color-success'}) / 0.08)`,
                      borderColor: `rgb(var(${(user as any).IsAdmin ? '--color-error' : '--color-success'}) / 0.2)`,
                      color: `rgb(var(${(user as any).IsAdmin ? '--color-error' : '--color-success'}))`
                    }}
                  >
                    <Shield className="h-2.5 w-2.5" />
                    {(user as any).IsAdmin ? 'Administrator' : 'User'}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-1.5">
              <button
                onClick={() => { setIsOpen(false); router.push('/settings') }}
                className="flex items-center w-full gap-2.5 px-3 py-2 text-sm text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-hover))] rounded-lg transition-colors"
              >
                <Settings className="h-3.5 w-3.5 text-[rgb(var(--color-icon))]" />
                <span className="font-medium">Settings</span>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false)
                  handleOpenLogoutModal()
                }}
                className="flex items-center w-full gap-2.5 px-3 py-2 text-sm text-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error)/0.08)] rounded-lg transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="font-medium">Log Out</span>
              </button>
            </div>
          </div>
        </>
      )}

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onLogout={handleLogout}
        onLogoutEverywhere={handleLogout}
        sessionData={getSessionData()}
        onExtendSession={() => setShowLogoutModal(false)}
        onViewTasks={() => {
          setShowLogoutModal(false)
          router.push('/activity/notifications')
        }}
      />
    </div>
  )
}
