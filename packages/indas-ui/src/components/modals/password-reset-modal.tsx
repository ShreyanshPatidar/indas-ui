'use client'

import { useState } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from '@/components/modals/Modal'
import { Input } from '@/components/ui/forms/input'
import { Eye, EyeOff, Lock, Check, X } from '@/lib/icons'
import { useGlobalAlert } from '@/contexts/GlobalAlertContext'

interface PasswordResetModalProps {
  isOpen: boolean
  onClose: () => void
  email: string
  otpCode: string
  companyUsername?: string
  companyPassword?: string
  onSuccess: () => void
}

interface PasswordRequirement {
  label: string
  test: (password: string) => boolean
}

const passwordRequirements: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
  { label: 'Contains uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
  { label: 'Contains lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
  { label: 'Contains number', test: (pwd) => /\d/.test(pwd) },
]

export function PasswordResetModal({
  isOpen,
  onClose,
  email,
  otpCode,
  onSuccess,
}: PasswordResetModalProps) {
  const alerts = useGlobalAlert()
  const [newPassword, setNewPassword] = useState('')
  const [retypePassword, setRetypePassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showRetypePassword, setShowRetypePassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  // Calculate password strength
  const calculatePasswordStrength = (password: string) => {
    let strength = 0
    passwordRequirements.forEach((req) => {
      if (req.test(password)) strength++
    })
    setPasswordStrength(strength)
  }

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500'
    if (passwordStrength <= 3) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStrengthLabel = () => {
    if (passwordStrength <= 1) return 'Weak'
    if (passwordStrength <= 2) return 'Medium'
    return 'Strong'
  }

  const handlePasswordChange = (value: string) => {
    setNewPassword(value)
    calculatePasswordStrength(value)
  }

  // Prevent paste in password fields (security feature)
  const preventPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    alerts.showWarning('Security Notice', 'Pasting passwords is disabled for security reasons. Please type your password.')
  }

  const validateForm = () => {
    // Check minimum password strength (4 requirements now)
    if (passwordStrength < 4) {
      alerts.showError('Weak Password', 'Please meet all password requirements for a strong password.')
      return false
    }

    // Check if passwords match
    if (newPassword !== retypePassword) {
      alerts.showError('Password Mismatch', 'Passwords do not match. Please try again.')
      return false
    }

    return true
  }

  const handleResetPassword = async () => {
    if (!validateForm()) return

    setIsLoading(true)

    try {
      // Call server-side proxy (company credentials read from HttpOnly cookie)
      const response = await fetch('/api/auth/forgot-password-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset', email, otpCode, newPassword })
      })
      const result = await response.json()

      if (result.success) {
        alerts.showSuccess('Password Reset Successful', 'Your password has been reset successfully.')
        onSuccess()
        onClose()
      } else {
        alerts.showError('Reset Failed', result.message || 'Failed to reset password. Please try again.')
      }
    } catch (error) {
      alerts.showError('Error', 'An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setNewPassword('')
      setRetypePassword('')
      setShowNewPassword(false)
      setShowRetypePassword(false)
      setPasswordStrength(0)
      onClose()
    }
  }

  return (
    <Modal open={isOpen} onOpenChange={handleClose}>
      <ModalContent size="sm" className="p-0">
        <ModalHeader className="sr-only">
          <ModalTitle>Reset Password</ModalTitle>
        </ModalHeader>

        <div className="p-4 sm:p-6 max-h-[100dvh] overflow-y-auto">
          {/* Header */}
          <div className="text-center mb-5 sm:mb-6">
            <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 bg-[rgb(var(--color-primary))]/10 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <Lock className="h-6 w-6 sm:h-7 sm:w-7 text-[rgb(var(--color-primary))]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[rgb(var(--fg-default))] mb-2">Create New Password</h2>
            <p className="text-xs sm:text-sm text-[rgb(var(--fg-muted))] break-words">
              Resetting password for <span className="font-medium text-[rgb(var(--fg-default))]">{email}</span>. Your new password must be different from previously used passwords.
            </p>
          </div>

          <div className="space-y-4">
            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-[rgb(var(--fg-default))] mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  onPaste={preventPaste}
                  placeholder="Enter your new password"
                  disabled={isLoading}
                  className="pr-10 h-11 text-base"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-icon))] hover:text-[rgb(var(--fg-default))]"
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[rgb(var(--fg-muted))]">Password strength</span>
                    <span className={`text-xs font-medium ${passwordStrength <= 1 ? 'text-red-600' : passwordStrength <= 2 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {getStrengthLabel()}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-[rgb(var(--bg-hover))] rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                      style={{ width: `${(passwordStrength / 4) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Re-type Password */}
            <div>
              <label htmlFor="retypePassword" className="block text-sm font-medium text-[rgb(var(--fg-default))] mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="retypePassword"
                  type={showRetypePassword ? 'text' : 'password'}
                  value={retypePassword}
                  onChange={(e) => setRetypePassword(e.target.value)}
                  onPaste={preventPaste}
                  placeholder="Re-enter your new password"
                  disabled={isLoading}
                  className="pr-10 h-11 text-base"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowRetypePassword(!showRetypePassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-icon))] hover:text-[rgb(var(--fg-default))]"
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  {showRetypePassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Password Match Indicator */}
              {retypePassword && (
                <div className="mt-2 flex items-center gap-1.5">
                  {newPassword === retypePassword ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-green-600 font-medium">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 text-red-600" />
                      <span className="text-xs text-red-600 font-medium">Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-[rgb(var(--bg-hover))] rounded-lg p-3 sm:p-4 border border-[rgb(var(--bd-default))]">
              <p className="text-sm font-medium text-[rgb(var(--fg-default))] mb-2 sm:mb-3">Password Requirements</p>
              <div className="space-y-2">
                {passwordRequirements.map((req, index) => {
                  const isPassed = req.test(newPassword)
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                        isPassed ? 'bg-green-100' : 'bg-[rgb(var(--bg-hover))]'
                      }`}>
                        {isPassed && <Check className="h-3 w-3 text-green-600" />}
                      </div>
                      <span className={`text-xs ${isPassed ? 'text-green-700' : 'text-[rgb(var(--fg-muted))]'}`}>
                        {req.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 sm:gap-3 mt-5 sm:mt-6">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 rounded-xl px-3 sm:px-4 py-2.5 min-h-[2.75rem] bg-[rgb(var(--bg-surface))] hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--fg-default))] border border-[rgb(var(--bd-default))] transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleResetPassword}
              disabled={isLoading || passwordStrength < 4 || newPassword !== retypePassword || !newPassword || !retypePassword}
              className="flex-1 rounded-xl px-3 sm:px-4 py-2.5 min-h-[2.75rem] bg-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary-dark))] text-white border border-[rgb(var(--color-primary))] transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}
