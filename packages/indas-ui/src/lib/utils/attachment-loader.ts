/**
 * Attachment Loader Utility
 *
 * Loads file attachments from API response and converts them to blob URLs
 * Used by: quotation-loader.ts, estimation page (load enquiry), enquiry modal
 */

import type { AttachedFile } from '@/components'
import { storageFileUrl } from '@/lib/api/activity/storage'

/**
 * API FileAttachment structure from backend
 */
export interface APIFileAttachment {
  AttachementID?: number  // Note: typo in API field name
  AttachmentID?: number
  BookingID?: number
  AttachedFileName?: string
  AttachedFileUrl?: string
  FilePath?: string
  FileSize?: number
}

/**
 * Map file extensions to MIME types
 */
const getMimeType = (ext: string): string => {
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'webp': 'image/webp',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls': 'application/vnd.ms-excel',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'eml': 'message/rfc822',
    'msg': 'application/vnd.ms-outlook'
  }
  return mimeTypes[ext.toLowerCase()] || 'application/octet-stream'
}

/**
 * Load file attachments from API response
 * Fetches files through proxy to get blob URLs and proper file sizes
 *
 * @param fileAttachments - Array of file attachment objects from API
 * @returns Promise<AttachedFile[]> - Array of attached files with blob URLs
 */
export async function loadFileAttachments(
  fileAttachments: APIFileAttachment[]
): Promise<AttachedFile[]> {
  if (!fileAttachments || !Array.isArray(fileAttachments) || fileAttachments.length === 0) {
    return []
  }

  const attachmentPromises = fileAttachments.map(async (file, index) => {
    // Display name: the clean original filename (FileName column).
    const rawName = file.AttachedFileName || ''
    const displayName = rawName.includes('/') ? rawName.split('/').pop() || rawName : rawName

    // Fetch source: build the public S3 URL from the stored object key.
    const fileUrl = storageFileUrl(file.AttachedFileUrl || file.FilePath || '')

    const ext = displayName.split('.').pop() || ''
    const mimeType = getMimeType(ext)

    try {
      // Fetch the file through proxy to bypass CORS
      const proxyUrl = `/api/proxy-file?url=${encodeURIComponent(fileUrl)}`
      const response = await fetch(proxyUrl)
      if (!response.ok) throw new Error('Fetch failed')
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)

      return {
        id: file.AttachementID?.toString() || file.AttachmentID?.toString() || `attachment-${index}`,
        name: displayName,
        size: blob.size,
        type: blob.type || mimeType,
        url: blobUrl,
        file: new File([blob], displayName, { type: blob.type || mimeType })
      }
    } catch {
      // If fetch fails, return with server URL (will open in new tab on preview)
      return {
        id: file.AttachementID?.toString() || file.AttachmentID?.toString() || `attachment-${index}`,
        name: displayName,
        size: 0,
        type: mimeType,
        url: fileUrl
      }
    }
  })

  const loadedAttachments = await Promise.all(attachmentPromises)
  return loadedAttachments.filter(att => att.name)
}
