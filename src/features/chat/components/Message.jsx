import ToolCall from '../../tools/components/ToolCall.jsx'
import ThinkingIndicator from './ThinkingIndicator.jsx'
import { useChatStore } from '../store/index.js'

export default function Message({ message, isLast }) {
  const isUser = message.role === 'user'
  const { isStreaming, isLoading, isConnected } = useChatStore()
  const showCursor = isLast && !isUser && isStreaming && message.content
  const showThinking = isLast && !isUser && isLoading && !isStreaming && !message.content

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-5`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-red-950 border border-red-800 flex items-center justify-center text-xs font-bold text-red-400 shrink-0 mr-3 mt-1 red-glow">
          Z
        </div>
      )}

      <div className={`${isUser ? 'max-w-[70%]' : 'flex-1 max-w-[85%]'}`}>
        {!isUser && message.toolEvents?.length > 0 && (
          <ToolCall events={message.toolEvents} />
        )}

        {showThinking && <ThinkingIndicator connected={isConnected} />}

        {(message.content || isUser) && (
          <div
            className={`rounded-2xl px-4 py-3 mt-1 text-sm leading-relaxed whitespace-pre-wrap break-words ${
              isUser
                ? 'bg-red-950 border border-red-800 text-gray-100 rounded-br-none ml-auto'
                : 'glass text-gray-200 rounded-bl-none'
            } ${showCursor ? 'cursor-blink' : ''}`}
          >
            {message.content}
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-full bg-gray-900 border border-gray-700 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0 ml-3 mt-1">
          U
        </div>
      )}
    </div>
  )
}
