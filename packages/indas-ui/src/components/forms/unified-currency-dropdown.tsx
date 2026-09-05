'use client'

import * as React from 'react'
import { Check, ChevronDown, RefreshCw, Calculator, AlertTriangle, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dropdown } from '@/components'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { Label } from '@/components/ui'
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/ui'
import { Badge } from '@/components/ui'
import { Alert, AlertDescription } from '@/components/ui'
import { useCurrency, CurrencyCode } from '@/contexts/CurrencyContext'

export interface UnifiedCurrencyDropdownProps {
  value?: CurrencyCode
  onValueChange?: (currency: CurrencyCode) => void
  amount?: number
  onAmountChange?: (amount: number) => void
  showRates?: boolean
  showConverter?: boolean
  allowManualRates?: boolean
  className?: string
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'compact' | 'detailed'
  validation?: {
    min?: number
    max?: number
    required?: boolean
    customValidator?: (value: CurrencyCode) => string | null
  }
  error?: string
}

export function UnifiedCurrencyDropdown({
  value,
  onValueChange,
  amount = 0,
  onAmountChange,
  showRates = true,
  showConverter = true,
  allowManualRates = true,
  className,
  label = 'Currency',
  placeholder = 'Select currency',
  disabled = false,
  required = false,
  size = 'md',
  variant = 'default',
  validation,
  error
}: UnifiedCurrencyDropdownProps) {
  const {
    selectedCurrency,
    baseCurrency,
    exchangeRates,
    availableCurrencies,
    isLoading,
    lastUpdated,
    error: contextError,
    setCurrency,
    refreshRates,
    convertAmount,
    formatCurrency,
    getCurrencyInfo
  } = useCurrency()

  const [showConverterModal, setShowConverterModal] = React.useState(false)
  const [validationError, setValidationError] = React.useState<string | null>(null)
  const pendingModalRef = React.useRef(false)

  // Use context currency if no value prop provided
  const currentCurrency = value || selectedCurrency

  // Validation function
  const validateCurrency = React.useCallback((currency: CurrencyCode) => {
    if (validation?.required && !currency) {
      return 'Currency selection is required'
    }

    if (validation?.customValidator) {
      const customError = validation.customValidator(currency)
      if (customError) return customError
    }

    return null
  }, [validation])

  // Validate on currency change
  React.useEffect(() => {
    const error = validateCurrency(currentCurrency)
    setValidationError(error)
  }, [currentCurrency, validateCurrency])

  // Currency options for the dropdown - use availableCurrencies directly
  const currencyOptions = React.useMemo(() => {
    const currencies = availableCurrencies
    return currencies.map(currency => {
      // Include exchange rate in description along with currency name
      const rate = exchangeRates[currency.code]
      let description = currency.name

      // Add exchange rate if available (reversed: 1 USD = X INR)
      if (rate && currency.code !== baseCurrency) {
        const reversedRate = (1 / rate).toFixed(4)
        description = `${currency.name} (1 ${currency.code} = ${reversedRate} ${baseCurrency})`
      } else if (currency.code === baseCurrency) {
        description = `${currency.name} (Base Currency)`
      }

      return {
        value: currency.code,
        label: `${currency.symbol} ${currency.code}`,
        description: description
      }
    })
  }, [availableCurrencies, exchangeRates, baseCurrency]) // Update when rates change

  // Get converted amount for display (simplified to avoid re-renders)
  const convertedAmount = React.useMemo(() => {
    if (!amount || currentCurrency === baseCurrency) return amount
    // Use a simple calculation to avoid context function dependency
    const rate = exchangeRates[currentCurrency]
    return rate ? amount * rate : amount
  }, [amount, currentCurrency, baseCurrency, exchangeRates])

  const handleCurrencyChange = React.useCallback((newCurrency: string) => {
    const currencyCode = newCurrency as CurrencyCode
    // Prevent unnecessary updates if currency hasn't changed
    if (currencyCode === currentCurrency) return

    if (onValueChange) {
      onValueChange(currencyCode)
    } else {
      // Update context if no external handler
      setCurrency(currencyCode)
    }
  }, [onValueChange, setCurrency, currentCurrency])

  const getCurrentCurrencyInfo = () => {
    return getCurrencyInfo(currentCurrency)
  }

  const getRateInfo = () => {
    if (currentCurrency === baseCurrency) return null
    const rate = exchangeRates[currentCurrency]
    return rate ? { rate, provider: 'live' } : null
  }

  const currentCurrencyInfo = getCurrentCurrencyInfo()
  const rateInfo = getRateInfo()

  return (
    <div className={cn('space-y-1', className)}>
      {label && variant !== 'compact' && (
        <Label className="font-medium text-[rgb(var(--fg-default))]">
          {label}
          {required && <span className="text-[rgb(var(--color-error))] ml-1">*</span>}
        </Label>
      )}

      <div className="space-y-1">
        {/* Currency Selection */}
        <Dropdown
          value={currentCurrency}
          onValueChange={handleCurrencyChange}
          options={currencyOptions}
          placeholder={placeholder}
          searchable={true}
          clearable={false}
          disabled={disabled}
          autoWidth={true}
          variant={variant}
          size={size}
          customFooter={
            <div className="border-t p-2">
              <div className="flex items-center justify-between">
                {(showConverter || allowManualRates) && (
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      pendingModalRef.current = true
                      setTimeout(() => {
                        if (pendingModalRef.current) {
                          pendingModalRef.current = false
                          setShowConverterModal(true)
                        }
                      }, 100)
                    }}
                    className="inline-flex items-center h-6 px-2 text-xs rounded-md text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-hover))] transition-colors"
                  >
                    <Calculator className="h-3 w-3 mr-1" />
                    Currency Hedging
                  </button>
                )}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    refreshRates()
                  }}
                  disabled={isLoading}
                  className="inline-flex items-center h-6 px-2 text-xs rounded-md text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-hover))] transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={cn('h-3 w-3 mr-1', isLoading && 'animate-spin')} />
                  Refresh
                </button>
              </div>
            </div>
          }
        />

        {/* Rate Information - Removed: Now shown inside dropdown options */}

        {/* Amount Display */}
        {amount > 0 && variant === 'detailed' && (
          <div className="bg-[rgb(var(--bg-subtle))] rounded-lg p-3 border border-[rgb(var(--bd-default))]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-[rgb(var(--fg-muted))]">Amount in {baseCurrency}:</span>
                <div className="font-medium text-[rgb(var(--fg-default))]">{formatCurrency(amount, baseCurrency)}</div>
              </div>
              {currentCurrency !== baseCurrency && (
                <div className="text-right">
                  <span className="text-sm text-[rgb(var(--fg-muted))]">Converted to {currentCurrency}:</span>
                  <div className="font-medium text-[rgb(var(--color-primary))]">
                    {formatCurrency(convertedAmount, currentCurrency)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Compact Rate Display - Removed: Now shown inside dropdown options */}

        {/* Error Display */}
        {contextError && variant !== 'compact' && (
          <Alert className="py-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {contextError}. Using cached or fallback rates.
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Error Display */}
        {(validationError || error) && (
          <div className="text-[rgb(var(--color-error))] text-xs mt-1">
            {validationError || error}
          </div>
        )}
      </div>

      {/* Currency Converter Modal */}
      {showConverterModal && (
        <CurrencyConverterModal
          isOpen={showConverterModal}
          onClose={() => setShowConverterModal(false)}
          allowManualRates={allowManualRates}
        />
      )}
    </div>
  )
}

interface CurrencyConverterModalProps {
  isOpen: boolean
  onClose: () => void
  allowManualRates: boolean
}

function CurrencyConverterModal({
  isOpen,
  onClose,
  allowManualRates
}: CurrencyConverterModalProps) {
  const {
    baseCurrency,
    availableCurrencies,
    convertAmount,
    formatCurrency,
    setManualRate,
    removeManualRate,
    isManualRate
  } = useCurrency()

  const [amount, setAmount] = React.useState<string>('1000')
  const [fromCurrency, setFromCurrency] = React.useState<CurrencyCode>(baseCurrency)
  const [toCurrency, setToCurrency] = React.useState<CurrencyCode>(baseCurrency === 'INR' ? 'USD' : 'INR')
  const [manualRateInput, setManualRateInput] = React.useState<string>('')
  const [useManualRate, setUseManualRate] = React.useState(false)
  const [result, setResult] = React.useState<{
    amount: number
    fromCurrency: CurrencyCode
    toCurrency: CurrencyCode
    convertedAmount: number
    rate: number
    timestamp: Date
    isManualRate: boolean
  } | null>(null)

  const currencyOptions = availableCurrencies.map(currency => ({
    value: currency.code,
    label: `${currency.flag} ${currency.code} - ${currency.name}`
  }))

  const handleConvert = React.useCallback(() => {
    const numAmount = parseFloat(amount)
    const numManualRate = useManualRate ? parseFloat(manualRateInput) : undefined

    if (isNaN(numAmount) || numAmount <= 0) return
    if (useManualRate && (isNaN(numManualRate!) || numManualRate! <= 0)) return

    if (useManualRate && numManualRate) {
      // Set manual rate in context
      setManualRate(fromCurrency, toCurrency, numManualRate)
    } else {
      // Remove manual rate if not using
      removeManualRate(fromCurrency, toCurrency)
    }

    const convertedAmount = useManualRate && numManualRate
      ? numAmount * numManualRate
      : convertAmount(numAmount, fromCurrency, toCurrency)

    const rate = useManualRate && numManualRate
      ? numManualRate
      : convertedAmount / numAmount

    setResult({
      amount: numAmount,
      fromCurrency,
      toCurrency,
      convertedAmount,
      rate,
      timestamp: new Date(),
      isManualRate: useManualRate
    })
  }, [amount, fromCurrency, toCurrency, manualRateInput, useManualRate, convertAmount, setManualRate, removeManualRate])

  React.useEffect(() => {
    if (amount && fromCurrency && toCurrency) {
      handleConvert()
    }
  }, [handleConvert])

  // Check if there's already a manual rate set
  React.useEffect(() => {
    const hasManualRate = isManualRate(fromCurrency, toCurrency)
    setUseManualRate(hasManualRate)
  }, [fromCurrency, toCurrency, isManualRate])

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <ModalContent size="lg">
        <ModalHeader>
          <ModalTitle>Currency Converter</ModalTitle>
        </ModalHeader>

        <div className="space-y-6">
          {/* Amount Input */}
          <div>
            <Label>Amount</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="0"
              step="0.01"
            />
          </div>

        {/* Currency Selection */}
        <div className="grid grid-cols-2 gap-4 items-end">
          <div>
            <Label>From Currency</Label>
            <Dropdown
              value={fromCurrency}
              onValueChange={(value) => setFromCurrency(value as CurrencyCode)}
              options={currencyOptions}
              searchable={true}
            />
          </div>

          {/* Swap Button */}
          <div className="flex justify-center pb-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const temp = fromCurrency
                setFromCurrency(toCurrency)
                setToCurrency(temp)
              }}
              className="h-8 w-8 p-0 rounded-full"
              title="Swap currencies"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m0-4l-4-4" />
              </svg>
            </Button>
          </div>

          <div>
            <Label>To Currency</Label>
            <Dropdown
              value={toCurrency}
              onValueChange={(value) => setToCurrency(value as CurrencyCode)}
              options={currencyOptions}
              searchable={true}
            />
          </div>
        </div>

        {/* Manual Rate Option */}
        {allowManualRates && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="useManualRate"
                checked={useManualRate}
                onChange={(e) => setUseManualRate(e.target.checked)}
                className="rounded-lg border-[rgb(var(--bd-default))]"
              />
              <Label htmlFor="useManualRate" className="text-sm">
                Use manual exchange rate (for hedged scenarios)
              </Label>
            </div>

            {useManualRate && (
              <div>
                <Label>Manual Exchange Rate</Label>
                <Input
                  type="number"
                  value={manualRateInput}
                  onChange={(e) => setManualRateInput(e.target.value)}
                  placeholder={`1 ${fromCurrency} = ? ${toCurrency}`}
                  min="0"
                  step="0.0001"
                />
              </div>
            )}
          </div>
        )}

        {/* Conversion Result */}
        {result && (
          <div className="bg-[rgb(var(--color-primary))]/10 rounded-lg p-4 border border-[rgb(var(--color-primary))]/20">
            <div className="text-center space-y-2">
              <div className="text-lg font-semibold text-[rgb(var(--fg-default))]">
                {formatCurrency(result.amount, result.fromCurrency)}
                <span className="mx-3 text-[rgb(var(--fg-muted))]">=</span>
                {formatCurrency(result.convertedAmount, result.toCurrency)}
              </div>

              <div className="text-sm text-[rgb(var(--fg-muted))]">
                Exchange Rate: 1 {result.fromCurrency} = {result.rate.toFixed(6)} {result.toCurrency}
                {result.isManualRate && (
                  <Badge variant="outline" className="ml-2">Manual Rate</Badge>
                )}
              </div>

              <div className="text-xs text-[rgb(var(--fg-muted))]">
                {result.timestamp.toLocaleString()}
              </div>
            </div>
          </div>
        )}
        </div>
      </ModalContent>
    </Modal>
  )
}