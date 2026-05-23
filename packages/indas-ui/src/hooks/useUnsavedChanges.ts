import { useEffect, useRef, useMemo } from 'react'

/**
 * Hook to detect unsaved changes in a form or modal
 * Compares current data with initial data to determine if changes exist
 *
 * @param currentData - Current form/modal data
 * @param isOpen - Whether the modal/form is open
 * @returns boolean indicating if there are unsaved changes
 *
 * @example
 * ```tsx
 * const hasUnsavedChanges = useUnsavedChanges(formData, isModalOpen)
 * ```
 */
export function useUnsavedChanges<T extends Record<string, any>>(
  currentData: T,
  isOpen: boolean = true
): boolean {
  // Store initial data on mount/open
  const initialDataRef = useRef<T | null>(null)

  // Reset initial data when modal opens
  useEffect(() => {
    if (isOpen && !initialDataRef.current) {
      initialDataRef.current = JSON.parse(JSON.stringify(currentData))
    }

    // Clear on close
    if (!isOpen) {
      initialDataRef.current = null
    }
  }, [isOpen])

  // Detect changes by comparing current data with initial data
  const hasChanges = useMemo(() => {
    if (!initialDataRef.current) return false

    return JSON.stringify(currentData) !== JSON.stringify(initialDataRef.current)
  }, [currentData])

  return hasChanges
}

/**
 * Hook to prevent data loss when user tries to leave page/close tab
 * Shows browser confirmation dialog when unsaved changes exist
 *
 * @param hasUnsavedChanges - Boolean indicating if there are unsaved changes
 * @param isEnabled - Whether to enable the protection (default: true)
 *
 * @example
 * ```tsx
 * usePreventDataLoss(hasUnsavedChanges, isModalOpen)
 * ```
 */
export function usePreventDataLoss(
  hasUnsavedChanges: boolean,
  isEnabled: boolean = true
): void {
  useEffect(() => {
    if (!isEnabled || !hasUnsavedChanges) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        // Modern browsers require returnValue to be set
        e.returnValue = ''
        return ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges, isEnabled])
}

/**
 * Combined hook that provides both unsaved changes detection and data loss prevention
 *
 * @param currentData - Current form/modal data
 * @param isOpen - Whether the modal/form is open
 * @returns boolean indicating if there are unsaved changes
 *
 * @example
 * ```tsx
 * const hasUnsavedChanges = useFormProtection(formData, isModalOpen)
 * ```
 */
export function useFormProtection<T extends Record<string, any>>(
  currentData: T,
  isOpen: boolean = true
): boolean {
  const hasUnsavedChanges = useUnsavedChanges(currentData, isOpen)
  usePreventDataLoss(hasUnsavedChanges, isOpen)

  return hasUnsavedChanges
}
