'use client'

import * as React from 'react'
import { Input } from '@/components/ui'

type EditableCellType = 'text' | 'number' | 'decimal'

interface EditableCellProps {
  value: string | number
  onSave: (value: string | number) => void
  type?: EditableCellType
  step?: string // For decimal type
  className?: string
  placeholder?: string
  disabled?: boolean // Disable editing
}

/**
 * Unified Editable Cell Component
 * Supports text, number, and decimal editing
 *
 * @example
 * // Text editing
 * <EditableCell value="John" onSave={handleSave} type="text" />
 *
 * // Integer editing
 * <EditableCell value={100} onSave={handleSave} type="number" />
 *
 * // Decimal editing
 * <EditableCell value={99.99} onSave={handleSave} type="decimal" step="0.01" />
 */
export function EditableCell({
  value,
  onSave,
  type = 'text',
  step = '0.01',
  className = 'w-full h-8 text-sm',
  placeholder = '-',
  disabled = false
}: EditableCellProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value.toString())

  const handleSave = () => {
    let newValue: string | number = inputValue

    // Parse based on type
    if (type === 'number') {
      newValue = parseInt(inputValue) || 0
    } else if (type === 'decimal') {
      newValue = parseFloat(inputValue) || 0
    }

    // Only save if changed
    if (newValue !== value) {
      onSave(newValue)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setInputValue(value.toString())
    setIsEditing(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyPress}
        className={className}
        autoFocus
        type={type === 'text' ? 'text' : 'number'}
        step={type === 'decimal' ? step : undefined}
      />
    )
  }

  return (
    <div
      className={`px-2 py-1 rounded ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-gray-100'}`}
      onClick={() => !disabled && setIsEditing(true)}
      title={disabled ? 'Editing disabled' : 'Click to edit'}
    >
      {value || placeholder}
    </div>
  )
}

// Export type-specific aliases for backwards compatibility with type-safe callbacks
export const EditableTextCell = (props: Omit<EditableCellProps, 'type'> & { onSave: (value: string) => void }) => (
  <EditableCell {...props} type="text" onSave={props.onSave as (value: string | number) => void} />
)

export const EditableNumberCell = (props: Omit<EditableCellProps, 'type'> & { onSave: (value: number) => void }) => (
  <EditableCell {...props} type="number" onSave={props.onSave as (value: string | number) => void} />
)

export const EditableDecimalCell = (props: Omit<EditableCellProps, 'type' | 'step'> & { step?: string; onSave: (value: number) => void }) => (
  <EditableCell {...props} type="decimal" step={props.step} onSave={props.onSave as (value: string | number) => void} />
)
