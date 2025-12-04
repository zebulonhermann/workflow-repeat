/**
 * Contract Chatbot Wrapper
 * 
 * Server component that wraps the ContractChatbot client component.
 * Handles chat persistence by:
 * 1. Getting or creating a chat ID from cookies
 * 2. Loading existing chat messages from the database
 * 3. Passing the chat ID and messages to the client component
 * 
 * This separation allows the client component to be interactive while
 * the server component handles data fetching and persistence.
 */

import { cookies } from "next/headers"
import { ContractChatbot } from "./contract-chatbot"
import { createChat, loadChatMessages, convertSelectMessagesToChatUIMessages } from "@/lib/chat"
import type { ChatUIMessage } from "@/lib/chat"

/**
 * Contract Chatbot Wrapper Component
 * 
 * Server component that initializes the chat session and loads message history.
 * 
 * @returns ContractChatbot client component with initialized chat ID and messages
 */
export async function ContractChatbotWrapper() {
  const cookieStore = await cookies()
  let chatId = cookieStore.get('chat_id')?.value

  // Generate new chatId if it doesn't exist
  if (!chatId) {
    chatId = await createChat()
  }

  // Fetch initial messages for this chat
  const messages = await loadChatMessages(chatId)
  const initialMessages: ChatUIMessage[] = convertSelectMessagesToChatUIMessages(messages)

  return <ContractChatbot id={chatId} initialMessages={initialMessages} />
}
