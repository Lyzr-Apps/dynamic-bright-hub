import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Plus, Loader2, AlertCircle } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const SUGGESTED_PROMPTS = [
  'What can you help me with?',
  'Tell me something interesting',
  'How does artificial intelligence work?',
  'What are some productivity tips?'
]

const AGENT_ID = '69397792e6ce9b78c38a0594'

export default function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [messages])

  const sendMessage = async (text: string = input) => {
    if (!text.trim() || loading) return

    setError(null)
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Build conversation history for context
      const conversationContext = messages
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n')

      const messageWithContext = conversationContext
        ? `${conversationContext}\nUser: ${text.trim()}`
        : text.trim()

      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageWithContext,
          agent_id: AGENT_ID
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response')
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to process message')
      }

      // Extract response with multiple fallback strategies
      const assistantResponse = data.response?.result
        ?? data.response?.response
        ?? data.response?.message
        ?? (typeof data.response === 'string' ? data.response : null)
        ?? data.raw_response
        ?? 'I apologize, but I could not generate a response.'

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)

      // Remove the user message if there was an error
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setInput('')
    setError(null)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt)
    setTimeout(() => sendMessage(prompt), 0)
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Chat Assistant</h1>
            <p className="text-sm text-slate-500 mt-1">
              {isEmpty ? 'Start a conversation' : `${messages.length} message${messages.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          {!isEmpty && (
            <Button
              onClick={handleNewChat}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {isEmpty && (
            <div className="flex flex-col items-center justify-center min-h-[500px] text-center">
              <div className="mb-8">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to Chat Assistant</h2>
                <p className="text-slate-600 mb-8 max-w-md">
                  Ask me anything and I'll do my best to help. I can remember our conversation history to provide better responses.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestedPrompt(prompt)}
                    className="p-4 text-left rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-slate-700 hover:text-slate-900 font-medium"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isEmpty && (
            <div className="space-y-6 pb-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex flex-col max-w-2xl ${
                      message.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`px-4 py-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                    <span className="text-xs text-slate-500 mt-1.5">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="flex flex-col items-start">
                    <div className="px-4 py-3 rounded-lg bg-white border border-slate-200 rounded-bl-none shadow-sm">
                      <div className="flex gap-2 items-center">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                        <span className="text-xs text-slate-500">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex justify-center">
                  <Card className="bg-red-50 border border-red-200 px-4 py-3 max-w-2xl">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-red-900 text-sm">Error</p>
                        <p className="text-red-800 text-sm mt-1">{error}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setError(null)}
                          className="mt-3 h-8"
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              <div ref={scrollRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex gap-3">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={loading}
              className="flex-1 text-base border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              size="lg"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}
