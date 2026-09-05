'use client'

import { useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Send, RefreshCw } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSession } from 'next-auth/react'
import { useMessaging } from '@/contexts/MessagingContext'
import { parseParticipants } from '@/lib/api/activity/messaging/messaging'
import { getAvatarColor, getInitials, formatRelativeTime } from './conversation-list'
import { Button } from '@/components/ui'

interface MessagingPanelContentProps {
  onClose: () => void
}

export function MessagingPanelContent({ onClose }: MessagingPanelContentProps) {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const { state, actions } = useMessaging()
  const router = useRouter()

  const currentUserId = String(
    (session?.user as any)?.UserID || (session?.user as any)?.userID || ''
  )

  // Fetch conversations on mount if not already loaded
  useEffect(() => {
    if (state.conversations.length === 0) {
      actions.fetchConversations()
    }
  }, [state.conversations.length, actions])

  // Sort by recent, take top 8
  const recentConversations = useMemo(() => {
    return [...state.conversations]
      .sort((a, b) => {
        const aTime = a.LastMessageAt ? new Date(a.LastMessageAt).getTime() : 0
        const bTime = b.LastMessageAt ? new Date(b.LastMessageAt).getTime() : 0
        return bTime - aTime
      })
      .slice(0, 8)
  }, [state.conversations])

  const handleConvClick = useCallback((roomId: number) => {
    router.push(`/activity/messages?conv=${roomId}`)
    onClose()
  }, [router, onClose])

  const handleViewAll = useCallback(() => {
    router.push('/activity/messages')
    onClose()
  }, [router, onClose])

  const handleNewMessage = useCallback(() => {
    router.push('/activity/messages')
    onClose()
  }, [router, onClose])

  return (
    <>
      {/* Header — matches Email panel pattern */}
      <div className="p-4 border-b border-[rgb(var(--bd-default))]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[rgb(var(--fg-default))]">{t('Recent')}</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => actions.fetchConversations()}
              disabled={state.loadingConversations}
              className="p-1.5"
              title={t('Refresh')}
            >
              <RefreshCw className={cn('h-4 w-4', state.loadingConversations && 'animate-spin')} />
            </Button>
            <Button
              size="sm"
              onClick={handleNewMessage}
              className="h-8 px-3"
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              {t('New Chat')}
            </Button>
          </div>
        </div>
        {state.totalUnreadCount > 0 && (
          <div className="text-xs text-[rgb(var(--fg-muted))] mt-1">
            {state.totalUnreadCount} {t('unread')}
          </div>
        )}
      </div>

      {/* Conversation list */}
      <div className="max-h-[500px] overflow-y-auto">
        {state.loadingConversations ? (
          <div className="space-y-1 p-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-[rgb(var(--bg-subtle))]" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-20 rounded bg-[rgb(var(--bg-subtle))]" />
                  <div className="h-2.5 w-32 rounded bg-[rgb(var(--bg-subtle))]" />
                </div>
              </div>
            ))}
          </div>
        ) : recentConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-[rgb(var(--fg-muted))]">
            <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm font-medium mb-1">{t('No messages yet')}</p>
            <p className="text-xs">{t('Start a conversation')}</p>
          </div>
        ) : (
          <div className="divide-y divide-[rgb(var(--bd-subtle))]">
            {recentConversations.map(room => {
              const unread = state.unreadCounts[room.RoomID] || 0
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

              return (
                <div
                  key={room.RoomID}
                  onClick={() => handleConvClick(room.RoomID)}
                  className={cn(
                    'flex items-start gap-3 p-3 hover:bg-[rgb(var(--bg-hover))] transition-colors cursor-pointer',
                    unread > 0 && 'bg-[rgb(var(--bg-subtle))]'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0',
                    getAvatarColor(avatarId)
                  )}>
                    {room.Type === 'Channel' ? '#' : getInitials(displayName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <span className={cn(
                        'text-sm truncate',
                        unread > 0 ? 'font-semibold text-[rgb(var(--fg-default))]' : 'font-medium text-[rgb(var(--fg-muted))]'
                      )}>
                        {displayName}
                      </span>
                      <span className="text-xs text-[rgb(var(--fg-muted))] flex-shrink-0">
                        {formatRelativeTime(room.LastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn(
                        'text-xs truncate',
                        unread > 0 ? 'text-[rgb(var(--fg-default))]' : 'text-[rgb(var(--fg-muted))]'
                      )}>
                        {room.LastMessagePreview || t('No messages')}
                      </span>
                      {unread > 0 && (
                        <span className="flex-shrink-0 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-[rgb(var(--color-primary))] text-white text-[0.625rem] font-bold flex items-center justify-center">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer — matches Email panel pattern */}
      <div className="p-3 border-t border-[rgb(var(--bd-subtle))] bg-[rgb(var(--bg-subtle))]">
        <button
          onClick={handleViewAll}
          className="block w-full text-center text-sm text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-hover))] font-medium transition-colors py-1"
        >
          {t('View All Messages')}
        </button>
      </div>
    </>
  )
}
