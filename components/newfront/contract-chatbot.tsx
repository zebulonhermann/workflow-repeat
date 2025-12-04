/**
 * Contract Chatbot Component
 * 
 * Client-side chat interface for the Newfront contract management system.
 * 
 * Key Features:
 * - Chat interface with message history
 * - Model selection (user can choose AI model)
 * - Persona selection (requester, contract_manager, legal)
 * - Tool approval UI (for contractDraft tool)
 * - Modal and floating window modes
 * - Auto-scrolling and message persistence
 * 
 * The chatbot connects to the contract management agent which can:
 * - Answer questions about contracts
 * - Draft contracts via the contractDraft tool
 * - Provide contract management guidance
 * 
 * Uses AI SDK's useChat hook with DefaultChatTransport for streaming responses.
 */

"use client"
import type React from "react"
import { useState, useRef, useEffect, startTransition } from "react"
import { useChat, type UIMessage } from "@ai-sdk/react"
//@ts-ignore
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses } from "ai"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { X, Send, FileText, Maximize2, Minimize2, Settings, Scale, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { setChatIdCookie } from "@/actions"
import { ThinkingLoader } from "@/components/thinking-loader"
import ReactMarkdown from "react-markdown"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/**
 * Contract Draft Tool View Component
 * 
 * Renders the UI for the contractDraft tool invocation.
 * Shows different states:
 * - approval-requested: Shows approval UI with contract details
 * - output-available: Shows success message with contract ID
 * - partial: Shows loading state
 * 
 * This component handles the approval flow for contract drafting,
 * allowing users to approve or decline before the workflow starts.
 */
function ContractDraftToolView({ 
  invocation, 
  addToolApprovalResponse 
}: { 
  invocation: any
  addToolApprovalResponse: (response: { id: string; approved: boolean }) => void
}) {
  // Show approval UI when tool requires approval
  if (invocation.state === 'approval-requested') {
    const input = invocation.input || {};
    const contractType = input.contractType || 'Contract';
    const jurisdiction = input.jurisdiction || 'N/A';
    const requesterRole = input.requesterRole || 'requester';
    
    return (
      <div className="max-w-[85%] mb-3">
        <div className="bg-card border-2 border-blue-500/30 rounded-xl overflow-hidden shadow-lg">
          {/* Header with blue accent */}
          <div className="bg-blue-500/10 border-b border-blue-500/20 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Contract Draft Approval Required</span>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Contract Type</span>
                <span className="text-sm font-semibold text-card-foreground">{contractType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Jurisdiction</span>
                <span className="text-sm text-card-foreground">{jurisdiction}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Requester Role</span>
                <span className="text-sm text-card-foreground capitalize">{requesterRole}</span>
              </div>
              {input.parties && (
                <div className="pt-2 border-t border-border">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Parties</span>
                  <div className="text-sm text-card-foreground">
                    <div>{input.parties.party1?.name} ({input.parties.party1?.role})</div>
                    <div>{input.parties.party2?.name} ({input.parties.party2?.role})</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 pt-2 border-t border-border">
              <Button
                size="sm"
                onClick={() =>
                  addToolApprovalResponse({
                    id: invocation.approval.id,
                    approved: true,
                  })
                }
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Approve Draft
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  addToolApprovalResponse({
                    id: invocation.approval.id,
                    approved: false,
                  })
                }
                className="flex-1 border-border hover:bg-muted"
              >
                Decline
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show success message when tool execution completes
  if (invocation.state === 'output-available') {
    const output = invocation.output || {};
    const contractId = output.contractId || output.runId || 'N/A';
    
    return (
      <div className="max-w-[85%] mb-3">
        <div className="bg-card border border-blue-500/20 rounded-lg p-3 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-card-foreground mb-1">Contract Draft Initiated</div>
              <div className="text-xs text-muted-foreground">
                Contract ID: <span className="font-mono text-blue-600 dark:text-blue-400">{contractId}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state while tool is executing
  if (invocation.state === 'partial') {
    return (
      <div className="max-w-[85%] mb-3">
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-sm text-card-foreground">Processing contract draft...</span>
          </div>
        </div>
      </div>
    )
  }

  return null
}

// Available AI models for selection in the UI
// Users can choose which model to use, or select "Auto" for smart routing
const AI_MODELS = [
  { id: '', name: 'Auto (Smart Routing)', provider: 'System' },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", cost: "Cheap" },
  { id: "openai/gpt-4o", name: "GPT-4o", provider: "OpenAI", cost: "Premium" },
  { id: "anthropic/claude-sonnet-4.5", name: "Claude Sonnet 4.5", provider: "Anthropic", cost: "Premium" },
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic", cost: "Premium" },
]

// Available personas for role-based access control
// Each persona has different permissions in the contract workflow
const PERSONAS = [
  { id: 'requester', name: 'Requester', description: 'Can draft contracts only' },
  { id: 'contract_manager', name: 'Contract Manager', description: 'Can draft, edit, and negotiate' },
  { id: 'legal', name: 'Legal', description: 'Can approve and publish' },
]

/**
 * Contract Chatbot Main Component
 * 
 * Main chat interface component that handles:
 * - Chat state management (messages, input, status)
 * - Model and persona selection
 * - Tool approval handling
 * - UI interactions (open/close, modal mode, scrolling)
 * 
 * @param id - Chat ID for message persistence
 * @param initialMessages - Initial messages to load (from database)
 */
export function ContractChatbot({ id, initialMessages }: { id: string; initialMessages?: UIMessage[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isModalMode, setIsModalMode] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string | undefined>(undefined)
  const [selectedPersona, setSelectedPersona] = useState<string>('requester')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<HTMLDivElement | null>(null)
  const [input, setInput] = useState("")

  // Set chat ID cookie for persistence across page reloads
  useEffect(() => {
    startTransition(async () => {
      await setChatIdCookie(id)
    })
  }, [id])
  
  // Initialize chat hook with AI SDK's useChat
  // This handles message streaming, tool invocations, and approval responses
  //@ts-ignore
  const { messages, sendMessage, status, addToolApprovalResponse } = useChat({
    id,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat/newfront/contracts",
      prepareSendMessagesRequest({ messages, id }: { messages: UIMessage[]; id: string }) {
        return { body: { messages, chatId: id, model: selectedModel } };
      },
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (input.trim()) {
      sendMessage({
        role: "user",
        parts: [{ type: "text", text: input }],
      })
      setInput("")
    }
  }

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (isDropdownOpen) {
        return
      }
      if (chatRef.current && !chatRef.current.contains(target)) {
        const isDropdownClick = (target as Element).closest('[data-slot="dropdown-menu-content"]') ||
                                (target as Element).closest('[data-slot="dropdown-menu-portal"]')
        if (!isDropdownClick) {
          setIsOpen(false)
        }
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)

      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [isOpen, isDropdownOpen])

  useEffect(() => {
    if (messagesRef.current && isOpen && messages.length > 0) {
      const lastMessage = messagesRef.current.lastElementChild
      if (lastMessage) {
        lastMessage.scrollIntoView({ behavior: "instant" })
      }
    }
  }, [isOpen, messages.length])

  return (
    <>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full shadow-2xl transition-all duration-300",
          "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:scale-110",
          "before:absolute before:inset-0 before:rounded-full before:bg-blue-500/20 before:animate-ping before:duration-2000",
          isOpen && "rotate-180 scale-95",
        )}
        size="icon"
      >
        {isOpen ? <X className="h-7 w-7" /> : <FileText className="h-7 w-7" />}
      </Button>

      {isOpen && isModalMode && <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" />}
      {isOpen && !isModalMode && <div className="fixed inset-0 z-30" />}

      {/* Chat Window */}
      {isOpen && (
        <div ref={chatRef}>
          <Card
            className={cn(
              "pt-0 pb-6 flex flex-col shadow-2xl border-2 border-blue-500/20 bg-card backdrop-blur-sm",
              isModalMode
                ? "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 w-[90vw] max-w-4xl h-[85vh]"
                : "fixed bottom-24 right-6 z-40 w-[420px] h-[650px]",
            )}
          >
            <div className="px-6 pb-5 pt-4 border-b border-blue-500/20 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 text-white rounded-t-xl" style={{ minHeight: 'fit-content' }}>
              <div className="flex items-center justify-between" style={{ contain: 'layout style' }}>
                <div className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  <h3 className="font-semibold text-lg">Newfront Contract AI</h3>
                </div>
                <div className="flex items-center gap-2 relative" style={{ contain: 'layout', transform: 'translateZ(0)' }}>
                  <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 min-w-8 min-h-8 hover:bg-white/10 text-white focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus:outline-none data-[state=open]:bg-white/10"
                        style={{ willChange: 'auto', transform: 'translateZ(0)' }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="w-64" 
                      onCloseAutoFocus={(e) => e.preventDefault()}
                      style={{ 
                        willChange: 'transform',
                        transform: 'translateZ(0)',
                        backfaceVisibility: 'hidden',
                        animation: 'none'
                      }}
                    >
                      <DropdownMenuLabel>Select AI Model</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {AI_MODELS.map((model) => (
                        <DropdownMenuItem
                          key={model.id}
                          onSelect={() => {
                            setSelectedModel(model.id || undefined)
                          }}
                          className={cn(
                            "cursor-pointer",
                            selectedModel === model.id && "bg-blue-600 text-white"
                          )}
                        >
                          <div className="flex flex-col">
                            <span className={cn("font-medium", selectedModel === model.id && "text-white")}>
                              {model.name}
                            </span>
                            <span className={cn("text-xs text-muted-foreground", selectedModel === model.id && "text-white/80")}>
                              {model.provider} {model.cost && `• ${model.cost}`}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsModalMode(!isModalMode)}
                    className="h-8 w-8 hover:bg-white/10 text-white"
                  >
                    {isModalMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <p className="text-sm opacity-90">Your AI-powered contract management assistant</p>
                <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                  <SelectTrigger className="h-7 w-32 text-xs bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERSONAS.map((persona) => (
                      <SelectItem key={persona.id} value={persona.id}>
                        {persona.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Messages */}
            <div ref={messagesRef} className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth bg-card">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-4">
                    <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-base font-medium text-foreground mb-2">Welcome to Newfront Contract Management</p>
                  <p className="text-sm text-muted-foreground mb-4">Your AI-powered contract drafting and review assistant</p>
                  <div className="grid gap-2 text-left max-w-xs mx-auto">
                    <div className="flex items-start gap-2 text-sm text-foreground">
                      <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                      <span>Draft contracts from approved templates</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-foreground">
                      <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                      <span>Validate clauses and check compliance</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-foreground">
                      <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                      <span>Generate redlines with reason codes</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-foreground">
                      <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                      <span>Route approvals by persona (requester/manager/legal)</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-foreground">
                      <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                      <span>Track costs and latency per step</span>
                    </div>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id} className={cn("flex flex-col gap-2", message.role === "user" ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                      message.role === "user"
                        ? "bg-blue-600 text-white rounded-br-sm dark:bg-blue-500"
                        : "bg-card border border-border rounded-bl-sm text-card-foreground",
                    )}
                  >
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="leading-relaxed my-2 first:mt-0 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="my-2 list-disc list-inside">{children}</ul>,
                        ol: ({ children }) => <ol className="my-2 list-decimal list-inside">{children}</ol>,
                        li: ({ children }) => <li className="my-0.5">{children}</li>,
                        h1: ({ children }) => <h1 className="text-base font-bold my-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-sm font-semibold my-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-medium my-1">{children}</h3>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        code: ({ children }) => (
                          <code className="text-xs bg-muted px-1 py-0.5 rounded text-foreground">{children}</code>
                        ),
                      }}
                    >
                      {message.parts.map((part) => (part.type === "text" ? part.text : "")).join("")}
                    </ReactMarkdown>
                  </div>
                  
                  {/* Render tool invocations inline with assistant messages */}
                  {/* This shows tool calls (like contractDraft) with their approval UI */}
                  {message.role === "assistant" &&
                    message.parts
                      ?.filter((p: any) => p.type?.startsWith('tool-'))
                      .map((part: any, i: number) => {
                        const toolName = part.type.replace('tool-', '')
                        const invocation = {
                          id: part.toolCallId || `tool-${i}`,
                          name: toolName,
                          input: part.input || {},
                          state: part.state || 'partial',
                          approval: part.approval,
                          output: part.output,
                        }
                        
                        // Render contractDraft tool with custom approval UI
                        if (toolName === 'contractDraft') {
                          return (
                            <ContractDraftToolView
                              key={invocation.id}
                              invocation={invocation}
                              addToolApprovalResponse={addToolApprovalResponse}
                            />
                          )
                        }
                        return null
                      })}
                </div>
              ))}

              {(() => {
                const lastMessage = messages[messages.length - 1];
                const isAssistantWithoutContent = lastMessage?.role === "assistant" && 
                  (!lastMessage.parts || 
                   lastMessage.parts.filter((p: any) => p.type === "text" && p.text?.trim()).length === 0);
                
                const shouldShowLoader = status === "submitted" || isAssistantWithoutContent;
                
                return shouldShowLoader ? (
                  <div className="flex justify-start">
                    <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                      <ThinkingLoader />
                    </div>
                  </div>
                ) : null;
              })()}
            </div>

            <form onSubmit={handleSubmit} className="px-4 pt-4 border-t border-border bg-card">
              <div className="flex space-x-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Draft a contract, validate clauses, review terms..."
                  className="flex-1 rounded-xl bg-background border-border focus-visible:ring-blue-500 text-foreground placeholder:text-muted-foreground"
                  autoComplete="off"
                  disabled={status === "submitted"}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={status === "submitted" || !input.trim()}
                  className="rounded-xl h-10 w-10 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  )
}
