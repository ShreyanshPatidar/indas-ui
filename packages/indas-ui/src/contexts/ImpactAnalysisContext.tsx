'use client'

import * as React from 'react'

interface ImpactAnalysisContextType {
  showImpactsPanel: boolean
  setShowImpactsPanel: (show: boolean) => void
  toggleImpactsPanel: () => void
}

const ImpactAnalysisContext = React.createContext<ImpactAnalysisContextType | undefined>(undefined)

export function ImpactAnalysisProvider({ children }: { children: React.ReactNode }) {
  const [showImpactsPanel, setShowImpactsPanel] = React.useState(false)

  const toggleImpactsPanel = React.useCallback(() => {
    setShowImpactsPanel(prev => !prev)
  }, [])

  const value = React.useMemo(() => ({
    showImpactsPanel,
    setShowImpactsPanel,
    toggleImpactsPanel
  }), [showImpactsPanel, toggleImpactsPanel])

  return (
    <ImpactAnalysisContext.Provider value={value}>
      {children}
    </ImpactAnalysisContext.Provider>
  )
}

export function useImpactAnalysis() {
  const context = React.useContext(ImpactAnalysisContext)
  if (context === undefined) {
    throw new Error('useImpactAnalysis must be used within an ImpactAnalysisProvider')
  }
  return context
}