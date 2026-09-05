/**
 * Provider-agnostic file storage API client.
 *
 * Uploads go through the backend (/api/storage/upload), which reads the active
 * provider from IntegrationConfig (code 'FileAttachments') and writes a
 * JobBookingAttachments index row. Swapping providers is a backend config change;
 * this client is unaffected.
 */

export interface StoredFile {
  key: string
  fileName: string
  fileExtension: string
}

export interface StorageUploadResult {
  success: boolean
  files: StoredFile[]
  errors: string[]
}

interface UploadParams {
  module: string
  documentID: string | number
  documentName: string
  documentIDName: string
  // false = store to S3 + return the key WITHOUT writing a JobBookingAttachments row
  // (estimation/enquiry write the row themselves via SaveQuotationData). Default true.
  indexRow?: boolean
}

function authHeaders(session: any): Record<string, string> {
  const companyUsername = session?.user?.companyUsername
  const companyPassword = session?.user?.companyPassword
  const authHeader = companyUsername && companyPassword
    ? `Basic ${btoa(`${companyUsername}:${companyPassword}`)}`
    : ''
  return {
    Authorization: authHeader,
    CompanyID: String(session?.user?.CompanyID || session?.user?.companyID || ''),
    UserID: String(session?.user?.UserID || session?.user?.userID || ''),
    ProductionUnitID: String(session?.productionUnitId || session?.user?.ProductionUnitID || session?.user?.productionUnitID || ''),
    FYear: session?.fYear || session?.user?.FYear || session?.user?.fYear || '',
  }
}

// Upload files to the configured store and index them against a document.
export async function uploadFilesToStorage(files: File[], params: UploadParams, session: any): Promise<StorageUploadResult> {
  if (!files || files.length === 0) return { success: true, files: [], errors: [] }
  try {
    const form = new FormData()
    form.append('module', params.module)
    form.append('documentID', String(params.documentID))
    form.append('documentName', params.documentName)
    form.append('documentIDName', params.documentIDName)
    form.append('indexRow', params.indexRow === false ? 'false' : 'true')
    files.forEach((f) => form.append('file', f))

    const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || ''
    const res = await fetch(`${baseURL}/api/storage/upload`, {
      method: 'POST',
      headers: authHeaders(session),
      body: form,
    })
    const text = await res.text()
    if (!res.ok || text.toLowerCase().startsWith('fail') || text.toLowerCase().startsWith('"fail')) {
      return { success: false, files: [], errors: [text || `Upload failed (${res.status})`] }
    }
    // Web API's Ok(jsonString) double-encodes: the body is a JSON string containing
    // JSON. Parse repeatedly until we get an object (matches the remarks parseList).
    let data: any = text
    for (let i = 0; i < 3 && typeof data === 'string'; i++) {
      try { data = JSON.parse(data) } catch { data = null; break }
    }
    if (!data || typeof data !== 'object') {
      return { success: false, files: [], errors: ['Unexpected upload response'] }
    }
    return { success: !!data.success, files: data.files || [], errors: data.errors || [] }
  } catch (error) {
    return { success: false, files: [], errors: [error instanceof Error ? error.message : 'Upload failed'] }
  }
}

// Build the public URL for a stored file-attachment object key. The key is
// provider-agnostic in the DB; the base lives in NEXT_PUBLIC_FILE_ATTACHMENT_BASE_URL so a
// provider switch is an env change, not a data migration. Each path segment is encoded.
export function storageFileUrl(key: string): string {
  if (!key) return ''
  // Already a full URL (legacy rows that stored the URL) — use as-is.
  if (/^https?:\/\//i.test(key)) return key
  const base = (process.env.NEXT_PUBLIC_FILE_ATTACHMENT_BASE_URL || '').replace(/\/+$/, '')
  const encodedKey = key.split('/').map(encodeURIComponent).join('/')
  return base ? `${base}/${encodedKey}` : encodedKey
}
