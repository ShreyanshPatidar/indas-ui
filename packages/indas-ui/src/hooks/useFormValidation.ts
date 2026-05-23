'use client'

import { useState, useCallback, useMemo, useRef } from 'react'

// ─── Types ───────────────────────────────────────────────────────

interface FieldRule {
  /** Field is required (non-empty, non-null, non-undefined) */
  required?: boolean
  /** Custom validation — return error message string, or true if valid */
  validate?: (value: any, formData: Record<string, any>) => true | string
}

type ValidationRules = Record<string, FieldRule>

interface UseFormValidationReturn {
  /**
   * Run full validation. Flips showErrors to true so fields highlight.
   * Returns { isValid, errorMessages }.
   */
  validate: (formData: Record<string, any>) => { isValid: boolean; errorMessages: string[] }

  /**
   * Check if a single field is invalid RIGHT NOW (reactive to current value).
   * Use on Input: `error={fieldError('length', planningData.length)}`
   * Use on Dropdown: `error={fieldError('gsm', planningData.gsm)}`
   * Returns false until showErrors is true (first save attempt).
   */
  fieldError: (fieldName: string, currentValue: any) => boolean

  /**
   * Returns label className — adds red text when field is invalid.
   * Use: `className={fieldLabelClass('length', planningData.length, 'text-xs font-medium')}`
   */
  fieldLabelClass: (fieldName: string, currentValue: any, baseClass?: string) => string

  /** Whether validation has fired at least once (save attempted) */
  showErrors: boolean

  /** Manually set showErrors (e.g., parent page sets it on save) */
  setShowErrors: (show: boolean) => void

  /** Reset — call on modal close or form reset */
  clearErrors: () => void
}

// ─── Helpers ─────────────────────────────────────────────────────

function isValueEmpty(value: any): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === 'string' && value.trim() === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  return false
}

function checkField(
  fieldName: string,
  currentValue: any,
  rules: ValidationRules,
  formData?: Record<string, any>
): boolean {
  const rule = rules[fieldName]
  if (!rule) return false

  if (rule.required && isValueEmpty(currentValue)) return true

  if (rule.validate) {
    const result = rule.validate(currentValue, formData || {})
    if (result !== true) return true
  }

  return false
}

// ─── Hook ────────────────────────────────────────────────────────

export function useFormValidation(rules: ValidationRules): UseFormValidationReturn {
  const [showErrors, setShowErrors] = useState(false)
  const rulesRef = useRef(rules)
  rulesRef.current = rules

  const validate = useCallback((formData: Record<string, any>) => {
    const errorMessages: string[] = []
    const currentRules = rulesRef.current

    for (const [fieldName, rule] of Object.entries(currentRules)) {
      const value = formData[fieldName]

      if (rule.required && isValueEmpty(value)) {
        errorMessages.push(fieldName)
        continue
      }

      if (rule.validate) {
        const result = rule.validate(value, formData)
        if (result !== true) {
          errorMessages.push(result)
        }
      }
    }

    setShowErrors(true)
    return { isValid: errorMessages.length === 0, errorMessages }
  }, [])

  const fieldError = useCallback((fieldName: string, currentValue: any): boolean => {
    if (!showErrors) return false
    return checkField(fieldName, currentValue, rulesRef.current)
  }, [showErrors])

  const fieldLabelClass = useCallback((
    fieldName: string,
    currentValue: any,
    baseClass = 'text-xs font-medium'
  ): string => {
    if (!showErrors) return baseClass
    const invalid = checkField(fieldName, currentValue, rulesRef.current)
    return invalid ? `${baseClass} text-[rgb(var(--color-error))]` : baseClass
  }, [showErrors])

  const clearErrors = useCallback(() => {
    setShowErrors(false)
  }, [])

  return { validate, fieldError, fieldLabelClass, showErrors, setShowErrors, clearErrors }
}
