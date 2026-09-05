'use client'

/**
 * Reusable chat with sidebar, sounds, floating widget, and mobile/desktop headers.
 * Domain-specific branding (logo, title, messages) is injected via props.
 */

import { useState, useEffect, useCallback, useRef, ReactNode, ComponentType } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Menu, X, Plus, Maximize2, Download, Share2, Volume2, VolumeX, Bot, History, PanelLeftOpen, Star, Pencil, Trash2, ChevronDown, Search, Calendar, Copy } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { sendChatMessageAPI, getConversationsAPI, getMessagesAPI, deleteConversationAPI, renameConversationAPI, toggleStarConversationAPI, submitMessageFeedbackAPI, duplicateConversationAPI } from '@/lib/api/ai/chat'
import type { Message, Conversation, UIDataEntry } from '@/lib/api/ai/types'
import { useGlobalAlert } from '@/contexts/GlobalAlertContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { SidePanel } from '@/components/layout/side-panel'
import { Messages } from '@/components/chat/ai-messages'
import { MultimodalInput } from '@/components/chat/multimodal-input'
import type { SelectableItem } from '@/components/chat/ai-messages'
import { ChatPromptNavigator } from '@/components/chat/chat-prompt-navigator'
import { DatePicker, type DateRange } from '@/components/forms/date-picker'
import { getLocalDateString } from '@/lib/utils'

interface MessagesComponentProps {
  messages: Message[]
  isLoading?: boolean
  onExport?: () => void
  onShare?: () => void
  onSelectItem?: (item: SelectableItem) => void
  onEditMessage?: (messageId: string, newContent: string) => void
  onRegenerateAi?: (messageId: string) => void
  onFeedback?: (messageId: string, rating: 'up' | 'down' | null) => void
}

export interface ChatProps {
  mode?: 'fullpage' | 'modal' | 'widget' | 'floating'
  externalMuted?: boolean
  /** Display title for headers and sidebar */
  title?: string
  /** Sidebar title (defaults to title) */
  sidebarTitle?: ReactNode
  /** Logo element for headers */
  logo?: ReactNode
  /** Logo element for floating bubble (white variant for primary bg). Falls back to logo. */
  bubbleLogo?: ReactNode
  /** Custom messages component (defaults to generic Messages) */
  MessagesComponent?: ComponentType<MessagesComponentProps>
  /** Path for "Open fullpage" button (defaults to none — button hidden) */
  fullpagePath?: string
  /** Called before resending an edited message. Receives conversationId and messageId for backend cleanup. */
  onBeforeEditMessage?: (conversationId: number, messageId: string) => Promise<void>
  /** Pre-filled message to send automatically on mount */
  initialMessage?: string
  /** Conversation to load on mount (used when expanding floating → fullpage) */
  initialConversationId?: number
  /** Extra buttons rendered on the right side of the chat header (mobile + desktop). */
  headerActions?: ReactNode
  /** Fires whenever the current conversation's messages change so the parent can
   *  inspect them (e.g. to copy the latest job-spec summary). */
  onMessagesChange?: (messages: Message[]) => void
}

// ─── Conversation context (discriminated union) ──────────────────────────────
//
// Replaces the old { isNewChat, currentConversationId } pair. The pair allowed
// the impossible state (existing-but-no-id, new-but-with-id) which silently
// corrupted the backend's "find most recent open conversation" fallback when
// the wire payload went out as { newChat: false, conversationId: undefined }.
//
// One source of truth, one helper that derives the wire shape — no caller can
// hand-build a malformed send payload.
type ConvCtx = { mode: 'new' } | { mode: 'existing'; id: number }

interface SendPayload {
  message: string
  conversationId: number | undefined
  newChat: boolean
  title: string | null
}

function buildSendPayload(ctx: ConvCtx, message: string, autoTitle: string | null): SendPayload {
  if (ctx.mode === 'new') {
    return { message, conversationId: undefined, newChat: true, title: autoTitle }
  }
  return { message, conversationId: ctx.id, newChat: false, title: null }
}

// Sidebar / search-modal date stamp: "19 May 2026, 3:42 PM".
function formatConversationStamp(iso: string): string {
  try {
    const d = new Date(iso)
    const date = d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
    const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    return `${date}, ${time}`
  } catch {
    return ''
  }
}

// Date-bucket key for a conversation timestamp. Buckets match the ChatGPT
// pattern: Today / Yesterday / Previous 7 Days / Previous 30 Days / Month YYYY.
function bucketForDate(iso: string | undefined, now: Date = new Date()): { id: string; label: string; sort: number } {
  if (!iso) return { id: 'unknown', label: 'Older', sort: -1 }
  const d = new Date(iso)
  if (isNaN(d.getTime())) return { id: 'unknown', label: 'Older', sort: -1 }

  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const today = startOfDay(now)
  const that = startOfDay(d)
  const diffDays = Math.floor((today - that) / 86400000)

  if (diffDays <= 0) return { id: 'today', label: 'Today', sort: 1000 }
  if (diffDays === 1) return { id: 'yesterday', label: 'Yesterday', sort: 999 }
  if (diffDays <= 7) return { id: 'prev7', label: 'Previous 7 Days', sort: 998 }
  if (diffDays <= 30) return { id: 'prev30', label: 'Previous 30 Days', sort: 997 }
  const monthLabel = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const sort = -(d.getFullYear() * 12 + d.getMonth())
  return { id: `m-${d.getFullYear()}-${d.getMonth()}`, label: monthLabel, sort }
}

export function Chat({
  mode = 'fullpage',
  externalMuted,
  title = 'Chat',
  sidebarTitle,
  bubbleLogo,
  logo,
  MessagesComponent,
  fullpagePath,
  onBeforeEditMessage,
  initialMessage,
  initialConversationId,
  headerActions,
  onMessagesChange
}: ChatProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const alerts = useGlobalAlert()
  const { t } = useLanguage()

  const [conversations, setConversations] = useState<Conversation[]>([])

  // Conversation context as a discriminated union — makes the invalid combo
  // (existing-mode with no id) unrepresentable. All send-payload construction
  // goes through buildSendPayload() so the wire shape is derived from the union.
  // The ref mirror is updated synchronously with the state so handlers reading
  // mid-render still see the latest value (no render-cycle gap on chat switch).
  const [convCtx, setConvCtxState] = useState<ConvCtx>({ mode: 'new' })
  const convCtxRef = useRef<ConvCtx>({ mode: 'new' })
  const setConvCtx = useCallback((next: ConvCtx) => {
    convCtxRef.current = next
    setConvCtxState(next)
  }, [])
  // Derived views — kept as locals so existing read-sites compile without churn.
  const currentConversationId = convCtx.mode === 'existing' ? convCtx.id : null
  const isNewChat = convCtx.mode === 'new'

  const [messages, setMessages] = useState<Message[]>([])
  // Stream the latest messages array out to the parent so it can derive UI state
  // (e.g. SynthiaPage uses it to build the Copy-Input-Specs template from the
  // active conversation's summary).
  useEffect(() => {
    onMessagesChange?.(messages)
  }, [messages, onMessagesChange])
  const [isLoading, setIsLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isFloatingOpen, setIsFloatingOpen] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  // Search-chats modal — ChatGPT-style centered overlay with text search + date-range filter.
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFrom, setSearchFrom] = useState('')
  const [searchTo, setSearchTo] = useState('')
  // Sidebar grouping toggle: OFF → flat "Recents" list (default). ON → date buckets
  // (Today / Yesterday / Previous 7 Days / Previous 30 Days / Month YYYY). Sticky via
  // localStorage so power users who prefer buckets keep them across reloads.
  const [groupByDate, setGroupByDate] = useState(false)
  useEffect(() => {
    try {
      const v = localStorage.getItem('synthia.sidebarGroupByDate')
      if (v === '1') setGroupByDate(true)
    } catch {}
  }, [])
  useEffect(() => {
    try { localStorage.setItem('synthia.sidebarGroupByDate', groupByDate ? '1' : '0') } catch {}
  }, [groupByDate])

  // Use external mute state if provided (e.g. from floating widget header)
  const effectiveMuted = externalMuted ?? isMuted

  // Hard-limit detection — when the conversation has been closed server-side, the last assistant
  // message carries the exact phrase below. Lock the input in that case.
  const isConversationClosed = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (m.role === 'assistant') {
        return /This conversation has reached its limit\.\s*Please start a new chat to continue\./i.test(m.content || '')
      }
      if (m.role === 'user') return false
    }
    return false
  })()

  useEffect(() => {
    if (session) {
      loadConversations()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const initialSentRef = useRef(false)
  // Stop-generation support — abort in-flight costingbot fetch when user clicks Stop
  const abortControllerRef = useRef<AbortController | null>(null)
  // Scroll container for the active messages viewport (floating vs fullpage/modal)
  const messagesScrollRef = useRef<HTMLDivElement | null>(null)

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
  }, [])

  // The inner Messages component has its own overflow-y-auto wrapper, so the
  // outer ref'd div doesn't scroll. Find the nearest actually-scrollable descendant.
  const findScroller = useCallback((): HTMLElement | null => {
    const root = messagesScrollRef.current
    if (!root) return null
    if (root.scrollHeight > root.clientHeight) return root
    const candidates = root.querySelectorAll<HTMLElement>('*')
    for (const el of Array.from(candidates)) {
      if (el.scrollHeight > el.clientHeight) {
        const style = window.getComputedStyle(el)
        if (/(auto|scroll)/.test(style.overflowY)) return el
      }
    }
    return root
  }, [])

  const scrollToBottom = useCallback(() => {
    const el = findScroller()
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [findScroller])

  const scrollToTop = useCallback(() => {
    const el = findScroller()
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' })
  }, [findScroller])

  // Show "scroll to bottom" floating button when user has scrolled away from the latest message
  const [showScrollDown, setShowScrollDown] = useState(false)
  useEffect(() => {
    const el = findScroller()
    if (!el) return
    const onScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
      setShowScrollDown(distanceFromBottom > 120)
    }
    onScroll()
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [findScroller, messages.length])

  const loadConversations = useCallback(async () => {
    if (!session) return
    const response = await getConversationsAPI(session)
    if (response.success && response.data) {
      setConversations(response.data)
    }
  }, [session])

  const loadConversation = useCallback(async (conversationId: number) => {
    if (!session) return

    setConvCtx({ mode: 'existing', id: conversationId })
    setMessages([])

    const response = await getMessagesAPI(conversationId, session)

    if (response.success && response.data) {
      const rows = response.data
      const formattedMessages: Message[] = []
      const seenUiIds = new Set<string>()
      // Pending ui_data waiting to be attached to the NEXT assistant row (GPT tool-call order quirk)
      let pendingUiData: UIDataEntry[] = []
      let pendingReadonly = false

      for (let idx = 0; idx < rows.length; idx++) {
        const msg = rows[idx]
        // Backend may send the text under either MessageContent or Content — read whichever is present
        const rawContent = msg.MessageContent ?? msg.Content ?? ''

        // Tool rows: parse, extract __ui_data, render as historical dropdown.
        // If missing/invalid JSON or no __ui_data → skip (non-UI tool result, not a chat bubble).
        if (msg.Role === 'tool') {
          let parsedPayload: Record<string, unknown> | null = null
          let uiDataRaw: unknown = null
          try {
            parsedPayload = JSON.parse(rawContent)
            uiDataRaw = parsedPayload?.__ui_data
          } catch {
            // Non-JSON tool content — skip silently
          }
          // __ui_data might be a single entry (object) or an array — normalize to array
          const uiData: UIDataEntry[] = Array.isArray(uiDataRaw)
            ? uiDataRaw
            : (uiDataRaw && typeof uiDataRaw === 'object' ? [uiDataRaw as UIDataEntry] : [])
          if (uiData.length === 0) continue

          // Stamp display_header from the parent payload onto each entry so the renderer can use it
          const displayHeader = typeof parsedPayload?.display_header === 'string'
            ? parsedPayload.display_header
            : undefined

          const filtered = uiData
            .filter((e: UIDataEntry) =>
              e?.version === 1 && Array.isArray(e.items) && e.items.length > 0 && !seenUiIds.has(e.id)
            )
            .map(e => ({ ...e, display_header: e.display_header ?? displayHeader }))
          filtered.forEach(e => seenUiIds.add(e.id))
          if (filtered.length === 0) continue

          // Contract §3.110: live iff no USER reply follows this tool row.
          // A user reply after the tool means the user already picked → historical/read-only.
          const hasUserAfter = rows.slice(idx + 1).some(r => r.Role === 'user')
          pendingUiData.push(...filtered)
          pendingReadonly = hasUserAfter
          continue
        }

        const built: Message = {
          id: `${msg.MessageID || idx}`,
          conversationId: conversationId,
          role: msg.Role,
          content: rawContent,
          timestamp: new Date(),
          contentType: 'text',
          feedback: msg.Feedback === 1 ? 'up' : msg.Feedback === 0 ? 'down' : null
        }
        // If this is the assistant row that the previous tool row was meant for, attach the ui_data here
        if (msg.Role === 'assistant' && pendingUiData.length > 0) {
          built.ui_data = pendingUiData
          built.uiDataReadonly = pendingReadonly
          pendingUiData = []
          pendingReadonly = false
        }
        formattedMessages.push(built)
      }

      // Any ui_data still pending after the loop means there was no assistant after the final tool row
      // → it's the live/active dropdown. Attach to the most recent assistant as non-readonly.
      if (pendingUiData.length > 0) {
        for (let j = formattedMessages.length - 1; j >= 0; j--) {
          if (formattedMessages[j].role === 'assistant') {
            formattedMessages[j] = {
              ...formattedMessages[j],
              ui_data: [...(formattedMessages[j].ui_data || []), ...pendingUiData],
              uiDataReadonly: false
            }
            break
          }
        }
      }

      setMessages(formattedMessages)
    }

    if (window.innerWidth < 768) {
      setIsSidebarOpen(false)
    }

    loadConversations()
  }, [session, loadConversations])

  const startNewChat = useCallback(() => {
    setConvCtx({ mode: 'new' })
    setMessages([])
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false)
    }
  }, [setConvCtx])

  const deleteConversation = useCallback(async (conversationId: number) => {
    if (!session) return

    alerts.showConfirmation(
      t('Delete Conversation'),
      t('Are you sure you want to delete this conversation?'),
      async () => {
        const response = await deleteConversationAPI(conversationId, session)

        if (response.success) {
          if (conversationId === currentConversationId) {
            startNewChat()
          }
          loadConversations()
          alerts.showSuccess(t('Deleted'), t('Conversation deleted successfully'))
        } else {
          alerts.showError(t('Error'), response.error || t('Failed to delete conversation'))
        }
      }
    )
  }, [session, currentConversationId, startNewChat, loadConversations, alerts])

  const duplicateConversation = useCallback(async (conversationId: number) => {
    if (!session) return
    const response = await duplicateConversationAPI(conversationId, session)
    if (response.success && response.data?.ConversationID) {
      await loadConversations()
      alerts.showSuccess(t('Duplicated'), t('Conversation duplicated successfully'))
    } else {
      alerts.showError(t('Error'), response.error || t('Failed to duplicate conversation'))
    }
  }, [session, loadConversations, alerts, t])

  // Inline rename — which conversation is currently being edited, and the draft title
  const [renamingId, setRenamingId] = useState<number | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const renameFocusedRef = useRef(false)

  const startRename = useCallback((conversationId: number) => {
    const conv = conversations.find(c => c.ConversationID === conversationId)
    renameFocusedRef.current = false
    setRenamingId(conversationId)
    setRenameDraft(conv?.Title || '')
  }, [conversations])

  const commitRename = useCallback(async () => {
    if (!session || renamingId === null) return
    const trimmed = renameDraft.trim()
    const conv = conversations.find(c => c.ConversationID === renamingId)
    // No-op if empty or unchanged
    if (!trimmed || trimmed === conv?.Title) {
      setRenamingId(null)
      return
    }
    // Optimistic
    setConversations(prev => prev.map(c => c.ConversationID === renamingId ? { ...c, Title: trimmed } : c))
    setRenamingId(null)
    const response = await renameConversationAPI(renamingId, trimmed, session)
    if (!response.success) {
      alerts.showError(t('Error'), response.error || t('Failed to rename'))
      loadConversations()
    }
  }, [session, renamingId, renameDraft, conversations, alerts, loadConversations])

  const cancelRename = useCallback(() => {
    setRenamingId(null)
    setRenameDraft('')
  }, [])

  const toggleStar = useCallback(async (conversationId: number) => {
    if (!session) return
    const current = conversations.find(c => c.ConversationID === conversationId)
    const currentStarred = current?.IsStarred === 1 || current?.IsStarred === true
    setConversations(prev => prev.map(c =>
      c.ConversationID === conversationId ? { ...c, IsStarred: currentStarred ? 0 : 1 } : c
    ))
    const response = await toggleStarConversationAPI(conversationId, session)
    if (!response.success) {
      alerts.showError(t('Error'), response.error || t('Failed to update star'))
      loadConversations()
    } else {
      loadConversations()
    }
  }, [session, conversations, alerts, loadConversations])

  // Build sidebar items with star indicator + inline rename input
  const conversationItems = conversations.map(conv => {
    const starred = conv.IsStarred === 1 || conv.IsStarred === true
    const title = conv.Title || `Conversation ${conv.ConversationID}`
    const isRenaming = renamingId === conv.ConversationID
    return {
      id: String(conv.ConversationID),
      searchText: title,
      disableSelect: isRenaming,
      label: isRenaming ? (
        <input
          ref={(el) => {
            if (el && !renameFocusedRef.current) {
              renameFocusedRef.current = true
              el.focus()
              el.select()
            }
          }}
          value={renameDraft}
          onChange={(e) => setRenameDraft(e.target.value)}
          onKeyDown={(e) => {
            // Stop keys from reaching the wrapping <button>, the global chat input, and the search bar.
            e.stopPropagation()
            if (e.key === 'Enter') { e.preventDefault(); commitRename() }
            else if (e.key === 'Escape') { e.preventDefault(); cancelRename() }
          }}
          onKeyUp={(e) => e.stopPropagation()}
          onKeyPress={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-full bg-[rgb(var(--bg-surface))] border border-[rgb(var(--color-primary))] rounded-md px-2 py-0.5 outline-none text-[0.8125rem] text-[rgb(var(--fg-default))]"
        />
      ) : (
        <span className="flex flex-col min-w-0 gap-0">
          <span className="flex items-center gap-1.5 min-w-0">
            {starred && <Star className="w-3 h-3 shrink-0 fill-current text-[rgb(var(--color-primary))]" />}
            <span className="truncate">{title}</span>
          </span>
          {conv.CreatedAt && (
            <span className="text-[0.6875rem] text-[rgb(var(--fg-muted))] truncate">
              {formatConversationStamp(conv.CreatedAt)}
            </span>
          )}
        </span>
      )
    }
  })

  // Sidebar categories. Two modes:
  //   - groupByDate=false (default): single flat "Conversations" category — preserves
  //     the original chronological list under the "Recents" header.
  //   - groupByDate=true: bucket items by Today / Yesterday / Previous 7 Days /
  //     Previous 30 Days / Month YYYY (ChatGPT-style).
  // Bucket grain is identical to the search modal so the two views feel consistent.
  const conversationCategories = (() => {
    if (!groupByDate) {
      return [{ id: 'conversations', label: 'Conversations', items: conversationItems }]
    }
    const groups = new Map<string, { label: string; sort: number; items: typeof conversationItems }>()
    conversations.forEach((conv, idx) => {
      const b = bucketForDate(conv.CreatedAt)
      const item = conversationItems[idx]
      if (!groups.has(b.id)) groups.set(b.id, { label: b.label, sort: b.sort, items: [] })
      groups.get(b.id)!.items.push(item)
    })
    return Array.from(groups.entries())
      .sort((a, b) => b[1].sort - a[1].sort)
      .map(([id, g]) => ({ id, label: g.label, items: g.items }))
  })()

  // Toggle rendered to the right of the sidebar "Recents" header. Pill-style two-state
  // switch — "List" (flat) vs "Group" (date buckets). Kept tiny so it doesn't crowd
  // the header.
  const groupingToggle = (
    <button
      onClick={(e) => { e.stopPropagation(); setGroupByDate(g => !g) }}
      title={groupByDate ? 'Switch to flat list' : 'Group by date'}
      className={cn(
        'text-[0.6rem] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md transition-colors',
        groupByDate
          ? 'bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))]'
          : 'text-[rgb(var(--fg-muted))] hover:bg-[rgb(var(--bg-subtle))] hover:text-[rgb(var(--fg-default))]'
      )}
    >
      {groupByDate ? 'Grouped' : 'Group'}
    </button>
  )

  // Context menu renderer for a conversation row — shared by floating and fullpage sidebars
  const renderConversationMenu = useCallback((itemId: string, close: () => void) => {
    const id = parseInt(itemId)
    const conv = conversations.find(c => c.ConversationID === id)
    const starred = conv?.IsStarred === 1 || conv?.IsStarred === true
    const itemCls = 'w-full px-3 py-2 text-left text-sm text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-subtle))] transition-colors flex items-center gap-2.5'
    const fire = (fn: () => void) => (e: React.MouseEvent) => {
      e.stopPropagation()
      close()
      fn()
    }
    return (
      <div className="py-1">
        <button onClick={fire(() => toggleStar(id))} className={itemCls}>
          <Star className={cn('w-3.5 h-3.5', starred && 'fill-current text-[rgb(var(--color-primary))]')} />
          {starred ? 'Unstar' : 'Star'}
        </button>
        <button onClick={fire(() => startRename(id))} className={itemCls}>
          <Pencil className="w-3.5 h-3.5" />
          Rename
        </button>
        {/* Duplicate hidden until backend endpoint ships.
        <button onClick={fire(() => duplicateConversation(id))} className={itemCls}>
          <Copy className="w-3.5 h-3.5" />
          Duplicate
        </button>
        */}
        <button
          onClick={fire(() => deleteConversation(id))}
          className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>
    )
  }, [conversations, toggleStar, startRename, deleteConversation])


  // Play a gentle two-note chime — nicer than a flat beep, soft on ears
  const playChime = useCallback((notes: number[], durationPerNote: number, peakGain: number) => {
    if (effectiveMuted) return
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const now = audioContext.currentTime
      notes.forEach((freq, i) => {
        const osc = audioContext.createOscillator()
        const gain = audioContext.createGain()
        osc.connect(gain)
        gain.connect(audioContext.destination)
        osc.frequency.value = freq
        osc.type = 'sine'
        const start = now + i * durationPerNote * 0.85
        gain.gain.setValueAtTime(0, start)
        gain.gain.linearRampToValueAtTime(peakGain, start + 0.015)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + durationPerNote)
        osc.start(start)
        osc.stop(start + durationPerNote)
      })
    } catch (e) {
      // Silently fail if audio not supported
    }
  }, [effectiveMuted])

  // Send: soft single "pop" — quick, low-key, doesn't compete with receive chime
  const playSendSound = useCallback(() => {
    if (effectiveMuted) return
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const now = audioContext.currentTime
      const osc = audioContext.createOscillator()
      const gain = audioContext.createGain()
      osc.connect(gain)
      gain.connect(audioContext.destination)
      osc.type = 'sine'
      // Quick frequency sweep up = gentle "blip"
      osc.frequency.setValueAtTime(520, now)
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.07)
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.08, now + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09)
      osc.start(now)
      osc.stop(now + 0.1)
    } catch (e) {
      // Silently fail if audio not supported
    }
  }, [effectiveMuted])

  // Receive: soft descending chime (G5 → D5) — warm acknowledgement
  const playReceiveSound = useCallback(() => {
    playChime([783.99, 587.33], 0.18, 0.1)
  }, [playChime])

  const handleSubmit = useCallback(async (input: string, files?: File[], displayOverride?: string) => {
    if (!session || (!input.trim() && !files?.length) || isLoading || isConversationClosed) return

    // Snapshot context at send time from the ref so a chat-switch that just
    // happened (state setter not yet flushed) is still respected. The captured
    // ctx is also used post-await to detect mid-flight switches.
    const sentCtx = convCtxRef.current

    playSendSound()

    // When displayOverride is set (e.g. multiselect confirm), the bubble shows the friendly labels
    // while the backend still receives the structured `input` string with ids.
    const bubbleText = displayOverride ?? input
    const conversationIdAtSend = sentCtx.mode === 'existing' ? sentCtx.id : 0
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      conversationId: conversationIdAtSend,
      role: 'user',
      content: bubbleText + (files?.length ? `\n\n[${files.length} file(s) attached]` : ''),
      timestamp: new Date(),
      contentType: 'text'
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    const autoTitle = sentCtx.mode === 'new' ? bubbleText.substring(0, 40) : null
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const response = await sendChatMessageAPI(
        buildSendPayload(sentCtx, input, autoTitle),
        session,
        controller.signal
      )

      // If the user switched conversations during the request, drop the response.
      // Compare against the live ref — closure state is captured at send time
      // and won't reflect a switch that happened during await.
      const liveCtx = convCtxRef.current
      const stillOnSameConversation = sentCtx.mode === 'existing'
        ? liveCtx.mode === 'existing' && liveCtx.id === sentCtx.id
        // new-chat case: still on the same chat if user hasn't switched at all
        // (still in 'new' mode) or we're now on the conversation the backend
        // just created for this send.
        : liveCtx.mode === 'new' || (liveCtx.mode === 'existing' && liveCtx.id === response.conversationId)

      if (!stillOnSameConversation) {
        return
      }

      if (response.aborted) {
        // User clicked Stop — drop in a small marker so it's clear the reply was halted
        const stoppedMessage: Message = {
          id: `assistant-stopped-${Date.now()}`,
          conversationId: conversationIdAtSend,
          role: 'assistant',
          content: t('The response was interrupted by the user.'),
          timestamp: new Date(),
          contentType: 'text'
        }
        setMessages((prev) => [...prev, stoppedMessage])
      } else if (response.success && response.data) {
        // First reply on a new chat — promote ctx to 'existing' with the backend-assigned id.
        if (sentCtx.mode === 'new' && response.conversationId) {
          setConvCtx({ mode: 'existing', id: response.conversationId })
        }

        // Update user message with real backend MessageID (for edit/resend to work)
        if (response.userMessageId) {
          setMessages(prev => prev.map(m =>
            m.id === userMessage.id ? { ...m, id: response.userMessageId! } : m
          ))
        }

        const aiMessage: Message = {
          id: `assistant-${Date.now()}`,
          conversationId: response.conversationId || conversationIdAtSend,
          role: 'assistant',
          content: response.data,
          timestamp: new Date(),
          contentType: 'text',
          tokens: response.tokens,
          ui_data: response.ui_data
        }
        setMessages((prev) => [...prev, aiMessage])
        playReceiveSound()

        loadConversations()
      } else {
        alerts.showError(t('Error'), response.error || t('Failed to send message'))
      }
    } catch (error) {
      alerts.showError(t('Error'), t('Connection failed'))
    } finally {
      if (abortControllerRef.current === controller) abortControllerRef.current = null
      setIsLoading(false)
    }
  }, [session, isLoading, isConversationClosed, loadConversations, alerts, playSendSound, playReceiveSound, setConvCtx, t])

  const handleExport = useCallback(() => {
    if (messages.length === 0) return

    const conversationText = messages
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n---\n\n')

    const blob = new Blob([conversationText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `conversation-${currentConversationId || 'new'}-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    alerts.showSuccess(t('Exported'), t('Conversation exported successfully'))
  }, [messages, currentConversationId, alerts])

  const handleShare = useCallback(async () => {
    if (messages.length === 0) return

    const conversationText = messages
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n')

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${title} Conversation`,
          text: conversationText
        })
      } else {
        await navigator.clipboard.writeText(conversationText)
      }
    } catch (error) {
      alerts.showError(t('Error'), t('Failed to share conversation'))
    }
  }, [messages, alerts, title])

  const handleEditMessage = useCallback(async (messageId: string, newContent: string) => {
    if (!session || isLoading) return

    // Edit/resend only makes sense on a saved conversation. A "new" chat with
    // no id can't have a prior message to resend against — bail out cleanly.
    const sentCtx = convCtxRef.current
    if (sentCtx.mode !== 'existing') return

    // Find the index of the edited message
    const editIndex = messages.findIndex(m => m.id === messageId)
    if (editIndex === -1) return

    // Backend cleanup: delete messages after this one (cascade delete like legacy)
    if (onBeforeEditMessage) {
      try {
        await onBeforeEditMessage(sentCtx.id, messageId)
      } catch {
        // Continue even if backend cleanup fails — DOM cleanup still works
      }
    }

    // Cascade delete: keep only messages up to and including the edited one.
    // Stamp a fresh client-only id so we can find this exact row later when
    // the backend hands us the real MessageID — matching by content alone
    // would alias to any earlier user message with the same text.
    const optimisticEditedId = `user-edit-${Date.now()}`
    const updatedMessages = messages.slice(0, editIndex).concat({
      ...messages[editIndex],
      id: optimisticEditedId,
      content: newContent
    })
    setMessages(updatedMessages)

    // Resend the edited message
    playSendSound()
    setIsLoading(true)
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const response = await sendChatMessageAPI(
        buildSendPayload(sentCtx, newContent, null),
        session,
        controller.signal
      )

      // Drop the response if user switched conversations during the request.
      const liveCtx = convCtxRef.current
      if (liveCtx.mode !== 'existing' || liveCtx.id !== sentCtx.id) {
        return
      }

      if (response.aborted) {
        // User clicked Stop mid-resend — mark it so they know the reply was interrupted
        const stoppedMessage: Message = {
          id: `assistant-stopped-${Date.now()}`,
          conversationId: sentCtx.id,
          role: 'assistant',
          content: t('The response was interrupted by the user.'),
          timestamp: new Date(),
          contentType: 'text'
        }
        setMessages(prev => [...prev, stoppedMessage])
      } else if (response.success && response.data) {
        // Update the edited user message with new backend MessageID
        if (response.userMessageId) {
          setMessages(prev => prev.map(m =>
            m.id === optimisticEditedId
              ? { ...m, id: response.userMessageId! }
              : m
          ))
        }

        const aiMessage: Message = {
          id: `assistant-${Date.now()}`,
          conversationId: sentCtx.id,
          role: 'assistant',
          content: response.data,
          timestamp: new Date(),
          contentType: 'text',
          tokens: response.tokens,
          ui_data: response.ui_data
        }
        setMessages(prev => [...prev, aiMessage])
        playReceiveSound()
        loadConversations()
      } else {
        alerts.showError(t('Error'), response.error || t('Failed to resend message'))
      }
    } catch (error) {
      alerts.showError(t('Error'), t('Connection failed'))
    } finally {
      if (abortControllerRef.current === controller) abortControllerRef.current = null
      setIsLoading(false)
    }
  }, [session, isLoading, messages, playSendSound, playReceiveSound, loadConversations, alerts, onBeforeEditMessage, t])

  const handleFeedback = useCallback((messageId: string, rating: 'up' | 'down' | null) => {
    if (!session) return
    submitMessageFeedbackAPI(messageId, rating, session)
  }, [session])

  // Regenerate from an AI message — find the user prompt that triggered it and resend
  const handleRegenerateAi = useCallback((aiMessageId: string) => {
    const aiIndex = messages.findIndex(m => m.id === aiMessageId)
    if (aiIndex === -1) return
    for (let i = aiIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        handleEditMessage(messages[i].id, messages[i].content)
        return
      }
    }
  }, [messages, handleEditMessage])

  useEffect(() => {
    if (session && initialMessage && !initialSentRef.current) {
      initialSentRef.current = true
      handleSubmit(initialMessage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, initialMessage])

  // Load a specific conversation on mount (e.g., when expanding floating chat → fullpage via ?c=<id>)
  const initialConvLoadedRef = useRef(false)
  useEffect(() => {
    if (session && initialConversationId && !initialConvLoadedRef.current) {
      initialConvLoadedRef.current = true
      loadConversation(initialConversationId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, initialConversationId])

  // Hijack the sidebar's built-in search input: when the user focuses or clicks
  // it, open the chat-wide search modal instead of typing into the small inline
  // filter. Immediately blur the original so the inline filter doesn't also run.
  // Re-scans on conversations/sidebar-open changes since the SidePanel re-renders.
  useEffect(() => {
    const el = document.querySelector<HTMLInputElement>('[data-sidepanel-search]')
    if (!el) return
    const open = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
      setIsSearchOpen(true)
      // Defer blur so React doesn't fight the focus event in the same tick.
      setTimeout(() => el.blur(), 0)
    }
    el.addEventListener('focus', open)
    el.addEventListener('mousedown', open)
    return () => {
      el.removeEventListener('focus', open)
      el.removeEventListener('mousedown', open)
    }
  }, [isSidebarOpen, conversations.length, mode, isFloatingOpen])

  const handleSelectItem = useCallback((item: SelectableItem) => {
    // When user selects from list, auto-send as message.
    // If the item carries a messageText (e.g. multiselect "Selected: ... (ids: ...)"), that goes
    // to the backend while item.name remains the bubble text shown to the user.
    const wire = item.messageText ?? item.name
    const display = item.messageText ? item.name : undefined
    handleSubmit(wire, undefined, display)
  }, [handleSubmit])

  // Keyboard shortcuts — only active when the chat UI is mounted/visible.
  // Floating widget: only when open. Others: always.
  useEffect(() => {
    const active = mode !== 'floating' || isFloatingOpen
    if (!active) return
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      // Ctrl/Cmd + ↓ → scroll to bottom
      if (mod && !e.shiftKey && e.key === 'ArrowDown') {
        e.preventDefault()
        scrollToBottom()
        return
      }
      // Ctrl/Cmd + ↑ → scroll to top
      if (mod && !e.shiftKey && e.key === 'ArrowUp') {
        e.preventDefault()
        scrollToTop()
        return
      }
      // Ctrl/Cmd + Shift + O → new chat
      if (mod && e.shiftKey && (e.key === 'O' || e.key === 'o')) {
        e.preventDefault()
        startNewChat()
        return
      }
      // Ctrl/Cmd + K → focus chat input
      if (mod && !e.shiftKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        const el = document.querySelector<HTMLTextAreaElement>('textarea[data-chat-input]')
        el?.focus()
        return
      }
      // Ctrl/Cmd + Shift + K → open search-chats modal
      if (mod && e.shiftKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        setIsSearchOpen(true)
        return
      }
      // "/" while not typing → open search-chats modal (matches sidebar UX)
      if (e.key === '/' && !mod) {
        const target = e.target as HTMLElement | null
        const tag = (target?.tagName || '').toLowerCase()
        const isEditable = tag === 'input' || tag === 'textarea' || target?.isContentEditable
        if (!isEditable) {
          e.preventDefault()
          setIsSearchOpen(true)
          return
        }
      }
      // Esc → stop generation if loading; otherwise close sidebar if open
      if (e.key === 'Escape') {
        if (isLoading) {
          e.preventDefault()
          handleStop()
          return
        }
        if (isSidebarOpen) {
          e.preventDefault()
          setIsSidebarOpen(false)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mode, isFloatingOpen, isLoading, isSidebarOpen, scrollToBottom, scrollToTop, startNewChat, handleStop])

  // Resolve the messages component
  const ResolvedMessages = MessagesComponent || Messages

  // Default logo fallback
  const logoElement = logo || <Bot className="w-4 h-4 text-[rgb(var(--fg-muted))]" />
  const bubbleLogoElement = bubbleLogo || logoElement

  // ── Draggable floating bubble state ──────────────────────────────────
  const [bubblePos, setBubblePos] = useState<{ x: number; y: number } | null>(null)
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number; dragged: boolean } | null>(null)
  const bubbleRef = useRef<HTMLButtonElement>(null)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const el = bubbleRef.current
    if (!el) return
    el.setPointerCapture(e.pointerId)

    const rect = el.getBoundingClientRect()
    const posX = bubblePos?.x ?? (window.innerWidth - rect.right + rect.width / 2)
    const posY = bubblePos?.y ?? (window.innerHeight - rect.bottom + rect.height / 2)

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: posX,
      startPosY: posY,
      dragged: false,
    }
  }, [bubblePos])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY

    if (!dragRef.current.dragged && Math.abs(dx) + Math.abs(dy) > 5) {
      dragRef.current.dragged = true
    }

    if (dragRef.current.dragged) {
      // Position is stored as distance from right/bottom edges
      const newX = Math.max(8, Math.min(window.innerWidth - 64, dragRef.current.startPosX - dx))
      const newY = Math.max(8, Math.min(window.innerHeight - 64, dragRef.current.startPosY - dy))
      setBubblePos({ x: newX, y: newY })
    }
  }, [])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return
    const wasDragged = dragRef.current.dragged
    dragRef.current = null

    if (!wasDragged) {
      setIsFloatingOpen(true)
    }
  }, [])

  // ── Draggable panel state (header as drag handle) ────────────────────
  const [panelPos, setPanelPos] = useState<{ x: number; y: number } | null>(null)
  const panelDragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number; dragged: boolean } | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const handlePanelPointerDown = useCallback((e: React.PointerEvent) => {
    // Don't drag if clicking on buttons inside the header
    if ((e.target as HTMLElement).closest('button')) return
    const el = panelRef.current
    if (!el) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)

    const rect = el.getBoundingClientRect()
    const posX = panelPos?.x ?? (window.innerWidth - rect.right)
    const posY = panelPos?.y ?? (window.innerHeight - rect.bottom)

    panelDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: posX,
      startPosY: posY,
      dragged: false,
    }
  }, [panelPos])

  const handlePanelPointerMove = useCallback((e: React.PointerEvent) => {
    if (!panelDragRef.current) return
    const dx = e.clientX - panelDragRef.current.startX
    const dy = e.clientY - panelDragRef.current.startY

    if (!panelDragRef.current.dragged && Math.abs(dx) + Math.abs(dy) > 5) {
      panelDragRef.current.dragged = true
    }

    if (panelDragRef.current.dragged) {
      const newX = Math.max(0, Math.min(window.innerWidth - 200, panelDragRef.current.startPosX - dx))
      const newY = Math.max(0, Math.min(window.innerHeight - 100, panelDragRef.current.startPosY - dy))
      setPanelPos({ x: newX, y: newY })
    }
  }, [])

  const handlePanelPointerUp = useCallback(() => {
    panelDragRef.current = null
  }, [])

  // Filtered + bucketed results for the search modal. Text match is OR over title
  // and ContactNo; date range filters by CreatedAt. Same bucketing as the sidebar
  // so the modal feels consistent with what users see in the side list.
  const searchResults = (() => {
    const q = searchQuery.trim().toLowerCase()
    const fromTs = searchFrom ? new Date(searchFrom + 'T00:00:00').getTime() : null
    const toTs = searchTo ? new Date(searchTo + 'T23:59:59').getTime() : null
    const filtered = conversations.filter(c => {
      if (q) {
        const title = (c.Title || '').toLowerCase()
        const contact = (c.ContactNo || '').toLowerCase()
        if (!title.includes(q) && !contact.includes(q)) return false
      }
      if ((fromTs || toTs) && c.CreatedAt) {
        const ts = new Date(c.CreatedAt).getTime()
        if (fromTs && ts < fromTs) return false
        if (toTs && ts > toTs) return false
      }
      return true
    })
    const groups = new Map<string, { label: string; sort: number; items: typeof filtered }>()
    filtered.forEach(c => {
      const b = bucketForDate(c.CreatedAt)
      if (!groups.has(b.id)) groups.set(b.id, { label: b.label, sort: b.sort, items: [] })
      groups.get(b.id)!.items.push(c)
    })
    return Array.from(groups.entries())
      .sort((a, b) => b[1].sort - a[1].sort)
      .map(([id, g]) => ({ id, label: g.label, items: g.items }))
  })()

  const searchModal = isSearchOpen ? (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 bg-black/50 backdrop-blur-sm"
      onClick={() => setIsSearchOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--bd-default))] rounded-xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgb(var(--bd-default))]">
          <Search className="w-4 h-4 text-[rgb(var(--fg-muted))] shrink-0" />
          <input
            autoFocus
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('Search chats...')}
            className="flex-1 bg-transparent outline-none text-sm text-[rgb(var(--fg-default))] placeholder:text-[rgb(var(--fg-muted))]"
            onKeyDown={e => { if (e.key === 'Escape') setIsSearchOpen(false) }}
          />
          <button
            onClick={() => setIsSearchOpen(false)}
            className="h-7 w-7 rounded-md hover:bg-[rgb(var(--bg-subtle))] flex items-center justify-center text-[rgb(var(--fg-muted))]"
            aria-label={t('Close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[rgb(var(--bd-default))] text-xs text-[rgb(var(--fg-muted))]">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap shrink-0">{t('Date range')}</span>
          <DatePicker
            mode="range"
            showFromTo
            placeholder={t('Select date range...')}
            value={{
              from: searchFrom ? new Date(searchFrom + 'T00:00:00') : undefined,
              to: searchTo ? new Date(searchTo + 'T00:00:00') : undefined,
            }}
            onChange={(val) => {
              const range = (val && typeof val === 'object' && 'from' in val) ? val as DateRange : { from: undefined, to: undefined }
              setSearchFrom(range.from ? getLocalDateString(range.from) : '')
              setSearchTo(range.to ? getLocalDateString(range.to) : '')
            }}
          />
          {(searchFrom || searchTo || searchQuery) && (
            <button
              onClick={() => { setSearchFrom(''); setSearchTo(''); setSearchQuery('') }}
              className="ml-auto px-2 py-1 rounded hover:bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))]"
            >
              {t('Clear')}
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {searchResults.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[rgb(var(--fg-muted))]">
              {t('No chats found')}
            </div>
          ) : (
            searchResults.map(group => (
              <div key={group.id} className="mb-2">
                <div className="px-4 py-1 text-[0.6875rem] uppercase tracking-wide text-[rgb(var(--fg-muted))] font-medium">
                  {group.label}
                </div>
                {group.items.map(c => (
                  <button
                    key={c.ConversationID}
                    onClick={() => {
                      loadConversation(c.ConversationID)
                      setIsSearchOpen(false)
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-[rgb(var(--bg-subtle))] text-left"
                  >
                    {(c.IsStarred === 1 || c.IsStarred === true) && (
                      <Star className="w-3 h-3 shrink-0 fill-current text-[rgb(var(--color-primary))]" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[rgb(var(--fg-default))] truncate">
                        {c.Title || `Conversation ${c.ConversationID}`}
                      </div>
                      {c.CreatedAt && (
                        <div className="text-[0.6875rem] text-[rgb(var(--fg-muted))] truncate">
                          {formatConversationStamp(c.CreatedAt)}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  ) : null

  // Floating Widget Mode — bubble + backdrop + panel chrome wrapping the regular chat
  if (mode === 'floating') {
    if (!isFloatingOpen) {
      return (
        <button
          ref={bubbleRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={cn(
            "fixed z-50 touch-none select-none cursor-pointer",
            "h-14 w-14 rounded-full",
            "bg-[rgb(var(--bg-surface))]",
            "flex items-center justify-center",
            "hover:scale-110",
            "transition-shadow duration-200 ease-out",
            "border border-[rgb(var(--bd-default))]",
            "shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)]",
            !dragRef.current?.dragged && "animate-floating-bubble"
          )}
          style={{
            right: bubblePos ? `${bubblePos.x}px` : '16px',
            bottom: bubblePos ? `${bubblePos.y}px` : '16px',
          }}
          aria-label={t('Open chat')}
        >
          {bubbleLogoElement}
        </button>
      )
    }

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          onClick={() => setIsFloatingOpen(false)}
        />

        {/* Chat Container */}
        <div
          ref={panelRef}
          className={cn(
            "fixed z-50 flex flex-col",
            "bg-[rgb(var(--bg-surface))] rounded-xl shadow-2xl overflow-hidden",
            "border border-[rgb(var(--bd-default))]",
            !panelPos && "animate-in slide-in-from-bottom-4 duration-300",
            "inset-4 md:inset-auto",
            "md:w-[480px] md:h-[680px]"
          )}
          style={{
            ...(panelPos
              ? { right: `${panelPos.x}px`, bottom: `${panelPos.y}px` }
              : { right: '16px', bottom: '16px' }
            ),
          }}
        >
          {/* Floating Header — drag handle */}
          <div
            onPointerDown={handlePanelPointerDown}
            onPointerMove={handlePanelPointerMove}
            onPointerUp={handlePanelPointerUp}
            className="h-12 px-3 flex items-center justify-between border-b border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))] shrink-0 cursor-move touch-none select-none"
          >
            <div className="flex items-center gap-2.5">
              {logoElement}
              <span className="font-semibold text-sm text-[rgb(var(--fg-default))]">{title}</span>
              {process.env.NEXT_PUBLIC_SHOW_TOKENS === 'true' && currentConversationId && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-muted))]">
                  Conversation ID: #{currentConversationId}
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="h-7 w-7 rounded-md hover:bg-[rgb(var(--bg-subtle))] flex items-center justify-center text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] transition-colors"
                title={isMuted ? "Unmute sounds" : "Mute sounds"}
              >
                {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={handleExport}
                className="h-7 w-7 rounded-md hover:bg-[rgb(var(--bg-subtle))] flex items-center justify-center text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] transition-colors"
                title={t('Export')}
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleShare}
                className="h-7 w-7 rounded-md hover:bg-[rgb(var(--bg-subtle))] flex items-center justify-center text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] transition-colors"
                title={t('Share')}
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
              {fullpagePath && (
                <button
                  onClick={() => {
                    setIsFloatingOpen(false)
                    const target = currentConversationId
                      ? `${fullpagePath}?c=${currentConversationId}`
                      : fullpagePath
                    router.push(target)
                  }}
                  disabled={isLoading && !currentConversationId}
                  className="h-7 w-7 rounded-md hover:bg-[rgb(var(--bg-subtle))] flex items-center justify-center text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  title={isLoading && !currentConversationId ? 'Wait for first reply to expand' : 'Open fullpage'}
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsFloatingOpen(false)}
                className="h-7 w-7 rounded-md hover:bg-[rgb(var(--bg-subtle))] flex items-center justify-center text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] transition-colors"
                aria-label={t('Close chat')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Chat Body — same state, no nested Chat */}
          <div className="flex-1 flex min-h-0 overflow-hidden bg-[rgb(var(--bg-app))]">
            <SidePanel
              title={sidebarTitle || title}
              categories={conversationCategories}
              activeItemId={String(currentConversationId)}
              onItemSelect={(id) => loadConversation(parseInt(id))}
              actionButton={{
                label: 'New Chat',
                icon: Plus,
                onClick: startNewChat
              }}
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              showSearch={true}
              collapsible={true}
              defaultCollapsed={true}
              showItemIcons={false}
              itemContextMenu={renderConversationMenu}
              recentsAction={groupingToggle}
            />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <div className="relative flex-1 min-h-0">
                <div ref={messagesScrollRef} className="absolute inset-0 overflow-y-auto">
                  <ResolvedMessages
                    messages={messages}
                    isLoading={isLoading}
                    onSelectItem={handleSelectItem}
                    onEditMessage={handleEditMessage}
                    onRegenerateAi={handleRegenerateAi}
                    onFeedback={handleFeedback}
                  />
                </div>
                {showScrollDown && (
                  <button
                    type="button"
                    onClick={scrollToBottom}
                    aria-label={t('Scroll to bottom')}
                    className="absolute left-1/2 -translate-x-1/2 bottom-3 z-10 w-11 h-11 lg:w-8 lg:h-8 rounded-full bg-[rgb(var(--bg-surface))] border border-[rgb(var(--bd-default))] shadow-md hover:bg-[rgb(var(--bg-hover))] hover:shadow-lg flex items-center justify-center transition-all"
                  >
                    <ChevronDown className="w-4 h-4 text-[rgb(var(--fg-default))]" />
                  </button>
                )}
              </div>
              <MultimodalInput
                onSubmit={handleSubmit}
                onStop={handleStop}
                isLoading={isLoading}
                allowFileUpload={false}
                compact={true}
                disabled={isConversationClosed}
                disabledReason={isConversationClosed ? 'This conversation has reached its limit. Start a new chat to continue.' : undefined}
              />
            </div>
          </div>
        </div>
        {searchModal}
      </>
    )
  }

  // Regular Chat Mode (fullpage, modal)
  return (
    <div
      className={cn(
        'flex h-full w-full overflow-hidden',
        mode === 'fullpage' && 'bg-[rgb(var(--bg-app))]'
      )}
    >
      {/* Sidebar */}
      <SidePanel
        title={sidebarTitle || title}
        categories={conversationCategories}
        activeItemId={String(currentConversationId)}
        onItemSelect={(id) => loadConversation(parseInt(id))}
        actionButton={{
          label: 'New Chat',
          icon: Plus,
          onClick: startNewChat
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        showSearch={true}
        collapsible={true}
        defaultCollapsed={mode === 'widget'}
        showItemIcons={false}
        itemContextMenu={renderConversationMenu}
        recentsAction={groupingToggle}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[rgb(var(--bg-app))]">
        {/* Mobile Header */}
        <div className="md:hidden h-12 flex items-center justify-between px-3 border-b border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))] shrink-0">
          {/* Left: sidebar toggle + logo + title */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-8 h-8 flex items-center justify-center text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-subtle))] rounded-lg transition-colors shrink-0"
              title={t('Chat history')}
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
            {logo && <div className="shrink-0">{logo}</div>}
            <span className="font-semibold text-sm text-[rgb(var(--fg-default))] truncate">{title}</span>
            {process.env.NEXT_PUBLIC_SHOW_TOKENS === 'true' && currentConversationId && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-muted))] shrink-0">
                Conversation ID: #{currentConversationId}
              </span>
            )}
          </div>
          {/* Right: new chat + actions */}
          <div className="flex items-center gap-0.5 shrink-0">
            {headerActions}
            <button
              onClick={startNewChat}
              className="w-8 h-8 flex items-center justify-center text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary))]/5 rounded-lg transition-colors"
              title={t('New chat')}
            >
              <Plus className="w-4 h-4" />
            </button>
            {messages.length > 0 && (
              <>
                <button
                  onClick={handleExport}
                  className="w-8 h-8 flex items-center justify-center text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-subtle))] rounded-lg transition-colors"
                  title={t('Export')}
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleShare}
                  className="w-8 h-8 flex items-center justify-center text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-subtle))] rounded-lg transition-colors"
                  title={t('Share')}
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            {fullpagePath && mode === 'modal' && (
              <button
                onClick={() => {
                  const target = currentConversationId
                    ? `${fullpagePath}?c=${currentConversationId}`
                    : fullpagePath
                  router.push(target)
                }}
                disabled={isLoading && !currentConversationId}
                className="w-8 h-8 flex items-center justify-center text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-subtle))] rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                title={isLoading && !currentConversationId ? 'Wait for first reply to expand' : 'Open fullpage'}
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        {/* Desktop header with actions */}
        <div className="hidden md:flex h-10 items-center justify-center px-3 border-b border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))] shrink-0 relative">
            {/* Conversation ID — left */}
            {process.env.NEXT_PUBLIC_SHOW_TOKENS === 'true' && currentConversationId && (
              <span className="absolute left-3 text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-muted))]">
                Conversation ID: #{currentConversationId}
              </span>
            )}
            {/* Token counter — centered */}
            {process.env.NEXT_PUBLIC_SHOW_TOKENS === 'true' && messages.length > 0 && (() => {
              const totals = messages.reduce((acc, m) => {
                if (m.tokens) { acc.prompt += m.tokens.prompt; acc.completion += m.tokens.completion; acc.total += m.tokens.total }
                return acc
              }, { prompt: 0, completion: 0, total: 0 })
              if (totals.total === 0) return null
              return (
                <span className="text-[0.65rem] text-[rgb(var(--fg-muted))] font-mono">
                  Prompt: {totals.prompt.toLocaleString()} · Response: {totals.completion.toLocaleString()} · Total: {totals.total.toLocaleString()} tokens · {messages.filter(m => m.tokens).length} calls
                </span>
              )
            })()}
            <div className="absolute right-3 flex items-center gap-0.5">
              {headerActions}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="w-7 h-7 flex items-center justify-center text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-subtle))] rounded-md transition-colors"
                title={isMuted ? "Unmute sounds" : "Mute sounds"}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              {messages.length > 0 && (
                <>
                  <button
                    onClick={handleExport}
                    className="w-7 h-7 flex items-center justify-center text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-subtle))] rounded-md transition-colors"
                    title={t('Export')}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-7 h-7 flex items-center justify-center text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-subtle))] rounded-md transition-colors"
                    title={t('Share')}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              {fullpagePath && mode === 'modal' && (
                <button
                  onClick={() => {
                    const target = currentConversationId
                      ? `${fullpagePath}?c=${currentConversationId}`
                      : fullpagePath
                    router.push(target)
                  }}
                  disabled={isLoading && !currentConversationId}
                  title={isLoading && !currentConversationId ? 'Wait for first reply to expand' : 'Open fullpage'}
                  className="w-7 h-7 flex items-center justify-center text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-subtle))] rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

        {/* Messages */}
        <div className="relative flex-1 min-h-0">
          <div ref={messagesScrollRef} className="absolute inset-0 overflow-y-auto">
            <ResolvedMessages
              messages={messages}
              isLoading={isLoading}
              onSelectItem={handleSelectItem}
              onEditMessage={handleEditMessage}
              onRegenerateAi={handleRegenerateAi}
              onFeedback={handleFeedback}
            />
          </div>
          {showScrollDown && (
            <button
              type="button"
              onClick={scrollToBottom}
              aria-label={t('Scroll to bottom')}
              className="absolute left-1/2 -translate-x-1/2 bottom-3 z-10 w-11 h-11 lg:w-8 lg:h-8 rounded-full bg-[rgb(var(--bg-surface))] border border-[rgb(var(--bd-default))] shadow-md hover:bg-[rgb(var(--bg-hover))] hover:shadow-lg flex items-center justify-center transition-all"
            >
              <ChevronDown className="w-4 h-4 text-[rgb(var(--fg-default))]" />
            </button>
          )}
          {mode === 'fullpage' && (
            <ChatPromptNavigator messages={messages} scrollContainer={findScroller} moduleName={title} />
          )}
        </div>

        {/* Input */}
        <MultimodalInput
          onSubmit={handleSubmit}
          onStop={handleStop}
          isLoading={isLoading}
          allowFileUpload={false}
          compact={mode === 'widget'}
          disabled={isConversationClosed}
          disabledReason={isConversationClosed ? 'This conversation has reached its limit. Start a new chat to continue.' : undefined}
        />
      </div>

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      {searchModal}
    </div>
  )
}
