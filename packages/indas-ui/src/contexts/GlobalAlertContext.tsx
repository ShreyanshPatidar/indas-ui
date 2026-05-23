'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useModalAlert, ModalAlert } from '@/components/modals/modal-alert'
import { Loading, LoadingStates, LoadingOverlay } from '@/components/ui/overlays/loading'
import type { AlertAction } from '@/components/modals/modal-alert'

// Global Alert Context
interface GlobalAlertContextType {
  // Quick Demo Alert Methods
  showSuccess: (title: string, description: string, autoCloseOrActions?: number | AlertAction[]) => void
  showError: (title: string, description: string) => void
  showWarning: (title: string, description: string, actions?: AlertAction[]) => void
  showInfo: (title: string, description: string, autoCloseOrActions?: number | AlertAction[]) => void
  showConfirmation: (title: string, description: string, onConfirm: () => void, onCancel?: () => void) => void
  showLoading: (title: string, description: string) => void
  showCritical: (title: string, description: string, actions?: AlertAction[]) => void
  hideAlert: () => void

  // Professional Loading State Methods
  showAppStartup: (message?: string) => void
  showDataLoading: (message?: string) => void
  showFormSaving: (message?: string) => void
  showAuthentication: (message?: string) => void
  showBackgroundSync: (message?: string, progress?: string) => void
  showModalProcessing: (message?: string) => void
  showFieldValidation: (message?: string) => void
  hideLoading: () => void
}

const GlobalAlertContext = createContext<GlobalAlertContextType | undefined>(undefined)

interface GlobalAlertProviderProps {
  children: ReactNode
}

export function GlobalAlertProvider({ children }: GlobalAlertProviderProps) {
  const alertSystem = useModalAlert()
  const [loadingOverlay, setLoadingOverlay] = React.useState<{
    isVisible: boolean
    type: 'startup' | 'auth' | 'modal' | null
    message: string
  }>({
    isVisible: false,
    type: null,
    message: ''
  })

  // Quick Demo Alert Methods
  const showSuccess = (title: string, description: string, autoCloseOrActions: number | AlertAction[] = 3000) => {
    // Support both autoClose number and actions array
    if (Array.isArray(autoCloseOrActions)) {
      alertSystem.showAlert({
        type: 'success',
        title,
        description,
        actions: autoCloseOrActions
      })
    } else {
      alertSystem.showSuccess(title, description, autoCloseOrActions)
    }
  }

  const showError = (title: string, description: string) => {
    alertSystem.showError(title, description)
  }

  const showWarning = (title: string, description: string, actions?: AlertAction[]) => {
    alertSystem.showWarning(title, description, actions)
  }

  const showInfo = (title: string, description: string, autoCloseOrActions?: number | AlertAction[]) => {
    // Support both autoClose number and actions array
    if (Array.isArray(autoCloseOrActions)) {
      alertSystem.showAlert({
        type: 'info',
        title,
        description,
        actions: autoCloseOrActions
      })
    } else {
      alertSystem.showInfo(title, description, autoCloseOrActions)
    }
  }

  const showConfirmation = (
    title: string,
    description: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    alertSystem.showConfirmation(title, description, onConfirm, onCancel)
  }

  const showLoading = (title: string, description: string) => {
    alertSystem.showLoading(title, description)
  }

  const showCritical = (title: string, description: string, actions?: AlertAction[]) => {
    alertSystem.showAlert({
      type: 'critical',
      title,
      description,
      actions
    })
  }

  const hideAlert = () => {
    alertSystem.hideAlert()
  }

  // Professional Loading State Methods
  const showAppStartup = (message = "Loading your workspace...") => {
    setLoadingOverlay({
      isVisible: true,
      type: 'startup',
      message
    })
  }

  const showDataLoading = (message = "Processing...") => {
    // For data loading, we typically show inline loading in components
    // This is more for global data operations
    showLoading("Loading Data", message)
  }

  const showFormSaving = (message = "Saving...") => {
    // This will be handled by form components with button states
    // But can be used for global save operations
    showLoading("Saving Changes", message)
  }

  const showAuthentication = (message = "Authenticating your account...") => {
    setLoadingOverlay({
      isVisible: true,
      type: 'auth',
      message
    })
  }

  const showBackgroundSync = (message = "Syncing...", progress = "") => {
    showInfo("Background Sync", `${message} ${progress}`, 5000)
  }

  const showModalProcessing = (message = "Processing...") => {
    setLoadingOverlay({
      isVisible: true,
      type: 'modal',
      message
    })
  }

  const showFieldValidation = (message = "Validating...") => {
    // Field validation is typically handled inline by form components
    // This is for global validation operations
    showInfo("Validation", message, 2000)
  }

  const hideLoading = () => {
    setLoadingOverlay({
      isVisible: false,
      type: null,
      message: ''
    })
    // Also hide the alert modal (used by showDataLoading and showFormSaving)
    alertSystem.hideAlert()
  }

  const contextValue: GlobalAlertContextType = {
    // Quick Demo Methods
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirmation,
    showLoading,
    showCritical,
    hideAlert,

    // Professional Loading Methods
    showAppStartup,
    showDataLoading,
    showFormSaving,
    showAuthentication,
    showBackgroundSync,
    showModalProcessing,
    showFieldValidation,
    hideLoading
  }

  return (
    <GlobalAlertContext.Provider value={contextValue}>
      {children}

      {/* Alert System Component */}
      <alertSystem.AlertComponent />

      {/* Loading Overlays */}
      {loadingOverlay.type === 'startup' && (
        <LoadingOverlay
          isVisible={loadingOverlay.isVisible}
          text={loadingOverlay.message}
          variant="cradle"
          size="xl"
        />
      )}

      {loadingOverlay.type === 'auth' && (
        <LoadingOverlay
          isVisible={loadingOverlay.isVisible}
          text={loadingOverlay.message}
          variant="cradle"
          size="lg"
        />
      )}

      {loadingOverlay.type === 'modal' && (
        <LoadingOverlay
          isVisible={loadingOverlay.isVisible}
          text={loadingOverlay.message}
          variant="spinner"
          size="lg"
        />
      )}
    </GlobalAlertContext.Provider>
  )
}

// Hook to use the global alert system
export function useGlobalAlert(): GlobalAlertContextType {
  const context = useContext(GlobalAlertContext)
  if (context === undefined) {
    throw new Error('useGlobalAlert must be used within a GlobalAlertProvider')
  }
  return context
}

// Convenience hooks for specific scenarios
export function useQuickAlert() {
  const {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirmation,
    showLoading,
    showCritical,
    hideAlert
  } = useGlobalAlert()

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirmation,
    showLoading,
    showCritical,
    hideAlert
  }
}

export function useProfessionalLoading() {
  const {
    showAppStartup,
    showDataLoading,
    showFormSaving,
    showAuthentication,
    showBackgroundSync,
    showModalProcessing,
    showFieldValidation,
    hideLoading
  } = useGlobalAlert()

  return {
    showAppStartup,
    showDataLoading,
    showFormSaving,
    showAuthentication,
    showBackgroundSync,
    showModalProcessing,
    showFieldValidation,
    hideLoading
  }
}

// Global Loading Components for Inline Usage
export const GlobalLoadingComponents = {
  // Form Operations
  Saving: () => <LoadingStates.Saving />,
  Processing: () => <LoadingStates.Processing />,

  // Business Operations
  Calculating: () => <LoadingStates.Calculating />,
  Validating: () => <LoadingStates.Validating />,

  // Data Operations
  Exporting: () => <LoadingStates.Exporting />,
  Importing: () => <LoadingStates.Importing />,
  Syncing: () => <LoadingStates.Syncing />,

  // System Operations
  Connecting: () => <LoadingStates.Connecting />,
  Authenticating: () => <LoadingStates.Authenticating />,
  SigningIn: () => <LoadingStates.SigningIn />,

  // Inline Components
  Inline: ({ size = 'sm' }: { size?: 'sm' | 'md' }) => <LoadingStates.Inline size={size} />,
  InlinePendulum: ({ size = 'sm' }: { size?: 'sm' | 'md' }) => <LoadingStates.InlinePendulum size={size} />,
  InlineCradle: ({ size = 'sm' }: { size?: 'sm' | 'md' }) => <LoadingStates.InlineCradle size={size} />
}