'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import type { Message } from '@/lib/api/ai/types'

interface ChatPromptNavigatorProps {
  messages: Message[]
  scrollContainer: () => HTMLElement | null
  /** Module display name (Synthia / ParkBuddy / Baghbadi / etc.) for the bot toggle label. */
  moduleName?: string
}

interface NavEntry {
  id: string
  text: string
}

type NavMode = 'user' | 'assistant'

const stripJson = (raw: string): string => {
  let s = raw
  for (let start = 0; start < s.length; start++) {
    const open = s[start]
    if (open !== '{' && open !== '[') continue
    const close = open === '{' ? '}' : ']'
    let depth = 0
    let end = -1
    let inStr = false
    let esc = false
    for (let i = start; i < s.length; i++) {
      const ch = s[i]
      if (inStr) {
        if (esc) esc = false
        else if (ch === '\\') esc = true
        else if (ch === '"') inStr = false
      } else if (ch === '"') inStr = true
      else if (ch === open) depth++
      else if (ch === close && --depth === 0) { end = i; break }
    }
    if (end === -1) break
    s = s.slice(0, start) + ' ' + s.slice(end + 1)
    start--
  }
  return s
}

const previewText = (content: string): string =>
  stripJson(content || '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*`>_~]/g, '')
    .replace(/\[\d+ file\(s\) attached\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

export function ChatPromptNavigator({ messages, scrollContainer, moduleName }: ChatPromptNavigatorProps) {
  const { t } = useLanguage()
  const [mode, setMode] = useState<NavMode>('user')
  const [hovered, setHovered] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const entries = useMemo<NavEntry[]>(
    () =>
      messages
        .filter((m) => m.role === mode)
        .map((m) => ({ id: m.id, text: previewText(m.content) }))
        .filter((e) => e.text.length > 0),
    [messages, mode]
  )

  // Track which entry is currently in view so its tick/row is highlighted.
  useEffect(() => {
    const el = scrollContainer()
    if (!el || entries.length === 0) return
    const onScroll = () => {
      const top = el.getBoundingClientRect().top
      let current: string | null = null
      for (const e of entries) {
        const node = el.querySelector<HTMLElement>(`[data-message-id="${CSS.escape(e.id)}"]`)
        if (!node) continue
        if (node.getBoundingClientRect().top - top <= 80) current = e.id
        else break
      }
      setActiveId(current ?? entries[0]?.id ?? null)
    }
    onScroll()
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [scrollContainer, entries])

  const scrollToEntry = useCallback(
    (id: string) => {
      const el = scrollContainer()
      const node = el?.querySelector<HTMLElement>(`[data-message-id="${CSS.escape(id)}"]`)
      if (!el || !node) return
      const top = el.scrollTop + (node.getBoundingClientRect().top - el.getBoundingClientRect().top) - 16
      el.scrollTo({ top, behavior: 'smooth' })
    },
    [scrollContainer]
  )

  // Hide only when neither side has anything worth navigating.
  const userCount = useMemo(() => messages.filter((m) => m.role === 'user').length, [messages])
  const botCount = useMemo(() => messages.filter((m) => m.role === 'assistant').length, [messages])
  if (userCount < 2 && botCount < 2) return null

  const botLabel = moduleName || t('Assistant')

  const TabButton = ({ value, label }: { value: NavMode; label: string }) => (
    <button
      onClick={(e) => { e.stopPropagation(); setMode(value) }}
      className={cn(
        'flex-1 rounded-md px-2 py-1 text-[0.7rem] font-medium transition-colors',
        mode === value
          ? 'bg-[rgb(var(--bg-surface))] text-[rgb(var(--color-primary))] shadow-sm'
          : 'text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))]'
      )}
    >
      {label}
    </button>
  )

  return (
    <div
      className="hidden lg:flex absolute right-2 top-1/2 -translate-y-1/2 z-20"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Expanded list — floats out of flow so the hover target stays the thin tick strip */}
      <div
        className={cn(
          'absolute right-full top-1/2 -translate-y-1/2 mr-1.5 flex max-h-[40vh] w-72 flex-col overflow-hidden rounded-xl border border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))] shadow-xl transition-opacity duration-150',
          hovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        <div className="border-b border-[rgb(var(--bd-default))] p-1.5">
          <div className="flex gap-1 rounded-lg bg-[rgb(var(--bg-subtle))] p-0.5">
            <TabButton value="assistant" label={botLabel} />
            <TabButton value="user" label={t('You')} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {entries.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-[rgb(var(--fg-muted))]">
              {t('Nothing to show')}
            </div>
          ) : (
            entries.map((entry, i) => {
              const isActive = activeId === entry.id
              return (
                <button
                  key={entry.id}
                  onClick={() => scrollToEntry(entry.id)}
                  title={entry.text}
                  className={cn(
                    'group relative flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors',
                    isActive ? 'bg-[rgb(var(--color-primary))]/8' : 'hover:bg-[rgb(var(--bg-subtle))]'
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 -translate-y-1/2 w-[3px] rounded-r-full bg-[rgb(var(--color-primary))]" />
                  )}
                  <span
                    className={cn(
                      'mt-[0.05rem] shrink-0 text-[0.6875rem] font-semibold tabular-nums',
                      isActive ? 'text-[rgb(var(--color-primary))]' : 'text-[rgb(var(--fg-muted))]'
                    )}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={cn(
                      'min-w-0 flex-1 truncate text-xs leading-relaxed',
                      isActive
                        ? 'text-[rgb(var(--color-primary))] font-medium'
                        : 'text-[rgb(var(--fg-default))]/80 group-hover:text-[rgb(var(--fg-default))]'
                    )}
                  >
                    {entry.text}
                  </span>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Dot strip — one dot per message; active is larger + primary. Capped height, scrolls if many. */}
      <div className="flex max-h-[40vh] flex-col items-center justify-center gap-1.5 overflow-y-auto px-1 py-1">
        {entries.map((entry) => (
          <button
            key={entry.id}
            onClick={() => scrollToEntry(entry.id)}
            aria-label={entry.text}
            className={cn(
              'shrink-0 rounded-full transition-all duration-150',
              activeId === entry.id
                ? 'h-2 w-2 bg-[rgb(var(--color-primary))]'
                : 'h-1 w-1 bg-[rgb(var(--fg-muted))]/40 hover:bg-[rgb(var(--fg-muted))]/70'
            )}
          />
        ))}
      </div>
    </div>
  )
}
