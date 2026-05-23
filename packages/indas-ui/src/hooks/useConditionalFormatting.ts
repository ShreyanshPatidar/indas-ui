import { useMemo } from 'react'

// Condition operators
export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty'
  | 'between'
  | 'in_list'

// Style configurations
export interface ConditionalStyle {
  backgroundColor?: string
  textColor?: string
  fontWeight?: 'normal' | 'bold' | 'lighter'
  fontStyle?: 'normal' | 'italic'
  borderColor?: string
  borderWidth?: number
  opacity?: number
  className?: string
}

// Formatting rule
export interface FormattingRule {
  id: string
  name: string
  columnId?: string // If undefined, applies to all columns
  operator: ConditionOperator
  value: any
  secondValue?: any // For 'between' operator
  style: ConditionalStyle
  enabled?: boolean
  priority?: number // Higher priority rules override lower ones
}

// Predefined style presets
export const STYLE_PRESETS: Record<string, ConditionalStyle> = {
  success: {
    backgroundColor: '#dcfce7',
    textColor: '#166534',
    borderColor: '#22c55e'
  },
  warning: {
    backgroundColor: '#fef3c7',
    textColor: '#92400e',
    borderColor: '#f59e0b'
  },
  error: {
    backgroundColor: '#fee2e2',
    textColor: '#dc2626',
    borderColor: '#ef4444'
  },
  info: {
    backgroundColor: '#dbeafe',
    textColor: '#1d4ed8',
    borderColor: '#3b82f6'
  },
  highlight: {
    backgroundColor: '#fef3c7',
    fontWeight: 'bold',
    borderColor: '#f59e0b',
    borderWidth: 2
  },
  muted: {
    opacity: 0.6,
    fontStyle: 'italic'
  },
  important: {
    backgroundColor: '#fecaca',
    textColor: '#991b1b',
    fontWeight: 'bold'
  }
}

// Evaluation functions for each operator
function evaluateCondition(
  cellValue: any,
  operator: ConditionOperator,
  ruleValue: any,
  secondValue?: any
): boolean {
  // Handle null/undefined values
  const isEmptyValue = cellValue === null || cellValue === undefined || cellValue === ''

  if (operator === 'is_empty') {
    return isEmptyValue
  }

  if (operator === 'is_not_empty') {
    return !isEmptyValue
  }

  if (isEmptyValue) {
    return false
  }

  // Convert to strings for string operations
  const cellStr = String(cellValue).toLowerCase()
  const ruleStr = String(ruleValue).toLowerCase()

  // Convert to numbers for numeric operations
  const cellNum = Number(cellValue)
  const ruleNum = Number(ruleValue)
  const isNumericComparison = !isNaN(cellNum) && !isNaN(ruleNum)

  switch (operator) {
    case 'equals':
      return isNumericComparison ? cellNum === ruleNum : cellStr === ruleStr

    case 'not_equals':
      return isNumericComparison ? cellNum !== ruleNum : cellStr !== ruleStr

    case 'greater_than':
      return isNumericComparison ? cellNum > ruleNum : cellStr > ruleStr

    case 'less_than':
      return isNumericComparison ? cellNum < ruleNum : cellStr < ruleStr

    case 'greater_than_or_equal':
      return isNumericComparison ? cellNum >= ruleNum : cellStr >= ruleStr

    case 'less_than_or_equal':
      return isNumericComparison ? cellNum <= ruleNum : cellStr <= ruleStr

    case 'contains':
      return cellStr.includes(ruleStr)

    case 'not_contains':
      return !cellStr.includes(ruleStr)

    case 'starts_with':
      return cellStr.startsWith(ruleStr)

    case 'ends_with':
      return cellStr.endsWith(ruleStr)

    case 'between':
      if (secondValue === undefined) return false
      const secondNum = Number(secondValue)
      if (isNumericComparison && !isNaN(secondNum)) {
        return cellNum >= Math.min(ruleNum, secondNum) && cellNum <= Math.max(ruleNum, secondNum)
      }
      return cellStr >= ruleStr && cellStr <= String(secondValue).toLowerCase()

    case 'in_list':
      const list = Array.isArray(ruleValue) ? ruleValue : String(ruleValue).split(',')
      return list.some(item =>
        isNumericComparison ? cellNum === Number(item) : cellStr === String(item).toLowerCase()
      )

    default:
      return false
  }
}

/**
 * Hook for conditional formatting in data grids
 * Evaluates formatting rules against cell values and returns appropriate styles
 */
export function useConditionalFormatting<TData>(
  data: TData[],
  rules: FormattingRule[]
) {
  const enabledRules = useMemo(() =>
    rules
      .filter(rule => rule.enabled !== false)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
  , [rules])

  // Get styles for a specific cell
  const getCellStyle = useMemo(() =>
    (rowData: TData, columnId: string): ConditionalStyle | null => {
      for (const rule of enabledRules) {
        // Skip if rule is for a specific column and doesn't match
        if (rule.columnId && rule.columnId !== columnId) {
          continue
        }

        const cellValue = (rowData as any)[columnId]

        if (evaluateCondition(cellValue, rule.operator, rule.value, rule.secondValue)) {
          return rule.style
        }
      }

      return null
    }
  , [enabledRules])

  // Get CSS properties object for a cell
  const getCellCSSProperties = useMemo(() =>
    (rowData: TData, columnId: string): React.CSSProperties => {
      const style = getCellStyle(rowData, columnId)
      if (!style) return {}

      return {
        backgroundColor: style.backgroundColor,
        color: style.textColor,
        fontWeight: style.fontWeight,
        fontStyle: style.fontStyle,
        borderColor: style.borderColor,
        borderWidth: style.borderWidth ? `${style.borderWidth}px` : undefined,
        borderStyle: style.borderColor || style.borderWidth ? 'solid' : undefined,
        opacity: style.opacity
      }
    }
  , [getCellStyle])

  // Get CSS class name for a cell
  const getCellClassName = useMemo(() =>
    (rowData: TData, columnId: string): string => {
      const style = getCellStyle(rowData, columnId)
      return style?.className || ''
    }
  , [getCellStyle])

  // Get combined props for a cell
  const getCellProps = useMemo(() =>
    (rowData: TData, columnId: string) => ({
      style: getCellCSSProperties(rowData, columnId),
      className: getCellClassName(rowData, columnId)
    })
  , [getCellCSSProperties, getCellClassName])

  // Utility functions for creating common rules
  const createRule = {
    // Highlight cells above/below threshold
    threshold: (
      columnId: string,
      threshold: number,
      operator: 'greater_than' | 'less_than' = 'greater_than',
      style: ConditionalStyle = STYLE_PRESETS.warning
    ): FormattingRule => ({
      id: `threshold-${columnId}-${threshold}`,
      name: `${columnId} ${operator} ${threshold}`,
      columnId,
      operator,
      value: threshold,
      style
    }),

    // Highlight specific values
    valueMatch: (
      columnId: string,
      value: any,
      style: ConditionalStyle = STYLE_PRESETS.highlight
    ): FormattingRule => ({
      id: `value-${columnId}-${value}`,
      name: `${columnId} equals ${value}`,
      columnId,
      operator: 'equals',
      value,
      style
    }),

    // Highlight empty cells
    emptyValues: (
      columnId: string,
      style: ConditionalStyle = STYLE_PRESETS.error
    ): FormattingRule => ({
      id: `empty-${columnId}`,
      name: `${columnId} is empty`,
      columnId,
      operator: 'is_empty',
      value: null,
      style
    }),

    // Range highlighting
    range: (
      columnId: string,
      min: number,
      max: number,
      style: ConditionalStyle = STYLE_PRESETS.success
    ): FormattingRule => ({
      id: `range-${columnId}-${min}-${max}`,
      name: `${columnId} between ${min} and ${max}`,
      columnId,
      operator: 'between',
      value: min,
      secondValue: max,
      style
    })
  }

  return {
    getCellStyle,
    getCellCSSProperties,
    getCellClassName,
    getCellProps,
    createRule,
    STYLE_PRESETS
  }
}