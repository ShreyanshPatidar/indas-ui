'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
// Dynamic currency type based on API response
export type CurrencyCode = string

export interface CurrencyInfo {
  code: string
  name: string
  symbol: string
  flag: string
  decimal: number
}

export interface ExchangeRates {
  [key: string]: number
}

// Resolve symbol from Intl API — no hardcoding
export function getSymbolForCode(code: string): string {
  try {
    const parts = new Intl.NumberFormat('en', { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' }).formatToParts(0)
    return parts.find(p => p.type === 'currency')?.value || code
  } catch {
    return code
  }
}

// Build CurrencyInfo from API code + name — everything derived, nothing hardcoded
function buildCurrencyInfo(code: string, name: string): CurrencyInfo {
  const zeroDecimals = new Set(['JPY', 'KRW', 'HUF', 'ISK', 'IDR'])
  return {
    code,
    name,
    symbol: getSymbolForCode(code),
    flag: '',
    decimal: zeroDecimals.has(code) ? 0 : 2,
  }
}

interface CurrencyContextType {
  // Current settings
  selectedCurrency: CurrencyCode
  baseCurrency: CurrencyCode
  exchangeRates: ExchangeRates
  availableCurrencies: CurrencyInfo[]
  isLoading: boolean
  lastUpdated: Date | null
  error: string | null

  // Actions
  setCurrency: (currency: CurrencyCode) => void
  refreshRates: () => Promise<void>
  convertAmount: (amount: number, from?: CurrencyCode, to?: CurrencyCode) => number
  formatCurrency: (
    amount: number,
    currency?: CurrencyCode,
    options?: {
      showSymbol?: boolean
      locale?: string
      compact?: boolean
      precision?: number
    }
  ) => string
  parseCurrencyInput: (input: string, currency?: CurrencyCode) => number | null
  getCurrencyInfo: (currency: CurrencyCode) => CurrencyInfo | null
  getAllCurrencies: () => CurrencyInfo[]

  // Manual rates for hedged scenarios
  setManualRate: (from: CurrencyCode, to: CurrencyCode, rate: number) => void
  removeManualRate: (from: CurrencyCode, to: CurrencyCode) => void
  isManualRate: (from: CurrencyCode, to: CurrencyCode) => boolean
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

// Reliable exchange rate service with multiple APIs
class ExchangeRateService {
  private static instance: ExchangeRateService
  private cache: { rates: ExchangeRates; timestamp: number } | null = null
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static getInstance(): ExchangeRateService {
    if (!ExchangeRateService.instance) {
      ExchangeRateService.instance = new ExchangeRateService()
    }
    return ExchangeRateService.instance
  }


  private async fetchFromAPI(base: string): Promise<ExchangeRates | null> {
    try {
      const response = await fetch(`https://api.frankfurter.dev/v1/latest?base=${base}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      const rates = data.rates

      if (rates && typeof rates === 'object') {
        const normalizedRates: ExchangeRates = { [base]: 1 }
        for (const [key, value] of Object.entries(rates)) {
          normalizedRates[key.toUpperCase()] = value as number
        }
        return normalizedRates
      }
    } catch (error) {
      // Silent fail - currency conversion is optional
    }

    return null
  }

  async getRates(base: string): Promise<ExchangeRates> {
    // Check cache (invalidate if base changed)
    if (this.cache && Date.now() - this.cache.timestamp < this.CACHE_DURATION && this.cache.rates[base] === 1) {
      return this.cache.rates
    }

    try {
      const apiRates = await this.fetchFromAPI(base)

      if (apiRates) {
        this.cache = {
          rates: apiRates,
          timestamp: Date.now()
        }
        return apiRates
      }
    } catch (error) {
      // Exchange rate API unavailable - fallback to base only
    }

    const baseRates: ExchangeRates = { [base]: 1 }
    this.cache = {
      rates: baseRates,
      timestamp: Date.now()
    }
    return baseRates
  }
}

export function CurrencyProvider({ children, baseCurrencyCode }: { children: React.ReactNode, baseCurrencyCode?: string }) {
  const resolvedBase = baseCurrencyCode || 'INR'
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(resolvedBase)
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>(resolvedBase)
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({})
  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [manualRates, setManualRates] = useState<Map<string, number>>(new Map())

  const exchangeService = ExchangeRateService.getInstance()

  const refreshRates = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const rates = await exchangeService.getRates(baseCurrency)
      setExchangeRates(rates)
      setLastUpdated(new Date())
    } catch (err) {
      setError('Failed to fetch exchange rates')
    } finally {
      setIsLoading(false)
    }
  }, [exchangeService, baseCurrency])

  // Fetch full currency list from API on mount
  useEffect(() => {
    let cancelled = false
    async function fetchCurrencies() {
      try {
        const res = await fetch('https://api.frankfurter.dev/v1/currencies')
        if (!res.ok) return
        const data: Record<string, string> = await res.json()
        if (cancelled) return
        const list = Object.entries(data).map(([code, name]) => buildCurrencyInfo(code, name))
        // Ensure base currency is always in the list even if API doesn't return it
        if (!list.some(c => c.code === resolvedBase)) {
          list.unshift(buildCurrencyInfo(resolvedBase, resolvedBase))
        }
        setAvailableCurrencies(list)
      } catch {
        // API down — create a minimal entry from the DB base currency so dropdown isn't empty
        setAvailableCurrencies([buildCurrencyInfo(resolvedBase, resolvedBase)])
      }
    }
    fetchCurrencies()
    return () => { cancelled = true }
  }, [resolvedBase])

  // Update base currency when session loads
  useEffect(() => {
    if (baseCurrencyCode && baseCurrencyCode !== baseCurrency) {
      setBaseCurrency(baseCurrencyCode)
      // Also update selected if it was still the old default
      setSelectedCurrency(prev => {
        const saved = localStorage.getItem('selectedCurrency')
        return saved || baseCurrencyCode
      })
    }
  }, [baseCurrencyCode])

  // Auto-refresh exchange rates
  useEffect(() => {
    refreshRates()
    const interval = setInterval(refreshRates, 5 * 60 * 1000) // 5 minutes
    return () => clearInterval(interval)
  }, [refreshRates])

  const setCurrency = useCallback((currency: CurrencyCode) => {
    setSelectedCurrency(currency)
    // Store in localStorage for persistence
    localStorage.setItem('selectedCurrency', currency)
  }, [])

  // Load saved currency on mount (after currencies are loaded)
  useEffect(() => {
    if (availableCurrencies.length > 0) {
      const saved = localStorage.getItem('selectedCurrency') as CurrencyCode
      const currencyExists = availableCurrencies.some(c => c.code === saved)
      if (saved && currencyExists) {
        setSelectedCurrency(saved)
      }
    }
  }, [availableCurrencies])

  const convertAmount = useCallback((
    amount: number,
    from: CurrencyCode = baseCurrency,
    to: CurrencyCode = selectedCurrency
  ): number => {
    if (from === to) return amount
    if (!amount || amount === 0) return 0

    const manualRateKey = `${from}-${to}`
    const manualRate = manualRates.get(manualRateKey)

    if (manualRate) {
      return amount * manualRate
    }

    // Use exchange rates
    if (from === baseCurrency) {
      const rate = exchangeRates[to]
      return rate ? amount * rate : amount
    }

    if (to === baseCurrency) {
      const rate = exchangeRates[from]
      return rate ? amount / rate : amount
    }

    // Cross currency conversion via base currency
    const fromRate = exchangeRates[from]
    const toRate = exchangeRates[to]

    if (fromRate && toRate) {
      const inBaseCurrency = amount / fromRate
      return inBaseCurrency * toRate
    }

    return amount
  }, [baseCurrency, selectedCurrency, exchangeRates, manualRates])

  const formatCurrency = useCallback((
    amount: number,
    currency: CurrencyCode = selectedCurrency,
    options?: {
      showSymbol?: boolean
      locale?: string
      compact?: boolean
      precision?: number
    }
  ): string => {
    const currencyInfo = availableCurrencies.find(c => c.code === currency)
    if (!currencyInfo) return amount.toString()

    const {
      showSymbol = true,
      locale = 'en-IN',
      compact = false,
      precision = currencyInfo.decimal
    } = options || {}

    // Handle zero and negative amounts
    if (amount === 0) {
      return showSymbol ? `${currencyInfo.symbol}0${precision > 0 ? '.' + '0'.repeat(precision) : ''}` : '0'
    }

    try {
      if (compact && Math.abs(amount) >= 1000) {
        // Compact formatting for large numbers
        const formatValue = (num: number, suffix: string) => {
          const formatted = new Intl.NumberFormat(locale, {
            style: 'decimal',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
          }).format(num)
          return showSymbol ? `${currencyInfo.symbol}${formatted}${suffix}` : `${formatted}${suffix}`
        }

        if (Math.abs(amount) >= 10000000) { // 1 crore
          return formatValue(amount / 10000000, 'Cr')
        } else if (Math.abs(amount) >= 100000) { // 1 lakh
          return formatValue(amount / 100000, 'L')
        } else if (Math.abs(amount) >= 1000) { // 1 thousand
          return formatValue(amount / 1000, 'K')
        }
      }

      // Standard formatting - use decimal style + manual symbol to avoid
      // Intl rendering full currency name (e.g. "IndianRupee" instead of "₹")
      const formatted = new Intl.NumberFormat(locale, {
        style: 'decimal',
        minimumFractionDigits: precision,
        maximumFractionDigits: precision
      }).format(amount)
      return showSymbol ? `${currencyInfo.symbol}${formatted}` : formatted
    } catch {
      // Fallback formatting
      const formattedAmount = amount.toLocaleString(locale, {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision
      })
      return showSymbol ? `${currencyInfo.symbol}${formattedAmount}` : formattedAmount
    }
  }, [selectedCurrency, availableCurrencies])

  const parseCurrencyInput = useCallback((
    input: string,
    currency: CurrencyCode = selectedCurrency
  ): number | null => {
    if (!input || input.trim() === '') return null

    const currencyInfo = availableCurrencies.find(c => c.code === currency)
    if (!currencyInfo) return null

    // Remove currency symbols and common formatting
    let cleaned = input
      .replace(new RegExp(currencyInfo.symbol, 'g'), '')
      .replace(/[,\s]/g, '') // Remove commas and spaces
      .replace(/[₹$€£¥]/g, '') // Remove common currency symbols
      .trim()

    // Handle Indian notation (L for lakh, Cr for crore, K for thousand)
    if (cleaned.toLowerCase().includes('cr')) {
      const number = parseFloat(cleaned.replace(/cr/i, ''))
      if (!isNaN(number)) return number * 10000000 // 1 crore = 10 million
    }

    if (cleaned.toLowerCase().includes('l')) {
      const number = parseFloat(cleaned.replace(/l/i, ''))
      if (!isNaN(number)) return number * 100000 // 1 lakh = 100,000
    }

    if (cleaned.toLowerCase().includes('k')) {
      const number = parseFloat(cleaned.replace(/k/i, ''))
      if (!isNaN(number)) return number * 1000 // 1K = 1,000
    }

    // Parse as regular number
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? null : parsed
  }, [selectedCurrency, availableCurrencies])

  const getCurrencyInfo = useCallback((currency: CurrencyCode): CurrencyInfo | null => {
    return availableCurrencies.find(c => c.code === currency) || null
  }, [availableCurrencies])

  const getAllCurrencies = useCallback((): CurrencyInfo[] => {
    return availableCurrencies
  }, [availableCurrencies])

  const setManualRate = useCallback((from: CurrencyCode, to: CurrencyCode, rate: number) => {
    const key = `${from}-${to}`
    setManualRates(prev => new Map(prev.set(key, rate)))
  }, [])

  const removeManualRate = useCallback((from: CurrencyCode, to: CurrencyCode) => {
    const key = `${from}-${to}`
    setManualRates(prev => {
      const newMap = new Map(prev)
      newMap.delete(key)
      return newMap
    })
  }, [])

  const isManualRate = useCallback((from: CurrencyCode, to: CurrencyCode): boolean => {
    const key = `${from}-${to}`
    return manualRates.has(key)
  }, [manualRates])

  const value: CurrencyContextType = {
    selectedCurrency,
    baseCurrency,
    exchangeRates,
    availableCurrencies,
    isLoading,
    lastUpdated,
    error,
    setCurrency,
    refreshRates,
    convertAmount,
    formatCurrency,
    parseCurrencyInput,
    getCurrencyInfo,
    getAllCurrencies,
    setManualRate,
    removeManualRate,
    isManualRate
  }

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}