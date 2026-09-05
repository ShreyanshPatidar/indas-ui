'use client'

import { useState, useMemo, useCallback, memo } from 'react'
import { Search, Plus, MessageSquare, Users, Hash, X } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { useMessaging } from '@/contexts/MessagingContext'
import type { ChatRoom } from '@/lib/api/activity/messaging/messaging'
import { parseParticipants } from '@/lib/api/activity/messaging/messaging'

// ── Avatar helpers (exported for reuse in other messaging components) ──────

const AVATAR_COLORS = [
  'bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-amber-600',
  'bg-rose-600', 'bg-cyan-600', 'bg-indigo-600', 'bg-teal-600',
]

export function getAvatarColor(id: string | number) {
  const str = String(id)
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return ''
  // Backend stores UTC (GETUTCDATE) — append Z if no timezone indicator so JS parses as UTC
  const normalized = dateStr.endsWith('Z') || dateStr.includes('+') || dateStr.includes('T') && dateStr.match(/[+-]\d{2}:\d{2}$/)
    ? dateStr
    : dateStr.replace(' ', 'T') + 'Z'
  const date = new Date(normalized)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffMin < 1) return 'now'
  if (diffMin < 60) return `${diffMin}m`
  if (diffHr < 24) return `${diffHr}h`
  if (diffDay < 7) return `${diffDay}d`
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

// ── ConversationListItem ──────────────────────────────────────────────────

interface ConversationListItemProps {
  room: ChatRoom
  isActive: boolean
  unreadCount: number
  isOnline?: boolean
  currentUserId: string
  onClick: () => void
}

const ConversationListItem = memo(function ConversationListItem({
  room,
  isActive,
  unreadCount,
  isOnline,
  currentUserId,
  onClick
}: ConversationListItemProps) {
  const { t } = useLanguage()

  const displayName = (() => {
    if (room.Type === 'DM') {
      const participants = parseParticipants(room.Participants)
      const other = participants.find(p => String(p.userId) !== currentUserId)
      return other?.userName || room.Name || t('Direct Message')
    }
    return room.Name || t('Unnamed')
  })()

  const avatarId = room.Type === 'DM'
    ? (() => {
        const participants = parseParticipants(room.Participants)
        const other = participants.find(p => String(p.userId) !== currentUserId)
        return String(other?.userId || room.RoomID)
      })()
    : String(room.RoomID)

  const typeIcon = room.Type === 'Channel' ? '#' : room.Type === 'Group' ? '' : null
  const participantCount = room.Type !== 'DM'
    ? parseParticipants(room.Participants).length
    : 0

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left',
        'hover:bg-[rgb(var(--bg-hover))]',
        isActive && 'bg-[rgb(var(--bg-surface-active))]'
      )}
    >
      <div className="relative flex-shrink-0">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium',
            getAvatarColor(avatarId)
          )}
        >
          {typeIcon ? (
            <span className="text-lg font-bold">{typeIcon}</span>
          ) : (
            getInitials(displayName)
          )}
        </div>
        {room.Type === 'DM' && isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[rgb(var(--bg-surface))]" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn(
            'text-sm truncate',
            unreadCount > 0 ? 'font-semibold text-[rgb(var(--fg-default))]' : 'font-medium text-[rgb(var(--fg-default))]'
          )}>
            {displayName}
          </span>
          <span className="text-xs text-[rgb(var(--fg-muted))] flex-shrink-0">
            {formatRelativeTime(room.LastMessageAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className={cn(
            'text-xs truncate',
            unreadCount > 0 ? 'text-[rgb(var(--fg-default))]' : 'text-[rgb(var(--fg-muted))]'
          )}>
            {room.LastMessagePreview || (participantCount > 0 ? `${participantCount} ${t('members')}` : t('No messages yet'))}
          </span>
          {unreadCount > 0 && (
            <span className="flex-shrink-0 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-[rgb(var(--color-primary))] text-white text-xs font-medium flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
})

// ── ConversationList ──────────────────────────────────────────────────────

type FilterTab = 'All' | 'DM' | 'Group' | 'Channel'

interface ConversationListProps {
  currentUserId: string
  onSelectRoom: (room: ChatRoom) => void
  onNewConversation: () => void
  activeRoomId: number | null
  className?: string
}

export function ConversationList({
  currentUserId,
  onSelectRoom,
  onNewConversation,
  activeRoomId,
  className
}: ConversationListProps) {
  const { t } = useLanguage()
  const { state, actions } = useMessaging()
  const [filter, setFilter] = useState<FilterTab>('All')
  const [searchText, setSearchText] = useState('')

  const filteredConversations = useMemo(() => {
    let list = state.conversations

    if (filter !== 'All') {
      list = list.filter(c => c.Type === filter)
    }

    if (searchText.trim()) {
      const q = searchText.toLowerCase()
      list = list.filter(c =>
        c.Name?.toLowerCase().includes(q) ||
        c.LastMessagePreview?.toLowerCase().includes(q)
      )
    }

    return [...list].sort((a, b) => {
      const aTime = a.LastMessageAt ? new Date(a.LastMessageAt).getTime() : 0
      const bTime = b.LastMessageAt ? new Date(b.LastMessageAt).getTime() : 0
      return bTime - aTime
    })
  }, [state.conversations, filter, searchText])

  const tabs: { key: FilterTab; icon: any; label: string }[] = [
    { key: 'All', icon: MessageSquare, label: t('All') },
    { key: 'DM', icon: MessageSquare, label: t('DMs') },
    { key: 'Group', icon: Users, label: t('Groups') },
    { key: 'Channel', icon: Hash, label: t('Channels') },
  ]

  const handleSelectRoom = useCallback((room: ChatRoom) => {
    onSelectRoom(room)
  }, [onSelectRoom])

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex-shrink-0 px-3 pt-3 pb-2 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[rgb(var(--fg-default))]">{t('Messages')}</h2>
          <button
            onClick={onNewConversation}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--fg-muted))] transition-colors"
            title={t('New conversation')}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--fg-muted))]" />
          <input
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder={t('Search conversations...')}
            className="w-full h-8 pl-8 pr-8 rounded-lg bg-[rgb(var(--bg-subtle))] text-sm text-[rgb(var(--fg-default))] placeholder:text-[rgb(var(--fg-muted))] border border-[rgb(var(--bd-default))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))]"
          />
          {searchText && (
            <button
              onClick={() => setSearchText('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[rgb(var(--fg-muted))]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                'flex-1 py-1 px-2 rounded-md text-xs font-medium transition-colors',
                filter === tab.key
                  ? 'bg-[rgb(var(--color-primary))] text-white'
                  : 'text-[rgb(var(--fg-muted))] hover:bg-[rgb(var(--bg-hover))]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-1.5 py-1">
        {state.loadingConversations ? (
          <div className="space-y-2 px-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3 py-2.5 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-[rgb(var(--bg-subtle))]" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-24 rounded bg-[rgb(var(--bg-subtle))]" />
                  <div className="h-3 w-40 rounded bg-[rgb(var(--bg-subtle))]" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[rgb(var(--fg-muted))]">
            <MessageSquare className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-sm">{searchText ? t('No conversations found') : t('No conversations yet')}</p>
            {!searchText && (
              <button
                onClick={onNewConversation}
                className="mt-2 text-xs text-[rgb(var(--color-primary))] hover:underline"
              >
                {t('Start a conversation')}
              </button>
            )}
          </div>
        ) : (
          filteredConversations.map(room => (
            <ConversationListItem
              key={room.RoomID}
              room={room}
              isActive={activeRoomId === room.RoomID}
              unreadCount={state.unreadCounts[room.RoomID] || 0}
              isOnline={room.Type === 'DM' ? actions.isUserOnline(room.RoomID) : undefined}
              currentUserId={currentUserId}
              onClick={() => handleSelectRoom(room)}
            />
          ))
        )}
      </div>
    </div>
  )
}
