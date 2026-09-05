import * as React from 'react'
import { DropdownOption } from '../types'
import { naturalCompare } from '@/lib/utils'

export function useDropdownFiltering(
  allOptions: DropdownOption[],
  searchTerm: string,
  enableTextInput: boolean,
  // Values pinned to the top of the list (selected-first). Snapshotted at open
  // time by the caller so rows don't jump while the user is ticking.
  pinnedValues?: string[],
  // Keep the caller-supplied option order (e.g. backend priority ordering)
  // instead of natural-sorting by label. Pinned/sentinel rows still float up.
  preserveOrder?: boolean
) {
  // Filter options based on search term, then natural-sort by label so a
  // numeric prefix like "10" sorts after "9" instead of after "1". Sentinel
  // options (None / All / -) are pinned to the top regardless of sort.
  const filteredOptions = React.useMemo(() => {
    const base = !searchTerm
      ? allOptions
      : allOptions.filter(option => {
          const term = searchTerm.toLowerCase()
          return (
            String(option.label).toLowerCase().includes(term) ||
            (option.description && option.description.toLowerCase().includes(term))
          )
        })
    const isSentinel = (label: any) => {
      const l = String(label ?? '').trim().toLowerCase()
      return l === 'none' || l === 'all' || l === '-' || l === '' || l === 'n/a' || l === 'na'
    }
    const pinned = pinnedValues && pinnedValues.length > 0 ? new Set(pinnedValues.map(String)) : null
    return [...base].sort((a, b) => {
      if (pinned) {
        const pa = pinned.has(String(a.value)), pb = pinned.has(String(b.value))
        if (pa !== pb) return pa ? -1 : 1
      }
      const sa = isSentinel(a.label), sb = isSentinel(b.label)
      if (sa !== sb) return sa ? -1 : 1
      return preserveOrder ? 0 : naturalCompare(a.label, b.label)
    })
  }, [allOptions, searchTerm, pinnedValues, preserveOrder])

  // Check if we should show "Create" option
  const showCreateOption = React.useMemo(() => {
    if (!enableTextInput || !searchTerm.trim()) return false
    const term = searchTerm.toLowerCase()
    const exactMatch = allOptions.some(
      opt => String(opt.label).toLowerCase() === term
    )
    return !exactMatch
  }, [enableTextInput, searchTerm, allOptions])

  return {
    filteredOptions,
    showCreateOption
  }
}
