'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface AppConfigContextType {
  selectedFinancialYear: string
  setSelectedFinancialYear: (fy: string) => void
  selectedProductionUnit: string
  setSelectedProductionUnit: (unit: string) => void
  getFinancialYearSuffix: () => string
}

const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined)

export function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const [selectedFinancialYear, setSelectedFinancialYear] = useState('2025-2026')
  const [selectedProductionUnit, setSelectedProductionUnit] = useState('')

  // Helper to convert "2025-2026" to "_25_26"
  const getFinancialYearSuffix = (): string => {
    if (!selectedFinancialYear) return ''

    const parts = selectedFinancialYear.split('-')
    if (parts.length !== 2) return ''

    const startYear = parts[0].slice(-2) // Last 2 digits of start year
    const endYear = parts[1].slice(-2)   // Last 2 digits of end year

    return `_${startYear}_${endYear}`
  }

  return (
    <AppConfigContext.Provider
      value={{
        selectedFinancialYear,
        setSelectedFinancialYear,
        selectedProductionUnit,
        setSelectedProductionUnit,
        getFinancialYearSuffix
      }}
    >
      {children}
    </AppConfigContext.Provider>
  )
}

export function useAppConfig() {
  const context = useContext(AppConfigContext)
  if (context === undefined) {
    throw new Error('useAppConfig must be used within an AppConfigProvider')
  }
  return context
}
