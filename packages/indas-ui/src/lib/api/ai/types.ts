/**
 * AI Chat API Types
 */

export interface TokenUsage {
  prompt: number
  completion: number
  total: number
}

export interface UIDataItem {
  index: number
  id: string | number
  name: string
  // Tool-specific extras — freight has state/rate, others may add fields. Pass through to click handler.
  [key: string]: unknown
}

export interface UIDataEntry {
  version: number
  id: string
  type: 'dropdown' | 'multiselect' | string
  tool: string
  items: UIDataItem[]
  // Optional prompt header authored by the tool (contract §2.54). Frontend renders this above the list.
  display_header?: string
  // multiselect only — ids already committed to the job, pre-ticked on render
  selected_ids?: (string | number)[]
}

export interface Message {
  id: string
  conversationId: number
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  timestamp: Date
  contentType: 'text' | 'image' | 'file'
  tokens?: TokenUsage
  ui_data?: UIDataEntry[]
  uiDataReadonly?: boolean
  feedback?: 'up' | 'down' | null
}

export interface Conversation {
  ConversationID: number
  Title: string
  Status?: string
  CreatedAt?: string
  LastActivityAt?: string
  ContactNo?: string
  IsStarred?: 0 | 1 | boolean
}

export interface HelpCombinationProcess {
  process: string
  materials: string[]
}

export interface HelpCombinationCategory {
  category: string
  code?: string
  processes: HelpCombinationProcess[]
}

export interface HelpCombinationsResponse {
  success: boolean
  count: number
  categories: HelpCombinationCategory[]
}

export interface ChatMessageResponse {
  MessageID: number
  ConversationID: number
  Role: 'user' | 'assistant' | 'system' | 'tool'
  // Backend may send either MessageContent or Content depending on endpoint/version
  MessageContent?: string
  Content?: string
  CreatedAt: string
  ToolName?: string | null
  ToolCallID?: string | null
  Feedback?: 1 | 0 | null
}
