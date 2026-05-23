/**
 * AI Chat API Functions
 * Connects to main backend for Parksons AI chat (ParksonsBotController)
 */

import APIClient from '@/lib/api/core/client'
import type { APIResponse } from '@/lib/api/core/types'
import type { Conversation, ChatMessageResponse, TokenUsage, UIDataEntry, HelpCombinationCategory } from './types'

export interface ChatMessageParams {
  message: string
  conversationId?: number
  newChat?: boolean
  title?: string | null
  phone?: string
}

/**
 * Send a chat message to the AI
 * Returns standard APIResponse plus optional userMessageId from X-User-MessageID header
 */
export async function sendChatMessageAPI(
  params: ChatMessageParams,
  sessionData: any,
  signal?: AbortSignal
): Promise<APIResponse<string> & { userMessageId?: string; conversationId?: number; tokens?: TokenUsage; ui_data?: UIDataEntry[] }> {
  try {
    // Costingbot turns can take 30-90s when the model chains multiple tools
    // (validation → costing → freight). The default 60s timeout aborts legit
    // turns mid-flight, leaving the server with a half-finished AiMessages row
    // and no assistant reply. 3 minutes is a sane upper bound — the user's
    // Stop button (signal) is the meaningful cancel for normal use.
    const response = await APIClient.post(
      '/api/synthia/costingbot',
      {
        message: params.message,
        conversationId: params.conversationId,
        newChat: params.newChat,
        title: params.title,
        phone: params.phone || sessionData?.user?.UserID?.toString() || '9999999999'
      },
      sessionData,
      undefined,
      signal,
      180000
    )

    // Try to extract tokens + ui_data if backend returns JSON with { message, tokens, ui_data }
    let tokens: TokenUsage | undefined
    let ui_data: UIDataEntry[] | undefined
    let messageContent = response.data
    if (typeof response.data === 'string') {
      try {
        const parsed = JSON.parse(response.data)
        if (parsed.message && parsed.tokens) {
          messageContent = parsed.message
          tokens = parsed.tokens
          if (Array.isArray(parsed.ui_data)) {
            ui_data = parsed.ui_data.filter((e: UIDataEntry) => e.version === 1)
          }
        }
      } catch {
        // Not JSON — plain string response, that's fine
      }
    } else if (response.data && typeof response.data === 'object') {
      const obj = response.data as Record<string, unknown>
      if (obj.message && obj.tokens) {
        messageContent = obj.message as string
        tokens = obj.tokens as TokenUsage
        if (Array.isArray(obj.ui_data)) {
          ui_data = (obj.ui_data as UIDataEntry[]).filter(e => e.version === 1)
        }
      }
    }

    const convIdRaw = response.responseHeaders?.['X-Conversation-ID']
    const conversationId = convIdRaw ? Number(convIdRaw) : undefined
    return {
      ...response,
      data: messageContent,
      userMessageId: response.responseHeaders?.['X-User-MessageID'],
      conversationId: Number.isFinite(conversationId) ? conversationId : undefined,
      tokens,
      ui_data
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message'
    }
  }
}

/**
 * Get all conversations for current user
 */
export async function getConversationsAPI(sessionData: any): Promise<APIResponse<Conversation[]>> {
  try {
    const response = await APIClient.get('/api/synthia/conversations', sessionData)
    return response
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load conversations'
    }
  }
}

/**
 * Get messages for a specific conversation
 */
export async function getMessagesAPI(
  conversationId: number,
  sessionData: any
): Promise<APIResponse<ChatMessageResponse[]>> {
  try {
    const response = await APIClient.get(
      `/api/synthia/messages/${conversationId}`,
      sessionData
    )
    return response
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load messages'
    }
  }
}

/**
 * Delete all messages after a specific message in a conversation (cascade delete on edit/resend)
 * Backend uses [HttpGet] route
 */
export async function deleteMessagesAfterAPI(
  conversationId: number,
  messageId: string,
  sessionData: any
): Promise<APIResponse<void>> {
  try {
    const response = await APIClient.get(
      `/api/synthia/delete-messages-after/${conversationId}/${messageId}`,
      sessionData
    )
    return response
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete messages'
    }
  }
}

/**
 * Rename a conversation
 */
export async function renameConversationAPI(
  conversationId: number,
  title: string,
  sessionData: any
): Promise<APIResponse<{ ConversationID: number; Title: string }>> {
  try {
    const response = await APIClient.post(
      `/api/synthia/rename-conversation/${conversationId}`,
      { title },
      sessionData
    )
    return response
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to rename conversation'
    }
  }
}

/**
 * Toggle star (favorite) on a conversation — server flips the state and returns the new value
 */
export async function toggleStarConversationAPI(
  conversationId: number,
  sessionData: any
): Promise<APIResponse<{ ConversationID: number; IsStarred: 0 | 1 }>> {
  try {
    const response = await APIClient.post(
      `/api/synthia/toggle-star/${conversationId}`,
      undefined,
      sessionData
    )
    return response
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle star'
    }
  }
}

/**
 * Fetch the dynamic Categories & Combinations list for the Synthia help screen.
 * Returns the categories configured for the user's company, with each category's
 * default processes and the materials allowed per process.
 */
export async function getHelpCombinationsAPI(
  sessionData: any
): Promise<APIResponse<HelpCombinationCategory[]>> {
  try {
    const response = await APIClient.get('/api/synthia/help/combinations', sessionData)
    if (response.success && response.data && typeof response.data === 'object') {
      const obj = response.data as { categories?: HelpCombinationCategory[] }
      return { ...response, data: Array.isArray(obj.categories) ? obj.categories : [] }
    }
    return { ...response, data: [] }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load categories'
    }
  }
}

/**
 * Submit thumbs up/down feedback on an AI message. Pass null to clear.
 */
export async function submitMessageFeedbackAPI(
  messageId: string,
  rating: 'up' | 'down' | null,
  sessionData: any
): Promise<APIResponse<void>> {
  try {
    const response = await APIClient.post(
      `/api/synthia/messages/${messageId}/feedback`,
      { rating },
      sessionData
    )
    return response
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit feedback'
    }
  }
}

/**
 * Delete a conversation
 * Backend uses [HttpGet] route
 */
export async function deleteConversationAPI(
  conversationId: number,
  sessionData: any
): Promise<APIResponse<void>> {
  try {
    const response = await APIClient.get(
      `/api/synthia/delete-conversation/${conversationId}`,
      sessionData
    )
    return response
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete conversation'
    }
  }
}
