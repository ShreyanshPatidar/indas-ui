'use client'

// Global Loading Service - Professional ERP Loading Patterns
// Use this throughout the application for consistent loading states

export interface LoadingState {
  isLoading: boolean
  message?: string
  progress?: number
  type?: 'data' | 'form' | 'auth' | 'sync' | 'calculation' | 'export'
}

export interface LoadingConfig {
  message: string
  duration?: number
  onComplete?: () => void
  onError?: (error: Error) => void
}

// Professional Loading Scenarios
export const LoadingScenarios = {
  // 1. App Startup (Full Screen)
  APP_STARTUP: {
    type: 'startup',
    defaultMessage: 'Loading your workspace...',
    animation: 'cradle',
    placement: 'fullscreen',
    duration: '2-4s'
  },

  // 2. Data Loading (Content Area)
  DATA_FETCH: {
    type: 'data',
    defaultMessage: 'Processing...',
    animation: 'dots',
    placement: 'content-area',
    duration: 'instant'
  },

  // 3. Form Save (Button + Toast)
  FORM_SAVE: {
    type: 'form',
    defaultMessage: 'Saving...',
    animation: 'dots',
    placement: 'button-toast',
    duration: '1-3s'
  },

  // 4. Authentication (Button → Full)
  AUTHENTICATION: {
    type: 'auth',
    defaultMessage: 'Authenticating your account...',
    animation: 'cradle',
    placement: 'button-to-full',
    duration: '2-4s'
  },

  // 5. Background Sync (Corner Indicator)
  BACKGROUND_SYNC: {
    type: 'sync',
    defaultMessage: 'Syncing...',
    animation: 'dots',
    placement: 'top-right',
    duration: 'persistent'
  },

  // 6. Modal Operations (Modal Center)
  MODAL_PROCESSING: {
    type: 'modal',
    defaultMessage: 'Generating machine configurations...',
    animation: 'spinner',
    placement: 'modal-center',
    duration: 'variable'
  },

  // 7. Field Validation (Adjacent)
  FIELD_VALIDATION: {
    type: 'validation',
    defaultMessage: 'Validating...',
    animation: 'dots',
    placement: 'adjacent',
    duration: '0.5-2s'
  }
} as const

// ERP-Specific Loading Messages
export const ERPLoadingMessages = {
  // Estimation Operations
  ESTIMATION: {
    loading: 'Loading estimations...',
    saving: 'Saving estimation...',
    calculating: 'Calculating costs...',
    generating: 'Generating machine plan...',
    exporting: 'Exporting estimation data...'
  },

  // Client Operations
  CLIENT: {
    loading: 'Loading client data...',
    saving: 'Saving client information...',
    validating: 'Validating client details...',
    searching: 'Searching clients...'
  },

  // Machine Operations
  MACHINE: {
    loading: 'Loading machine configurations...',
    planning: 'Planning machine operations...',
    calculating: 'Calculating production time...',
    optimizing: 'Optimizing machine setup...'
  },

  // Material Operations
  MATERIAL: {
    loading: 'Loading material data...',
    costing: 'Calculating material costs...',
    checking: 'Checking inventory...',
    updating: 'Updating material prices...'
  },

  // System Operations
  SYSTEM: {
    startup: 'Loading Indas Estimo...',
    authenticating: 'Authenticating user...',
    syncing: 'Syncing data...',
    connecting: 'Connecting to server...',
    importing: 'Importing data...',
    exporting: 'Exporting report...'
  }
} as const

// Button Loading States
export const ButtonLoadingStates = {
  // Primary Actions
  SAVE: { text: 'Saving...', animation: 'dots' },
  DELETE: { text: 'Deleting...', animation: 'dots' },
  UPDATE: { text: 'Updating...', animation: 'dots' },
  SUBMIT: { text: 'Submitting...', animation: 'dots' },

  // Data Operations
  EXPORT: { text: 'Exporting...', animation: 'dots' },
  IMPORT: { text: 'Importing...', animation: 'dots' },
  SYNC: { text: 'Syncing...', animation: 'dots' },
  REFRESH: { text: 'Refreshing...', animation: 'dots' },

  // Calculations
  CALCULATE: { text: 'Calculating...', animation: 'pendulum' },
  GENERATE: { text: 'Generating...', animation: 'spinner' },
  PROCESS: { text: 'Processing...', animation: 'dots' },

  // Authentication
  SIGNING_IN: { text: 'Signing in...', animation: 'cradle' },
  SIGNING_OUT: { text: 'Signing out...', animation: 'spinner' },

  // Validation
  VALIDATING: { text: 'Validating...', animation: 'dots' },
  CHECKING: { text: 'Checking...', animation: 'pulse' }
} as const

// Toast Notifications for Loading Completion
export const LoadingToasts = {
  SUCCESS: {
    SAVE: { title: 'Saved Successfully', message: 'Your changes have been saved.' },
    DELETE: { title: 'Deleted Successfully', message: 'Item has been removed.' },
    EXPORT: { title: 'Export Complete', message: 'Your data has been exported.' },
    SYNC: { title: 'Sync Complete', message: 'Data has been synchronized.' }
  },
  ERROR: {
    SAVE: { title: 'Save Failed', message: 'Unable to save changes. Please try again.' },
    DELETE: { title: 'Delete Failed', message: 'Unable to delete item. Please try again.' },
    NETWORK: { title: 'Connection Error', message: 'Please check your internet connection.' },
    SERVER: { title: 'Server Error', message: 'Server is temporarily unavailable.' }
  }
} as const

// Usage Examples for Different Scenarios
export const LoadingUsageExamples = {
  // Form submission with button state + toast
  formSave: `
    const { showFormSaving } = useProfessionalLoading()
    const { showSuccess, showError } = useQuickAlert()

    const handleSave = async () => {
      try {
        showFormSaving(ERPLoadingMessages.ESTIMATION.saving)
        await saveEstimation(data)
        showSuccess(LoadingToasts.SUCCESS.SAVE.title, LoadingToasts.SUCCESS.SAVE.message)
      } catch (error) {
        showError(LoadingToasts.ERROR.SAVE.title, LoadingToasts.ERROR.SAVE.message)
      }
    }
  `,

  // Data grid refresh
  dataRefresh: `
    const { showDataLoading } = useProfessionalLoading()

    const refreshData = async () => {
      showDataLoading(ERPLoadingMessages.ESTIMATION.loading)
      await fetchEstimations()
      hideLoading()
    }
  `,

  // Modal processing
  modalProcessing: `
    const { showModalProcessing, hideLoading } = useProfessionalLoading()

    const generatePlan = async () => {
      showModalProcessing(ERPLoadingMessages.MACHINE.planning)
      await generateMachinePlan(data)
      hideLoading()
    }
  `,

  // Authentication flow
  authentication: `
    const { showAuthentication, hideLoading } = useProfessionalLoading()

    const signIn = async (credentials) => {
      showAuthentication(ERPLoadingMessages.SYSTEM.authenticating)
      await authenticate(credentials)
      hideLoading()
    }
  `
} as const

// Loading State Manager Class
export class GlobalLoadingManager {
  private static instance: GlobalLoadingManager
  private loadingStates: Map<string, LoadingState> = new Map()

  private constructor() {}

  static getInstance(): GlobalLoadingManager {
    if (!GlobalLoadingManager.instance) {
      GlobalLoadingManager.instance = new GlobalLoadingManager()
    }
    return GlobalLoadingManager.instance
  }

  setLoading(key: string, state: LoadingState): void {
    this.loadingStates.set(key, state)
  }

  getLoading(key: string): LoadingState | undefined {
    return this.loadingStates.get(key)
  }

  isLoading(key: string): boolean {
    return this.loadingStates.get(key)?.isLoading || false
  }

  clearLoading(key: string): void {
    this.loadingStates.delete(key)
  }

  clearAllLoading(): void {
    this.loadingStates.clear()
  }
}

// Export the singleton instance
export const globalLoadingManager = GlobalLoadingManager.getInstance()