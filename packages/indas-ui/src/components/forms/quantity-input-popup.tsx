'use client'

import * as React from 'react'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { cn } from '@/lib/utils'
import { Check, X } from 'lucide-react'

interface QuantityInputPopupProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (quantity: number) => void
  triggerRef: React.RefObject<HTMLElement>
  className?: string
}

export function QuantityInputPopup({
  isOpen,
  onClose,
  onConfirm,
  triggerRef,
  className
}: QuantityInputPopupProps) {
  const [quantity, setQuantity] = React.useState<string>('1000')
  const [error, setError] = React.useState<string>('')
  const [position, setPosition] = React.useState({ top: 0, left: 0 })
  const popupRef = React.useRef<HTMLDivElement>(null)

  // Calculate position relative to trigger button
  React.useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + window.scrollY + 4, // 4px gap below button
        left: rect.left + window.scrollX
      })
    }
  }, [isOpen, triggerRef])

  // Handle clicks outside popup
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose, triggerRef])

  // Handle Enter and Escape keys
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return

      if (event.key === 'Enter') {
        event.preventDefault() // Prevent form submission
        handleConfirm()
      } else if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, quantity, error]) // Added quantity and error to dependencies

  // Validate quantity input
  const validateQuantity = (value: string): string => {
    if (!value.trim()) {
      return 'Quantity is required'
    }

    const num = parseFloat(value)
    if (isNaN(num)) {
      return 'Please enter a valid number'
    }

    if (num <= 0) {
      return 'Quantity must be greater than 0'
    }

    if (num > 1000000) {
      return 'Quantity cannot exceed 1,000,000'
    }

    return ''
  }

  const handleQuantityChange = (value: string) => {
    // Allow only numbers, decimal point, and commas
    const cleanValue = value.replace(/[^0-9.,]/g, '')
    setQuantity(cleanValue)

    const validationError = validateQuantity(cleanValue)
    setError(validationError)
  }

  const handleConfirm = () => {
    const validationError = validateQuantity(quantity)
    if (validationError) {
      setError(validationError)
      return
    }

    const numericQuantity = parseFloat(quantity.replace(/,/g, ''))
    onConfirm(numericQuantity)
    setQuantity('1000') // Reset to default
    setError('')
    onClose()
  }

  const handleCancel = () => {
    setQuantity('1000') // Reset to default
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" />

      {/* Popup */}
      <div
        ref={popupRef}
        className={cn(
          "fixed z-50 bg-white border border-gray-300 rounded-md shadow-lg p-3 min-w-[200px]",
          className
        )}
        style={{
          top: position.top,
          left: position.left
        }}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="text-sm font-medium text-gray-900">
            Add Quantity Column
          </div>

          {/* Input */}
          <div className="space-y-1">
            <Input
              type="text"
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              placeholder="Enter quantity"
              className={cn(
                "h-8 text-sm",
                error && "border-red-500 focus:ring-red-500"
              )}
              autoFocus
            />
            {error && (
              <div className="text-xs text-red-500">{error}</div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={!!error || !quantity.trim()}
              className="h-7 px-3 text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Add
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="h-7 px-3 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}