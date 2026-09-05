'use client'

/**
 * Reusable chat message list with auto-scroll, message bubbles, markdown rendering,
 * copy/edit actions, typing indicator, and optional export/share bar.
 * Domain-specific rendering (cards, empty states) is injected via props.
 */

import { useEffect, useRef, useState, useCallback, KeyboardEvent, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { Message as MessageType } from '@/lib/api/ai/types'
import { User, Copy, Check, Download, Share2, Pencil, Bot, RotateCcw, ThumbsUp, ThumbsDown } from '@/lib/icons'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export interface SelectableItem {
  id: string
  name: string
  num: number
  // Optional payload that gets sent to the backend when set — the user bubble still shows `name`.
  // Used by multiselect to separate human-readable labels (bubble) from the structured id+label string (wire).
  messageText?: string
  // Tool-specific extras (e.g. freight has state, rate) — passed through to click handler
  [key: string]: unknown
}

interface MessagesProps {
  messages: MessageType[]
  isLoading?: boolean
  onExport?: () => void
  onShare?: () => void
  onSelectItem?: (item: SelectableItem) => void
  onEditMessage?: (messageId: string, newContent: string) => void
  onRegenerateAi?: (messageId: string) => void
  onFeedback?: (messageId: string, rating: 'up' | 'down' | null) => void
  /** Custom bot avatar element (defaults to generic Bot icon) */
  botAvatar?: ReactNode
  /** Custom empty state when no messages (defaults to nothing) */
  emptyState?: ReactNode
  /** Custom renderer for bot message content. Return null to fall back to markdown. */
  renderBotContent?: (message: MessageType, onSelectItem?: (item: SelectableItem) => void) => ReactNode | null
}

// Individual Message Bubble Component
function Message({ message, onSelectItem, onEditMessage, onRegenerateAi, onFeedback, botAvatar, renderBotContent }: {
  message: MessageType
  onSelectItem?: (item: SelectableItem) => void
  onEditMessage?: (messageId: string, newContent: string) => void
  onRegenerateAi?: (messageId: string) => void
  onFeedback?: (messageId: string, rating: 'up' | 'down' | null) => void
  botAvatar?: ReactNode
  renderBotContent?: (message: MessageType, onSelectItem?: (item: SelectableItem) => void) => ReactNode | null
}) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(message.feedback ?? null)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const editTextareaRef = useRef<HTMLTextAreaElement>(null)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleStartEdit = useCallback(() => {
    setEditText(message.content)
    setIsEditing(true)
  }, [message.content])

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false)
    setEditText('')
  }, [])

  const handleSaveEdit = useCallback(() => {
    const trimmed = editText.trim()
    if (!trimmed) {
      handleCancelEdit()
      return
    }
    onEditMessage?.(message.id, trimmed)
    setIsEditing(false)
    setEditText('')
  }, [editText, message.id, onEditMessage, handleCancelEdit])

  const handleEditKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      handleCancelEdit()
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSaveEdit()
    }
  }, [handleCancelEdit, handleSaveEdit])

  // Regenerate — re-send the same content via the edit flow (cascades delete after this message, re-posts)
  const handleRegenerate = useCallback(() => {
    if (onEditMessage && message.content) {
      onEditMessage(message.id, message.content)
    }
  }, [onEditMessage, message.id, message.content])

  const handleRegenerateAi = useCallback(() => {
    onRegenerateAi?.(message.id)
  }, [onRegenerateAi, message.id])

  const handleFeedback = useCallback((rating: 'up' | 'down') => {
    const next = feedback === rating ? null : rating
    setFeedback(next)
    onFeedback?.(message.id, next)
  }, [feedback, onFeedback, message.id])

  // Claude-style short timestamp: "Apr 19" for older, "2:34 PM" for today
  const formattedTimestamp = (() => {
    const d = message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp as any)
    if (isNaN(d.getTime())) return ''
    const now = new Date()
    const sameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
    if (sameDay) {
      return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    }
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  })()

  // Auto-resize and focus edit textarea
  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      const ta = editTextareaRef.current
      ta.style.height = 'auto'
      ta.style.height = `${ta.scrollHeight}px`
      ta.focus()
      ta.setSelectionRange(ta.value.length, ta.value.length)
    }
  }, [isEditing])

  // Try custom bot content renderer first
  const customBotContent = !isUser && renderBotContent ? renderBotContent(message, onSelectItem) : null

  return (
    <div
      data-message-id={message.id}
      data-message-role={message.role}
      className={cn(
        'flex gap-4 group animate-[popIn_0.25s_cubic-bezier(0.175,0.885,0.32,1.05)]',
        isUser && 'flex-row-reverse'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 shrink-0 rounded-full flex items-center justify-center',
          isUser
            ? 'bg-[rgb(var(--color-primary))]'
            : 'bg-[rgb(var(--bg-subtle))] border border-[rgb(var(--bd-default))]'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          botAvatar || <Bot className="w-4 h-4 text-[rgb(var(--fg-muted))]" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn('flex-1', isUser ? 'max-w-[85%] flex flex-col items-end' : 'max-w-[95%]')}>
        <div className="relative">
          {/* Rich bot content — rendered WITHOUT bubble wrapper (no padding/border/bg) */}
          {!isUser && !isEditing && customBotContent ? (
            <div className="break-words text-sm leading-relaxed text-[rgb(var(--fg-default))] max-w-xl">
              {customBotContent}
            </div>
          ) : (
          <div
            className={cn(
              'inline-block break-words',
              isEditing
                ? 'px-3 py-2 rounded-xl bg-[rgb(var(--bg-surface))] border-2 border-[rgb(var(--color-primary))] w-full'
                : cn(
                  'px-4 py-3',
                  isUser
                    ? 'rounded-[18px_4px_18px_18px] bg-[rgb(var(--color-primary))] text-white animate-[sendBubble_0.22s_ease-out]'
                    : 'rounded-[4px_18px_18px_18px] bg-[rgb(var(--bg-surface))] border border-[rgb(var(--bd-default))] text-[rgb(var(--fg-default))]'
                )
            )}
          >
            {isEditing ? (
              /* Edit Mode */
              <div>
                <textarea
                  ref={editTextareaRef}
                  value={editText}
                  onChange={(e) => {
                    setEditText(e.target.value)
                    // Auto-resize
                    e.target.style.height = 'auto'
                    e.target.style.height = `${e.target.scrollHeight}px`
                  }}
                  onKeyDown={handleEditKeyDown}
                  className="w-full bg-transparent text-[rgb(var(--fg-default))] text-sm leading-relaxed resize-none outline-none min-h-[40px]"
                />
                <div className="flex gap-2 justify-end mt-2">
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[rgb(var(--bg-subtle))] border border-[rgb(var(--bd-default))] text-[rgb(var(--fg-muted))] hover:bg-[rgb(var(--bg-app))] hover:text-[rgb(var(--fg-default))] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[rgb(var(--color-primary))] text-white hover:opacity-90 transition-all"
                  >
                    Save & Resend
                  </button>
                </div>
              </div>
            ) : (
              /* Message Content */
              <div className="text-sm leading-relaxed">
                {isUser ? (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                ) : (
                  <div className="markdown-content text-left">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0 text-left">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 text-left">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 text-left">{children}</ol>,
                        li: ({ children }) => <li className="ml-4 text-left">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[rgb(var(--color-primary))] underline hover:opacity-80"
                          >
                            {children}
                          </a>
                        ),
                        code: ({ children }) => (
                          <code className="bg-[rgb(var(--bg-app))] px-1.5 py-0.5 rounded text-xs font-mono">
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre className="bg-[rgb(var(--bg-app))] p-3 rounded-lg overflow-x-auto mb-2 text-xs">
                            {children}
                          </pre>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-[rgb(var(--bd-default))] pl-4 italic my-2">
                            {children}
                          </blockquote>
                        ),
                        h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-base font-bold mb-2">{children}</h3>,
                        img: ({ src, alt }) => {
                          let normalizedSrc = src || ''
                          const m = normalizedSrc.match(/^\/?(?:images\/)?Contents\/(.+)$/i)
                          if (m) {
                            normalizedSrc = '/Contents/' + m[1]
                          }
                          return (
                            <img
                              src={normalizedSrc}
                              alt={alt || ''}
                              className="w-32 h-auto rounded-lg my-2 block"
                              loading="lazy"
                              onError={(e) => {
                                const cur = e.currentTarget.src
                                if (cur.includes('.jpg') && !cur.includes('_tried_png')) {
                                  e.currentTarget.src = cur.replace('.jpg', '.png') + '?_tried_png=1'
                                } else if (!cur.includes('Rectangular')) {
                                  e.currentTarget.src = '/Contents/Rectangular.jpg'
                                }
                              }}
                            />
                          )
                        },
                      }}
                    >
                      {(() => {
                        let text = message.content
                        const jsonStart = text.search(/\{"(?:source|ui_data_id|ui_state)":/)
                        if (jsonStart >= 0) text = text.substring(0, jsonStart).trim()
                        let processed = text
                          // Repair multi-line markdown images: `![\n...\n](url)` → `![](url)` (LLM sometimes splits syntax across lines)
                          .replace(/!\[([^\]]*)\]\s*\n+\s*\(([^)]+)\)/g, (_: string, alt: string, url: string) => `![${alt}](${url})`)
                          .replace(/!\[\s*\n+\s*\]\(([^)]+)\)/g, (_: string, url: string) => `![](${url})`)
                          .replace(/^(.+?)\s*(?:[—–-]{1,3}|[.:])?\s*(?:[Ii]mage:\s*)?(\/?(?:images\/)?Contents\/[^\n]+?\.(?:jpg|png))\s*$/gm,
                            (_: string, alt: string, path: string) => `![${alt.trim()}](${path.trim()})`)
                          .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_: string, alt: string, url: string) =>
                            `![${alt}](${url.replace(/ /g, '%20')})`)
                        const normalizeImgKey = (url: string) => {
                          const cleaned = decodeURIComponent(url.trim()).replace(/\s+/g, '')
                          const m = cleaned.match(/^\/?(?:images\/)?Contents\/(.+)$/i)
                          return (m ? `/Contents/${m[1]}` : cleaned).toLowerCase()
                        }
                        const seenImgUrls = new Set<string>()
                        processed = processed.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (full: string, _alt: string, url: string) => {
                          const key = normalizeImgKey(url)
                          if (seenImgUrls.has(key)) return ''
                          seenImgUrls.add(key)
                          return full
                        })
                        return processed
                      })()}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            )}
          </div>
          )}
        </div>

        {/* Action Bar — Claude-style: timestamp + action buttons below bubble, hover-only */}
        {!isEditing && (
          <div className={cn(
            'flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200',
            isUser ? 'justify-end' : 'justify-start'
          )}>
            {formattedTimestamp && (
              <span className="text-[0.7rem] text-[rgb(var(--fg-muted))]/70 select-none">
                {formattedTimestamp}
              </span>
            )}
            {/* Regenerate - user messages only, re-sends same content */}
            {isUser && onEditMessage && (
              <button
                onClick={handleRegenerate}
                className="w-7 h-7 rounded-md flex items-center justify-center text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-subtle))] transition-colors"
                aria-label="Regenerate response"
                title="Regenerate"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            {/* Edit - user messages only */}
            {isUser && onEditMessage && (
              <button
                onClick={handleStartEdit}
                className="w-7 h-7 rounded-md flex items-center justify-center text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-subtle))] transition-colors"
                aria-label="Edit message"
                title="Edit"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            {/* Copy */}
            <button
              onClick={handleCopy}
              className="w-7 h-7 rounded-md flex items-center justify-center text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-subtle))] transition-colors"
              aria-label="Copy message"
              title="Copy"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            {/* AI-only: regenerate this response */}
            {!isUser && onRegenerateAi && (
              <button
                onClick={handleRegenerateAi}
                className="w-7 h-7 rounded-md flex items-center justify-center text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-subtle))] transition-colors"
                aria-label="Regenerate response"
                title="Regenerate"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            {/* AI-only: thumbs up/down feedback */}
            {!isUser && (
              <>
                <button
                  onClick={() => handleFeedback('up')}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-subtle))] transition-colors"
                  aria-label="Good response"
                  title="Good response"
                >
                  <ThumbsUp className="w-3.5 h-3.5" fill={feedback === 'up' ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => handleFeedback('down')}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-subtle))] transition-colors"
                  aria-label="Bad response"
                  title="Bad response"
                >
                  <ThumbsDown className="w-3.5 h-3.5" fill={feedback === 'down' ? 'currentColor' : 'none'} />
                </button>
              </>
            )}
            {!isUser && message.tokens && process.env.NEXT_PUBLIC_SHOW_TOKENS === 'true' && (
              <span className="text-[0.65rem] text-[rgb(var(--fg-muted))]/70 font-mono select-none ml-1">
                P: {message.tokens.prompt.toLocaleString()}  R: {message.tokens.completion.toLocaleString()}  T: {message.tokens.total.toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Synthia thinking phrases — the fun ones
const SYNTHIA_THINKING = [
  'Accomplishing', 'Actioning', 'Actualizing', 'Architecting', 'Baking', 'Beaming', 'Beboppin\'',
  'Befuddling', 'Billowing', 'Blanching', 'Bloviating', 'Boogieing', 'Boondoggling', 'Booping', 'Bootstrapping', 'Brewing',
  'Bunning', 'Burrowing', 'Calculating', 'Canoodling', 'Caramelizing', 'Cascading', 'Catapulting', 'Cerebrating', 'Channeling',
  'Channelling', 'Choreographing', 'Churning', 'Coalescing', 'Cogitating', 'Combobulating', 'Composing', 'Computing',
  'Concocting', 'Considering', 'Contemplating', 'Cooking', 'Crafting', 'Creating', 'Crunching', 'Crystallizing', 'Cultivating',
  'Deciphering', 'Deliberating', 'Determining', 'Dilly-dallying', 'Doing', 'Doodling', 'Drizzling', 'Ebbing',
  'Effecting', 'Elucidating', 'Embellishing', 'Enchanting', 'Envisioning', 'Evaporating', 'Fermenting', 'Fiddle-faddling',
  'Finagling', 'Flambéing', 'Flibbertigibbeting', 'Flowing', 'Flummoxing', 'Fluttering', 'Forging', 'Forming', 'Frolicking',
  'Frosting', 'Gallivanting', 'Galloping', 'Garnishing', 'Generating', 'Gesticulating', 'Germinating', 'Gitifying', 'Grooving',
  'Gusting', 'Harmonizing', 'Hashing', 'Hatching', 'Herding', 'Honking', 'Hullaballooing', 'Hyperspacing', 'Ideating', 'Imagining',
  'Improvising', 'Incubating', 'Inferring', 'Infusing', 'Ionizing', 'Jitterbugging', 'Julienning', 'Kneading', 'Leavening',
  'Levitating', 'Lollygagging', 'Manifesting', 'Marinating', 'Meandering', 'Metamorphosing', 'Misting', 'Moonwalking', 'Moseying',
  'Mulling', 'Mustering', 'Musing', 'Nebulizing', 'Nesting', 'Newspapering', 'Noodling', 'Nucleating', 'Orbiting', 'Orchestrating',
  'Osmosing', 'Perambulating', 'Percolating', 'Perusing', 'Philosophising', 'Photosynthesizing', 'Pollinating', 'Pondering',
  'Pontificating', 'Pouncing', 'Precipitating', 'Prestidigitating', 'Processing', 'Proofing', 'Propagating', 'Puttering',
  'Puzzling', 'Quantumizing', 'Razzle-dazzling', 'Razzmatazzing', 'Recombobulating', 'Reticulating', 'Roosting', 'Ruminating',
  'Sautéing', 'Scampering', 'Schlepping', 'Scurrying', 'Seasoning', 'Shenaniganing', 'Shimmying', 'Simmering', 'Skedaddling',
  'Sketching', 'Slithering', 'Smooshing', 'Sock-hopping', 'Spelunking', 'Spinning', 'Sprouting', 'Stewing', 'Sublimating',
  'Swirling', 'Swooping', 'Symbioting', 'Synthesizing', 'Tempering', 'Thinking', 'Thundering', 'Tinkering', 'Tomfoolering',
  'Topsy-turvying', 'Transfiguring', 'Transmuting', 'Twisting', 'Undulating', 'Unfurling', 'Unravelling', 'Vibing', 'Waddling',
  'Wandering', 'Warping', 'Whatchamacalliting', 'Whirlpooling', 'Whirring', 'Whisking', 'Wibbling', 'Working', 'Wrangling',
  'Zesting', 'Zigzagging',
]

// Contextual first phrase based on what the user asked — each bucket rotates randomly
const THINKING_CONTEXT: { test: RegExp; phrases: string[] }[] = [
  { test: /\b(cost|costing|estimate|pricing|quote|quotation)\b/i, phrases: ['Crunching', 'Tallying numbers', 'Sharpening pencils', 'Doing math'] },
  { test: /\b(plant|unit|factory|production)\b/i, phrases: ['Spooling plants', 'Walking floor', 'Counting machines', 'Booting units'] },
  { test: /\b(customer|client|party|lead)\b/i, phrases: ['Dialing', 'Flipping rolodex', 'Pulling clients', 'Sleuthing leads'] },
  { test: /\b(paper|gsm|quality|mill|material)\b/i, phrases: ['Weighing GSM', 'Sniffing mills', 'Stacking reels', 'Sorting paper'] },
  { test: /\b(color|colour|printing|print)\b/i, phrases: ['Mixing inks', 'Calibrating', 'Loading plates', 'Tuning press'] },
  { test: /\b(corrugat|ply|flute|liner)\b/i, phrases: ['Stacking flutes', 'Counting plies', 'Folding liners', 'Fluting'] },
  { test: /\b(freight|delivery|location|ship)\b/i, phrases: ['Plotting routes', 'Loading trucks', 'Pinging logistics', 'Shipping'] },
  { test: /\b(process|lamination|varnish|emboss|foil)\b/i, phrases: ['Heating foil', 'Queueing finishes', 'Laminating', 'Lining post-press'] },
  { test: /\b(save|confirm|generate|finalize)\b/i, phrases: ['Locking it in', 'Sealing deal', 'Stamping', 'Finalizing'] },
  { test: /\b(login|activity|audit|log|who)\b/i, phrases: ['Reading trail', 'Pulling logs', 'Tracing steps', 'Snooping'] },
  { test: /\b(enquir|inquir|estimation|quotation|how many|count|list|report|status)\b/i, phrases: ['Pulling reports', 'Counting rows', 'Scanning books', 'Fetching'] },
]

function getContextualPhrase(lastUserMsg?: string): string {
  if (lastUserMsg) {
    for (const ctx of THINKING_CONTEXT) {
      if (ctx.test.test(lastUserMsg)) {
        return ctx.phrases[Math.floor(Math.random() * ctx.phrases.length)]
      }
    }
  }
  return SYNTHIA_THINKING[Math.floor(Math.random() * SYNTHIA_THINKING.length)]
}

// Typing Indicator — contextual first phrase, fun word on second rotation, max 2
function TypingIndicator({ lastUserMessage }: { lastUserMessage?: string }) {
  const [phrase, setPhrase] = useState(() => getContextualPhrase(lastUserMessage))
  const rotatedRef = useRef(false)

  useEffect(() => {
    rotatedRef.current = false
    setPhrase(getContextualPhrase(lastUserMessage))
    const timer = setTimeout(() => {
      if (!rotatedRef.current) {
        rotatedRef.current = true
        setPhrase(SYNTHIA_THINKING[Math.floor(Math.random() * SYNTHIA_THINKING.length)])
      }
    }, 4000)
    return () => clearTimeout(timer)
  }, [lastUserMessage])

  return (
    <div className="flex justify-start">
      <div className="inline-flex items-center gap-2 px-4 py-2" aria-label="AI typing">
        <span className="w-2 h-2 bg-[rgb(var(--color-primary))] rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 bg-[rgb(var(--color-primary))] rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 bg-[rgb(var(--color-primary))] rounded-full animate-bounce" />
        <span className="text-sm text-[rgb(var(--fg-muted))] animate-pulse ml-1">{phrase}...</span>
      </div>
    </div>
  )
}

// Main Messages Container
export function Messages({ messages, isLoading = false, onExport, onShare, onSelectItem, onEditMessage, onRegenerateAi, onFeedback, botAvatar, emptyState, renderBotContent }: MessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [fadeKey, setFadeKey] = useState(0)
  const prevFirstMsgIdRef = useRef<string | null>(null)

  // Detect conversation switch (first message ID changes = different conversation loaded)
  useEffect(() => {
    const firstId = messages.length > 0 ? messages[0].id : null
    if (firstId && prevFirstMsgIdRef.current && firstId !== prevFirstMsgIdRef.current) {
      setFadeKey(k => k + 1)
    }
    prevFirstMsgIdRef.current = firstId
  }, [messages])

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isLoading])

  // Empty State
  if (messages.length === 0 && !isLoading) {
    if (emptyState) return <>{emptyState}</>
    return null
  }

  return (
    <div className="h-full flex flex-col">
      {/* Action Bar - Tokens + Export/Share */}
      {messages.length > 0 && (onExport || onShare) && (
        <div className="border-b border-[rgb(var(--bd-default))] px-4 py-2 flex items-center justify-between bg-[rgb(var(--bg-surface))]">
          {/* Token counter — left side */}
          {process.env.NEXT_PUBLIC_SHOW_TOKENS === 'true' ? (() => {
            const totals = messages.reduce((acc, m) => {
              if (m.tokens) { acc.prompt += m.tokens.prompt; acc.completion += m.tokens.completion; acc.total += m.tokens.total }
              return acc
            }, { prompt: 0, completion: 0, total: 0 })
            if (totals.total === 0) return <div />
            return (
              <span className="text-[0.65rem] text-[rgb(var(--fg-muted))] font-mono">
                P:{totals.prompt.toLocaleString()} · C:{totals.completion.toLocaleString()} · T:{totals.total.toLocaleString()} · {messages.filter(m => m.tokens).length} calls
              </span>
            )
          })() : <div />}
          {/* Actions — right side */}
          <div className="flex gap-2">
            {onExport && (
              <button
                onClick={onExport}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-subtle))] rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            )}
            {onShare && (
              <button
                onClick={onShare}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-subtle))] rounded-lg transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            )}
          </div>
        </div>
      )}

      {/* Messages — fade-in on conversation switch */}
      <div className="flex-1 overflow-y-auto">
        <div
          key={fadeKey}
          className="max-w-5xl mx-auto px-3 sm:px-4 py-6 space-y-6 animate-[fadeInUp_0.28s_ease-out]"
        >
          {messages.map((message) => (
            <Message
              key={message.id}
              message={message}
              onSelectItem={onSelectItem}
              onEditMessage={onEditMessage}
              onRegenerateAi={onRegenerateAi}
              onFeedback={onFeedback}
              botAvatar={botAvatar}
              renderBotContent={renderBotContent}
            />
          ))}

          {isLoading && <TypingIndicator lastUserMessage={messages.filter(m => m.role === 'user').at(-1)?.content} />}

          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  )
}
