// Chat Components - Centralized exports
//
// Only the backend-agnostic pieces are exported. `Chat` itself is deliberately left out: it is
// bound to Estimo's stack (next-auth's useSession, the /api/synthia endpoints in lib/api/ai/chat,
// and Estimo's alert and language contexts), so a host app on a different backend cannot use it.
// `Messages` and `MultimodalInput` take everything they render as props and so travel anywhere.
//
// Hosts that want the full assembly compose it themselves: SidePanel (from 'indas-ui/layout') for
// the conversation rail, Messages for the transcript, MultimodalInput for the composer.

export { Messages } from './ai-messages'
export type { SelectableItem } from './ai-messages'

export { MultimodalInput } from './multimodal-input'

export { ChatPromptNavigator } from './chat-prompt-navigator'

// The message/conversation shapes Messages renders, so hosts can type their own state.
export type { Message, Conversation, UIDataEntry, UIDataItem, TokenUsage } from '../../lib/api/ai/types'
