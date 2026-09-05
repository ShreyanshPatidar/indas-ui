'use client'

import * as React from 'react'
import {
  File as FileIcon,
  FileText,
  Image,
  FileArchive,
  Download,
  X,
  Mail,
  Paperclip
} from 'lucide-react'
import { Button } from '@/components/ui'
import type { AttachedFile } from './FileAttachment'

// Types
interface EmailAttachment {
  filename: string
  contentType: string
  data: string // base64 encoded
}

// Helper to decode base64 (with UTF-8 support)
function decodeBase64(str: string): string {
  try {
    const cleaned = str.replace(/[\s\r\n]/g, '')
    const binaryStr = atob(cleaned)
    const bytes = new Uint8Array(binaryStr.length)
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i)
    }
    return new TextDecoder('utf-8').decode(bytes)
  } catch {
    try {
      return atob(str.replace(/[\s\r\n]/g, ''))
    } catch {
      return str
    }
  }
}

// Helper to decode quoted-printable (with UTF-8 support)
function decodeQuotedPrintable(str: string): string {
  let result = str.replace(/=\r?\n/g, '')

  const bytes: number[] = []
  let i = 0
  while (i < result.length) {
    if (result[i] === '=' && i + 2 < result.length) {
      const hex = result.substring(i + 1, i + 3)
      if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
        bytes.push(parseInt(hex, 16))
        i += 3
        continue
      }
    }
    if (bytes.length > 0) {
      try {
        const decoded = new TextDecoder('utf-8').decode(new Uint8Array(bytes))
        result = result.substring(0, i - bytes.length * 3) + decoded + result.substring(i)
        i = i - bytes.length * 3 + decoded.length
        bytes.length = 0
      } catch {
        for (const byte of bytes) {
          result = result.substring(0, i - bytes.length * 3) + String.fromCharCode(byte) + result.substring(i)
        }
        bytes.length = 0
      }
    }
    i++
  }

  if (bytes.length > 0) {
    try {
      const decoded = new TextDecoder('utf-8').decode(new Uint8Array(bytes))
      result = result.substring(0, result.length - bytes.length * 3) + decoded
    } catch {
      // Already handled above
    }
  }

  return result.replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

// Email Preview Component for .eml files
export function EmailPreview({ file }: { file: AttachedFile }) {
  const [emailContent, setEmailContent] = React.useState<{
    subject?: string
    from?: string
    to?: string
    date?: string
    body?: string
    attachments?: EmailAttachment[]
  } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [previewAttachment, setPreviewAttachment] = React.useState<EmailAttachment | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)

  // Create blob URL for attachment
  const createAttachmentUrl = (attachment: EmailAttachment): string | null => {
    try {
      const binaryStr = atob(attachment.data.replace(/[\s\r\n]/g, ''))
      const bytes = new Uint8Array(binaryStr.length)
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: attachment.contentType || 'application/octet-stream' })
      return URL.createObjectURL(blob)
    } catch {
      return null
    }
  }

  // Open attachment preview
  const openPreview = (attachment: EmailAttachment) => {
    const url = createAttachmentUrl(attachment)
    if (url) {
      setPreviewUrl(url)
      setPreviewAttachment(attachment)
    }
  }

  // Close preview and cleanup
  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setPreviewAttachment(null)
  }

  // Download attachment
  const downloadAttachment = (attachment: EmailAttachment) => {
    try {
      if (!attachment.data || attachment.data.length === 0) {
        alert('No attachment data available')
        return
      }

      const cleanData = attachment.data.replace(/[\s\r\n]/g, '')
      const binaryStr = atob(cleanData)
      const bytes = new Uint8Array(binaryStr.length)
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i)
      }

      const blob = new Blob([bytes], { type: attachment.contentType || 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = attachment.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Failed to download attachment: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  // Check if file type is previewable
  const isPreviewable = (contentType: string, filename: string): boolean => {
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    if (contentType.startsWith('image/')) return true
    if (contentType === 'application/pdf' || ext === 'pdf') return true
    if (contentType.startsWith('text/') || ['txt', 'csv', 'json', 'xml', 'html', 'css', 'js'].includes(ext)) return true
    return false
  }

  React.useEffect(() => {
    const parseEmail = async () => {
      if (!file.file && !file.url) {
        setLoading(false)
        return
      }

      try {
        let text = ''

        if (file.file) {
          text = await file.file.text()
        } else if (file.url) {
          const response = await fetch(file.url)
          text = await response.text()
        }

        // Parse .eml file (RFC 822 / MIME format)
        const headers: Record<string, string> = {}
        const lines = text.split(/\r?\n/)
        let bodyStartIndex = 0
        let currentHeader = ''

        // Parse headers (handle multi-line headers)
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          if (line === '') {
            bodyStartIndex = i + 1
            break
          }
          if (line.startsWith(' ') || line.startsWith('\t')) {
            if (currentHeader) {
              headers[currentHeader] += ' ' + line.trim()
            }
          } else {
            const match = line.match(/^([^:]+):\s*(.*)$/)
            if (match) {
              currentHeader = match[1].toLowerCase()
              headers[currentHeader] = match[2]
            }
          }
        }

        // Get raw body
        const rawBody = lines.slice(bodyStartIndex).join('\n')

        // Check if multipart
        const contentType = headers['content-type'] || ''
        const boundaryMatch = contentType.match(/boundary="?([^";\s]+)"?/i)
        const transferEncoding = headers['content-transfer-encoding']?.toLowerCase() || ''

        let body = ''
        const attachments: EmailAttachment[] = []

        // Helper to extract filename from headers
        const extractFilename = (disposition: string, contentType: string): string | null => {
          const dispMatch = disposition.match(/filename\*?=(?:UTF-8''|")?([^";\r\n]+)"?/i)
          if (dispMatch) return decodeURIComponent(dispMatch[1].replace(/['"]/g, ''))

          const ctMatch = contentType.match(/name\*?=(?:UTF-8''|")?([^";\r\n]+)"?/i)
          if (ctMatch) return decodeURIComponent(ctMatch[1].replace(/['"]/g, ''))

          return null
        }

        // Helper to extract content type
        const extractContentType = (contentType: string): string => {
          const match = contentType.match(/^([^;]+)/i)
          return match ? match[1].trim() : 'application/octet-stream'
        }

        // Function to extract text from a MIME part
        const extractTextFromPart = (partContent: string): { html: string; plain: string } => {
          const result = { html: '', plain: '' }

          const emptyLineMatch = partContent.match(/\r?\n\r?\n/)
          if (!emptyLineMatch) return result

          const emptyLineIndex = partContent.indexOf(emptyLineMatch[0])
          const headerSection = partContent.substring(0, emptyLineIndex)
          let bodySection = partContent.substring(emptyLineIndex + emptyLineMatch[0].length)

          bodySection = bodySection.replace(/\r?\n--[\w\-]+--?\s*$/g, '').trim()

          const partHeaders: Record<string, string> = {}
          const headerLines = headerSection.split(/\r?\n/)
          let currentKey = ''

          for (const line of headerLines) {
            if (line.startsWith(' ') || line.startsWith('\t')) {
              if (currentKey) partHeaders[currentKey] += ' ' + line.trim()
            } else {
              const match = line.match(/^([^:]+):\s*(.*)$/i)
              if (match) {
                currentKey = match[1].toLowerCase()
                partHeaders[currentKey] = match[2]
              }
            }
          }

          const partContentType = partHeaders['content-type'] || ''
          const partEncoding = partHeaders['content-transfer-encoding']?.toLowerCase() || ''
          const partDisposition = partHeaders['content-disposition'] || ''

          const isAttachment = partDisposition.includes('attachment') ||
                               (partContentType && !partContentType.includes('text/') && !partContentType.includes('multipart/'))

          if (isAttachment) {
            const filename = extractFilename(partDisposition, partContentType)
            if (filename) {
              let attachmentData = bodySection.trim()

              if (partEncoding === 'base64') {
                attachmentData = attachmentData.replace(/[\r\n\s]/g, '')
              }

              if (attachmentData.length > 0) {
                attachments.push({
                  filename,
                  contentType: extractContentType(partContentType),
                  data: attachmentData
                })
              }
            }
            return result
          }

          const nestedBoundary = partContentType.match(/boundary="?([^";\s\r\n]+)"?/i)
          if (nestedBoundary) {
            return extractMultipart(bodySection, nestedBoundary[1])
          }

          if (partContentType && !partContentType.includes('text/')) return result

          if (partEncoding === 'base64') {
            bodySection = decodeBase64(bodySection)
          } else if (partEncoding === 'quoted-printable') {
            bodySection = decodeQuotedPrintable(bodySection)
          }

          if (partContentType.includes('text/html')) {
            result.html = bodySection
          } else {
            result.plain = bodySection
          }

          return result
        }

        // Function to parse multipart content
        const extractMultipart = (content: string, boundary: string): { html: string; plain: string } => {
          const result = { html: '', plain: '' }

          const escapedBoundary = boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const parts = content.split(new RegExp(`(?:\\r?\\n)?--${escapedBoundary}(?:--)?(?:\\r?\\n)?`, 'g'))

          for (const part of parts) {
            if (!part.trim() || part.trim() === '--') continue

            const extracted = extractTextFromPart(part)
            if (extracted.html && !result.html) result.html = extracted.html
            if (extracted.plain && !result.plain) result.plain = extracted.plain
          }

          return result
        }

        if (boundaryMatch) {
          const parsed = extractMultipart(rawBody, boundaryMatch[1])
          body = parsed.html || parsed.plain || ''
        } else {
          body = rawBody

          if (transferEncoding === 'base64') {
            body = decodeBase64(body)
          } else if (transferEncoding === 'quoted-printable') {
            body = decodeQuotedPrintable(body)
          }
        }

        if (body.includes('<html') || body.includes('<body')) {
          // Keep HTML for iframe rendering
        } else {
          body = body.replace(/^Content-Type:.*$/gm, '')
                     .replace(/^Content-Transfer-Encoding:.*$/gm, '')
                     .replace(/^--[a-zA-Z0-9_-]+.*$/gm, '')
                     .trim()
        }

        // Decode subject if encoded
        let subject = headers['subject'] || '(No Subject)'
        if (subject.includes('=?')) {
          subject = subject.replace(/=\?([^?]+)\?([BQ])\?([^?]+)\?=/gi, (_, _charset, encoding, encoded) => {
            if (encoding.toUpperCase() === 'B') {
              return decodeBase64(encoded)
            } else {
              return decodeQuotedPrintable(encoded.replace(/_/g, ' '))
            }
          })
        }

        setEmailContent({
          subject,
          from: headers['from'] || 'Unknown',
          to: headers['to'] || '',
          date: headers['date'] || '',
          body: body || '(No message body)',
          attachments
        })
      } catch {
        setEmailContent(null)
      } finally {
        setLoading(false)
      }
    }

    parseEmail()
  }, [file])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-sm text-[rgb(var(--fg-muted))]">Loading email...</div>
      </div>
    )
  }

  if (!emailContent) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-[rgb(var(--fg-muted))]">
        <Mail className="h-12 w-12 mb-4" />
        <p>Unable to parse email content</p>
      </div>
    )
  }

  return (
    <div className="bg-white overflow-hidden flex flex-col h-full">
      {/* Email Header */}
      <div className="bg-[rgb(var(--bg-muted))] px-4 py-3 border-b border-[rgb(var(--bd-default))] flex-shrink-0">
        <div className="space-y-1.5 text-sm">
          <div className="flex">
            <span className="text-[rgb(var(--fg-muted))] font-medium w-[70px] flex-shrink-0">Subject:</span>
            <span className="text-[rgb(var(--fg-default))] font-semibold">{emailContent.subject}</span>
          </div>
          <div className="flex">
            <span className="text-[rgb(var(--fg-muted))] font-medium w-[70px] flex-shrink-0">From:</span>
            <span className="text-[rgb(var(--fg-default))]">{emailContent.from}</span>
          </div>
          {emailContent.to && (
            <div className="flex">
              <span className="text-[rgb(var(--fg-muted))] font-medium w-[70px] flex-shrink-0">To:</span>
              <span className="text-[rgb(var(--fg-default))] flex-1">{emailContent.to}</span>
            </div>
          )}
          {emailContent.date && (
            <div className="flex">
              <span className="text-[rgb(var(--fg-muted))] font-medium w-[70px] flex-shrink-0">Date:</span>
              <span className="text-[rgb(var(--fg-default))]">{emailContent.date}</span>
            </div>
          )}
          {emailContent.attachments && emailContent.attachments.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[rgb(var(--bd-default))]">
              <div className="flex items-center gap-1 text-[rgb(var(--fg-muted))] text-xs font-medium mb-2">
                <Paperclip className="h-3 w-3" />
                <span>{emailContent.attachments.length} Attachment{emailContent.attachments.length > 1 ? 's' : ''}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {emailContent.attachments.map((attachment, idx) => {
                  const ext = attachment.filename.split('.').pop()?.toLowerCase() || ''
                  let IconComponent = FileIcon
                  let colorClass = 'text-gray-600 bg-gray-100'

                  if (['xlsx', 'xls', 'csv'].includes(ext)) {
                    colorClass = 'text-green-600 bg-green-50'
                  } else if (['pdf'].includes(ext)) {
                    IconComponent = FileText
                    colorClass = 'text-red-600 bg-red-50'
                  } else if (['doc', 'docx'].includes(ext)) {
                    IconComponent = FileText
                    colorClass = 'text-blue-600 bg-blue-50'
                  } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
                    IconComponent = Image
                    colorClass = 'text-purple-600 bg-purple-50'
                  } else if (['zip', 'rar', '7z'].includes(ext)) {
                    IconComponent = FileArchive
                    colorClass = 'text-orange-600 bg-orange-50'
                  }

                  const canPreview = isPreviewable(attachment.contentType, attachment.filename)

                  return (
                    <div key={idx} className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (canPreview) {
                            openPreview(attachment)
                          } else {
                            downloadAttachment(attachment)
                          }
                        }}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))] hover:bg-[rgb(var(--bg-hover))] hover:border-[rgb(var(--color-primary))] transition-colors cursor-pointer"
                        title={canPreview ? `Click to preview ${attachment.filename}` : `Click to download ${attachment.filename}`}
                      >
                        <div className={`p-1 rounded ${colorClass}`}>
                          <IconComponent className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs text-[rgb(var(--fg-default))] max-w-[150px] truncate">
                          {attachment.filename}
                        </span>
                        <Download className="h-3.5 w-3.5 text-[rgb(var(--fg-muted))]" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Email Body */}
      <div className="p-4 flex-1 overflow-auto min-h-0">
        {emailContent.body?.includes('<html') || emailContent.body?.includes('<div') || emailContent.body?.includes('<p') ? (
          <iframe
            srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;font-size:14px;line-height:1.5;margin:0;padding:10px;}</style></head><body>${emailContent.body}</body></html>`}
            className="w-full h-full border-0 bg-white"
            title="Email content"
            sandbox="allow-same-origin"
          />
        ) : (
          <pre className="whitespace-pre-wrap text-sm text-[rgb(var(--fg-default))] font-sans">
            {emailContent.body}
          </pre>
        )}
      </div>

      {/* Attachment Preview Modal */}
      {previewAttachment && previewUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
          onClick={closePreview}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Preview Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgb(var(--bd-default))]">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-[rgb(var(--fg-muted))]" />
                <span className="font-medium text-[rgb(var(--fg-default))] truncate max-w-[300px]">
                  {previewAttachment.filename}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadAttachment(previewAttachment)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closePreview}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-auto p-4 bg-[rgb(var(--bg-muted))]">
              {previewAttachment.contentType.startsWith('image/') ? (
                <img
                  src={previewUrl}
                  alt={previewAttachment.filename}
                  className="max-w-full h-auto mx-auto rounded"
                />
              ) : previewAttachment.contentType === 'application/pdf' || previewAttachment.filename.endsWith('.pdf') ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-[70vh] rounded bg-white"
                  title={previewAttachment.filename}
                />
              ) : previewAttachment.contentType.startsWith('text/') ||
                  ['txt', 'csv', 'json', 'xml', 'html', 'css', 'js'].includes(previewAttachment.filename.split('.').pop()?.toLowerCase() || '') ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-[70vh] rounded bg-white font-mono text-sm"
                  title={previewAttachment.filename}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-[50vh] text-[rgb(var(--fg-muted))]">
                  <FileIcon className="h-16 w-16 mb-4" />
                  <p>Preview not available for this file type</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => downloadAttachment(previewAttachment)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download to view
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
