'use client'

import React, { useState, useCallback, useRef, useLayoutEffect, useEffect } from 'react'
import { MessageSquare, Send, Info, X, Pencil, Trash2, Check, Paperclip, FileText, Loader2 } from '@/lib/icons'
import { Modal, ModalContent, ModalTitle } from '@/components'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'
import { RemarkIntelligenceAPI, type RemarkEntry, type RemarkFile } from '@/lib/api/activity/remarks'
import { Skeleton } from '@/components/ui'

// Commits the form's Remark field to the shared trail — the counterpart to the
// "Current" preview entry the trail shows while the remark is still unsaved.
// Call it after the host form saves successfully; `previous` is the remark as it
// was loaded, so an unchanged remark is not re-posted on every save.
export async function commitRemarkToTrail(args: {
  module: string
  documentId: string | number | null | undefined
  documentName?: string
  documentNo?: string
  actionUrl?: string
  stage: string
  status?: string
  text: string
  previous?: string
  session: any
}): Promise<{ success: boolean; error?: string; skipped?: boolean }> {
  const text = (args.text || '').trim()
  const previous = (args.previous || '').trim()
  const hasDoc = args.documentId !== null && args.documentId !== undefined && args.documentId !== '' && Number(args.documentId) !== 0
  if (!text || text === previous || !hasDoc) return { success: true, skipped: true }
  return RemarkIntelligenceAPI.saveRemarkData({
    Module: args.module,
    DocumentID: args.documentId!,
    DocumentName: args.documentName,
    DocumentNo: args.documentNo,
    ActionUrl: args.actionUrl,
    stage: args.stage,
    status: args.status || '',
    text,
  }, args.session)
}

// ── Trail (timeline list) ───────────────────────────────────────────────────

// Timeline-shaped placeholder shown while the trail is still loading and no
// remarks are available yet.
function RemarkTrailSkeleton() {
  return (
    <ul className="space-y-3" aria-hidden>
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={i} className="flex gap-2.5">
          <Skeleton width="1.5rem" height="1.5rem" variant="circular" className="shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton width="30%" height="0.75rem" />
            <Skeleton width={i % 2 === 0 ? '85%' : '65%'} height="0.85rem" />
          </div>
        </li>
      ))}
    </ul>
  )
}

interface RemarkTrailProps {
  remarks: RemarkEntry[]
  onAdd?: (text: string, files?: RemarkFile[]) => void | Promise<void>
  canAdd?: boolean
  loading?: boolean
  // When provided, shows a close (X) button in the header.
  onClose?: () => void
  // Optional document number shown in the header (e.g. 'EQ00044_25_26').
  documentNo?: string
  // Edit/delete the last entry — only allowed when it's the caller's and < 2h old.
  currentUserId?: number
  onEdit?: (seq: number, text: string) => void | Promise<void>
  onDelete?: (seq: number) => void | Promise<void>
  // When provided, an attach button appears in the add row. Uploads files and
  // returns their {name,url} so they can ride along with the new remark.
  onUploadFiles?: (files: File[]) => Promise<RemarkFile[]>
  // Hide the internal "Remarks" header bar (use when the host already titles it).
  hideHeader?: boolean
  // Custom empty-state copy (defaults to a generic "No remarks yet").
  emptyTitle?: string
  emptyHint?: string
  className?: string
}

// The last entry is editable/deletable only if authored by the caller and < 2 hours old.
function canMutate(entry: RemarkEntry | undefined, currentUserId?: number): boolean {
  if (!entry || !currentUserId) return false
  if (Number(entry.by) !== Number(currentUserId)) return false
  if (!entry.at) return false
  const at = new Date(entry.at)
  if (isNaN(at.getTime())) return false
  return Date.now() - at.getTime() < 2 * 60 * 60 * 1000
}

// Relative time like "2h ago", "3 days ago"; falls back to a date for old entries.
function formatWhen(at: string): string {
  if (!at) return ''
  const d = new Date(at)
  if (isNaN(d.getTime())) return at
  const diff = Date.now() - d.getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}d ago`
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: '2-digit' })
}

// Neutral stage chip — no per-stage colors.
function stageChip(_stage: string): string {
  return 'bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-muted))]'
}

export function RemarkTrail({ remarks, onAdd, canAdd = true, loading = false, onClose, documentNo, currentUserId, onEdit, onDelete, onUploadFiles, hideHeader = false, emptyTitle, emptyHint, className }: RemarkTrailProps) {
  const { t } = useLanguage()
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  // Inline edit state for the (only-editable) last entry.
  const [editingSeq, setEditingSeq] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  // Files attached to the note being composed (uploaded on pick, sent on add).
  const [pendingFiles, setPendingFiles] = useState<RemarkFile[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const lastSeq = remarks.length ? remarks[remarks.length - 1].seq : -1

  const handlePickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || [])
    e.target.value = '' // allow re-picking the same file
    if (!picked.length || !onUploadFiles) return
    setUploading(true)
    try {
      const uploaded = await onUploadFiles(picked)
      if (uploaded?.length) setPendingFiles(prev => [...prev, ...uploaded])
    } finally {
      setUploading(false)
    }
  }

  const handleAdd = async () => {
    const value = text.trim()
    // A note is valid with text, files, or both.
    if ((!value && pendingFiles.length === 0) || !onAdd) return
    setSaving(true)
    try {
      await onAdd(value, pendingFiles)
      setText('')
      setPendingFiles([])
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (r: RemarkEntry) => { setEditingSeq(r.seq); setEditText(r.text) }
  const commitEdit = async () => {
    const value = editText.trim()
    if (!value || editingSeq == null || !onEdit) { setEditingSeq(null); return }
    await onEdit(editingSeq, value)
    setEditingSeq(null)
  }

  return (
    <div className={cn('rounded-lg border border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))] overflow-hidden flex flex-col', className)}>
      {!hideHeader && (
        <div className="flex items-center gap-1.5 px-3 py-2 bg-[rgb(var(--bg-subtle))] border-b border-[rgb(var(--bd-subtle))]">
          <MessageSquare className="h-3.5 w-3.5 text-[rgb(var(--fg-muted))]" />
          <span className="text-xs font-medium text-[rgb(var(--fg-muted))]">{t('Remarks')}</span>
          {remarks.length > 0 && <span className="text-[11px] text-[rgb(var(--fg-subtle))]">({remarks.length})</span>}
          {documentNo && <span className="text-[11px] text-[rgb(var(--fg-subtle))]">· {documentNo}</span>}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title={t('Close')}
              className="ml-auto p-0.5 rounded text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-hover))] transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-auto px-3 py-2">
        {/* Show whatever we already have. Only when there's nothing yet do we
            fall back to a skeleton (still loading) or a friendly empty state. */}
        {remarks.length === 0 ? (
          loading ? (
            <RemarkTrailSkeleton />
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5 py-8 text-center">
              <MessageSquare className="h-6 w-6 text-[rgb(var(--fg-subtle))]" />
              <p className="text-sm font-medium text-[rgb(var(--fg-muted))]">{emptyTitle || t('No remarks yet')}</p>
              {emptyHint && <p className="text-xs text-[rgb(var(--fg-subtle))]">{emptyHint}</p>}
            </div>
          )
        ) : (
          <ul className="space-y-2.5">
            {remarks.map((r) => {
              const mutable = r.seq === lastSeq && canMutate(r, currentUserId) && (!!onEdit || !!onDelete)
              const isEditing = editingSeq === r.seq
              return (
                <li key={r.seq} className="group relative text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {r.byName && r.byName.trim() && (
                      <span className="font-semibold text-[rgb(var(--fg-default))]">{r.byName}</span>
                    )}
                    {(r.stage || r.status) && (() => {
                      const stageLabel = t(r.stage || 'General')
                      // Don't repeat the stage chip when it just echoes the author name.
                      const dup = r.byName && r.byName.trim().toLowerCase() === (r.stage || '').trim().toLowerCase()
                      if (dup && !r.status) return null
                      return (
                        <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide', stageChip(r.stage))}>
                          {dup ? '' : stageLabel}{r.status ? `${dup ? '' : ' · '}${t(r.status)}` : ''}
                        </span>
                      )
                    })()}
                    {r.at && <span className="text-[10px] text-[rgb(var(--fg-subtle))]">{formatWhen(r.at)}</span>}
                    {r.edited && <span className="text-[10px] italic text-[rgb(var(--fg-subtle))]">({t('edited')})</span>}
                    {mutable && !isEditing && (
                      <span className="ml-auto inline-flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onEdit && (
                          <button type="button" onClick={() => startEdit(r)} title={t('Edit')} className="p-0.5 rounded text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--color-primary))]">
                            <Pencil className="h-3 w-3" />
                          </button>
                        )}
                        {onDelete && (
                          <button type="button" onClick={() => onDelete(r.seq)} title={t('Delete')} className="p-0.5 rounded text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--color-error))]">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="mt-1 flex items-center gap-1.5">
                      <input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitEdit() } if (e.key === 'Escape') setEditingSeq(null) }}
                        autoFocus
                        className="flex-1 text-xs rounded border border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))] px-2 py-1 text-[rgb(var(--fg-default))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))]"
                      />
                      <button type="button" onClick={commitEdit} title={t('Save')} className="p-1 rounded bg-[rgb(var(--color-primary))] text-white hover:opacity-90"><Check className="h-3 w-3" /></button>
                      <button type="button" onClick={() => setEditingSeq(null)} title={t('Cancel')} className="p-1 rounded text-[rgb(var(--fg-muted))] hover:bg-[rgb(var(--bg-hover))]"><X className="h-3 w-3" /></button>
                    </div>
                  ) : (
                    r.text && <p className="mt-0.5 text-[rgb(var(--fg-default))] whitespace-pre-wrap break-words leading-snug">{r.text}</p>
                  )}
                  {!isEditing && r.files && r.files.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {r.files.map((f, i) => (
                        <a
                          key={i}
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={f.name}
                          className="inline-flex items-center gap-1 max-w-[12rem] rounded-md border border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-subtle))] px-1.5 py-0.5 text-[10px] text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--color-primary))] hover:border-[rgb(var(--color-primary))]/40 transition-colors"
                        >
                          <FileText className="h-3 w-3 shrink-0" />
                          <span className="truncate">{f.name}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {onAdd && (
        <div className="border-t border-[rgb(var(--bd-subtle))] px-2 py-1.5 space-y-1.5">
          {pendingFiles.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {pendingFiles.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1 max-w-[12rem] rounded-md border border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-subtle))] pl-1.5 pr-1 py-0.5 text-[10px] text-[rgb(var(--fg-muted))]">
                  <FileText className="h-3 w-3 shrink-0" />
                  <span className="truncate">{f.name}</span>
                  <button type="button" onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))} title={t('Remove')} className="p-0.5 rounded-full hover:text-[rgb(var(--color-error))]">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            {onUploadFiles && (
              <>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handlePickFiles} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!canAdd || saving || uploading}
                  title={t('Attach files')}
                  className="p-1.5 rounded border border-[rgb(var(--bd-default))] text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--color-primary))] hover:border-[rgb(var(--color-primary))]/50 disabled:opacity-50 transition-colors shrink-0"
                >
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
                </button>
              </>
            )}
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd() } }}
              disabled={!canAdd || saving}
              placeholder={t('Add a note...')}
              className="flex-1 text-xs rounded border border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))] px-2 py-1 text-[rgb(var(--fg-default))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))] disabled:opacity-60"
            />
            <button
              onClick={handleAdd}
              disabled={!canAdd || saving || uploading || (!text.trim() && pendingFiles.length === 0)}
              title={t('Add')}
              className="p-1.5 rounded bg-[rgb(var(--color-primary))] text-white disabled:opacity-50 hover:opacity-90 transition-opacity shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Input (form field + eye → trail popup) ──────────────────────────────────

interface RemarkInputProps {
  // The remark text being entered now (bound to the host form's remark value).
  value: string
  onChange: (value: string) => void
  // Identity of the document this remark belongs to — used to load/persist the trail.
  module: string
  documentId: string | number | null | undefined
  documentName?: string
  documentNo?: string
  actionUrl?: string
  // Stage the current author writes at (e.g. 'Sales', 'Estimation', 'Quotation').
  stage?: string
  session: any
  label?: string
  placeholder?: string
  rows?: number
  disabled?: boolean
  // Show the "Trail" info button / popup. Default false (opt-in).
  showTrail?: boolean
  // When provided, enables per-remark attachments in the trail popup.
  onUploadFiles?: (files: File[]) => Promise<RemarkFile[]>
  className?: string
  // Overrides on the textarea itself (e.g. a smaller font in dense layouts).
  inputClassName?: string
  error?: boolean
  required?: boolean
}

export function RemarkInput({
  value,
  onChange,
  module,
  documentId,
  documentName,
  documentNo,
  actionUrl,
  stage = 'General',
  session,
  label,
  placeholder,
  rows = 1,
  showTrail = false,
  onUploadFiles,
  disabled = false,
  className,
  inputClassName,
  error = false,
  required = false,
}: RemarkInputProps) {
  const { t } = useLanguage()
  const [trailOpen, setTrailOpen] = useState(false)
  const [remarks, setRemarks] = useState<RemarkEntry[]>([])
  const [loading, setLoading] = useState(false)
  const taRef = useRef<HTMLTextAreaElement>(null)

  // Auto-grow with content: starts at one row, expands smoothly up to a cap, then scrolls.
  // User-dragged heights are respected (we only auto-size while the user hasn't manually resized).
  const userResized = useRef(false)
  const autoGrow = useCallback(() => {
    const el = taRef.current
    if (!el || userResized.current) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`
  }, [])
  useLayoutEffect(() => { autoGrow() }, [value, autoGrow])

  const hasDoc = documentId !== null && documentId !== undefined && documentId !== '' && Number(documentId) !== 0

  const [count, setCount] = useState(0)
  const currentUserId = Number((session?.user as any)?.UserID ?? (session?.user as any)?.userID ?? 0) || undefined

  const loadTrail = useCallback(async () => {
    if (!hasDoc) { setRemarks([]); setCount(0); return }
    setLoading(true)
    try {
      const res = await RemarkIntelligenceAPI.getRemarkData(module, documentId!, session)
      const raw = res.success && res.data ? res.data.remarks : []
      // Oldest → newest so the trail reads top-to-bottom (latest message at the bottom).
      const list = [...raw].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0))
      setRemarks(list)
      setCount(list.length)
    } catch {
      setRemarks([])
    } finally {
      setLoading(false)
    }
  }, [hasDoc, module, documentId, session])

  // Eager count on mount (and when the doc changes) so the Trail badge shows up front.
  useEffect(() => {
    let alive = true
    if (!hasDoc || !showTrail) { setCount(0); return }
    RemarkIntelligenceAPI.getRemarkData(module, documentId!, session).then((res) => {
      if (alive) setCount(res.success && res.data ? res.data.remarks.length : 0)
    }).catch(() => {})
    return () => { alive = false }
  }, [hasDoc, showTrail, module, documentId, session])

  const openTrail = useCallback(() => {
    setTrailOpen(true)
    loadTrail()
  }, [loadTrail])

  const handleEdit = useCallback(async (seq: number, text: string) => {
    if (!hasDoc) return
    const res = await RemarkIntelligenceAPI.editRemarkData(module, documentId!, seq, text, session)
    if (res.success) await loadTrail()
  }, [hasDoc, module, documentId, session, loadTrail])

  const handleDelete = useCallback(async (seq: number) => {
    if (!hasDoc) return
    const res = await RemarkIntelligenceAPI.deleteRemarkData(module, documentId!, seq, session)
    if (res.success) await loadTrail()
  }, [hasDoc, module, documentId, session, loadTrail])

  // What the trail shows: saved entries + the currently-typed (unsaved) remark, so the user
  // sees their in-progress note captured even before the form is saved.
  const displayRemarks: RemarkEntry[] = (() => {
    const draft = (value || '').trim()
    const lastSaved = remarks.length ? (remarks[remarks.length - 1].text || '').trim() : ''
    if (!draft || draft === lastSaved) return remarks
    return [
      ...remarks,
      { seq: remarks.length + 1, stage, status: t('Current'), text: draft, by: null, byName: t('You'), at: '' },
    ]
  })()

  // Append a note straight to the trail from inside the popup (independent of the host form).
  const handleAdd = useCallback(async (text: string, files?: RemarkFile[]) => {
    if (!hasDoc) return
    const res = await RemarkIntelligenceAPI.saveRemarkData({
      Module: module,
      DocumentID: documentId!,
      DocumentName: documentName,
      DocumentNo: documentNo,
      ActionUrl: actionUrl,
      stage,
      status: '',
      text,
      files,
    }, session)
    if (res.success) await loadTrail()
  }, [hasDoc, module, documentId, documentName, documentNo, actionUrl, stage, session, loadTrail])

  return (
    <div className={className}>
      {label && (
        <label className="text-xs font-medium text-[rgb(var(--fg-muted))] mb-1.5 flex items-center justify-between">
          <span>
            {label}
            {required && <span className="ml-0.5 text-[rgb(var(--color-error))]">*</span>}
          </span>
          {hasDoc && showTrail && (
            <button
              type="button"
              onClick={openTrail}
              title={t('View remark trail')}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[rgb(var(--color-primary))] hover:opacity-80"
            >
              <Info className="h-3.5 w-3.5" />
              {t('Trail')}{count > 0 ? ` (${count})` : ''}
            </button>
          )}
        </label>
      )}

      <div className="relative">
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => { onChange(e.target.value); autoGrow() }}
          onMouseDown={() => { /* dragging the resize handle counts as manual sizing */ }}
          onMouseUp={(e) => {
            // If the user dragged the resize grip, keep their height; double-clearing resets it.
            const el = e.currentTarget
            if (el.style.height && Math.abs(el.clientHeight - el.scrollHeight) > 4) userResized.current = true
          }}
          placeholder={placeholder ?? t('Add remarks or notes...')}
          rows={rows}
          disabled={disabled}
          className={cn(
            'w-full text-sm rounded-md border bg-[rgb(var(--bg-surface))] px-3 py-2 pr-9 text-[rgb(var(--fg-default))]',
            error
              ? 'border-[rgb(var(--color-error))] placeholder:text-[rgb(var(--fg-subtle))]'
              : 'border-[rgb(var(--bd-default))] placeholder:text-[rgb(var(--fg-subtle))]',
            'transition-[height,box-shadow,border-color] duration-150 ease-out',
            'focus:outline-none focus:border-[rgb(var(--color-primary))] focus:ring-2 focus:ring-[rgb(var(--color-primary))]/30',
            'resize-y overflow-auto min-h-[2.25rem] disabled:opacity-60',
            inputClassName
          )}
        />
        {/* Trail (info) button inside the field when there's no label row to host it. */}
        {hasDoc && showTrail && !label && (
          <button
            type="button"
            onClick={openTrail}
            title={t('View remark trail')}
            className="absolute top-1.5 right-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[rgb(var(--bd-default))] text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--color-primary))] hover:border-[rgb(var(--color-primary))]/50 hover:bg-[rgb(var(--color-primary-subtle))] transition-colors"
          >
            <Info className="h-3 w-3" />
            {count > 0 && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[rgb(var(--color-primary))]" />}
          </button>
        )}
      </div>

      <Modal open={trailOpen} onOpenChange={setTrailOpen}>
        <ModalContent size="md" hideCloseButton className="p-0 overflow-hidden max-h-[80vh]">
          <ModalTitle className="sr-only">{t('Remarks')}</ModalTitle>
          <RemarkTrail
            remarks={displayRemarks}
            loading={loading}
            onAdd={hasDoc ? handleAdd : undefined}
            onClose={() => setTrailOpen(false)}
            documentNo={documentNo}
            currentUserId={currentUserId}
            onEdit={hasDoc ? handleEdit : undefined}
            onDelete={hasDoc ? handleDelete : undefined}
            onUploadFiles={onUploadFiles}
            className="max-h-[80vh] border-0 rounded-none"
          />
        </ModalContent>
      </Modal>
    </div>
  )
}
