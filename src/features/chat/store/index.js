import { create } from 'zustand'
import { useModelStore } from './modelStore.js'

const parseSSE = async (response, handlers) => {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let currentEvent = 'message'

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7).trim()
      } else if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6))
          handlers[currentEvent]?.(data)
        } catch {}
        currentEvent = 'message'
      }
    }
  }
}

export const useChatStore = create((set, get) => ({
  messages: [],
  attachments: [],   // files staged before sending
  isLoading: false,
  isStreaming: false,
  isConnected: false, // server acknowledged, waiting for first token
  isUploading: false,
  error: null,

  addAttachments: async (fileList) => {
    set({ isUploading: true })
    try {
      const form = new FormData()
      for (const file of fileList) form.append('files', file)

      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const { files } = await res.json()

      set(state => ({ attachments: [...state.attachments, ...files] }))
    } catch (err) {
      set({ error: `Upload error: ${err.message}` })
    } finally {
      set({ isUploading: false })
    }
  },

  removeAttachment: (path) =>
    set(state => ({ attachments: state.attachments.filter(f => f.path !== path) })),

  sendMessage: async (content) => {
    const { messages, attachments } = get()
    const { model } = useModelStore.getState()

    // Build user message — include file context if any
    let fullContent = content
    if (attachments.length > 0) {
      const fileList = attachments.map(f => `- ${f.name} → ${f.path}`).join('\n')
      fullContent = `${content}\n\nArchivos adjuntos:\n${fileList}`
    }

    const userMsg = { role: 'user', content: fullContent, attachments }
    const assistantMsg = { role: 'assistant', content: '', toolEvents: [] }

    set({
      messages: [...messages, userMsg, assistantMsg],
      attachments: [],
      isLoading: true,
      isStreaming: false,
      error: null,
    })

    const historyForApi = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))

    const updateLast = (updater) =>
      set(state => {
        const msgs = [...state.messages]
        msgs[msgs.length - 1] = updater(msgs[msgs.length - 1])
        return { messages: msgs }
      })

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historyForApi, model }),
      })

      await parseSSE(response, {
        start: () => {
          // Server acknowledged — request is being processed
          set({ isConnected: true })
        },
        token: ({ content }) => {
          set({ isStreaming: true, isConnected: false })
          updateLast(msg => ({ ...msg, content: msg.content + content }))
        },
        tool_call: ({ agent, name, args }) => {
          updateLast(msg => ({ ...msg, toolEvents: [...msg.toolEvents, { type: 'call', agent, name, args }] }))
        },
        tool_result: ({ agent, name, result }) => {
          updateLast(msg => ({ ...msg, toolEvents: [...msg.toolEvents, { type: 'result', agent, name, result }] }))
        },
        agent_start: ({ agent, model, task }) => {
          updateLast(msg => ({ ...msg, toolEvents: [...msg.toolEvents, { type: 'agent_start', agent, model, task }] }))
        },
        agent_token: ({ agent, content }) => {
          updateLast(msg => ({ ...msg, toolEvents: [...msg.toolEvents.slice(0, -1),
            { ...msg.toolEvents.at(-1), streaming: (msg.toolEvents.at(-1)?.streaming ?? '') + content }
          ]}))
        },
        agent_end: ({ agent, result }) => {
          updateLast(msg => ({
            ...msg,
            toolEvents: msg.toolEvents.map(e =>
              e.type === 'agent_start' && e.agent === agent
                ? { ...e, type: 'agent_done', result, streaming: undefined }
                : e
            )
          }))
        },
        error: ({ message }) => {
          set({ error: message })
          updateLast(msg => ({ ...msg, content: `Error: ${message}` }))
        },
      })
    } catch (err) {
      set({ error: err.message })
      updateLast(msg => ({ ...msg, content: `Error de conexión: ${err.message}` }))
    } finally {
      set({ isLoading: false, isStreaming: false, isConnected: false })
    }
  },

  clearChat: () => set({ messages: [], attachments: [], error: null }),
}))
