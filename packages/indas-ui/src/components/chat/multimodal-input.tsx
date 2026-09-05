'use client'

/**
 * Multimodal Input Component
 * Chat input with auto-expanding textarea, file upload, and voice input
 */

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react'
import { Send, Paperclip, Mic, MicOff, X, FileIcon, Image as ImageIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

interface MultimodalInputProps {
  onSubmit: (text: string, files?: File[]) => void
  onStop?: () => void
  isLoading?: boolean
  placeholder?: string
  allowFileUpload?: boolean
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
  compact = false,
  disabled = false,
  disabledReason
}: MultimodalInputProps) {
  const { t } = useLanguage()
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
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-IN'

    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript
      if (transcript) {
        setInput(prev => prev + (prev ? ' ' : '') + transcript.trim())
      }
      setIsListening(false)
      recognitionRef.current = null
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
  }, [isListening])

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
    setFiles(prev => [...prev, ...selectedFiles])
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
                ) : (
                  <FileIcon className="w-4 h-4 text-[rgb(var(--fg-muted))]" />
                )}
                <span className="text-[rgb(var(--fg-default))] truncate max-w-[150px]">
                  {file.name}
                </span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className={cn(
          "relative flex items-center gap-1 bg-[rgb(var(--bg-app))]/60 backdrop-blur-xl border border-[rgb(var(--bd-default))] shadow-lg transition-all duration-250 focus-within:border-[rgb(var(--color-primary))] focus-within:shadow-[0_0_0_4px_rgb(var(--color-primary)/0.12),0_20px_25px_-5px_rgba(0,0,0,0.15)] focus-within:-translate-y-px",
          compact ? "rounded-xl p-1.5" : "rounded-2xl p-2.5"
        )}>
          {/* File Upload Button */}
          {allowFileUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf,.doc,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 !min-h-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-subtle))]"
                aria-label="Attach file"
              >
                <Paperclip className="w-4 h-4" />
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
                  ? 'text-red-500 bg-red-500/10 animate-pulse'
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
              title="Stop"
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
