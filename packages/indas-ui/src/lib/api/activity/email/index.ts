// Email API - Main Export File
export * from './types'
export * from './client'
export * from './templates'
export * from './password-reset'


// Re-export for easier importing
export { EmailAPI, createEmailAPI } from './client'
export type {
  Email,
  EmailThread,
  EmailFolder,
  EmailCategory,
  EmailTemplate,
  EmailTemplateVariable,
  EmailSearchFilters,
  EmailSendRequest,
  EmailDraft,
  EmailContact,
  EmailAddress,
  EmailAttachment,
  EmailListResponse,
  EmailThreadResponse,
  EmailSendResponse,
  EmailTemplateResponse,
  EmailComposerProps,
  EmailListProps,
  EmailViewerProps,
  EmailSidebarProps
} from './types'

// Export constants (not as types)
export { DEFAULT_FOLDERS, DEFAULT_CATEGORIES } from './types'