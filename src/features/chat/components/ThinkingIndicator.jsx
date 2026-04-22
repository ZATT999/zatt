import { useState, useEffect } from 'react'

const PHRASES_CONNECTING = ['Enviando...', 'Conectando...']
const PHRASES_THINKING = [
  'Generando respuesta...',
  'Pensando...',
  'Analizando el pedido...',
  'Procesando...',
  'Razonando...',
  'Preparando respuesta...',
]

export default function ThinkingIndicator({ connected = false }) {
  const PHRASES = connected ? PHRASES_THINKING : PHRASES_CONNECTING
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex(i => (i + 1) % PHRASES.length)
        setVisible(true)
      }, 200)
    }, 1800)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="glass rounded-2xl rounded-bl-none px-4 py-3 mt-1 flex items-center gap-3">
      <div className="flex gap-1 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-red-700 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-red-800 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span
        key={index}
        className="text-xs text-gray-500 tracking-wider thinking-text"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.15s ease' }}
      >
        {PHRASES[index]}
      </span>
    </div>
  )
}
