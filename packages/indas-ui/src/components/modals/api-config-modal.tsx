'use client'

import { useState, useEffect } from 'react'
import { Button, Input, Label, Alert, AlertDescription } from '@/components/ui'
import { Loader2, CheckCircle, AlertCircle, TestTube } from 'lucide-react'
import { StandardModal } from './StandardModal'
import { getAuthAPIConfig, setAuthAPIConfig, clearAuthAPIConfig } from '@/lib/api'

interface APIConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onConfigured?: () => void
}

export function APIConfigModal({ isOpen, onClose, onConfigured }: APIConfigModalProps) {
  const [baseURL, setBaseURL] = useState('')
  const [authEndpoint, setAuthEndpoint] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Load existing configuration
      const config = getAuthAPIConfig()
      if (config) {
        setBaseURL(config.baseURL)
        setAuthEndpoint(config.authEndpoint || '/api/GetLoginDetails')
      } else {
        // Set default values
        setBaseURL('')
        setAuthEndpoint('/api/GetLoginDetails')
      }
      setError('')
      setSuccess(false)
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
      if (!authEndpoint.trim()) {
        throw new Error('Auth endpoint is required')
      }

      // Test the configuration by making a request to the configure endpoint
      const response = await fetch('/api/auth/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          baseURL: baseURL.trim(),
          authEndpoint: authEndpoint.trim()
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to configure API')
      }

      setSuccess(true)
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
      clearAuthAPIConfig()
      setBaseURL('')
      setAuthEndpoint('/api/GetLoginDetails')
      setSuccess(false)
      setError('')
    } catch (err) {
      setError('Failed to clear configuration')
    }
  }

  const handleTestConnection = async () => {
    if (!baseURL.trim()) {
      setError('Please enter a base URL first')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const testUrl = baseURL.trim().replace(/\/$/, '') + '/api/test'
      const response = await fetch(testUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(`Server responded with ${response.status}: ${response.statusText}`)
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Connection test timed out')
      } else {
        setError('Unable to connect to server')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="Configure API Authentication"
      subtitle="Set up the base URL and authentication endpoint for API requests"
      size="md"
      onSave={handleSave}
      onCancel={onClose}
      saveLabel="Save Configuration"
      saving={isLoading}
      footerActions={
        <>
          <Button
            variant="action-secondary"
            onClick={handleTestConnection}
            disabled={isLoading || !baseURL.trim()}
            icon={TestTube}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test Connection'}
          </Button>
          <Button
            variant="action-secondary"
            onClick={handleClear}
            disabled={isLoading}
          >
            Clear
          </Button>
          <Button
            variant="action-save"
            onClick={handleSave}
            disabled={isLoading || !baseURL.trim() || !authEndpoint.trim()}
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
      ariaDescription="Configure API authentication settings including base URL and authentication endpoint"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="baseURL" className="text-[rgb(var(--fg-default))]">
            Base URL
          </Label>
          <Input
            id="baseURL"
            placeholder="https://your-api-domain.com"
            value={baseURL}
            onChange={(e) => setBaseURL(e.target.value)}
            disabled={isLoading}
            className="bg-[rgb(var(--bg-surface))] border-[rgb(var(--bd-default))] text-[rgb(var(--fg-default))]"
          />
          <p className="text-xs text-[rgb(var(--fg-muted))]">
            The base URL of your API server (e.g., https://api.indusanalytics.co.in)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="authEndpoint" className="text-[rgb(var(--fg-default))]">
            Authentication Endpoint
          </Label>
          <Input
            id="authEndpoint"
            placeholder="/api/GetLoginDetails"
            value={authEndpoint}
            onChange={(e) => setAuthEndpoint(e.target.value)}
            disabled={isLoading}
            className="bg-[rgb(var(--bg-surface))] border-[rgb(var(--bd-default))] text-[rgb(var(--fg-default))]"
          />
          <p className="text-xs text-[rgb(var(--fg-muted))]">
            The endpoint path for authentication (default: /api/GetLoginDetails)
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
      </div>
    </StandardModal>
  )
}