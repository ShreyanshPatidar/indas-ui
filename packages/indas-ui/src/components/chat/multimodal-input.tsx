'use client'

/**
 * Multimodal Input Component
 * Chat input with auto-expanding textarea, file upload, and voice input
 */

import { useState, useRef, useEffect, useCallback, KeyboardEvent, type ReactNode } from 'react'
import { Send, Paperclip, Mic, MicOff, X, FileIcon, FileSpreadsheet, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOptionalLanguage } from '@/contexts/LanguageContext'

/** What the paperclip offers when the host does not say: images, PDFs and documents. */
export const DEFAULT_CHAT_ACCEPT = 'image/*,application/pdf,.doc,.docx,.txt'

interface MultimodalInputProps {
  onSubmit: (text: string, files?: File[]) => void
  onStop?: () => void
  isLoading?: boolean
  placeholder?: string
  allowFileUpload?: boolean
  /**
   * File types the paperclip offers, as an `<input accept>` list. Defaults to
   * DEFAULT_CHAT_ACCEPT; a host that reads spreadsheets adds `.xlsx,.xls,.csv`.
   */
  accept?: string
  /** Allow several files at once. Default true; false keeps one attachment, replacing the last. */
  multiple?: boolean
  /** Screen-reader name of the paperclip. Default "Attach file". */
  attachLabel?: string
  /**
   * The attach button's icon. Default a paperclip; a host whose button opens more than a file
   * picker (a menu, a scan) may pass a plus. Sized by the host, e.g. `<Plus className="w-4 h-4" />`.
   */
  attachIcon?: ReactNode
  /** The language the mic listens in, as a BCP 47 tag: 'en-IN' (default), 'hi-IN' for Hindi. */
  speechLang?: string
  compact?: boolean
  disabled?: boolean
  disabledReason?: string
}

export function MultimodalInput({
  onSubmit,
  onStop,
  isLoading = false,
  placeholder = 'Send a message...',
  allowFileUpload = true,
  accept = DEFAULT_CHAT_ACCEPT,
  multiple = true,
  attachLabel = 'Attach file',
  attachIcon,
  speechLang = 'en-IN',
  compact = false,
  disabled = false,
  disabledReason
}: MultimodalInputProps) {
  // Optional: the composer is exported for host apps that have no LanguageProvider, and falls
  // back to the English source text rather than throwing.
  const { t } = useOptionalLanguage()
  const [input, setInput] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [isListening, setIsListening] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  // Voice input support check (must be in state to survive SSR hydration)
  const [speechSupported, setSpeechSupported] = useState(false)
  useEffect(() => {
    setSpeechSupported(
      typeof window !== 'undefined' &&
      !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    )
  }, [])

  const handleVoiceInput = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    // Fresh instance every click — reusing a stopped instance throws InvalidStateError
    const recognition = new SpeechRecognition()
    // Listens until the mic is tapped again, not just to the first pause, and writes the words
    // into the box as they are heard, so the speaker sees it working.
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = speechLang

    // What was typed before the mic opened; every result rewrites the rest after it.
    const before = textareaRef.current?.value.trim() ?? ''
    recognition.onresult = (event: any) => {
      let heard = ''
      for (let i = 0; i < event.results.length; i++) heard += event.results[i][0]?.transcript ?? ''
      heard = heard.trim()
      setInput(before && heard ? `${before} ${heard}` : before || heard)
    }

    recognition.onerror = (event: any) => {
      setIsListening(false)
      recognitionRef.current = null
    }

    recognition.onend = () => {
      setIsListening(false)
      recognitionRef.current = null
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
      setIsListening(true)
    } catch {
      setIsListening(false)
      recognitionRef.current = null
    }
  }, [isListening, speechLang])

  // Cleanup on unmount
  useEffect(() => {
    return () => { recognitionRef.current?.abort() }
  }, [])

  // Auto-focus textarea on mount
  useEffect(() => {
    const timer = setTimeout(() => { textareaRef.current?.focus() }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  const handleSubmit = () => {
    if (disabled) return
    if (!input.trim() && files.length === 0) return
    onSubmit(input, files.length > 0 ? files : undefined)
    setInput('')
    setFiles([])
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.focus()
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles(prev => (multiple ? [...prev, ...selectedFiles] : selectedFiles.slice(0, 1)))
    // Cleared so picking the same file again (after removing it) still fires a change.
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className={cn("bg-[rgb(var(--bg-surface))] shrink-0", compact ? "px-1 py-1" : "border-t border-[rgb(var(--bd-default))] px-4 py-2.5")}>
      <div className="max-w-3xl mx-auto">
        {/* Disabled Banner */}
        {disabled && disabledReason && (
          <div className="mb-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>{disabledReason}</span>
          </div>
        )}
        {/* File Previews */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2 bg-[rgb(var(--bg-app))] border border-[rgb(var(--bd-default))] rounded-lg text-sm"
              >
                {file.type.startsWith('image/') ? (
                  <ImageIcon className="w-4 h-4 text-[rgb(var(--fg-muted))]" />
                ) : /\.(xlsx|xls|csv)$/i.test(file.name) ? (
                  <FileSpreadsheet className="w-4 h-4 text-[rgb(var(--fg-muted))]" />
                ) : (
                  <FileIcon className="w-4 h-4 text-[rgb(var(--fg-muted))]" />
                )}
                <span className="text-[rgb(var(--fg-default))] truncate max-w-[150px]">
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  aria-label={`Remove ${file.name}`}
                  className="text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* While the mic is open: a strip that says so, moving, and how to stop. */}
        {isListening && (
          <div role="status" aria-live="polite" className="mb-2 flex items-center gap-2 px-1 text-xs text-[rgb(var(--color-primary))]">
            <span className="relative flex w-2 h-2" aria-hidden>
              <span className="absolute inline-flex w-full h-full rounded-full bg-[rgb(var(--color-primary))] opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-[rgb(var(--color-primary))]" />
            </span>
            <span className="font-medium">{t('Listening')}</span>
            <span className="flex items-center gap-0.5 h-3" aria-hidden>
              {[0.5, 1, 0.7, 0.9, 0.6].map((h, i) => (
                <span
                  key={i}
                  className="w-0.5 rounded-full bg-[rgb(var(--color-primary))] motion-safe:animate-pulse"
                  style={{ height: `${h * 100}%`, animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
            <span className="text-[rgb(var(--fg-muted))]">{t('tap the mic to stop')}</span>
          </div>
        )}

        <div className={cn(
          isListening && "!border-[rgb(var(--color-primary))]",
          "relative flex items-center gap-1 bg-[rgb(var(--bg-app))]/60 backdrop-blur-xl border border-[rgb(var(--bd-default))] shadow-lg transition-all duration-250 focus-within:border-[rgb(var(--color-focus))] focus-within:shadow-[0_0_0_4px_rgb(var(--color-focus)/0.12),0_20px_25px_-5px_rgba(0,0,0,0.15)] focus-within:-translate-y-px",
          compact ? "rounded-xl p-1.5" : "rounded-2xl p-2.5"
        )}>
          {/* File Upload Button */}
          {allowFileUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple={multiple}
                accept={accept}
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 !min-h-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-subtle))]"
                aria-label={attachLabel}
              >
                {attachIcon ?? <Paperclip className="w-4 h-4" />}
              </button>
            </>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            data-chat-input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              disabled ? t('Conversation closed — start a new chat')
              : isListening ? t('Listening...')
              : placeholder
            }
            disabled={isListening || disabled}
            autoFocus={!disabled}
            rows={1}
            className={cn(
              'flex-1 bg-transparent text-[rgb(var(--fg-default))] placeholder:text-[rgb(var(--fg-muted))]',
              'resize-none outline-none text-sm',
              compact ? 'px-2 py-1.5 max-h-[120px]' : 'px-3 py-2.5 max-h-[200px]',
              'overflow-y-auto',
              disabled && 'cursor-not-allowed'
            )}
          />

          {/* Voice Input Button */}
          {speechSupported && (
            <button
              onClick={handleVoiceInput}
              className={cn(
                'shrink-0 !min-h-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                isListening
                  ? 'text-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))]/15'
                  : 'text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-subtle))]'
              )}
              aria-label={isListening ? t('Stop listening') : t('Voice input')}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}

          {/* Send / Stop Button — swap when assistant is responding */}
          {isLoading && onStop ? (
            <button
              onClick={onStop}
              className="shrink-0 !min-h-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-[180ms] ease-out shadow-sm bg-[rgb(var(--color-primary))] text-white hover:opacity-90 hover:scale-[1.04] active:scale-95 ring-1 ring-[rgb(var(--color-primary))]/20"
              aria-label="Stop generation"
            >
              <span className="w-2.5 h-2.5 rounded-[2px] bg-white" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={(!input.trim() && files.length === 0) || isListening || disabled}
              className={cn(
                'shrink-0 !min-h-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-[180ms] ease-out shadow-md',
                (input.trim() || files.length > 0) && !isListening && !disabled
                  ? 'bg-[rgb(var(--color-primary))] text-white hover:scale-[1.06] active:scale-95'
                  : 'bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-muted))] cursor-not-allowed shadow-none'
              )}
              aria-label="Send message"
            >
              <Send className="w-4 h-4 transition-transform duration-200 active:rotate-45" />
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
