'use client'

import { useState, useEffect } from 'react'
import { Button, Input, Label, Alert, AlertDescription } from '@/components/ui'
import { Loader2, CheckCircle, AlertCircle, Server, User, Lock, TestTube, Eye, EyeOff } from 'lucide-react'
import { StandardModal } from './StandardModal'
import {
  getGlobalAPIConfig,
  setGlobalAPIConfig,
  clearGlobalAPIConfig,
  isAPIConfigured
} from '@/lib/api'
import { pingAPI } from '@/lib/api'

interface GlobalAPIConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onConfigured?: () => void
}

export function GlobalAPIConfigModal({ isOpen, onClose, onConfigured }: GlobalAPIConfigModalProps) {
  const [baseURL, setBaseURL] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isConfigured, setIsConfigured] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Load existing configuration
      const config = getGlobalAPIConfig()
      setIsConfigured(isAPIConfigured())

      if (config) {
        setBaseURL(config.baseURL)
        setUsername(config.username)
        setPassword(config.password)
      } else {
        // Set default values
        setBaseURL('')
        setUsername('')
        setPassword('')
      }
      setError('')
      setSuccess(false)
      setShowPassword(false)
    }
  }, [isOpen])

  const handleSave = async () => {
    setIsLoading(true)
    setError('')
    setSuccess(false)

    try {
      // Validate inputs
      if (!baseURL.trim()) {
        throw new Error('Base URL is required')
      }
      if (!username.trim()) {
        throw new Error('Username is required')
      }
      if (!password.trim()) {
        throw new Error('Password is required')
      }

      // Set the global configuration
      setGlobalAPIConfig({
        baseURL: baseURL.trim(),
        username: username.trim(),
        password: password.trim()
      })

      setSuccess(true)
      setIsConfigured(true)

      setTimeout(() => {
        onConfigured?.()
        onClose()
      }, 1500)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Configuration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = async () => {
    try {
      clearGlobalAPIConfig()
      setBaseURL('')
      setUsername('')
      setPassword('')
      setSuccess(false)
      setError('')
      setIsConfigured(false)
    } catch (err) {
      setError('Failed to clear configuration')
    }
  }

  const handleTestConnection = async () => {
    if (!baseURL.trim() || !username.trim() || !password.trim()) {
      setError('Please fill in all fields before testing')
      return
    }

    setIsTesting(true)
    setError('')

    try {
      // Temporarily set the configuration for testing
      setGlobalAPIConfig({
        baseURL: baseURL.trim(),
        username: username.trim(),
        password: password.trim()
      })

      // Test the connection
      const isConnected = await pingAPI()

      if (isConnected) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError('Connection test failed - server is not reachable or authentication failed')
      }
    } catch (err) {
      setError('Connection test failed - please check your configuration')
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="Global API Configuration"
      subtitle="Configure base URL and authentication credentials for all API requests"
      size="md"
      badge={isConfigured ? {
        label: 'Configured',
        variant: 'default'
      } : undefined}
      onSave={handleSave}
      onCancel={onClose}
      saveLabel="Save Configuration"
      saving={isLoading}
      footerActions={
        <>
          <Button
            variant="action-secondary"
            onClick={handleTestConnection}
            disabled={isLoading || isTesting || !baseURL.trim() || !username.trim() || !password.trim()}
            icon={TestTube}
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </Button>
          <Button
            variant="action-secondary"
            onClick={handleClear}
            disabled={isLoading || isTesting}
          >
            Clear All
          </Button>
          <Button
            variant="action-save"
            onClick={handleSave}
            disabled={isLoading || isTesting || !baseURL.trim() || !username.trim() || !password.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Configuration'
            )}
          </Button>
        </>
      }
      ariaDescription="Global API configuration for base URL and authentication credentials"
    >
      <div className="space-y-4">
          {isConfigured && (
            <Alert className="border-[rgb(var(--bd-default))] bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                API is currently configured and ready for use.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="baseURL" className="flex items-center gap-2 text-[rgb(var(--fg-default))]">
              <Server className="h-4 w-4 text-[rgb(var(--color-icon))]" />
              Base URL
            </Label>
            <Input
              id="baseURL"
              placeholder="https://api.my-domain.com/"
              value={baseURL}
              onChange={(e) => setBaseURL(e.target.value)}
              disabled={isLoading || isTesting}
              className="bg-[rgb(var(--bg-surface))] border-[rgb(var(--bd-default))] text-[rgb(var(--fg-default))]"
            />
            <p className="text-xs text-[rgb(var(--fg-muted))]">
              The base domain for all API calls (e.g., https://api.my-domain.com/)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="flex items-center gap-2 text-[rgb(var(--fg-default))]">
              <User className="h-4 w-4 text-[rgb(var(--color-icon))]" />
              API Username
            </Label>
            <Input
              id="username"
              placeholder="your-api-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading || isTesting}
              className="bg-[rgb(var(--bg-surface))] border-[rgb(var(--bd-default))] text-[rgb(var(--fg-default))]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2 text-[rgb(var(--fg-default))]">
              <Lock className="h-4 w-4 text-[rgb(var(--color-icon))]" />
              API Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="your-api-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || isTesting}
                className="bg-[rgb(var(--bg-surface))] border-[rgb(var(--bd-default))] text-[rgb(var(--fg-default))]"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-[rgb(var(--bg-subtle))]"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading || isTesting}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-[rgb(var(--color-icon))]" />
                ) : (
                  <Eye className="h-4 w-4 text-[rgb(var(--color-icon))]" />
                )}
              </Button>
            </div>
            <p className="text-xs text-[rgb(var(--fg-muted))]">
              Credentials for Basic Authentication (stored securely in session)
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="border-[rgb(var(--bd-default))]">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-[rgb(var(--bd-default))] bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Configuration saved successfully!
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-[rgb(var(--bg-subtle))] p-3 rounded-md text-xs border border-[rgb(var(--bd-default))]">
            <h4 className="font-medium mb-2 text-[rgb(var(--fg-default))]">Usage Information:</h4>
            <ul className="space-y-1 text-[rgb(var(--fg-muted))]">
              <li>• All API calls will use: BASE_URL + "api/..."</li>
              <li>• Authentication: Basic Auth with provided credentials</li>
              <li>• Configuration applies to entire application</li>
              <li>• Update once, use everywhere</li>
            </ul>
          </div>
        </div>
    </StandardModal>
  )
}