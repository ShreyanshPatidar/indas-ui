'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

const APP_NAME = 'Estimo'

interface PageTitleContextType {
  title: string
  setTitle: (title: string) => void
}

const PageTitleContext = createContext<PageTitleContextType | undefined>(undefined)

export const usePageTitle = () => {
  const context = useContext(PageTitleContext)
  if (context === undefined) {
    throw new Error('usePageTitle must be used within a PageTitleProvider')
  }
  return context
}

interface PageTitleProviderProps {
  children: React.ReactNode
}

export const PageTitleProvider: React.FC<PageTitleProviderProps> = ({ children }) => {
  const [title, setTitle] = useState(APP_NAME)

  useEffect(() => {
    document.title = title || APP_NAME
  }, [title])

  const value = {
    title,
    setTitle,
  }

  return (
    <PageTitleContext.Provider value={value}>
      {children}
    </PageTitleContext.Provider>
  )
}