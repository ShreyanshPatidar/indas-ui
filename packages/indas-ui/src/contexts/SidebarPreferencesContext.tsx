'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export interface SidebarPreferences {
  // Favorited module paths (pinned items shown at top)
  favorites: string[]
  // Hidden module paths (not shown in sidebar)
  hiddenItems: string[]
  // Actions
  addFavorite: (modulePath: string) => void
  removeFavorite: (modulePath: string) => void
  toggleFavorite: (modulePath: string) => void
  isFavorite: (modulePath: string) => boolean
  hideItem: (modulePath: string) => void
  unhideItem: (modulePath: string) => void
  toggleHidden: (modulePath: string) => void
  isHidden: (modulePath: string) => boolean
  clearAllHidden: () => void
  clearAllFavorites: () => void
}

const STORAGE_KEY = 'sidebarPreferences'

const SidebarPreferencesContext = createContext<SidebarPreferences | undefined>(undefined)

interface StoredPreferences {
  favorites: string[]
  hiddenItems: string[]
}

export function SidebarPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([])
  const [hiddenItems, setHiddenItems] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const preferences: StoredPreferences = JSON.parse(saved)
        if (Array.isArray(preferences.favorites)) {
          setFavorites(preferences.favorites)
        }
        if (Array.isArray(preferences.hiddenItems)) {
          setHiddenItems(preferences.hiddenItems)
        }
      }
    } catch (error) {
      console.error('Failed to parse sidebar preferences:', error)
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage when changed
  useEffect(() => {
    if (!isLoaded) return

    const preferences: StoredPreferences = {
      favorites,
      hiddenItems
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  }, [favorites, hiddenItems, isLoaded])

  // Favorite actions
  const addFavorite = useCallback((modulePath: string) => {
    setFavorites(prev => {
      if (prev.includes(modulePath)) return prev
      return [...prev, modulePath]
    })
  }, [])

  const removeFavorite = useCallback((modulePath: string) => {
    setFavorites(prev => prev.filter(path => path !== modulePath))
  }, [])

  const toggleFavorite = useCallback((modulePath: string) => {
    setFavorites(prev => {
      if (prev.includes(modulePath)) {
        return prev.filter(path => path !== modulePath)
      }
      return [...prev, modulePath]
    })
  }, [])

  const isFavorite = useCallback((modulePath: string) => {
    return favorites.includes(modulePath)
  }, [favorites])

  // Hidden items actions
  const hideItem = useCallback((modulePath: string) => {
    setHiddenItems(prev => {
      if (prev.includes(modulePath)) return prev
      return [...prev, modulePath]
    })
    // Also remove from favorites if hidden
    setFavorites(prev => prev.filter(path => path !== modulePath))
  }, [])

  const unhideItem = useCallback((modulePath: string) => {
    setHiddenItems(prev => prev.filter(path => path !== modulePath))
  }, [])

  const toggleHidden = useCallback((modulePath: string) => {
    setHiddenItems(prev => {
      if (prev.includes(modulePath)) {
        return prev.filter(path => path !== modulePath)
      }
      return [...prev, modulePath]
    })
  }, [])

  const isHidden = useCallback((modulePath: string) => {
    return hiddenItems.includes(modulePath)
  }, [hiddenItems])

  const clearAllHidden = useCallback(() => {
    setHiddenItems([])
  }, [])

  const clearAllFavorites = useCallback(() => {
    setFavorites([])
  }, [])

  return (
    <SidebarPreferencesContext.Provider value={{
      favorites,
      hiddenItems,
      addFavorite,
      removeFavorite,
      toggleFavorite,
      isFavorite,
      hideItem,
      unhideItem,
      toggleHidden,
      isHidden,
      clearAllHidden,
      clearAllFavorites
    }}>
      {children}
    </SidebarPreferencesContext.Provider>
  )
}

export function useSidebarPreferences() {
  const context = useContext(SidebarPreferencesContext)
  if (context === undefined) {
    throw new Error('useSidebarPreferences must be used within a SidebarPreferencesProvider')
  }
  return context
}
