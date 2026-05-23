'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type SearchType = 'advanced' | 'new'

interface SearchPreferences {
  defaultSearchType: SearchType
  setDefaultSearchType: (type: SearchType) => void
}

const SearchPreferencesContext = createContext<SearchPreferences | undefined>(undefined)

export function SearchPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [defaultSearchType, setDefaultSearchTypeState] = useState<SearchType>('advanced')

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('searchPreferences')
    if (saved) {
      try {
        const preferences = JSON.parse(saved)
        if (preferences.defaultSearchType === 'advanced' || preferences.defaultSearchType === 'new') {
          setDefaultSearchTypeState(preferences.defaultSearchType)
        }
      } catch (error) {
        console.error('Failed to parse search preferences:', error)
      }
    }
  }, [])

  // Save to localStorage when changed
  const setDefaultSearchType = (type: SearchType) => {
    setDefaultSearchTypeState(type)
    localStorage.setItem('searchPreferences', JSON.stringify({ defaultSearchType: type }))
  }

  return (
    <SearchPreferencesContext.Provider value={{
      defaultSearchType,
      setDefaultSearchType
    }}>
      {children}
    </SearchPreferencesContext.Provider>
  )
}

export function useSearchPreferences() {
  const context = useContext(SearchPreferencesContext)
  if (context === undefined) {
    throw new Error('useSearchPreferences must be used within a SearchPreferencesProvider')
  }
  return context
}