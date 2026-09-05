'use client'

import { useState, memo, useCallback } from 'react'
import { Reply, Smile, Pencil, Trash2, Copy, Check, MoreHorizontal } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { parseReactions, parseAttachments } from '@/lib/api/activity/messaging/messaging'
import type { ChatMessage, ChatReaction, ChatAttachment } from '@/lib/api/activity/messaging/messaging'
import { getAvatarColor, getInitials, formatRelativeTime } from './conversation-list'

// ── Curated reaction emojis ───────────────────────────────────────────────

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '💯']

// ── Component ─────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: ChatMessage
  isOwn: boolean
  senderName: string
  showSender: boolean // false for consecutive messages from same sender
  onReply: (message: ChatMessage) => void
  onReact: (messageId: number, emoji: string) => void
  onEdit: (messageId: number, content: string) => void
  onDelete: (messageId: number) => void
  onThreadClick?: (messageId: number) => void
  currentUserId: number
}

export const MessageBubble = memo(function MessageBubble({
  message,
  isOwn,
  senderName,
  showSender,
  onReply,
  onReact,
  onEdit,
  onDelete,
  onThreadClick,
  currentUserId
}: MessageBubbleProps) {
  const { t } = useLanguage()
  const [showActions, setShowActions] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.Content || '')
  const [copied, setCopied] = useState(false)

  const reactions = parseReactions(message.Reactions)
  const attachments = parseAttachments(message.Attachments)

  const handleCopy = useCallback(() => {
    if (message.Content) {
      navigator.clipboard.writeText(message.Content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [message.Content])

  const handleEditSubmit = useCallback(() => {
    if (editContent.trim() && editContent !== message.Content) {
      onEdit(message.MessageID, editContent.trim())
    }
    setIsEditing(false)
  }, [editContent, message.Content, message.MessageID, onEdit])

  if (message.IsDeleted) {
    return (
      <div className={cn('flex gap-2 px-4 py-1', isOwn ? 'justify-end' : 'justify-start')}>
        <div className="px-3 py-1.5 rounded-lg bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-muted))] text-sm italic">
          {t('This message was deleted')}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group flex gap-2 px-4',
        showSender ? 'pt-2' : 'pt-0.5',
        isOwn ? 'justify-end' : 'justify-start'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowReactionPicker(false) }}
    >
      {/* Avatar (only for others, only when showing sender) */}
      {!isOwn && (
        <div className="w-8 flex-shrink-0">
          {showSender && (
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium',
                getAvatarColor(message.UserID)
              )}
            >
              {getInitials(senderName)}
            </div>
          )}
        </div>
      )}

      {/* Bubble */}
      <div className={cn('max-w-[70%] min-w-[4rem]', isOwn ? 'items-end' : 'items-start')}>
        {/* Sender name */}
        {showSender && !isOwn && (
          <p className="text-xs font-medium text-[rgb(var(--fg-muted))] mb-0.5 ml-1">{senderName}</p>
        )}

        <div className="relative">
          {/* Action buttons (hover) */}
          {showActions && !isEditing && (
            <div className={cn(
              'absolute -top-7 flex items-center gap-0.5 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--bd-default))] rounded-lg shadow-sm px-1 py-0.5 z-10',
              isOwn ? 'right-0' : 'left-0'
            )}>
              <ActionBtn icon={Smile} title={t('React')} onClick={() => setShowReactionPicker(!showReactionPicker)} />
              <ActionBtn icon={Reply} title={t('Reply')} onClick={() => onReply(message)} />
              <ActionBtn icon={Copy} title={copied ? t('Copied') : t('Copy')} onClick={handleCopy} />
              {isOwn && (
                <>
                  <ActionBtn icon={Pencil} title={t('Edit')} onClick={() => { setIsEditing(true); setEditContent(message.Content || '') }} />
                  <ActionBtn icon={Trash2} title={t('Delete')} onClick={() => onDelete(message.MessageID)} />
                </>
              )}
            </div>
          )}

          {/* Reaction picker */}
          {showReactionPicker && (
            <div className={cn(
              'absolute -top-14 flex items-center gap-0.5 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--bd-default))] rounded-xl shadow-lg px-2 py-1.5 z-20',
              isOwn ? 'right-0' : 'left-0'
            )}>
              {QUICK_REACTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => { onReact(message.MessageID, emoji); setShowReactionPicker(false) }}
                  className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[rgb(var(--bg-hover))] text-base transition-transform hover:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Message content */}
          <div
            className={cn(
              'rounded-2xl px-3 py-2 text-sm',
              isOwn
                ? 'bg-[rgb(var(--color-primary))] text-white rounded-br-md'
                : 'bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-default))] rounded-bl-md'
            )}
          >
            {isEditing ? (
              <div className="space-y-1.5">
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className="w-full min-h-[2rem] bg-transparent text-sm resize-none focus:outline-none"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSubmit() }
                    if (e.key === 'Escape') setIsEditing(false)
                  }}
                />
                <div className="flex gap-1 justify-end">
                  <button onClick={() => setIsEditing(false)} className="text-xs opacity-70 hover:opacity-100 px-2 py-0.5">
                    {t('Cancel')}
                  </button>
                  <button onClick={handleEditSubmit} className="text-xs font-medium opacity-70 hover:opacity-100 px-2 py-0.5">
                    {t('Save')}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Attachments */}
                {attachments.length > 0 && (
                  <div className="space-y-1 mb-1">
                    {attachments.map((att, i) => (
                      <AttachmentPreview key={i} attachment={att} isOwn={isOwn} />
                    ))}
                  </div>
                )}

                {/* Text content + inline time */}
                {message.Content && (
                  <p className="whitespace-pre-wrap break-words">
                    {message.Content}
                    <span className="inline-flex items-center gap-1 ml-2 align-bottom translate-y-[1px]">
                      {message.IsEdited && (
                        <span className="text-[0.625rem] opacity-60 italic">{t('edited')}</span>
                      )}
                      <span className="text-[0.625rem] opacity-50 whitespace-nowrap">
                        {formatRelativeTime(message.CreatedAt)}
                      </span>
                    </span>
                  </p>
                )}

                {/* Time only shown separately when there's no text (attachment-only) */}
                {!message.Content && (
                  <div className={cn(
                    'flex items-center gap-1 mt-0.5',
                    isOwn ? 'justify-end' : 'justify-start'
                  )}>
                    <span className="text-[0.625rem] opacity-50">
                      {formatRelativeTime(message.CreatedAt)}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Reactions bar */}
        {reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 ml-1">
            {reactions.map(reaction => (
              <ReactionBadge
                key={reaction.emoji}
                reaction={reaction}
                currentUserId={currentUserId}
                onToggle={() => onReact(message.MessageID, reaction.emoji)}
              />
            ))}
          </div>
        )}

        {/* Thread indicator */}
        {message.ReplyCount > 0 && onThreadClick && (
          <button
            onClick={() => onThreadClick(message.MessageID)}
            className="flex items-center gap-1 mt-1 ml-1 text-xs text-[rgb(var(--color-primary))] hover:underline"
          >
            <Reply className="w-3 h-3" />
            {message.ReplyCount} {message.ReplyCount === 1 ? t('reply') : t('replies')}
          </button>
        )}
      </div>
    </div>
  )
})

// ── Sub-components ────────────────────────────────────────────────────────

function ActionBtn({ icon: Icon, title, onClick }: { icon: any; title: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-6 h-6 flex items-center justify-center rounded hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--fg-muted))]"
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  )
}

function ReactionBadge({ reaction, currentUserId, onToggle }: { reaction: ChatReaction; currentUserId: number; onToggle: () => void }) {
  const isReacted = reaction.userIds.includes(currentUserId)
  return (
    <button
      onClick={onToggle}
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors',
        isReacted
          ? 'bg-[rgb(var(--color-primary)/0.1)] border-[rgb(var(--color-primary)/0.3)] text-[rgb(var(--color-primary))]'
          : 'bg-[rgb(var(--bg-subtle))] border-[rgb(var(--bd-default))] text-[rgb(var(--fg-muted))]'
      )}
    >
      <span>{reaction.emoji}</span>
      <span>{reaction.userIds.length}</span>
    </button>
  )
}

function AttachmentPreview({ attachment, isOwn }: { attachment: ChatAttachment; isOwn: boolean }) {
  const isImage = attachment.mimeType.startsWith('image/')

  if (isImage) {
    return (
      <a href={attachment.fileUrl} target="_blank" rel="noopener noreferrer" className="block">
        <img
          src={attachment.fileUrl}
          alt={attachment.fileName}
          className="max-w-[15rem] max-h-[12rem] rounded-lg object-cover"
        />
      </a>
    )
  }

  const sizeStr = attachment.fileSize < 1024 * 1024
    ? `${(attachment.fileSize / 1024).toFixed(0)} KB`
    : `${(attachment.fileSize / (1024 * 1024)).toFixed(1)} MB`

  return (
    <a
      href={attachment.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-2 px-2.5 py-1.5 rounded-lg border',
        isOwn ? 'border-white/20 hover:bg-white/10' : 'border-[rgb(var(--bd-default))] hover:bg-[rgb(var(--bg-hover))]'
      )}
    >
      <div className="w-8 h-8 rounded bg-[rgb(var(--bg-subtle))] flex items-center justify-center text-xs font-bold text-[rgb(var(--fg-muted))]">
        {attachment.fileName.split('.').pop()?.toUpperCase().slice(0, 3)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium truncate">{attachment.fileName}</p>
        <p className={cn('text-[0.625rem]', isOwn ? 'opacity-60' : 'text-[rgb(var(--fg-muted))]')}>{sizeStr}</p>
      </div>
    </a>
  )
}
