'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ArrowLeft, Phone, Video, MoreVertical, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { useMessaging } from '@/contexts/MessagingContext'
import { MessageBubble } from './message-bubble'
import { MessageInput } from './message-input'
import { parseParticipants } from '@/lib/api/activity/messaging/messaging'
import { getAvatarColor, getInitials } from './conversation-list'
import type { ChatRoom, ChatMessage, ChatAttachment } from '@/lib/api/activity/messaging/messaging'

interface MessageThreadProps {
  room: ChatRoom
  currentUserId: string
  onBack: () => void // mobile back
  onOpenThread: (messageId: number) => void
  className?: string
}

export function MessageThread({
  room,
  currentUserId,
  onBack,
  onOpenThread,
  className
}: MessageThreadProps) {
  const { t } = useLanguage()
  const { state, actions } = useMessaging()
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const prevMessageCountRef = useRef(0)

  const messages = state.messages[room.RoomID] || []
  const pagination = state.messagePagination[room.RoomID]
  const typingUsers = actions.getTypingUsers(room.RoomID)

  // Display name for header
  const displayName = useMemo(() => {
    if (room.Type === 'DM') {
      const participants = parseParticipants(room.Participants)
      const other = participants.find(p => String(p.userId) !== currentUserId)
      return other?.userName || room.Name || t('Direct Message')
    }
    return room.Name || t('Unnamed')
  }, [room, currentUserId, t])

  const participants = useMemo(() => parseParticipants(room.Participants), [room.Participants])
  const memberCount = participants.length

  // Build sender name map
  const senderNames = useMemo(() => {
    const map: Record<number, string> = {}
    for (const p of participants) {
      map[p.userId] = p.userName
    }
    return map
  }, [participants])

  // DM partner online status
  const isDMPartnerOnline = useMemo(() => {
    if (room.Type !== 'DM') return false
    const other = participants.find(p => String(p.userId) !== currentUserId)
    return other ? actions.isUserOnline(other.userId) : false
  }, [room.Type, participants, currentUserId, actions])

  // Fetch messages + join SignalR group on mount
  useEffect(() => {
    actions.fetchMessages(room.RoomID)
    actions.joinConversation(room.RoomID)

    return () => {
      actions.leaveConversation(room.RoomID)
    }
  }, [room.RoomID, actions])

  // Auto-scroll to bottom on new messages (only if already near bottom)
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
    const isNewMessage = messages.length > prevMessageCountRef.current

    if (isNearBottom || isNewMessage) {
      messagesEndRef.current?.scrollIntoView({ behavior: isNewMessage ? 'smooth' : 'auto' })
    }
    prevMessageCountRef.current = messages.length
  }, [messages.length])

  // Mark as read when viewing
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      actions.markAsRead(room.RoomID, lastMsg.MessageID)
    }
  }, [room.RoomID, messages, actions])

  // Load more on scroll to top
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return
    if (container.scrollTop < 50 && pagination?.hasMore && !state.loadingMessages) {
      actions.fetchMoreMessages(room.RoomID)
    }
  }, [pagination, state.loadingMessages, room.RoomID, actions])

  const handleSend = useCallback((content: string, attachments?: ChatAttachment[]) => {
    const request: any = { Content: content }
    if (attachments) {
      request.AttachmentsJson = JSON.stringify(attachments)
    }
    if (replyTo) {
      actions.replyToMessage(replyTo.MessageID, request)
      setReplyTo(null)
    } else {
      actions.sendMessage(room.RoomID, request)
    }
  }, [replyTo, room.RoomID, actions])

  const handleTyping = useCallback((isTyping: boolean) => {
    actions.sendTyping(room.RoomID, isTyping)
  }, [room.RoomID, actions])

  return (
    <div className={cn('flex flex-col h-full bg-[rgb(var(--bg-app))]', className)}>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-3 py-2.5 border-b border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))]">
        {/* Back button (mobile) */}
        <button
          onClick={onBack}
          className="lg:hidden flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--fg-muted))]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Room avatar */}
        <div className="relative flex-shrink-0">
          <div
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium',
              getAvatarColor(room.RoomID)
            )}
          >
            {room.Type === 'Channel' ? '#' : getInitials(displayName)}
          </div>
          {room.Type === 'DM' && isDMPartnerOnline && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[rgb(var(--bg-surface))]" />
          )}
        </div>

        {/* Room info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[rgb(var(--fg-default))] truncate">{displayName}</h3>
          <p className="text-xs text-[rgb(var(--fg-muted))]">
            {room.Type === 'DM'
              ? (isDMPartnerOnline ? t('Online') : t('Offline'))
              : `${memberCount} ${t('members')}`}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {room.Type !== 'DM' && (
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[rgb(var(--fg-muted))] hover:bg-[rgb(var(--bg-hover))]">
              <Users className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto py-2"
        onScroll={handleScroll}
      >
        {/* Loading more indicator */}
        {state.loadingMessages && messages.length > 0 && (
          <div className="flex justify-center py-2">
            <div className="w-5 h-5 border-2 border-[rgb(var(--color-primary))] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Loading initial */}
        {state.loadingMessages && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-[rgb(var(--color-primary))] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, idx) => {
          const prev = idx > 0 ? messages[idx - 1] : null
          const showSender = !prev || prev.UserID !== msg.UserID
          const isOwn = String(msg.UserID) === currentUserId

          return (
            <MessageBubble
              key={msg.MessageID}
              message={msg}
              isOwn={isOwn}
              senderName={senderNames[msg.UserID] || `User ${msg.UserID}`}
              showSender={showSender}
              onReply={setReplyTo}
              onReact={(id, emoji) => actions.toggleReaction(id, emoji)}
              onEdit={(id, content) => actions.editMessage(id, content)}
              onDelete={(id) => actions.deleteMessage(id)}
              onThreadClick={onOpenThread}
              currentUserId={Number(currentUserId)}
            />
          )
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <TypingIndicator userIds={typingUsers} senderNames={senderNames} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        onUploadFile={actions.uploadFile}
        onTyping={handleTyping}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        disabled={state.sendingMessage}
      />
    </div>
  )
}

// ── Typing Indicator ──────────────────────────────────────────────────────

function TypingIndicator({ userIds, senderNames }: { userIds: string[]; senderNames: Record<number, string> }) {
  const { t } = useLanguage()

  const names = userIds
    .map(id => senderNames[Number(id)] || `User ${id}`)
    .slice(0, 3)

  const text = names.length === 1
    ? `${names[0]} ${t('is typing')}`
    : names.length === 2
      ? `${names[0]} ${t('and')} ${names[1]} ${t('are typing')}`
      : `${names[0]} ${t('and')} ${names.length - 1} ${t('others are typing')}`

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 ml-10">
      <div className="flex gap-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--fg-muted))] animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--fg-muted))] animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--fg-muted))] animate-bounce [animation-delay:300ms]" />
      </div>
      <span className="text-xs text-[rgb(var(--fg-muted))] italic">{text}</span>
    </div>
  )
}
