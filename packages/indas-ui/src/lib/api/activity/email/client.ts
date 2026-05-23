import type { Session } from 'next-auth'
import APIClient from '@/lib/api/core/client'
import {
  DEFAULT_FOLDERS,
  DEFAULT_CATEGORIES
} from './types'
import type {
  Email,
  EmailThread,
  EmailFolder,
  EmailCategory,
  EmailTemplate,
  EmailSearchFilters,
  EmailSendRequest,
  EmailDraft,
  EmailContact,
  EmailListResponse,
  EmailThreadResponse,
  EmailSendResponse,
  EmailTemplateResponse
} from './types'

// Cache for extracted contacts from emails
let contactsCache: EmailContact[] = []

export class EmailAPI {
  private session: Session | null = null

  constructor(session: Session | null) {
    this.session = session
  }

  // Email Operations - Using internal Next.js API routes
  async getEmails(filters?: EmailSearchFilters, page = 1, limit = 20): Promise<EmailListResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...this.buildSearchParams(filters)
      })

      const response = await fetch(`/api/emails?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      const data = await response.json()

      // Extract contacts from fetched emails
      if (data.success && data.data?.emails) {
        this.extractContactsFromEmails(data.data.emails)
      }

      return data
    } catch (error) {
      console.error('Error fetching emails:', error)
      return {
        success: false,
        data: { emails: [], totalCount: 0, unreadCount: 0, hasMore: false },
        error: error instanceof Error ? error.message : 'Failed to fetch emails'
      }
    }
  }

  async getEmailById(emailId: string): Promise<{ success: boolean; data?: Email; error?: string }> {
    try {
      const response = await fetch(`/api/emails/${emailId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch email'
      }
    }
  }

  async getThread(threadId: string): Promise<EmailThreadResponse> {
    return {
      success: true,
      data: { id: threadId, messages: [], subject: '', participants: [], lastMessageAt: new Date().toISOString(), unreadCount: 0, isStarred: false, isArchived: false, labels: [], snippet: '' }
    }
  }

  async sendEmail(emailData: EmailSendRequest): Promise<EmailSendResponse> {
    try {
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          to: emailData.to,
          cc: emailData.cc,
          bcc: emailData.bcc,
          subject: emailData.subject,
          body: emailData.body,
          bodyHtml: emailData.bodyHtml,
          replyTo: emailData.replyTo
        })
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error sending email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      }
    }
  }

  // Drafts - Using IMAP Drafts folder
  async saveDraft(draft: EmailDraft): Promise<{ success: boolean; data?: EmailDraft; error?: string }> {
    try {
      const response = await fetch('/api/emails/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(draft)
      })
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error saving draft:', error)
      return { success: false, error: 'Failed to save draft' }
    }
  }

  async getDrafts(): Promise<{ success: boolean; data?: EmailDraft[]; error?: string }> {
    try {
      const response = await fetch('/api/emails/drafts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching drafts:', error)
      return { success: true, data: [] }
    }
  }

  async updateEmailStatus(emailId: string, updates: {
    isRead?: boolean
    isStarred?: boolean
    isArchived?: boolean
    category?: string
    labels?: string[]
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`/api/emails/${emailId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updates)
      })
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error updating email status:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update email status'
      }
    }
  }

  async deleteEmail(emailId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`/api/emails/${emailId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error deleting email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete email'
      }
    }
  }

  // Folder Operations
  async getFolders(): Promise<{ success: boolean; data?: EmailFolder[]; error?: string }> {
    return { success: true, data: DEFAULT_FOLDERS }
  }

  async createFolder(folder: Omit<EmailFolder, 'id' | 'totalCount'>): Promise<{ success: boolean; data?: EmailFolder; error?: string }> {
    return { success: false, error: 'Custom folders not supported' }
  }

  async deleteFolder(folderId: string): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'Custom folders not supported' }
  }

  // Category Operations
  async getCategories(): Promise<{ success: boolean; data?: EmailCategory[]; error?: string }> {
    return { success: true, data: DEFAULT_CATEGORIES }
  }

  async categorizeEmail(emailId: string, category: EmailCategory['type']): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'Email categorization not supported' }
  }

  // Template Operations - TODO: Connect to backend API when available
  // For now using localStorage as placeholder
  async getTemplates(): Promise<EmailTemplateResponse> {
    try {
      const templates = JSON.parse(localStorage.getItem('email_templates') || '[]')
      return { success: true, data: templates }
    } catch (error) {
      console.error('Error fetching templates:', error)
      return { success: true, data: [] }
    }
  }

  async getTemplateById(templateId: string): Promise<{ success: boolean; data?: EmailTemplate; error?: string }> {
    try {
      const templates = JSON.parse(localStorage.getItem('email_templates') || '[]')
      const template = templates.find((t: EmailTemplate) => t.id === templateId)
      return template ? { success: true, data: template } : { success: false, error: 'Template not found' }
    } catch (error) {
      console.error('Error fetching template:', error)
      return { success: false, error: 'Failed to fetch template' }
    }
  }

  async createTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<{ success: boolean; data?: EmailTemplate; error?: string }> {
    try {
      const templates = JSON.parse(localStorage.getItem('email_templates') || '[]')
      const newTemplate: EmailTemplate = {
        ...template,
        id: `template_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0
      } as EmailTemplate
      templates.push(newTemplate)
      localStorage.setItem('email_templates', JSON.stringify(templates))
      return { success: true, data: newTemplate }
    } catch (error) {
      console.error('Error creating template:', error)
      return { success: false, error: 'Failed to create template' }
    }
  }

  async updateTemplate(templateId: string, updates: Partial<EmailTemplate>): Promise<{ success: boolean; data?: EmailTemplate; error?: string }> {
    try {
      const templates = JSON.parse(localStorage.getItem('email_templates') || '[]')
      const index = templates.findIndex((t: EmailTemplate) => t.id === templateId)
      if (index < 0) return { success: false, error: 'Template not found' }
      templates[index] = { ...templates[index], ...updates, updatedAt: new Date().toISOString() }
      localStorage.setItem('email_templates', JSON.stringify(templates))
      return { success: true, data: templates[index] }
    } catch (error) {
      console.error('Error updating template:', error)
      return { success: false, error: 'Failed to update template' }
    }
  }

  async deleteTemplate(templateId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const templates = JSON.parse(localStorage.getItem('email_templates') || '[]')
      const filtered = templates.filter((t: EmailTemplate) => t.id !== templateId)
      localStorage.setItem('email_templates', JSON.stringify(filtered))
      return { success: true }
    } catch (error) {
      console.error('Error deleting template:', error)
      return { success: false, error: 'Failed to delete template' }
    }
  }

  // Contact Operations - Auto-extracted from emails
  private extractContactsFromEmails(emails: Email[]): void {
    const contactMap = new Map<string, EmailContact>()

    // Load existing cache
    contactsCache.forEach(c => contactMap.set(c.email.toLowerCase(), c))

    // Extract contacts from emails
    emails.forEach(email => {
      // From address
      if (email.from?.email) {
        const key = email.from.email.toLowerCase()
        const existing = contactMap.get(key)
        contactMap.set(key, {
          id: key,
          email: email.from.email,
          name: email.from.name || existing?.name || email.from.email.split('@')[0],
          emailCount: (existing?.emailCount || 0) + 1,
          lastContactAt: email.receivedAt,
          isFavorite: existing?.isFavorite || false
        })
      }

      // To addresses
      email.to?.forEach(addr => {
        if (addr?.email) {
          const key = addr.email.toLowerCase()
          const existing = contactMap.get(key)
          contactMap.set(key, {
            id: key,
            email: addr.email,
            name: addr.name || existing?.name || addr.email.split('@')[0],
            emailCount: (existing?.emailCount || 0) + 1,
            lastContactAt: email.sentAt || existing?.lastContactAt,
            isFavorite: existing?.isFavorite || false
          })
        }
      })

      // CC addresses
      email.cc?.forEach(addr => {
        if (addr?.email) {
          const key = addr.email.toLowerCase()
          const existing = contactMap.get(key)
          if (!existing) {
            contactMap.set(key, {
              id: key,
              email: addr.email,
              name: addr.name || addr.email.split('@')[0],
              emailCount: 1,
              lastContactAt: email.receivedAt,
              isFavorite: false
            })
          }
        }
      })
    })

    // Update cache sorted by email count (most contacted first)
    contactsCache = Array.from(contactMap.values()).sort((a, b) => b.emailCount - a.emailCount)
  }

  async getContacts(search?: string): Promise<{ success: boolean; data?: EmailContact[]; error?: string }> {
    try {
      let contacts = [...contactsCache]
      if (search) {
        const searchLower = search.toLowerCase()
        contacts = contacts.filter(c =>
          c.email.toLowerCase().includes(searchLower) ||
          c.name?.toLowerCase().includes(searchLower)
        )
      }
      return { success: true, data: contacts }
    } catch (error) {
      console.error('Error fetching contacts:', error)
      return { success: true, data: [] }
    }
  }

  async createContact(contact: Omit<EmailContact, 'id' | 'emailCount'>): Promise<{ success: boolean; data?: EmailContact; error?: string }> {
    // Contacts are auto-extracted, but allow manual addition to cache
    const newContact: EmailContact = {
      ...contact,
      id: contact.email.toLowerCase(),
      emailCount: 0
    } as EmailContact
    contactsCache.push(newContact)
    return { success: true, data: newContact }
  }

  // Search Operations
  async searchEmails(query: string, filters?: EmailSearchFilters): Promise<EmailListResponse> {
    try {
      const searchFilters = { ...filters, query }
      return this.getEmails(searchFilters)
    } catch (error) {
      console.error('Error searching emails:', error)
      return {
        success: false,
        data: { emails: [], totalCount: 0, unreadCount: 0, hasMore: false },
        error: error instanceof Error ? error.message : 'Failed to search emails'
      }
    }
  }

  // Helper Methods
  private buildSearchParams(filters?: EmailSearchFilters): Record<string, string> {
    if (!filters) return {}

    const params: Record<string, string> = {}

    if (filters.query) params.query = filters.query
    if (filters.category) params.category = filters.category
    if (filters.folder) params.folder = filters.folder
    if (filters.sender) params.sender = filters.sender
    if (filters.recipient) params.recipient = filters.recipient
    if (filters.subject) params.subject = filters.subject
    if (filters.body) params.body = filters.body
    if (filters.hasAttachments !== undefined) params.hasAttachments = filters.hasAttachments.toString()
    if (filters.isUnread !== undefined) params.isUnread = filters.isUnread.toString()
    if (filters.isStarred !== undefined) params.isStarred = filters.isStarred.toString()
    if (filters.isImportant !== undefined) params.isImportant = filters.isImportant.toString()
    if (filters.dateFrom) params.dateFrom = filters.dateFrom
    if (filters.dateTo) params.dateTo = filters.dateTo
    if (filters.labels) params.labels = filters.labels.join(',')

    return params
  }

  // Utility Methods
  async markEmailAsRead(emailId: string): Promise<{ success: boolean; error?: string }> {
    return this.updateEmailStatus(emailId, { isRead: true })
  }

  async markEmailAsUnread(emailId: string): Promise<{ success: boolean; error?: string }> {
    return this.updateEmailStatus(emailId, { isRead: false })
  }

  async toggleEmailStar(emailId: string): Promise<{ success: boolean; error?: string; isStarred?: boolean }> {
    try {
      const emailResponse = await this.getEmailById(emailId)
      if (!emailResponse.success || !emailResponse.data) {
        return { success: false, error: emailResponse.error || 'Email not found' }
      }

      const newStarStatus = !emailResponse.data.isStarred
      const updateResponse = await this.updateEmailStatus(emailId, { isStarred: newStarStatus })

      return {
        ...updateResponse,
        isStarred: newStarStatus
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to toggle star status'
      }
    }
  }

  async archiveEmail(emailId: string): Promise<{ success: boolean; error?: string }> {
    return this.updateEmailStatus(emailId, { isArchived: true })
  }

  async unarchiveEmail(emailId: string): Promise<{ success: boolean; error?: string }> {
    return this.updateEmailStatus(emailId, { isArchived: false })
  }

  async getUnreadCount(): Promise<{ success: boolean; data?: number; error?: string }> {
    try {
      const response = await this.getEmails()
      if (response.success && response.data) {
        return { success: true, data: response.data.unreadCount }
      }
      return { success: true, data: 0 }
    } catch (error) {
      console.error('Error fetching unread count:', error)
      return { success: true, data: 0 }
    }
  }
}

// Export factory function
export function createEmailAPI(session: Session | null): EmailAPI {
  return new EmailAPI(session)
}

// Export default instance (for backward compatibility)
export const emailAPI = new EmailAPI(null)

// ============================================================
//  Email Config API (IntegrationConfig-based)
// ============================================================

export interface BackendEmailConfigResponse {
  provider: string
  configured: boolean
  mailbox?: string
  graphConfigured: boolean
  smtpConfigured: boolean
}

export interface BackendSaveEmailConfigRequest {
  provider: string
  tenantId?: string
  clientId?: string
  clientSecret?: string
  mailboxAddress?: string
  senderEmail?: string
  smtpServer?: string
  smtpPort?: string
  smtpUser?: string
  smtpPass?: string
}

export async function getEmailConfig(session: any) {
  return APIClient.get<BackendEmailConfigResponse>('api/email/config', session)
}

export async function saveEmailConfig(data: BackendSaveEmailConfigRequest, session: any) {
  return APIClient.post('api/email/config', data, session)
}

export async function sendEmailViaBackend(data: { to: { email: string; name?: string }[]; cc?: { email: string; name?: string }[]; bcc?: { email: string; name?: string }[]; subject: string; htmlBody?: string; textBody?: string; replyTo?: string; attachments?: { filename: string; content: string; contentType: string }[] }, session: any) {
  return APIClient.post('api/email/send', data, session)
}

export async function testEmailConfig(session: any) {
  return APIClient.post('api/email/test', {}, session)
}
