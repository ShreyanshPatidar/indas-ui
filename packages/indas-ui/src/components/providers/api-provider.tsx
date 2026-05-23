'use client'

import { useEffect, createContext, useContext, ReactNode } from 'react'
import { initializeAPI } from '@/lib/api'

interface APIContextType {
  initialized: boolean
}

const APIContext = createContext<APIContextType>({ initialized: false })

export function useAPI() {
  return useContext(APIContext)
}

interface APIProviderProps {
  children: ReactNode
}

export function APIProvider({ children }: APIProviderProps) {
  useEffect(() => {
    // Initialize API configuration when the component mounts
    initializeAPI()
  }, [])

  return (
    <APIContext.Provider value={{ initialized: true }}>
      {children}
    </APIContext.Provider>
  )
}