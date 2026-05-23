/**
 * Messaging API — Types, helpers, and API client
 *
 * All endpoints under /api/messaging
 */

import APIClient from '../../core/client'
import type { APIResponse } from '../../core/types'

// Use production API URL (same as all other API files)
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ChatRoom {
  RoomID: number
  CompanyID: number
  Type: 'DM' | 'Group' | 'Channel'
  Name: string | null
  Description: string | null
  AvatarUrl: string | null
  IsPublic: boolean
  IsReadOnly: boolean
  CreatedBy: number
  CreatedDate: string
  UpdatedDate: string
  LastMessageAt: string | null
  LastMessagePreview: string | null
  LastMessageBy: number | null
  IsArchived: boolean
  IsDeleted: boolean
  Participants: string | null // JSON string — parse with parseParticipants()
  UnreadCount?: number
}

export interface ChatMessage {
  MessageID: number
  RoomID: number
  CompanyID: number
  UserID: number
  Content: string | null
  MessageType: 'Text' | 'File' | 'Image' | 'System'
  ParentMessageID: number | null
  ReplyDepth: number
  ReplyCount: number
  CreatedAt: string
  EditedAt: string | null
  IsEdited: boolean
  IsDeleted: boolean
  Reactions: string | null     // JSON string
  Attachments: string | null   // JSON string
  // Joined from search
  RoomName?: string
  RoomType?: string
}

export interface ChatParticipant {
  userId: number
  userName: string
  role: 'Owner' | 'Admin' | 'Member'
  lastReadMessageId: number | null
  lastReadAt: string | null
  isMuted: boolean
  joinedAt: string
}

export interface ChatReaction {
  emoji: string
  userIds: number[]
}

export interface ChatAttachment {
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
}

export interface ChatContact {
  UserID: number
  UserName: string
  Designation: string | null
  Email: string | null
}

export interface UnreadCount {
  RoomID: number
  UnreadCount: number
}

// ─── Request types ──────────────────────────────────────────────────────────

export interface CreateRoomRequest {
  Type: 'Group' | 'Channel'
  Name: string
  Description?: string
  IsPublic?: boolean
  IsReadOnly?: boolean
  ParticipantsJson: string
}

export interface CreateDMRequest {
  TargetUserID: number
  TargetUserName: string
}

export interface SendMessageRequest {
  Content?: string
  MessageType?: string
  ParentMessageID?: number
  AttachmentsJson?: string
}

export interface UpdateRoomRequest {
  Name?: string
  Description?: string
  IsPublic?: boolean
  IsReadOnly?: boolean
  ParticipantsJson?: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function parseParticipants(json: string | null): ChatParticipant[] {
  if (!json) return []
  try { return JSON.parse(json) } catch { return [] }
}

export function parseReactions(json: string | null): ChatReaction[] {
  if (!json) return []
  try { return JSON.parse(json) } catch { return [] }
}

export function parseAttachments(json: string | null): ChatAttachment[] {
  if (!json) return []
  try { return JSON.parse(json) } catch { return [] }
}

// ─── API Client ─────────────────────────────────────────────────────────────

class MessagingAPI {
  // ─── Conversations ──────────────────────────────────────────────────────────

  /** GET /api/messaging/conversations?type=DM|Group|Channel */
  static async getConversations(
    session: any,
    type?: 'DM' | 'Group' | 'Channel'
  ): Promise<APIResponse<ChatRoom[]>> {
    try {
      const query = type ? `?type=${type}` : ''
      const response = await APIClient.get<ChatRoom[]>(
        `/api/messaging/conversations${query}`,
        session,
        BASE_URL
      )
      return { success: true, data: response.data || [] }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch conversations' }
    }
  }

  /** POST /api/messaging/conversations — create group/channel */
  static async createRoom(
    request: CreateRoomRequest,
    session: any
  ): Promise<APIResponse<ChatRoom>> {
    try {
      const response = await APIClient.post<ChatRoom>(
        '/api/messaging/conversations',
        request,
        session,
        BASE_URL
      )
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create room' }
    }
  }

  /** POST /api/messaging/conversations/dm — get or create DM */
  static async getOrCreateDM(
    request: CreateDMRequest,
    session: any
  ): Promise<APIResponse<ChatRoom>> {
    try {
      const response = await APIClient.post<ChatRoom>(
        '/api/messaging/conversations/dm',
        request,
        session,
        BASE_URL
      )
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get/create DM' }
    }
  }

  /** POST /api/messaging/conversations/{id}/update — update room */
  static async updateRoom(
    roomId: number,
    request: UpdateRoomRequest,
    session: any
  ): Promise<APIResponse<ChatRoom>> {
    try {
      const response = await APIClient.post<ChatRoom>(
        `/api/messaging/conversations/${roomId}/update`,
        request,
        session,
        BASE_URL
      )
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update room' }
    }
  }

  // ─── Messages ───────────────────────────────────────────────────────────────

  /** GET /api/messaging/conversations/{id}/messages?page=1&pageSize=50 */
  static async getMessages(
    roomId: number,
    session: any,
    page = 1,
    pageSize = 50
  ): Promise<APIResponse<ChatMessage[]>> {
    try {
      const response = await APIClient.get<ChatMessage[]>(
        `/api/messaging/conversations/${roomId}/messages?page=${page}&pageSize=${pageSize}`,
        session,
        BASE_URL
      )
      return { success: true, data: response.data || [] }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch messages' }
    }
  }

  /** POST /api/messaging/conversations/{id}/messages — send message */
  static async sendMessage(
    roomId: number,
    request: SendMessageRequest,
    session: any
  ): Promise<APIResponse<ChatMessage>> {
    try {
      const response = await APIClient.post<ChatMessage>(
        `/api/messaging/conversations/${roomId}/messages`,
        request,
        session,
        BASE_URL
      )
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to send message' }
    }
  }

  /** POST /api/messaging/messages/{id}/edit — edit message */
  static async editMessage(
    messageId: number,
    content: string,
    session: any
  ): Promise<APIResponse<ChatMessage>> {
    try {
      const response = await APIClient.post<ChatMessage>(
        `/api/messaging/messages/${messageId}/edit`,
        { Content: content },
        session,
        BASE_URL
      )
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to edit message' }
    }
  }

  /** POST /api/messaging/messages/{id}/delete — soft delete */
  static async deleteMessage(
    messageId: number,
    session: any
  ): Promise<APIResponse<{ Message: string }>> {
    try {
      const response = await APIClient.post<{ Message: string }>(
        `/api/messaging/messages/${messageId}/delete`,
        {},
        session,
        BASE_URL
      )
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete message' }
    }
  }

  // ─── Threads ────────────────────────────────────────────────────────────────

  /** GET /api/messaging/messages/{id}/replies — get thread replies */
  static async getThreadReplies(
    messageId: number,
    session: any
  ): Promise<APIResponse<ChatMessage[]>> {
    try {
      const response = await APIClient.get<ChatMessage[]>(
        `/api/messaging/messages/${messageId}/replies`,
        session,
        BASE_URL
      )
      return { success: true, data: response.data || [] }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch thread' }
    }
  }

  /** POST /api/messaging/messages/{id}/replies — reply in thread */
  static async replyToMessage(
    parentMessageId: number,
    request: SendMessageRequest,
    session: any
  ): Promise<APIResponse<ChatMessage>> {
    try {
      const response = await APIClient.post<ChatMessage>(
        `/api/messaging/messages/${parentMessageId}/replies`,
        request,
        session,
        BASE_URL
      )
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to reply' }
    }
  }

  // ─── Reactions ──────────────────────────────────────────────────────────────

  /** POST /api/messaging/messages/{id}/reactions — update reactions JSON */
  static async updateReactions(
    messageId: number,
    reactionsJson: string,
    session: any
  ): Promise<APIResponse<ChatMessage>> {
    try {
      const response = await APIClient.post<ChatMessage>(
        `/api/messaging/messages/${messageId}/reactions`,
        { ReactionsJson: reactionsJson },
        session,
        BASE_URL
      )
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update reactions' }
    }
  }

  // ─── Read Status ────────────────────────────────────────────────────────────

  /** POST /api/messaging/conversations/{id}/read — mark as read */
  static async markAsRead(
    roomId: number,
    lastReadMessageId: number,
    session: any
  ): Promise<APIResponse<{ Message: string }>> {
    try {
      const response = await APIClient.post<{ Message: string }>(
        `/api/messaging/conversations/${roomId}/read`,
        { LastReadMessageID: lastReadMessageId },
        session,
        BASE_URL
      )
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to mark as read' }
    }
  }

  /** GET /api/messaging/unread-counts */
  static async getUnreadCounts(
    session: any
  ): Promise<APIResponse<UnreadCount[]>> {
    try {
      const response = await APIClient.get<UnreadCount[]>(
        '/api/messaging/unread-counts',
        session,
        BASE_URL
      )
      return { success: true, data: response.data || [] }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch unread counts' }
    }
  }

  // ─── Search & Contacts ──────────────────────────────────────────────────────

  /** GET /api/messaging/search?q=hello&limit=50 */
  static async searchMessages(
    query: string,
    session: any,
    limit = 50
  ): Promise<APIResponse<ChatMessage[]>> {
    try {
      const response = await APIClient.get<ChatMessage[]>(
        `/api/messaging/search?q=${encodeURIComponent(query)}&limit=${limit}`,
        session,
        BASE_URL
      )
      return { success: true, data: response.data || [] }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to search messages' }
    }
  }

  /** GET /api/messaging/contacts */
  static async getContacts(
    session: any
  ): Promise<APIResponse<ChatContact[]>> {
    try {
      const response = await APIClient.get<ChatContact[]>(
        '/api/messaging/contacts',
        session,
        BASE_URL
      )
      return { success: true, data: response.data || [] }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch contacts' }
    }
  }

  // ─── File Upload ────────────────────────────────────────────────────────────

  /** POST /api/messaging/upload — multipart file upload (25MB max) */
  static async uploadFile(
    file: File,
    session: any
  ): Promise<APIResponse<{ FileName: string; FileUrl: string; FileSize: number; MimeType: string }>> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const companyId = session?.user?.CompanyID || session?.user?.companyID
      const userId = session?.user?.UserID || session?.user?.userID
      const productionUnitId = session?.user?.ProductionUnitID || session?.user?.productionUnitID
      const fYear = session?.user?.FYear || session?.user?.fYear
      const username = session?.user?.companyUsername
      const password = session?.user?.companyPassword

      const res = await fetch(`${BASE_URL}/api/messaging/upload`, {
        method: 'POST',
        body: formData, // no Content-Type — browser sets multipart/form-data + boundary
        headers: {
          ...(username && password ? { 'Authorization': `Basic ${btoa(`${username}:${password}`)}` } : {}),
          ...(companyId ? { 'CompanyID': String(companyId) } : {}),
          ...(userId ? { 'UserID': String(userId) } : {}),
          ...(productionUnitId ? { 'ProductionUnitID': String(productionUnitId) } : {}),
          ...(fYear ? { 'FYear': String(fYear) } : {})
        }
      })

      if (!res.ok) {
        return { success: false, error: `Upload failed: ${res.status}` }
      }

      const data = await res.json()
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to upload file' }
    }
  }
}

export default MessagingAPI
export { MessagingAPI }
