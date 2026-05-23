// Email System Type Definitions

export interface EmailAddress {
  email: string
  name?: string
}

export interface EmailAttachment {
  id: string
  filename: string
  contentType: string
  mimeType?: string
  size: number
  url: string
  thumbnailUrl?: string
}

export interface Email {
  id: string
  threadId?: string
  subject: string
  from: EmailAddress
  to: EmailAddress[]
  cc?: EmailAddress[]
  bcc?: EmailAddress[]
  body: string
  bodyHtml?: string
  bodyText?: string
  attachments: EmailAttachment[]
  sentAt: string
  receivedAt: string
  readAt?: string
  isRead: boolean
  isStarred: boolean
  isArchived: boolean
  isDraft: boolean
  isSent: boolean
  isImportant: boolean
  category: EmailCategory['type'] | string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  labels: string[]
  folder: string
  replyTo?: EmailAddress
  inReplyTo?: string
  references?: string[]
  hasAttachments: boolean
  snippet: string
  externalId?: string
}

export interface EmailThread {
  id: string
  subject: string
  participants: EmailAddress[]
  messages: Email[]
  lastMessageAt: string
  unreadCount: number
  isStarred: boolean
  isArchived: boolean
  labels: string[]
  snippet: string
}

export interface EmailFolder {
  id: string
  name: string
  type: 'system' | 'custom'
  unreadCount: number
  totalCount: number
  icon?: string
  color?: string
  isDefault?: boolean
}

export interface EmailCategory {
  id: string
  name: string
  type: 'primary' | 'social' | 'promotions' | 'updates' | 'forums' | 'spam'
  color: string
  unreadCount: number
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  bodyHtml?: string
  variables: EmailTemplateVariable[]
  category: string
  isSystem: boolean
  createdAt: string
  updatedAt: string
  usageCount: number
}

export interface EmailTemplateVariable {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'select'
  defaultValue?: string
  options?: string[]
  required: boolean
}

export interface EmailSearchFilters {
  query?: string
  category?: EmailCategory['type']
  folder?: string
  sender?: string
  recipient?: string
  subject?: string
  body?: string
  hasAttachments?: boolean
  isUnread?: boolean
  isStarred?: boolean
  isImportant?: boolean
  dateFrom?: string
  dateTo?: string
  labels?: string[]
}

export interface EmailAttachmentBase64 {
  filename: string
  content: string
  contentType: string
}

export interface EmailSendRequest {
  to: EmailAddress[]
  cc?: EmailAddress[]
  bcc?: EmailAddress[]
  subject: string
  body: string
  bodyHtml?: string
  attachments?: EmailAttachmentBase64[]
  templateId?: string
  templateVariables?: Record<string, any>
  scheduleAt?: string
  replyTo?: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  requestReadReceipt?: boolean
  saveToSent?: boolean
}

export interface EmailDraft {
  id?: string
  to: EmailAddress[]
  cc?: EmailAddress[]
  bcc?: EmailAddress[]
  subject: string
  body: string
  bodyHtml?: string
  attachments: EmailAttachment[]
  templateId?: string
  templateVariables?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface EmailContact {
  id: string
  name: string
  email: string
  company?: string
  phone?: string
  avatar?: string
  lastContactAt?: string
  emailCount: number
  isFavorite: boolean
  notes?: string
  customFields?: Record<string, any>
}



// API Response Types
export interface EmailListResponse {
  success: boolean
  data?: {
    emails: Email[]
    totalCount: number
    unreadCount: number
    hasMore: boolean
    nextPage?: string
  }
  error?: string
}

export interface EmailThreadResponse {
  success: boolean
  data?: EmailThread
  error?: string
}

export interface EmailSendResponse {
  success: boolean
  data?: {
    emailId: string
    messageId: string
    status: 'sent' | 'queued' | 'draft'
    sentAt?: string
  }
  error?: string
}

export interface EmailTemplateResponse {
  success: boolean
  data?: EmailTemplate[]
  error?: string
}

// Component Props Types
export interface EmailComposerProps {
  isOpen: boolean
  onClose: () => void
  initialData?: Partial<EmailDraft>
  onSend?: (email: EmailSendRequest) => Promise<void>
  onSaveDraft?: (draft: EmailDraft) => Promise<void>
  recipients?: EmailAddress[]
  templateId?: string
  replyToEmail?: Email
}

export interface EmailListProps {
  emails: Email[]
  selectedEmailId?: string
  onEmailSelect: (emailId: string) => void
  onEmailSetRead: (emailId: string, isRead: boolean) => void
  onEmailToggleStar: (emailId: string) => void
  onEmailArchive: (emailId: string) => void
  onEmailDelete: (emailId: string) => void
  loading?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
}

export interface EmailViewerProps {
  email: Email
  thread?: EmailThread
  onReply: (email: Email) => void
  onReplyAll: (email: Email) => void
  onForward: (email: Email) => void
  onArchive: (emailId: string) => void
  onDelete: (emailId: string) => void
  onToggleStar: (emailId: string) => void
  onMarkAsRead: (emailId: string) => void
  onMarkAsUnread: (emailId: string) => void
  onPrint: (email: Email) => void
}

export interface EmailSidebarProps {
  folders: EmailFolder[]
  categories: EmailCategory[]
  selectedFolder?: string
  selectedCategory?: EmailCategory['type']
  onFolderSelect: (folderId: string) => void
  onCategorySelect: (category: EmailCategory['type']) => void
  onCompose: () => void
  unreadCounts: Record<string, number>
}

// Default folders
export const DEFAULT_FOLDERS: EmailFolder[] = [
  { id: 'inbox', name: 'Inbox', type: 'system', unreadCount: 0, totalCount: 0, icon: 'inbox', isDefault: true },
  { id: 'sent', name: 'Sent', type: 'system', unreadCount: 0, totalCount: 0, icon: 'send' },
  { id: 'drafts', name: 'Drafts', type: 'system', unreadCount: 0, totalCount: 0, icon: 'file' },
  { id: 'starred', name: 'Starred', type: 'system', unreadCount: 0, totalCount: 0, icon: 'star' },
  { id: 'archive', name: 'Archive', type: 'system', unreadCount: 0, totalCount: 0, icon: 'archive' },
  { id: 'spam', name: 'Spam', type: 'system', unreadCount: 0, totalCount: 0, icon: 'shield' },
  { id: 'trash', name: 'Trash', type: 'system', unreadCount: 0, totalCount: 0, icon: 'trash' }
]

// Default categories
export const DEFAULT_CATEGORIES: EmailCategory[] = [
  { id: 'primary', name: 'Primary', type: 'primary', color: '#4285F4', unreadCount: 0 },
  { id: 'social', name: 'Social', type: 'social', color: '#34A853', unreadCount: 0 },
  { id: 'promotions', name: 'Promotions', type: 'promotions', color: '#FBBC04', unreadCount: 0 },
  { id: 'updates', name: 'Updates', type: 'updates', color: '#EA4335', unreadCount: 0 },
  { id: 'forums', name: 'Forums', type: 'forums', color: '#9333EA', unreadCount: 0 },
  { id: 'spam', name: 'Spam', type: 'spam', color: '#6B7280', unreadCount: 0 }
]