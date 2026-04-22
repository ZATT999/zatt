import { useState, useRef } from 'react'
import { useChatStore } from '../store/index.js'

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export default function InputBar() {
  const [input, setInput] = useState('')
  const fileRef = useRef(null)
  const { sendMessage, addAttachments, removeAttachment, attachments, isLoading, isUploading } = useChatStore()

  const submit = () => {
    const text = input.trim()
    if ((!text && attachments.length === 0) || isLoading) return
    setInput('')
    sendMessage(text)
  }

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const onFiles = (e) => {
    if (e.target.files?.length) {
      addAttachments(e.target.files)
      e.target.value = ''
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files?.length) addAttachments(e.dataTransfer.files)
  }

  return (
    <div
      className="glass-dark border-t-0 p-4 relative z-10"
      onDragOver={e => e.preventDefault()}
      onDrop={onDrop}
    >
      {attachments.length > 0 && (
        <div className="max-w-4xl mx-auto mb-3 flex flex-wrap gap-2">
          {attachments.map(f => (
            <div
              key={f.path}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
              style={{ background: 'rgba(15,0,0,0.7)', border: '1px solid rgba(220,38,38,0.25)' }}
            >
              <span className="text-red-600">◈</span>
              <span className="text-gray-300 max-w-[120px] truncate">{f.name}</span>
              <span className="text-gray-600">{formatSize(f.size)}</span>
              <button
                onClick={() => removeAttachment(f.path)}
                className="text-gray-700 hover:text-red-500 transition-colors ml-1"
              >
                ✕
              </button>
            </div>
          ))}
          {isUploading && (
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600">
              <span className="animate-spin text-red-800">⟳</span>
              subiendo...
            </div>
          )}
        </div>
      )}

      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        <input ref={fileRef} type="file" multiple className="hidden" onChange={onFiles} />

        <button
          onClick={() => fileRef.current?.click()}
          disabled={isLoading}
          title="Adjuntar archivos"
          className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all text-gray-600 hover:text-red-400 hover:bg-red-950 hover:bg-opacity-30 border border-transparent hover:border-red-900 disabled:opacity-40"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder={attachments.length ? 'Añadí un mensaje o enviá los archivos...' : 'Ejecutá comandos, creá archivos, administrá el sistema...'}
          rows={1}
          className="flex-1 glass text-gray-100 placeholder-gray-700 rounded-xl px-4 py-3 text-sm resize-none outline-none focus:border-red-700 transition-all max-h-32 overflow-y-auto"
          style={{ minHeight: '48px' }}
          onInput={e => {
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
          }}
          disabled={isLoading}
        />

        <button
          onClick={submit}
          disabled={isLoading || isUploading || (!input.trim() && attachments.length === 0)}
          className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            isLoading || isUploading || (!input.trim() && attachments.length === 0)
              ? 'bg-gray-900 border border-gray-800 text-gray-700 cursor-not-allowed'
              : 'bg-red-700 hover:bg-red-600 border border-red-500 text-white red-glow hover:scale-105'
          }`}
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-red-700 border-t-red-400 rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
