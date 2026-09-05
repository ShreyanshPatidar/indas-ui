'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  AlertCircle,
  Loader2,
  Shield,
  X,
  Clock
} from '@/lib/icons'
import { Loading } from '../ui/overlays/loading'

// Design Tokens
export const ALERT_TOKENS = {
  colors: {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      title: 'text-green-900',
      description: 'text-green-700',
      primaryButton: 'bg-green-600 hover:bg-green-700 text-white',
      secondaryButton: 'bg-green-100 hover:bg-green-200 text-green-700'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      title: 'text-red-900',
      description: 'text-red-700',
      primaryButton: 'bg-red-600 hover:bg-red-700 text-white',
      secondaryButton: 'bg-red-100 hover:bg-red-200 text-red-700'
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: 'text-amber-600',
      title: 'text-amber-900',
      description: 'text-amber-700',
      primaryButton: 'bg-amber-600 hover:bg-amber-700 text-white',
      secondaryButton: 'bg-amber-100 hover:bg-amber-200 text-amber-700'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-900',
      description: 'text-blue-700',
      primaryButton: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondaryButton: 'bg-blue-100 hover:bg-blue-200 text-blue-700'
    },
    confirmation: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      icon: 'text-gray-600',
      title: 'text-gray-900',
      description: 'text-gray-700',
      primaryButton: 'bg-gray-900 hover:bg-gray-800 text-white',
      secondaryButton: 'bg-gray-100 hover:bg-gray-200 text-gray-700'
    },
    critical: {
      bg: 'bg-red-100',
      border: 'border-red-300',
      icon: 'text-red-700',
      title: 'text-red-900',
      description: 'text-red-800',
      primaryButton: 'bg-red-700 hover:bg-red-800 text-white',
      secondaryButton: 'bg-red-200 hover:bg-red-300 text-red-800'
    },
    loading: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-900',
      description: 'text-blue-700',
      primaryButton: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondaryButton: 'bg-blue-100 hover:bg-blue-200 text-blue-700'
    }
  },
  spacing: {
    padding: 'p-6',
    gap: 'gap-4',
    iconSize: 'w-8 h-8',
    buttonPadding: 'px-4 py-2',
    borderRadius: 'rounded-xl'
  },
  typography: {
    title: 'text-lg font-semibold',
    description: 'text-sm leading-relaxed',
    button: 'text-sm font-medium'
  },
  animations: {
    overlay: 'transition-all duration-200 ease-out data-[state=open]:opacity-100 data-[state=closed]:opacity-0',
    content: 'transition-all duration-200 ease-out data-[state=open]:opacity-100 data-[state=open]:scale-100 data-[state=closed]:opacity-0 data-[state=closed]:scale-95'
  }
}

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirmation' | 'critical' | 'loading'

export interface AlertAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

export interface ModalAlertProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: AlertType
  title: string
  description: string
  actions?: AlertAction[]
  showCloseButton?: boolean
  autoClose?: number // Auto-close after N milliseconds
  preventClose?: boolean // Prevent closing for critical alerts
  className?: string
  // Accessibility
  'aria-labelledby'?: string
  'aria-describedby'?: string
}

const ALERT_ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  confirmation: HelpCircle,
  critical: AlertCircle,
  loading: Loader2
} as const

export function ModalAlert({
  open,
  onOpenChange,
  type,
  title,
  description,
  actions = [],
  showCloseButton = true,
  autoClose,
  preventClose = false,
  className,
  'aria-labelledby': ariaLabelledby,
  'aria-describedby': ariaDescribedby,
  ...props
}: ModalAlertProps) {
  const colors = ALERT_TOKENS.colors[type]
  const IconComponent = ALERT_ICONS[type]
  const isLoading = type === 'loading'

  // Auto-close functionality
  React.useEffect(() => {
    if (autoClose && open && !preventClose) {
      const timer = setTimeout(() => {
        onOpenChange(false)
      }, autoClose)
      return () => clearTimeout(timer)
    }
  }, [autoClose, open, onOpenChange, preventClose])

  // Default actions if none provided
  const defaultActions: AlertAction[] = React.useMemo(() => {
    if (actions.length > 0) return actions

    switch (type) {
      case 'confirmation':
        return [
          { label: 'Cancel', onClick: () => onOpenChange(false), variant: 'secondary' },
          { label: 'Confirm', onClick: () => onOpenChange(false), variant: 'primary' }
        ]
      case 'error':
      case 'critical':
        return [
          { label: 'Try Again', onClick: () => onOpenChange(false), variant: 'secondary' },
          { label: 'OK', onClick: () => onOpenChange(false), variant: 'primary' }
        ]
      case 'warning':
        return [
          { label: 'Cancel', onClick: () => onOpenChange(false), variant: 'secondary' },
          { label: 'Continue', onClick: () => onOpenChange(false), variant: 'primary' }
        ]
      case 'loading':
        return [] // No actions for loading state
      default:
        return [
          { label: 'OK', onClick: () => onOpenChange(false), variant: 'primary' }
        ]
    }
  }, [actions, type, onOpenChange])

  // Forward Radix's open-change events to the parent. Radix calls this with
  // a boolean (true/false). We honor false-to-close unless preventClose is set.
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) return // ignore Radix-driven open events; we control opening
    if (preventClose || isLoading) return
    onOpenChange(false)
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm',
            ALERT_TOKENS.animations.overlay
          )}
        />

        {/* Content */}
        <DialogPrimitive.Content
          className={cn(
            'fixed left-[50%] top-[50%] z-[201] grid w-[calc(100%-2rem)] max-w-md translate-x-[-50%] translate-y-[-50%] border shadow-2xl rounded-2xl overflow-hidden',
            colors.bg,
            colors.border,
            ALERT_TOKENS.spacing.borderRadius,
            ALERT_TOKENS.animations.content,
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            type === 'success' && 'focus:ring-green-500',
            type === 'error' && 'focus:ring-red-500',
            type === 'warning' && 'focus:ring-amber-500',
            type === 'info' && 'focus:ring-blue-500',
            type === 'confirmation' && 'focus:ring-gray-500',
            type === 'critical' && 'focus:ring-red-500',
            type === 'loading' && 'focus:ring-blue-500',
            className
          )}
          aria-labelledby={ariaLabelledby || 'alert-title'}
          aria-describedby={undefined}
          {...props}
        >
          {/* Required DialogTitle for accessibility */}
          <DialogPrimitive.Title className="sr-only">
            {title}
          </DialogPrimitive.Title>

          <div className={cn(ALERT_TOKENS.spacing.padding)}>
            {/* Close Button — uses direct onOpenChange call, not DialogPrimitive.Close */}
            {showCloseButton && !preventClose && !isLoading && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onOpenChange(false) }}
                className={cn(
                  'absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none',
                  colors.icon
                )}
                aria-label="Close alert"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            )}

            {/* Main Content */}
            <div className={cn('flex', ALERT_TOKENS.spacing.gap)}>
              {/* Icon */}
              <div className="flex-shrink-0">
                {isLoading ? (
                  // Our custom bouncing dots animation for loading
                  <div className="w-8 h-8 flex items-center justify-center">
                    <Loading variant="dots" size="md" color={colors.icon} />
                  </div>
                ) : (
                  <IconComponent
                    className={cn(
                      ALERT_TOKENS.spacing.iconSize,
                      colors.icon
                    )}
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Text Content */}
              <div className="flex-1 space-y-2">
                <h4
                  className={cn(
                    ALERT_TOKENS.typography.title,
                    colors.title
                  )}
                >
                  {title}
                </h4>

                <p
                  id="alert-description"
                  className={cn(
                    ALERT_TOKENS.typography.description,
                    colors.description,
                    'break-words whitespace-pre-line'
                  )}
                >
                  {description}
                </p>

                {/* Auto-close timer display */}
                {autoClose && open && !preventClose && (
                  <div className="flex items-center gap-1 text-xs opacity-70">
                    <Clock className="w-3 h-3" />
                    <span>Auto-closing in {Math.ceil(autoClose / 1000)}s</span>
                  </div>
                )}

                {/* Actions */}
                {defaultActions.length > 0 && (
                  <div className="flex gap-2 pt-4 justify-end">
                    {defaultActions.map((action, index) => (
                      <button
                        type="button"
                        key={index}
                        onClick={(e) => {
                          // Always close the dialog on button click. Some
                          // actions provide their own onClick; run that
                          // first, then dismiss. Calling onOpenChange
                          // directly avoids relying on DialogPrimitive.Close
                          // wrapping which has been unreliable when the
                          // parent re-renders during click handling.
                          e.stopPropagation()
                          if (action.onClick) action.onClick()
                          if (!preventClose && !isLoading) onOpenChange(false)
                        }}
                        disabled={action.disabled || isLoading}
                        className={cn(
                          'inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
                          ALERT_TOKENS.spacing.buttonPadding,
                          ALERT_TOKENS.typography.button,
                          action.variant === 'primary'
                            ? colors.primaryButton
                            : colors.secondaryButton
                        )}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

// Preset Alert Components for Common Use Cases
export const SuccessAlert = (props: Omit<ModalAlertProps, 'type'>) => (
  <ModalAlert type="success" {...props} />
)

export const ErrorAlert = (props: Omit<ModalAlertProps, 'type'>) => (
  <ModalAlert type="error" {...props} />
)

export const WarningAlert = (props: Omit<ModalAlertProps, 'type'>) => (
  <ModalAlert type="warning" {...props} />
)

export const InfoAlert = (props: Omit<ModalAlertProps, 'type'>) => (
  <ModalAlert type="info" {...props} />
)

export const ConfirmationAlert = (props: Omit<ModalAlertProps, 'type'>) => (
  <ModalAlert type="confirmation" {...props} />
)

export const CriticalAlert = (props: Omit<ModalAlertProps, 'type'>) => (
  <ModalAlert type="critical" preventClose {...props} />
)

export const LoadingAlert = (props: Omit<ModalAlertProps, 'type'>) => (
  <ModalAlert type="loading" preventClose showCloseButton={false} {...props} />
)

// Hook for managing alert state
export function useModalAlert() {
  const [alert, setAlert] = React.useState<{
    open: boolean
    type: AlertType
    title: string
    description: string
    actions?: AlertAction[]
    autoClose?: number
  }>({
    open: false,
    type: 'info',
    title: '',
    description: ''
  })

  const showAlert = React.useCallback((params: Omit<typeof alert, 'open'>) => {
    setAlert({ ...params, open: true })
  }, [])

  const hideAlert = React.useCallback(() => {
    setAlert(prev => ({ ...prev, open: false }))
  }, [])

  const showSuccess = React.useCallback((title: string, description: string, autoClose = 3000) => {
    showAlert({ type: 'success', title, description, autoClose })
  }, [showAlert])

  const showError = React.useCallback((title: string, description: string) => {
    showAlert({ type: 'error', title, description })
  }, [showAlert])

  const showWarning = React.useCallback((title: string, description: string, actions?: AlertAction[]) => {
    showAlert({ type: 'warning', title, description, actions })
  }, [showAlert])

  const showInfo = React.useCallback((title: string, description: string, autoClose?: number) => {
    showAlert({ type: 'info', title, description, autoClose })
  }, [showAlert])

  const showConfirmation = React.useCallback((
    title: string,
    description: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    showAlert({
      type: 'confirmation',
      title,
      description,
      actions: [
        {
          label: 'Cancel',
          onClick: () => {
            onCancel?.()
            hideAlert()
          },
          variant: 'secondary'
        },
        {
          label: 'Confirm',
          onClick: () => {
            hideAlert()
            onConfirm()
          },
          variant: 'primary'
        }
      ]
    })
  }, [showAlert, hideAlert])

  const showLoading = React.useCallback((title: string, description: string) => {
    showAlert({ type: 'loading', title, description })
  }, [showAlert])

  // Stable AlertComponent reference. Declaring it inline as `() => (...)`
  // creates a new function identity each render → React remounts the whole
  // modal tree on every render → click handlers don't fire reliably while
  // the parent is re-rendering frequently. Wrapping in useCallback keeps
  // the reference stable.
  const AlertComponent = React.useCallback(() => (
    <ModalAlert
      open={alert.open}
      onOpenChange={hideAlert}
      type={alert.type}
      title={alert.title}
      description={alert.description}
      actions={alert.actions}
      autoClose={alert.autoClose}
    />
  ), [alert.open, alert.type, alert.title, alert.description, alert.actions, alert.autoClose, hideAlert])

  return {
    alert,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirmation,
    showLoading,
    AlertComponent,
  }
}