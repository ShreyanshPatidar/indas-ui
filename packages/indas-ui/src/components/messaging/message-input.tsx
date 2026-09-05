'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Send, Paperclip, X, FileIcon, Image as ImageIcon, Reply, Mic, MicOff } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import type { ChatMessage, ChatAttachment } from '@/lib/api/activity/messaging/messaging'

interface MessageInputProps {
  onSend: (content: string, attachments?: ChatAttachment[]) => void
  onUploadFile: (file: File) => Promise<{ FileName: string; FileUrl: string; FileSize: number; MimeType: string } | null>
  onTyping?: (isTyping: boolean) => void
  replyTo?: ChatMessage | null
  onCancelReply?: () => void
  disabled?: boolean
  placeholder?: string
}

export function MessageInput({
  onSend,
  onUploadFile,
  onTyping,
  replyTo,
  onCancelReply,
  disabled,
  placeholder
}: MessageInputProps) {
  const { t } = useLanguage()
  const [text, setText] = useState('')
  const [pendingFiles, setPendingFiles] = useState<{ file: File; preview?: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recognitionRef = useRef<any>(null)

  // Voice input support check
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

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-IN'

    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript
      if (transcript) {
        setText(prev => prev + (prev ? ' ' : '') + transcript.trim())
      }
      setIsListening(false)
      recognitionRef.current = null
    }

    recognition.onerror = () => {
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

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [text])

  // Focus on reply
  useEffect(() => {
    if (replyTo) textareaRef.current?.focus()
  }, [replyTo])

  const handleTyping = useCallback(() => {
    if (!onTyping) return
    onTyping(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => onTyping(false), 3000)
  }, [onTyping])

  const handleSubmit = useCallback(async () => {
    const content = text.trim()
    if (!content && pendingFiles.length === 0) return

    // Upload pending files
    let attachments: ChatAttachment[] = []
    if (pendingFiles.length > 0) {
      setUploading(true)
      try {
        const results = await Promise.all(pendingFiles.map(f => onUploadFile(f.file)))
        attachments = results
          .filter((r): r is NonNullable<typeof r> => r !== null)
          .map(r => ({
            fileName: r.FileName,
            fileUrl: r.FileUrl,
            fileSize: r.FileSize,
            mimeType: r.MimeType
          }))
      } finally {
        setUploading(false)
      }
    }

    onSend(content, attachments.length > 0 ? attachments : undefined)
    setText('')
    setPendingFiles([])
    onTyping?.(false)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [text, pendingFiles, onSend, onUploadFile, onTyping])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const newFiles = Array.from(files).map(file => {
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      return { file, preview }
    })
    setPendingFiles(prev => [...prev, ...newFiles])
    e.target.value = '' // reset so same file can be selected again
  }, [])

  const removeFile = useCallback((idx: number) => {
    setPendingFiles(prev => {
      const item = prev[idx]
      if (item?.preview) URL.revokeObjectURL(item.preview)
      return prev.filter((_, i) => i !== idx)
    })
  }, [])

  return (
    <div className="flex-shrink-0 border-t border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))]">
      {/* Reply indicator */}
      {replyTo && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--bg-subtle))] border-b border-[rgb(var(--bd-default))]">
          <Reply className="w-4 h-4 text-[rgb(var(--color-primary))] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[rgb(var(--color-primary))]">{t('Replying to message')}</p>
            <p className="text-xs text-[rgb(var(--fg-muted))] truncate">{replyTo.Content}</p>
          </div>
          <button onClick={onCancelReply} className="flex-shrink-0 text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pending file previews */}
      {pendingFiles.length > 0 && (
        <div className="flex gap-2 px-4 py-2 overflow-x-auto">
          {pendingFiles.map((f, i) => (
            <div key={i} className="relative flex-shrink-0">
              {f.preview ? (
                <img src={f.preview} alt={f.file.name} className="w-16 h-16 rounded-lg object-cover border border-[rgb(var(--bd-default))]" />
              ) : (
                <div className="w-16 h-16 rounded-lg border border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-subtle))] flex flex-col items-center justify-center">
                  <FileIcon className="w-5 h-5 text-[rgb(var(--fg-muted))]" />
                  <span className="text-[0.5rem] text-[rgb(var(--fg-muted))] mt-0.5 truncate max-w-[3.5rem]">
                    {f.file.name.split('.').pop()?.toUpperCase()}
                  </span>
                </div>
              )}
              <button
                onClick={() => removeFile(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 px-3 py-2">
        {/* File attach button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-[rgb(var(--fg-muted))] hover:bg-[rgb(var(--bg-hover))] transition-colors disabled:opacity-50"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar"
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => { setText(e.target.value); handleTyping() }}
          onKeyDown={handleKeyDown}
          disabled={disabled || uploading || isListening}
          placeholder={isListening ? t('Listening...') : (placeholder || t('Type a message...'))}
          rows={1}
          className="flex-1 min-h-[2.25rem] max-h-[7.5rem] px-3 py-2 rounded-xl bg-[rgb(var(--bg-subtle))] text-sm text-[rgb(var(--fg-default))] placeholder:text-[rgb(var(--fg-muted))] border border-[rgb(var(--bd-default))] resize-none focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))] disabled:opacity-50"
        />

        {/* Voice input button */}
        {speechSupported && (
          <button
            onClick={handleVoiceInput}
            disabled={disabled || uploading}
            className={cn(
              'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
              isListening
                ? 'text-red-500 bg-red-500/10 animate-pulse'
                : 'text-[rgb(var(--fg-muted))] hover:bg-[rgb(var(--bg-hover))]',
              'disabled:opacity-50'
            )}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        )}

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={disabled || uploading || isListening || (!text.trim() && pendingFiles.length === 0)}
          className={cn(
            'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
            text.trim() || pendingFiles.length > 0
              ? 'bg-[rgb(var(--color-primary))] text-white hover:opacity-90'
              : 'text-[rgb(var(--fg-muted))] hover:bg-[rgb(var(--bg-hover))]',
            'disabled:opacity-50'
          )}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
