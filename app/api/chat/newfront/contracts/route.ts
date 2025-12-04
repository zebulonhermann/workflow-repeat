/**
 * Contract Chat API Route
 * 
 * API endpoint for the contract management chatbot.
 * Handles chat message streaming and persistence.
 * 
 * Features:
 * - Creates/loads chat sessions
 * - Validates and processes chat messages
 * - Creates contract agent with dynamic model selection
 * - Streams agent responses back to client
 * - Persists messages to database
 * 
 * The agent uses callOptions to support runtime model selection
 * (user can choose model in the UI, passed via request body).
 */

import {
    // @ts-ignore
  createAgentUIStream,
  createUIMessageStreamResponse,
  validateUIMessages,
} from 'ai';
import { createContractAgent } from '@/workflows/newfront/contract-management/agent/contract-agent';
import { loadChatMessages, convertSelectMessagesToChatUIMessages, convertUIMessagesToNewMessages, saveChatMessages, getChat, type ChatUIMessage } from '@/lib/chat';
import { createChat } from '@/db/operations/chat';
import { generateId } from 'ai';



/**
 * POST Handler for Chat Messages
 * 
 * Processes chat messages and streams agent responses.
 * 
 * Request body:
 * - messages: Array of chat messages (UI format)
 * - chatId: Chat session ID
 * - model: Optional model ID for runtime model selection
 * 
 * Response: Streaming response with agent messages and tool invocations
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { messages, chatId, model: modelId } = body as {
    messages?: ChatUIMessage[];
    chatId?: string;
    model?: string;
  };

  console.log('[Contract Chat API] Received request', {
    chatId,
    modelId: modelId || 'No Model Selected',
    messageCount: messages?.length || 0,
  });

  // ========== Step 1: Handle Chat History and Persistence ==========
  // Load or create chat session, and handle message persistence
  let allMessages: ChatUIMessage[] = messages || [];
  if (chatId) {
    // Ensure the chat exists in the database
    const existingChat = await getChat(chatId);
    if (!existingChat) {
      await createChat({ id: chatId });
    }

    // If messages are provided, use them directly (client has the full conversation state)
    // Only load from DB if no messages are provided
    if (messages && messages.length > 0) {
      allMessages = messages;
      
      // Save new user messages to DB for persistence (avoid duplicates)
      const previousMessages = await loadChatMessages(chatId);
      const existingIds = new Set(previousMessages.map(m => m.id));
      const newUserMessages = allMessages.filter(m => m.role === 'user' && !existingIds.has(m.id));
      if (newUserMessages.length > 0) {
        const userMessagesToSave = convertUIMessagesToNewMessages(newUserMessages, chatId);
        await saveChatMessages({ messages: userMessagesToSave });
      }
    } else {
      // No messages provided, load from DB
      const previousMessages = await loadChatMessages(chatId);
      allMessages = convertSelectMessagesToChatUIMessages(previousMessages);
    }
  }

  // ========== Step 2: Validate Messages ==========
  // Filter out invalid messages (empty parts, etc.) before validation
  const validMessages = allMessages.filter((message) => {
    // Messages must have at least one part
    if (!message.parts || message.parts.length === 0) {
      return false;
    }
    return true;
  });

  // Validate messages using AI SDK's validation
  const validatedMessages = await validateUIMessages({
    messages: validMessages,
  });

  // ========== Step 3: Create Agent and Configure Model Selection ==========
  // Create agent with default model (model will be selected dynamically via prepareCall)
  const defaultModelId = 'openai/gpt-4o-mini';
  const agent = createContractAgent(defaultModelId);
  
  // Build callOptions object for AI SDK 6
  // This enables runtime model selection (user can choose model in UI)
  const callOptions = modelId ? { selectedModel: modelId } : undefined;

  // ========== Step 4: Create Agent Stream and Handle Response ==========
  // Create streaming response with agent
  // callOptions enables runtime model selection (if user selected a model)
  const agentStream = await createAgentUIStream({
    agent,
    messages: validatedMessages,
    options: callOptions, // Pass runtime model selection to agent
    sendStart: true,
    sendFinish: true,
    // Save assistant messages to database when stream completes
    onFinish: async ({ responseMessage }: any) => {
        if (responseMessage && chatId) {
            const newResponseMessage = responseMessage as ChatUIMessage;
            newResponseMessage.id =  newResponseMessage.id || generateId();
            const assistantMessages = convertUIMessagesToNewMessages([newResponseMessage], chatId);
            await saveChatMessages({ messages: assistantMessages });
        }
    }
  })

  // @ts-ignore
  return createUIMessageStreamResponse({ stream: agentStream });
}
