import { useEffect, useRef } from 'react'
import { useChatStore } from '../store/index.js'
import Message from './Message.jsx'

export default function ChatWindow() {
  const { messages } = useChatStore()
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 relative z-10">
      <div className="max-w-4xl mx-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-24">
            <div className="w-20 h-20 rounded-full bg-red-950 border border-red-800 flex items-center justify-center mb-6 red-glow">
              <span className="text-red-400 text-3xl font-black text-glow">Z</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1 tracking-widest">ZATT</h2>
            <p className="text-red-600 text-xs tracking-[0.3em] mb-6 uppercase">OS Agent</p>
            <p className="text-gray-600 text-sm max-w-sm leading-relaxed">
              Control total sobre el sistema. Creá carpetas, ejecutá comandos,
              leé y escribí archivos.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 text-xs text-gray-500 max-w-sm">
              {[
                'Creá una carpeta proyectos en mi home',
                'Listá los procesos corriendo',
                'Instalá neovim con pacman',
                'Creá un script bash de backup',
              ].map((text, i) => (
                <div
                  key={i}
                  className="glass rounded-lg p-3 text-left hover:border-red-800 transition-all cursor-default"
                >
                  <span className="text-red-700 mr-1">›</span>
                  {text}
                </div>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => <Message key={i} message={msg} isLast={i === messages.length - 1} />)
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
