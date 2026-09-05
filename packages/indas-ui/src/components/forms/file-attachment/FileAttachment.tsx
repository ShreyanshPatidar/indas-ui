'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import {
  Upload,
  X,
  File as FileIcon,
  FileText,
  Image,
  FileArchive,
  FileVideo,
  FileAudio,
  Download,
  Eye,
  Camera,
  Plus,
  XCircle,
  Save,
  Mail,
  Paperclip,
  RefreshCw,
  Search
} from '@/lib/icons'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { Footer } from '@/components/layout'
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/modals/Modal'
import { EmailPreview } from './EmailPreview'
import { useEmail } from '@/contexts/EmailContext'

// Helper function to get cropped image as blob
async function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
  mimeType: string = 'image/jpeg',
  quality: number = 0.92
): Promise<{ blob: Blob; url: string } | null> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  // Calculate scale factors
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height

  // Set canvas size to the crop size (in natural pixels for best quality)
  const pixelRatio = window.devicePixelRatio || 1
  canvas.width = Math.floor(crop.width * scaleX * pixelRatio)
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio)

  // Scale context for high DPI displays
  ctx.scale(pixelRatio, pixelRatio)
  ctx.imageSmoothingQuality = 'high'

  // Calculate crop coordinates in natural image pixels
  const cropX = crop.x * scaleX
  const cropY = crop.y * scaleY
  const cropWidth = crop.width * scaleX
  const cropHeight = crop.height * scaleY

  // Draw the cropped image
  ctx.drawImage(
    image,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    crop.width * scaleX,
    crop.height * scaleY
  )

  return new Promise((resolve) => {
    // Use lossless quality for PNG/BMP/GIF (quality param is ignored for these)
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve({
            blob,
            url: URL.createObjectURL(blob)
          })
        } else {
          resolve(null)
        }
      },
      mimeType,
      quality
    )
  })
}

// Helper to create centered aspect ratio crop
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number | undefined
): Crop {
  if (aspect) {
    return centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        aspect,
        mediaWidth,
        mediaHeight
      ),
      mediaWidth,
      mediaHeight
    )
  }
  // No aspect ratio - use 90% of image
  return {
    unit: '%',
    x: 5,
    y: 5,
    width: 90,
    height: 90
  }
}

export interface AttachedFile {
  id: string
  name: string
  size: number
  type: string
  url?: string
  file?: File
}

export interface FileAttachmentProps {
  value?: AttachedFile[]
  onChange?: (files: AttachedFile[]) => void
  maxFiles?: number
  maxFileSize?: number // in bytes
  acceptedFileTypes?: string[]
  label?: string
  className?: string
  disabled?: boolean
  showInlinePreview?: boolean // Show preview directly when single file selected
  previewShape?: 'circular' | 'rectangular' // Shape of inline preview
  previewSize?: 'sm' | 'md' | 'lg' // Size of inline preview
  hideInstructions?: boolean // Hide the "Drag & drop" instruction text
  hideDropzone?: boolean // Hide the upload dropzone entirely (view-only: just the file list)
  onFileClick?: (file: AttachedFile) => void // Clicking a file tile (instead of opening preview) — for host-side selection
  selectedFileId?: string // Highlight this file id as selected (used with onFileClick)
  enableEmailImport?: boolean // Enable "Import from Email" button
}

// Email type for import modal
interface EmailForImport {
  id: string
  subject: string
  from: string
  date: string
  body?: string
  attachments?: { name: string; size: number; type: string }[]
  folder?: string // Folder where the email is located for faster fetching
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Allowed filename characters: letters, digits, space, and a small set of safe
// punctuation. Rejects emojis and other characters that break the S3 object key.
const VALID_FILENAME = /^[A-Za-z0-9 ._\-()[\]&+#]+$/
// Returns an error string if the filename is invalid, else null.
const validateFileName = (name: string): string | null => {
  const base = (name || '').trim()
  if (!base) return 'File name is empty'
  if (!VALID_FILENAME.test(base)) {
    const bad = Array.from(base).filter(c => !VALID_FILENAME.test(c))
    const shown = Array.from(new Set(bad)).slice(0, 5).join(' ')
    return `File name "${base}" has invalid characters (${shown}). Use only letters, numbers, spaces and . _ - ( ) [ ] & + #`
  }
  return null
}

// Check if file is an email type (.eml, .msg, or imported email)
const isEmailFile = (type: string, name?: string) => {
  return type.includes('message/') ||
    type.includes('rfc822') ||
    type.includes('ms-outlook') ||
    type === 'message/email' ||
    name?.endsWith('.eml') ||
    name?.endsWith('.msg')
}

// Check if file is an Excel type
const isExcelFile = (type: string, name?: string) => {
  return type.includes('spreadsheet') ||
    type.includes('excel') ||
    type === 'application/vnd.ms-excel' ||
    type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    name?.endsWith('.xlsx') ||
    name?.endsWith('.xls') ||
    name?.endsWith('.csv')
}

const getFileIcon = (type: string, name?: string) => {
  if (type.startsWith('image/')) return Image
  if (type.startsWith('video/')) return FileVideo
  if (type.startsWith('audio/')) return FileAudio
  if (isEmailFile(type, name)) return Mail
  if (type.includes('pdf') || type.includes('text/')) return FileText
  if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return FileArchive
  return FileIcon
}

const getFileTypeColor = (type: string, name?: string) => {
  if (type.startsWith('image/')) return 'text-[rgb(var(--color-success))] bg-[rgb(var(--color-success)/0.1)]'
  if (type.startsWith('video/')) return 'text-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary)/0.1)]'
  if (type.startsWith('audio/')) return 'text-[rgb(var(--color-info))] bg-[rgb(var(--color-info)/0.1)]'
  if (isEmailFile(type, name)) return 'text-[rgb(var(--color-info))] bg-[rgb(var(--color-info)/0.1)]'
  if (type.includes('pdf')) return 'text-[rgb(var(--color-error))] bg-[rgb(var(--color-error)/0.1)]'
  if (type.includes('text/')) return 'text-[rgb(var(--fg-muted))] bg-[rgb(var(--bg-muted))]'
  if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return 'text-[rgb(var(--color-warning))] bg-[rgb(var(--color-warning)/0.1)]'
  return 'text-[rgb(var(--fg-muted))] bg-[rgb(var(--bg-muted))]'
}

// Image Preview Component with loading and error states
function ImagePreviewContent({ file }: { file: AttachedFile }) {
  const [imageLoading, setImageLoading] = React.useState(true)
  const [imageError, setImageError] = React.useState(false)
  const [imageSrc, setImageSrc] = React.useState<string | null>(null)

  React.useEffect(() => {
    let blobUrl: string | null = null
    let isCancelled = false

    setImageLoading(true)
    setImageError(false)

    // Priority 1: If we have a File object, create a fresh blob URL from it
    if (file.file && typeof file.file === 'object' && 'size' in file.file) {
      try {
        blobUrl = URL.createObjectURL(file.file)
        if (!isCancelled) {
          setImageSrc(blobUrl)
        }
        return () => {
          isCancelled = true
          if (blobUrl) {
            URL.revokeObjectURL(blobUrl)
          }
        }
      } catch (e) {
        // Failed to create blob URL, continue to other options
      }
    }

    // Priority 2: If we have a data URL, use it directly (always works)
    if (file.url?.startsWith('data:')) {
      if (!isCancelled) setImageSrc(file.url)
      return () => { isCancelled = true }
    }

    // Priority 3: If we have a blob URL, use it (might be stale but try)
    if (file.url?.startsWith('blob:')) {
      if (!isCancelled) setImageSrc(file.url)
      return () => { isCancelled = true }
    }

    // Priority 4: Server URL - use directly
    if (file.url) {
      if (!isCancelled) setImageSrc(file.url)
      return () => { isCancelled = true }
    }

    // No valid source found
    if (!isCancelled) {
      setImageError(true)
      setImageLoading(false)
    }

    return () => { isCancelled = true }
  }, [file])

  if (imageError) {
    return (
      <div className="flex flex-col items-center justify-center text-[rgb(var(--fg-muted))]">
        <Image className="h-16 w-16 mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2 text-[rgb(var(--fg-default))]">Unable to load image</h3>
        <p className="text-sm text-center mb-4">
          The image could not be displayed.
          <br />
          Try downloading the file instead.
        </p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[rgb(var(--bg-muted))]">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-[rgb(var(--color-primary))] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-[rgb(var(--fg-muted))]">Loading image...</span>
          </div>
        </div>
      )}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={file.name}
          className={cn(
            "max-w-full max-h-full object-contain rounded-lg shadow-lg transition-opacity duration-300",
            imageLoading ? "opacity-0" : "opacity-100"
          )}
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageLoading(false)
            setImageError(true)
          }}
        />
      )}
    </div>
  )
}

// Excel Preview Component
// A merge range in row/col terms (inclusive, 0-based).
interface MergeRange { r1: number; c1: number; r2: number; c2: number }
// One rendered cell: text + resolved colors from the workbook.
interface PreviewCell { text: string; bg?: string; fg?: string; bold?: boolean }
interface PreviewSheet { name: string; rows: PreviewCell[][]; merges: MergeRange[] }

// ExcelJS ARGB ("FF1E3A5F") → CSS "#1E3A5F". Skips fully transparent / absent.
function argbToCss(argb?: string): string | undefined {
  if (!argb || argb.length < 6) return undefined
  const hex = argb.length === 8 ? argb.slice(2) : argb
  if (argb.length === 8 && argb.slice(0, 2) === '00') return undefined // transparent
  return `#${hex}`
}

function ExcelPreviewContent({ file }: { file: AttachedFile }) {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const [sheetData, setSheetData] = React.useState<PreviewSheet[]>([])
  const [activeSheet, setActiveSheet] = React.useState(0)

  React.useEffect(() => {
    let isCancelled = false
    setLoading(true)
    setError(false)

    const loadExcel = async () => {
      try {
        let arrayBuffer: ArrayBuffer

        // Get file data
        if (file.file instanceof File) {
          arrayBuffer = await file.file.arrayBuffer()
        } else if (file.url) {
          const response = await fetch(file.url)
          arrayBuffer = await response.arrayBuffer()
        } else {
          throw new Error('No file data available')
        }

        // Parse with ExcelJS (not SheetJS) — the community xlsx build strips cell
        // fills/fonts, but ExcelJS preserves them, so the preview can show the
        // real colors + merges of the sheet.
        const { Workbook } = await import('exceljs')
        const workbook = new Workbook()
        await workbook.xlsx.load(arrayBuffer)

        const sheets: PreviewSheet[] = workbook.worksheets.map(ws => {
          const merges: MergeRange[] = Object.values((ws as any)._merges ?? {}).map((m: any) => ({
            r1: m.top - 1, c1: m.left - 1, r2: m.bottom - 1, c2: m.right - 1,
          }))
          const colCount = Math.max(ws.columnCount, ...merges.map(m => m.c2 + 1), 0)
          const rows: PreviewCell[][] = []
          for (let r = 1; r <= ws.rowCount; r++) {
            const row = ws.getRow(r)
            const cells: PreviewCell[] = []
            for (let c = 1; c <= colCount; c++) {
              const cell = row.getCell(c)
              const v = cell.value
              let text = ''
              if (v != null) {
                if (typeof v === 'object' && 'richText' in (v as any)) {
                  text = (v as any).richText.map((t: any) => t.text).join('')
                } else if (typeof v === 'object' && 'text' in (v as any)) {
                  text = String((v as any).text)
                } else if (typeof v === 'object' && 'result' in (v as any)) {
                  text = String((v as any).result ?? '')
                } else {
                  text = String(v)
                }
              }
              const fill: any = cell.fill
              const bg = fill?.type === 'pattern' ? argbToCss(fill.fgColor?.argb) : undefined
              const fg = argbToCss((cell.font?.color as any)?.argb)
              cells.push({ text, bg, fg, bold: cell.font?.bold })
            }
            rows.push(cells)
          }
          return { name: ws.name, rows, merges }
        })

        if (!isCancelled) {
          setSheetData(sheets)
          setLoading(false)
        }
      } catch (e) {
        if (!isCancelled) {
          setError(true)
          setLoading(false)
        }
      }
    }

    loadExcel()
    return () => { isCancelled = true }
  }, [file])

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[rgb(var(--bg-muted))]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-[rgb(var(--color-primary))] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-[rgb(var(--fg-muted))]">Loading spreadsheet...</span>
        </div>
      </div>
    )
  }

  if (error || sheetData.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-[rgb(var(--fg-muted))]">
        <FileText className="h-16 w-16 mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2 text-[rgb(var(--fg-default))]">Unable to load spreadsheet</h3>
        <p className="text-sm text-center mb-4">
          The file could not be parsed.
        </p>
      </div>
    )
  }

  const currentSheet = sheetData[activeSheet]

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Sheet tabs */}
      {sheetData.length > 1 && (
        <div className="flex-shrink-0 flex gap-1 px-4 pt-3 pb-2 border-b border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))] overflow-x-auto">
          {sheetData.map((sheet, index) => (
            <button
              key={sheet.name}
              onClick={() => setActiveSheet(index)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-t transition-colors whitespace-nowrap",
                activeSheet === index
                  ? "bg-white text-[rgb(var(--fg-default))] border border-b-0 border-[rgb(var(--bd-default))]"
                  : "text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-hover))]"
              )}
            >
              {sheet.name}
            </button>
          ))}
        </div>
      )}

      {/* Table content */}
      <div className="flex-1 overflow-auto p-4">
        {currentSheet.rows.length > 0 ? (
          (() => {
            // Merge lookups: origin cell "r:c" → span; covered cell "r:c" → skip.
            // Row spans are clamped to the 100-row render window so a merge that
            // extends past it doesn't reference unrendered rows.
            const ROW_LIMIT = 100
            const spanByOrigin = new Map<string, { rowSpan: number; colSpan: number }>()
            const covered = new Set<string>()
            for (const m of currentSheet.merges) {
              if (m.r1 >= ROW_LIMIT) continue
              const r2 = Math.min(m.r2, ROW_LIMIT - 1)
              spanByOrigin.set(`${m.r1}:${m.c1}`, { rowSpan: r2 - m.r1 + 1, colSpan: m.c2 - m.c1 + 1 })
              for (let r = m.r1; r <= r2; r++) {
                for (let c = m.c1; c <= m.c2; c++) {
                  if (r !== m.r1 || c !== m.c1) covered.add(`${r}:${c}`)
                }
              }
            }
            return (
              <table className="border-collapse text-sm whitespace-nowrap">
                <tbody>
                  {currentSheet.rows.slice(0, 100).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => {
                        if (covered.has(`${rowIndex}:${cellIndex}`)) return null
                        const span = spanByOrigin.get(`${rowIndex}:${cellIndex}`)
                        return (
                          <td
                            key={cellIndex}
                            rowSpan={span?.rowSpan}
                            colSpan={span?.colSpan}
                            className={cn(
                              "border border-[rgb(var(--bd-default))] px-2 py-1.5 align-top",
                              span && "text-center",
                              cell.bold && "font-semibold",
                            )}
                            style={{
                              backgroundColor: cell.bg,
                              color: cell.fg,
                            }}
                          >
                            {cell.text}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          })()
        ) : (
          <div className="text-center text-[rgb(var(--fg-muted))] py-8">
            This sheet is empty
          </div>
        )}
        {currentSheet.rows.length > 100 && (
          <div className="text-center text-[rgb(var(--fg-muted))] text-xs mt-4">
            Showing first 100 rows of {currentSheet.rows.length} total
          </div>
        )}
      </div>
    </div>
  )
}

export function FileAttachment({
  value = [],
  onChange,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedFileTypes = [],
  label = "File Attachment",
  className,
  disabled = false,
  showInlinePreview = false,
  previewShape = 'rectangular',
  previewSize = 'md',
  hideInstructions = false,
  hideDropzone = false,
  onFileClick,
  selectedFileId,
  enableEmailImport = false
}: FileAttachmentProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const [previewFile, setPreviewFile] = React.useState<AttachedFile | null>(null)
  // Blob URL created for the currently-previewed server file. Revoked when the
  // preview closes or switches to another file so we don't leak it (a PDF/image
  // blob can be several MB, and every preview open created a fresh one).
  const previewBlobUrlRef = React.useRef<string | null>(null)
  React.useEffect(() => {
    const url = previewFile?.url
    const isBlob = !!url && url.startsWith('blob:')
    if (isBlob && url !== previewBlobUrlRef.current) {
      if (previewBlobUrlRef.current) URL.revokeObjectURL(previewBlobUrlRef.current)
      previewBlobUrlRef.current = url!
    } else if (!previewFile && previewBlobUrlRef.current) {
      URL.revokeObjectURL(previewBlobUrlRef.current)
      previewBlobUrlRef.current = null
    }
  }, [previewFile])
  React.useEffect(() => () => {
    if (previewBlobUrlRef.current) URL.revokeObjectURL(previewBlobUrlRef.current)
  }, [])
  const [imageZoom, setImageZoom] = React.useState(1)
  const [imageRotation, setImageRotation] = React.useState(0)
  const [showCameraModal, setShowCameraModal] = React.useState(false)
  const [cameraStream, setCameraStream] = React.useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null)
  const [showCropModal, setShowCropModal] = React.useState(false)
  const [imageToCrop, setImageToCrop] = React.useState<string | null>(null)
  const [originalFileInfo, setOriginalFileInfo] = React.useState<{ name: string; type: string } | null>(null)
  const [crop, setCrop] = React.useState<Crop>()
  const [completedCrop, setCompletedCrop] = React.useState<PixelCrop>()
  const cropImageRef = React.useRef<HTMLImageElement>(null)

  // Email import state
  const [showEmailImportModal, setShowEmailImportModal] = React.useState(false)
  const [selectedEmail, setSelectedEmail] = React.useState<EmailForImport | null>(null)
  const [emailSearchQuery, setEmailSearchQuery] = React.useState('')
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Get emails from EmailContext
  const { state: emailState, actions: emailActions } = useEmail()
  const imageInputRef = React.useRef<HTMLInputElement>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  const handleFileSelect = (files: FileList | null) => {
    if (!files || disabled || files.length === 0) return

    const currentFiles = value || []
    const filesArray = Array.from(files)

    // Check if we have room for all files
    const availableSlots = maxFiles - currentFiles.length
    if (availableSlots <= 0) {
      alert(`Maximum ${maxFiles} files allowed`)
      return
    }

    // If multiple files selected, skip cropping and add them directly
    if (filesArray.length > 1) {
      const newFiles: AttachedFile[] = []
      const filesToProcess = filesArray.slice(0, availableSlots)

      for (const file of filesToProcess) {
        // Check file size - 10MB limit for images
        const sizeLimit = file.type.startsWith('image/') ? 10 * 1024 * 1024 : maxFileSize
        if (file.size > sizeLimit) {
          alert(`File "${file.name}" is too large. Maximum size is ${formatFileSize(sizeLimit)}`)
          continue
        }

        // Check file type - also allow .eml and .msg files by extension
        const isAllowedEmailFile = file.name.endsWith('.eml') || file.name.endsWith('.msg')
        if (acceptedFileTypes.length > 0 && !isAllowedEmailFile && !acceptedFileTypes.some(type => file.type.includes(type))) {
          alert(`File type "${file.type}" is not accepted`)
          continue
        }

        const nameError = validateFileName(file.name)
        if (nameError) { alert(nameError); continue }

        newFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          file,
          url: URL.createObjectURL(file)
        })
      }

      if (newFiles.length > 0) {
        onChange?.([...currentFiles, ...newFiles])
      }
      return
    }

    // Single file - check for cropping
    const file = filesArray[0]

    // Check file size - 10MB limit for images
    const sizeLimit = file.type.startsWith('image/') ? 10 * 1024 * 1024 : maxFileSize
    if (file.size > sizeLimit) {
      alert(`File "${file.name}" is too large. Maximum size is ${formatFileSize(sizeLimit)}`)
      return
    }

    // Check file type - also allow .eml and .msg files by extension
    const isAllowedEmailFile = file.name.endsWith('.eml') || file.name.endsWith('.msg')
    if (acceptedFileTypes.length > 0 && !isAllowedEmailFile && !acceptedFileTypes.some(type => file.type.includes(type))) {
      alert(`File type "${file.type}" is not accepted`)
      return
    }

    const nameError = validateFileName(file.name)
    if (nameError) { alert(nameError); return }

    // For single image, show cropper
    if (file.type.startsWith('image/')) {
      setOriginalFileInfo({ name: file.name, type: file.type })
      const reader = new FileReader()
      reader.onloadend = () => {
        setImageToCrop(reader.result as string)
        setShowCropModal(true)
      }
      reader.readAsDataURL(file)
    } else {
      // Non-image file, add directly
      const attachedFile: AttachedFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        file,
        url: URL.createObjectURL(file)
      }
      onChange?.([...currentFiles, attachedFile])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (disabled) return

    const files = e.dataTransfer.files
    handleFileSelect(files)
  }

  // Fetch emails using EmailContext
  const handleOpenEmailModal = () => {
    setShowEmailImportModal(true)
    // Refresh emails if needed
    if (emailState.emails.length === 0 && emailActions?.fetchEmails) {
      emailActions.fetchEmails()
    }
  }

  // Handle email selection and import
  // State for import loading
  const [importingEmail, setImportingEmail] = React.useState(false)

  const handleEmailImport = async (email: EmailForImport) => {
    const currentFiles = value || []

    setImportingEmail(true)
    try {
      // Download the actual .eml file from the API
      // Pass folder hint for faster fetching (skips searching all folders)
      const folderParam = email.folder ? `&folder=${encodeURIComponent(email.folder)}` : ''
      const response = await fetch(`/api/emails/${email.id}?format=eml${folderParam}`, {
        method: 'GET',
        credentials: 'include'
      })

      if (!response.ok) {
        let errorMsg = `HTTP ${response.status}`
        try {
          const text = await response.text()
          try {
            const errData = JSON.parse(text)
            errorMsg = errData.error || errorMsg
          } catch {
            errorMsg = text.substring(0, 200) || errorMsg
          }
        } catch { /* couldn't read body */ }
        throw new Error(errorMsg)
      }

      // Get the raw email content
      const emlContent = await response.blob()

      // Create filename from subject
      const safeSubject = email.subject.replace(/[<>:"/\\|?*]/g, '_').substring(0, 50)
      const filename = `${safeSubject}.eml`

      // Create File object
      const file = new File([emlContent], filename, { type: 'message/rfc822' })

      const attachedFile: AttachedFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: filename,
        size: file.size,
        type: 'message/rfc822',
        file,
        url: URL.createObjectURL(emlContent)
      }

      onChange?.([...currentFiles, attachedFile])
      setShowEmailImportModal(false)
      setSelectedEmail(null)
    } catch (error) {
      console.error('Failed to import email:', error)
      const msg = error instanceof Error ? error.message : 'Unknown error'
      alert(`Failed to import email: ${msg}`)
    } finally {
      setImportingEmail(false)
    }
  }

  const removeFile = (fileId: string) => {
    if (disabled) return

    const updatedFiles = value.filter(file => file.id !== fileId)
    onChange?.(updatedFiles)
  }

  const openFileDialog = () => {
    if (disabled) return
    fileInputRef.current?.click()
  }

  const openImageDialog = () => {
    if (disabled) return
    imageInputRef.current?.click()
  }

  const openCamera = async () => {
    if (disabled) return

    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Camera access is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.')
        return
      }

      // Check camera permission status if available
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName })

          if (permissionStatus.state === 'denied') {
            alert(
              'Camera access has been blocked.\n\n' +
              'To enable camera access:\n' +
              '1. Click the camera/lock icon in your browser\'s address bar\n' +
              '2. Change camera permission to "Allow"\n' +
              '3. Refresh the page and try again'
            )
            return
          }
        } catch (permError) {
          // Permission API might not support camera, continue anyway
        }
      }

      let stream: MediaStream | null = null

      try {
        // Try with default camera first (more compatible)
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        })
      } catch (firstError: any) {

        // Fallback: Try with minimal constraints
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true
          })
        } catch (secondError: any) {
          // If both attempts fail, throw the second error
          throw secondError
        }
      }

      if (stream) {
        setCameraStream(stream)
        setShowCameraModal(true)

        // Wait for modal to render then set video source
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            videoRef.current.play().catch(() => {
              // Video play error - silently handled
            })
          }
        }, 100)
      }
    } catch (err: any) {
      // Provide specific error messages based on error type
      let errorMessage = 'Unable to access camera. '

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage += 'Camera permission was denied.\n\n'
        errorMessage += 'To fix this:\n'
        errorMessage += '1. Click the camera/lock icon in your browser\'s address bar\n'
        errorMessage += '2. Allow camera access for this site\n'
        errorMessage += '3. Refresh the page and try again\n\n'
        errorMessage += 'Note: Camera access requires HTTPS (secure connection).'
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage += 'No camera found on this device.'
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage += 'Camera is already in use by another application. Please close other apps using the camera and try again.'
      } else if (err.name === 'OverconstrainedError') {
        errorMessage += 'Camera does not support the requested settings. Trying with default settings...'
      } else if (err.name === 'SecurityError') {
        errorMessage += 'Camera access is blocked due to security restrictions.\n\n'
        errorMessage += 'This usually happens when:\n'
        errorMessage += '- The site is not served over HTTPS\n'
        errorMessage += '- Browser security settings block camera access\n'
        errorMessage += '- You\'re using an incognito/private window'
      } else {
        errorMessage += `Error: ${err.message || 'Unknown error'}\n\n`
        errorMessage += 'Please check your browser permissions and try again.'
      }

      alert(errorMessage)
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    ctx?.drawImage(video, 0, 0)

    const imageDataUrl = canvas.toDataURL('image/jpeg')
    setCapturedImage(imageDataUrl)
  }

  const retakePhoto = () => {
    setCapturedImage(null)
  }

  const confirmPhoto = () => {
    if (!capturedImage) return

    // Convert data URL to blob
    fetch(capturedImage)
      .then(res => res.blob())
      .then(blob => {
        const fileName = `camera-${Date.now()}.jpg`
        let file: File

        try {
          file = new (File as any)([blob], fileName, { type: 'image/jpeg' })
        } catch (error) {
          // Fallback for older browsers
          const fileBlob = blob as any
          fileBlob.name = fileName
          fileBlob.lastModified = Date.now()
          file = fileBlob
        }

        const fileList = {
          0: file,
          length: 1,
          item: (index: number) => index === 0 ? file : null,
          [Symbol.iterator]: function* () {
            yield file
          }
        } as FileList

        handleFileSelect(fileList)
        closeCameraModal()
      })
  }

  const closeCameraModal = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setCapturedImage(null)
    setShowCameraModal(false)
  }

  const downloadFile = (file: AttachedFile) => {
    if (file.url) {
      const link = document.createElement('a')
      link.href = file.url
      link.download = file.name
      link.click()
    }
  }

  const handlePreviewFile = async (file: AttachedFile) => {
    // For server URLs (not blob/data URLs and no local file), fetch and create blob
    const isServerUrl = file.url && !file.url.startsWith('blob:') && !file.url.startsWith('data:') && !file.file
    if (isServerUrl && file.url) {
      try {
        const response = await fetch(file.url)
        const blob = await response.blob()
        const blobUrl = URL.createObjectURL(blob)

        // Create updated file with blob URL and size
        const updatedFile: AttachedFile = {
          ...file,
          url: blobUrl,
          size: blob.size,
          file: new File([blob], file.name, { type: blob.type || file.type })
        }

        setPreviewFile(updatedFile)
        setImageZoom(1)
        setImageRotation(0)
      } catch (error) {
        // If fetch fails, open in new tab as fallback
        window.open(file.url, '_blank')
      }
      return
    }

    setPreviewFile(file)
    setImageZoom(1)
    setImageRotation(0)
  }

  const hasFile = value.length > 0
  const singleFile = value.length === 1 ? value[0] : null
  const isImage = singleFile?.type.startsWith('image/')

  // Preview size classes
  const previewSizeClasses = {
    sm: previewShape === 'circular' ? 'w-24 h-24' : 'w-32 h-20',
    md: previewShape === 'circular' ? 'w-32 h-32' : 'w-48 h-28',
    lg: previewShape === 'circular' ? 'w-40 h-40' : 'w-64 h-36',
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Inline Preview Mode */}
      {showInlinePreview && hasFile && singleFile && isImage ? (
        <div className="flex flex-col items-center justify-center">
          {/* Hidden file inputs - Only images for inline preview */}
          <input
            ref={fileInputRef}
            type="file"
            multiple={maxFiles > 1}
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={disabled}
          />

          <input
            ref={imageInputRef}
            type="file"
            multiple={maxFiles > 1}
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={disabled}
          />

          {/* Image Preview - Centered */}
          <div className="relative group flex-shrink-0">
            <div
              className={cn(
                previewSizeClasses[previewSize],
                previewShape === 'circular' && 'rounded-full',
                previewShape === 'rectangular' && 'rounded-lg',
                'border-2 border-[rgb(var(--bd-default))] overflow-hidden bg-gray-50 cursor-pointer transition-all hover:shadow-lg relative'
              )}
            >
              {singleFile.url ? (
                <img
                  src={singleFile.url}
                  alt={singleFile.name}
                  className={cn(
                    'w-full h-full object-cover absolute inset-0',
                    previewShape === 'circular' && 'object-center'
                  )}
                  onError={() => {
                    // Image load error - silently handled
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                  No preview
                </div>
              )}
            </div>

            {/* Hover overlay with action buttons */}
            <div
              className={cn(
                'absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 cursor-pointer',
                previewShape === 'circular' && 'rounded-full',
                previewShape === 'rectangular' && 'rounded-lg'
              )}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePreviewFile(singleFile)
                }}
                disabled={disabled}
                className="h-8 bg-white/90 hover:bg-white border-white"
              >
                <Eye className="h-3 w-3 mr-1" />
                Preview
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  openFileDialog()
                }}
                disabled={disabled}
                className="h-8 bg-white/90 hover:bg-white border-white"
              >
                <Upload className="h-3 w-3 mr-1" />
                Change
              </Button>
            </div>
          </div>

          {/* Label below preview */}
          {label && (
            <label className="block text-sm font-medium text-gray-700 mt-3 text-center">
              {label}
            </label>
          )}
        </div>
      ) : showInlinePreview ? (
        /* Empty state for inline preview - matches final shape */
        <div className="flex flex-col items-center justify-center">
          <input
            ref={fileInputRef}
            type="file"
            multiple={maxFiles > 1}
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={disabled}
          />

          <input
            ref={imageInputRef}
            type="file"
            multiple={maxFiles > 1}
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={disabled}
          />

          {/* Empty preview area with + button */}
          <div className="relative group">
            <div
              className={cn(
                previewSizeClasses[previewSize],
                previewShape === 'circular' && 'rounded-full',
                previewShape === 'rectangular' && 'rounded-lg',
                'border-2 border-dashed border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))] cursor-pointer transition-all hover:border-gray-400 flex items-center justify-center'
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* Plus Icon - Always visible */}
              <Plus className="h-8 w-8 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>

            {/* Action buttons overlay - shown on hover */}
            <div
              className={cn(
                'absolute inset-0 bg-white/95 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2',
                previewShape === 'circular' && 'rounded-full',
                previewShape === 'rectangular' && 'rounded-lg'
              )}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  openFileDialog()
                }}
                disabled={disabled || value.length >= maxFiles}
                className="h-8 bg-white border-gray-300 hover:border-gray-400"
              >
                <Upload className="h-3 w-3 mr-1" />
                Upload
              </Button>

              {/* Camera button hidden
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  openCamera()
                }}
                disabled={disabled || value.length >= maxFiles}
                className="h-8 bg-white border-gray-300 hover:border-gray-400"
              >
                <Camera className="h-3 w-3 mr-1" />
                Camera
              </Button>
              */}

              {/* Import from Email Button - only shown when enableEmailImport is true */}
              {enableEmailImport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenEmailModal()
                  }}
                  disabled={disabled || value.length >= maxFiles}
                  className="h-8 bg-white border-gray-300 hover:border-gray-400"
                >
                  <Mail className="h-3 w-3 mr-1" />
                  Email
                </Button>
              )}
            </div>
          </div>

          {/* Label below empty preview */}
          {label && (
            <label className="block text-sm font-medium text-gray-700 mt-3 text-center">
              {label}
            </label>
          )}
        </div>
      ) : (
        /* Regular Upload Area - Non-inline preview mode */
        <div>
          {label && (
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {label}
            </label>
          )}
          {!hideDropzone && (
          <div
            className={cn(
              'group border-2 border-dashed rounded-lg transition-all duration-200 px-3 py-2 h-10',
              isDragging && !disabled && 'border-blue-400 bg-blue-50',
              !isDragging && !disabled && 'border-gray-300 hover:border-gray-400',
              disabled && 'border-gray-200 bg-gray-50 cursor-not-allowed',
              'cursor-pointer flex flex-col items-center justify-center relative'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.xlsx,.xls,.png,.jpg,.jpeg,.gif,.bmp,.webp,.eml,.msg"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              disabled={disabled}
            />

            <input
              ref={imageInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              disabled={disabled}
            />

            {/* Instruction Text - always visible */}
            {!hideInstructions && (
              <p className="text-xs text-[rgb(var(--fg-muted))]">
                Hover to upload or drag and drop (PDF, XLSX, PNG, JPG, EML)
              </p>
            )}

            {/* Buttons - shown on hover, overlay on top */}
            <div className="absolute inset-0 bg-white/95 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 rounded-lg">
              {/* Upload Files Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  openFileDialog()
                }}
                disabled={disabled || value.length >= maxFiles}
                className="h-8 text-xs"
              >
                <Upload className="h-3 w-3 mr-1" />
                Upload Files
              </Button>

              {/* Camera Button hidden
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  openCamera()
                }}
                disabled={disabled || value.length >= maxFiles}
                className="h-8 text-xs"
              >
                <Camera className="h-3 w-3 mr-1" />
                Camera
              </Button>
              */}

              {/* Import from Email Button - only shown when enableEmailImport is true */}
              {enableEmailImport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenEmailModal()
                  }}
                  disabled={disabled || value.length >= maxFiles}
                  className="h-8 text-xs"
                >
                  <Mail className="h-3 w-3 mr-1" />
                  Import from Email
                </Button>
              )}
            </div>
          </div>
          )}
        </div>
      )}

      {/* File List - Compact Square Layout (hidden when inline preview is shown) */}
      <AnimatePresence>
        {value.length > 0 && !(showInlinePreview && singleFile && isImage) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-2"
          >
            <div className="flex flex-wrap gap-2">
              {value.map((file, index) => {
                const FileIcon = getFileIcon(file.type, file.name)
                const colorClasses = getFileTypeColor(file.type, file.name)

                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className="relative group"
                  >
                    <div
                      title={file.name}
                      className={cn(
                        'flex flex-col items-center justify-center p-1.5 bg-[rgb(var(--bg-surface))] border rounded hover:shadow-sm transition-all duration-200 cursor-pointer w-14 h-14 relative',
                        onFileClick && selectedFileId === file.id
                          ? 'border-[rgb(var(--color-primary))] ring-2 ring-[rgb(var(--color-primary))]/40'
                          : 'border-[rgb(var(--bd-default))]'
                      )}
                      onClick={() => onFileClick ? onFileClick(file) : handlePreviewFile(file)}
                    >
                      <div className={cn('p-1 rounded mb-0.5', colorClasses)}>
                        <FileIcon className="h-3.5 w-3.5" />
                      </div>
                      <div className="text-[9px] text-[rgb(var(--fg-muted))] truncate w-full text-center leading-tight">
                        {formatFileSize(file.size)}
                      </div>

                      {/* Action overlay on hover */}
                      <div className="absolute inset-0 bg-black/40 rounded flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          className="p-1 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePreviewFile(file)
                          }}
                          title="Preview"
                        >
                          <Eye className="h-3 w-3 text-white" />
                        </button>
                        <button
                          className="p-1 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            downloadFile(file)
                          }}
                          title="Download"
                        >
                          <Download className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFile(file.id)
                      }}
                      disabled={disabled}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                    {/* Filename on hover — left-anchored, single line, truncated
                        with ellipsis so it never wraps ugly or clips at the
                        modal edge. The native title (on the tile) gives the full
                        name on hover as the untruncated fallback. */}
                    <div className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-gray-900 text-white text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-[12rem] truncate z-[120]">
                      {file.name}
                      <div className="absolute top-full left-3 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Preview Modal - Full Screen with improved viewing.
          Portaled to <body> so it escapes any parent modal's stacking/clip
          context and truly fills the screen. z-[200] sits above app dialogs. */}
      {typeof document !== 'undefined' && createPortal(
      <AnimatePresence>
        {previewFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 bg-black/95 z-[200] flex flex-col"
            onClick={() => setPreviewFile(null)}
          >
            <motion.div
              initial={{ scale: 0.98, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-white w-full h-full flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))]">
                <div className="flex items-center space-x-3">
                  {(() => {
                    const FileIconComponent = getFileIcon(previewFile.type, previewFile.name)
                    const colorClasses = getFileTypeColor(previewFile.type, previewFile.name)
                    return (
                      <div className={cn('p-2 rounded-lg', colorClasses)}>
                        <FileIconComponent className="h-5 w-5" />
                      </div>
                    )
                  })()}
                  <div>
                    <h3 className="font-semibold text-[rgb(var(--fg-default))]">{previewFile.name}</h3>
                    <p className="text-sm text-[rgb(var(--fg-muted))]">{formatFileSize(previewFile.size)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="action-download"
                    onClick={() => downloadFile(previewFile)}
                    icon={Download}
                  >
                    Download
                  </Button>
                  <button
                    onClick={() => setPreviewFile(null)}
                    className="close-btn-md"
                    aria-label="Close preview modal"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Modal Content - Full height preview area */}
              <div className={cn(
                "flex-1 overflow-hidden",
                (isEmailFile(previewFile.type, previewFile.name) || isExcelFile(previewFile.type, previewFile.name)) ? "min-h-0" : "bg-[rgb(var(--bg-muted))]"
              )}>
                {/* Image Preview */}
                {previewFile.type.startsWith('image/') && previewFile.url ? (
                  <div className="w-full h-full flex items-center justify-center p-4 bg-[rgb(var(--bg-muted))]">
                    <ImagePreviewContent file={previewFile} />
                  </div>
                ) : previewFile.type === 'application/pdf' && previewFile.url ? (
                  /* PDF Preview - Using browser's built-in viewer */
                  <div className="w-full h-full">
                    <iframe
                      src={previewFile.url}
                      className="w-full h-full border-0"
                      title={previewFile.name}
                    />
                  </div>
                ) : previewFile.type.startsWith('text/') && previewFile.url ? (
                  <div className="w-full h-full p-4">
                    <iframe
                      src={previewFile.url}
                      className="w-full h-full rounded-lg border border-[rgb(var(--bd-default))] bg-white"
                      title={previewFile.name}
                    />
                  </div>
                ) : isEmailFile(previewFile.type, previewFile.name) ? (
                  <EmailPreview file={previewFile} />
                ) : isExcelFile(previewFile.type, previewFile.name) ? (
                  <ExcelPreviewContent file={previewFile} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center py-12 text-[rgb(var(--fg-muted))]">
                    {(() => {
                      const FileIconComponent = getFileIcon(previewFile.type, previewFile.name)
                      return <FileIconComponent className="h-16 w-16 mb-4" />
                    })()}
                    <h3 className="text-lg font-medium mb-2 text-[rgb(var(--fg-default))]">Preview not available</h3>
                    <p className="text-sm text-center mb-4">
                      This file type cannot be previewed directly.
                      <br />
                      Click download to view the file.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => downloadFile(previewFile)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body,
      )}

      {/* Crop Modal - Using standard Modal component with react-image-crop */}
      <Modal
        open={showCropModal && !!imageToCrop}
        onOpenChange={(open) => {
          if (!open) {
            setShowCropModal(false)
            setImageToCrop(null)
            setOriginalFileInfo(null)
            setCrop(undefined)
            setCompletedCrop(undefined)
          }
        }}
      >
        <ModalContent
          size="lg"
          hideCloseButton
          disableOutsideClick
          className="p-0 flex flex-col overflow-hidden max-w-3xl w-[90vw] h-[80vh] max-h-[700px]"
        >
          {/* Header */}
          <ModalHeader className="px-6 py-4 border-b border-[rgb(var(--bd-default))] flex-shrink-0">
            <ModalTitle>Crop Image</ModalTitle>
          </ModalHeader>

          {/* Crop Area - Using ReactCrop component */}
          <div className="flex-1 flex items-center justify-center bg-[rgb(var(--bg-muted))] overflow-auto p-4" style={{ minHeight: 0 }}>
            {imageToCrop && (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={previewShape === 'circular' ? 1 : undefined}
                circularCrop={previewShape === 'circular'}
                className="max-h-full"
                ruleOfThirds
              >
                <img
                  ref={cropImageRef}
                  src={imageToCrop}
                  alt="Crop preview"
                  style={{ maxHeight: '55vh', maxWidth: '100%' }}
                  onLoad={(e) => {
                    const { width, height } = e.currentTarget
                    const initialCrop = centerAspectCrop(
                      width,
                      height,
                      previewShape === 'circular' ? 1 : undefined
                    )
                    setCrop(initialCrop)
                  }}
                />
              </ReactCrop>
            )}
          </div>

          {/* Footer */}
          <Footer
            variant="modal"
            gradient={true}
            actions={
              <>
                <Button
                  variant="action-cancel"
                  onClick={() => {
                    setShowCropModal(false)
                    setImageToCrop(null)
                    setOriginalFileInfo(null)
                    setCrop(undefined)
                    setCompletedCrop(undefined)
                  }}
                  icon={XCircle}
                >
                  Cancel
                </Button>
                <Button
                  variant="action-save"
                  disabled={!completedCrop}
                  onClick={async () => {
                    if (!cropImageRef.current || !completedCrop) return

                    // Preserve original file format and build cropped filename
                    const origType = originalFileInfo?.type || 'image/jpeg'
                    const origName = originalFileInfo?.name || 'image.jpg'
                    const lastDot = origName.lastIndexOf('.')
                    const baseName = lastDot > 0 ? origName.substring(0, lastDot) : origName
                    const extension = lastDot > 0 ? origName.substring(lastDot) : '.jpg'
                    const croppedName = `${baseName}_cropped${extension}`

                    const result = await getCroppedImg(
                      cropImageRef.current,
                      completedCrop,
                      origType
                    )

                    if (result) {
                      const { blob, url } = result

                      if (blob.size > 10 * 1024 * 1024) {
                        alert('Cropped image is too large (max 10MB). Please crop a smaller area.')
                        return
                      }

                      const reader = new FileReader()
                      reader.onloadend = () => {
                        const attachedFile: AttachedFile = {
                          id: Math.random().toString(36).substr(2, 9),
                          name: croppedName,
                          size: blob.size,
                          type: origType,
                          file: new File([blob], croppedName, { type: origType }),
                          url: reader.result as string
                        }
                        // Append to existing files instead of replacing
                        const currentFiles = value || []
                        onChange?.([...currentFiles, attachedFile])
                        setShowCropModal(false)
                        setImageToCrop(null)
                        setOriginalFileInfo(null)
                        setCrop(undefined)
                        setCompletedCrop(undefined)
                      }
                      reader.readAsDataURL(blob)

                      URL.revokeObjectURL(url)
                    }
                  }}
                  icon={Save}
                >
                  Crop & Upload
                </Button>
              </>
            }
          />
        </ModalContent>
      </Modal>

      {/* Email Import Modal */}
      <Modal
        open={showEmailImportModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowEmailImportModal(false)
            setSelectedEmail(null)
            setEmailSearchQuery('')
          }
        }}
      >
        <ModalContent
          size="lg"
          hideCloseButton
          disableOutsideClick
          className="p-0 flex flex-col overflow-hidden max-w-2xl w-[90vw] h-[75vh] max-h-[650px]"
        >
          {/* Header */}
          <ModalHeader className="px-5 py-3 border-b border-[rgb(var(--bd-default))] flex-shrink-0 bg-[rgb(var(--bg-surface))]">
            <div className="flex items-center justify-between w-full gap-3">
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="w-9 h-9 rounded-lg bg-[rgba(var(--color-primary),0.1)] flex items-center justify-center">
                  <Mail className="h-4.5 w-4.5 text-[rgb(var(--color-primary))]" />
                </div>
                <div>
                  <ModalTitle className="text-sm">Import from Email</ModalTitle>
                  {emailState.emails.length > 0 && (
                    <p className="text-xs text-[rgb(var(--fg-muted))] mt-0.5">
                      {emailState.emails.length} emails
                    </p>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[rgb(var(--fg-muted))]" />
                <input
                  type="text"
                  placeholder="Search by subject, sender, or content..."
                  value={emailSearchQuery}
                  onChange={(e) => setEmailSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 rounded-md border border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-default))] text-xs text-[rgb(var(--fg-default))] placeholder:text-[rgb(var(--fg-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-transparent"
                />
                {emailSearchQuery && (
                  <button
                    onClick={() => setEmailSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-[rgb(var(--bg-hover))]"
                  >
                    <X className="h-3.5 w-3.5 text-[rgb(var(--fg-muted))]" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => emailActions?.fetchEmails?.()}
                  disabled={emailState.loading}
                  className="p-1.5 rounded-md hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))] transition-colors disabled:opacity-50"
                  aria-label="Refresh emails"
                >
                  <RefreshCw className={cn("h-4 w-4", emailState.loading && "animate-spin")} />
                </button>
                <button
                  onClick={() => {
                    setShowEmailImportModal(false)
                    setSelectedEmail(null)
                    setEmailSearchQuery('')
                  }}
                  className="close-btn-md"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </ModalHeader>

          {/* Email List */}
          <div className="flex-1 overflow-auto" style={{ minHeight: 0 }}>
            {emailState.loading && emailState.emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="w-8 h-8 border-2 border-[rgb(var(--color-primary))] border-t-transparent rounded-full animate-spin" />
                <div className="text-sm text-[rgb(var(--fg-muted))]">Loading emails...</div>
              </div>
            ) : emailState.emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
                <div className="w-16 h-16 rounded-full bg-[rgb(var(--bg-muted))] flex items-center justify-center">
                  <Mail className="h-8 w-8 text-[rgb(var(--fg-muted))]" />
                </div>
                <div className="text-center">
                  <div className="text-base font-medium text-[rgb(var(--fg-default))] mb-1">No emails found</div>
                  <div className="text-sm text-[rgb(var(--fg-muted))]">Check your email configuration in User Master</div>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[rgb(var(--bd-subtle))]">
                {emailState.emails
                  .filter((email) => {
                    if (!emailSearchQuery.trim()) return true
                    const query = emailSearchQuery.toLowerCase()
                    const subject = (email.subject || '').toLowerCase()
                    const fromObj = email.from as any
                    const fromName = (typeof fromObj === 'string' ? fromObj : (fromObj?.name || fromObj?.email || '')).toLowerCase()
                    const fromEmailAddr = (typeof fromObj === 'string' ? '' : (fromObj?.email || '')).toLowerCase()
                    const body = (email.body || email.snippet || '').toLowerCase()
                    return subject.includes(query) || fromName.includes(query) || fromEmailAddr.includes(query) || body.includes(query)
                  })
                  .map((email) => {
                    const fromName = typeof email.from === 'string' ? email.from : email.from?.name || email.from?.email || 'Unknown'
                    const fromEmail = typeof email.from === 'string' ? email.from : email.from?.email || ''
                    const emailDate = email.receivedAt || email.sentAt
                    const formattedDate = emailDate ? new Date(emailDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: new Date(emailDate).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                    }) : ''
                    const formattedTime = emailDate ? new Date(emailDate).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    }) : ''
                    const snippet = email.snippet || email.body?.substring(0, 120) || ''
                    const isSelected = selectedEmail?.id === email.id

                    return (
                      <div
                        key={email.id}
                        onClick={() => setSelectedEmail({
                          id: email.id,
                          subject: email.subject || '(No Subject)',
                          from: fromEmail,
                          date: emailDate || new Date().toISOString(),
                          body: email.body || email.snippet || '',
                          attachments: email.attachments?.map(a => ({ name: a.filename, size: a.size || 0, type: a.contentType || '' })) || [],
                          folder: email.folder
                        })}
                        className={cn(
                          'px-4 py-3 cursor-pointer transition-all',
                          isSelected
                            ? 'bg-[rgba(var(--color-primary),0.08)] border-l-2 border-l-[rgb(var(--color-primary))]'
                            : 'hover:bg-[rgb(var(--bg-hover))] border-l-2 border-l-transparent',
                          !email.isRead && 'bg-[rgb(var(--bg-subtle))]'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {/* Unread indicator + Avatar */}
                          <div className="relative flex-shrink-0">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium",
                              isSelected ? "bg-[rgb(var(--color-primary))]" : "bg-[rgb(var(--color-info))]"
                            )}>
                              {isSelected ? (
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                fromName.charAt(0).toUpperCase()
                              )}
                            </div>
                            {!email.isRead && !isSelected && (
                              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[rgb(var(--color-primary))] border-2 border-white" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Row 1: From name + Date */}
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className={cn(
                                "text-sm truncate",
                                !email.isRead ? "font-semibold text-[rgb(var(--fg-default))]" : "font-medium text-[rgb(var(--fg-default))]"
                              )}>
                                {fromName}
                              </span>
                              <span className="text-xs text-[rgb(var(--fg-muted))] flex-shrink-0 whitespace-nowrap">
                                {formattedDate} {formattedTime}
                              </span>
                            </div>

                            {/* Row 2: Subject */}
                            <div className={cn(
                              "text-sm truncate mb-1",
                              !email.isRead ? "font-medium text-[rgb(var(--fg-default))]" : "text-[rgb(var(--fg-muted))]"
                            )}>
                              {email.subject || '(No Subject)'}
                            </div>

                            {/* Row 3: Snippet + Attachments */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[rgb(var(--fg-muted))] truncate flex-1">
                                {snippet.length > 100 ? snippet.substring(0, 100) + '...' : snippet}
                              </span>
                              {email.attachments && email.attachments.length > 0 && (
                                <span className="flex items-center gap-1 text-xs text-[rgb(var(--fg-muted))] flex-shrink-0 bg-[rgb(var(--bg-muted))] px-1.5 py-0.5 rounded">
                                  <Paperclip className="h-3 w-3" />
                                  {email.attachments.length}
                                </span>
                              )}
                            </div>
                          </div>

                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>

          {/* Footer */}
          <Footer
            variant="modal"
            gradient={true}
            actions={
              <>
                <Button
                  variant="action-cancel"
                  onClick={() => {
                    setShowEmailImportModal(false)
                    setSelectedEmail(null)
                    setEmailSearchQuery('')
                  }}
                  icon={XCircle}
                >
                  Cancel
                </Button>
                <Button
                  variant="action-save"
                  disabled={!selectedEmail || importingEmail}
                  onClick={() => {
                    if (selectedEmail) {
                      handleEmailImport(selectedEmail)
                    }
                  }}
                  icon={Mail}
                  loading={importingEmail}
                >
                  {importingEmail ? 'Importing...' : 'Import Email'}
                </Button>
              </>
            }
          />
        </ModalContent>
      </Modal>

      {/* Camera Modal */}
      <AnimatePresence>
        {showCameraModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 bg-black/95 z-50 flex flex-col"
            onClick={closeCameraModal}
          >
            <motion.div
              initial={{ scale: 0.98, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-white w-full h-full flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Camera Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {capturedImage ? 'Review Photo' : 'Take Photo'}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeCameraModal}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Camera Content */}
              <div className="flex-1 flex items-center justify-center p-4 bg-black">
                {!capturedImage ? (
                  /* Live Camera View */
                  <div className="relative w-full max-w-2xl aspect-video bg-gray-900 rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />
                    <canvas
                      ref={canvasRef}
                      className="hidden"
                    />

                    {/* Capture Button */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                      <Button
                        onClick={capturePhoto}
                        className="w-16 h-16 rounded-full bg-white text-gray-900 hover:bg-gray-100 border-4 border-white"
                      >
                        <Camera className="h-6 w-6" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Captured Image Preview */
                  <div className="relative w-full max-w-2xl">
                    <img
                      src={capturedImage}
                      alt="Captured"
                      className="w-full h-auto rounded-lg"
                    />

                    {/* Image Controls */}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={retakePhoto}
                        className="bg-white/90 hover:bg-white"
                      >
                        Retake
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Footer */}
              <div className="flex items-center justify-center p-4 border-t bg-white">
                {capturedImage ? (
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={retakePhoto}
                    >
                      Retake Photo
                    </Button>
                    <Button
                      variant="primary"
                      onClick={confirmPhoto}
                    >
                      Use Photo
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 text-center">
                    <p>Position your camera and tap the capture button</p>
                    <p className="text-xs mt-1">Make sure the image is clear and well-lit</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}