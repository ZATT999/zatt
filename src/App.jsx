import { useEffect } from 'react'
import { useModelStore } from './features/chat/store/modelStore.js'
import { useChatStore } from './features/chat/store/index.js'
import ChatWindow from './features/chat/components/ChatWindow.jsx'
import InputBar from './features/chat/components/InputBar.jsx'

export default function App() {
  const { model, models, setModel, fetchModels } = useModelStore()
  const { clearChat } = useChatStore()

  useEffect(() => {
    fetchModels()
  }, [])

  return (
    <div className="flex flex-col h-screen bg-black text-gray-100 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-red-950 opacity-20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-red-900 opacity-10 rounded-full blur-[100px]" />
      </div>

      <header className="glass-dark flex items-center justify-between px-6 py-3 shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center red-glow">
            <span className="text-xs font-black">Z</span>
          </div>
          <div>
            <span className="text-red-400 font-bold text-base tracking-widest text-glow">ZATT</span>
            <span className="text-gray-600 text-xs ml-2 tracking-wider">OS AGENT</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={model}
            onChange={e => setModel(e.target.value)}
            className="glass text-gray-300 text-xs rounded-lg px-3 py-1.5 outline-none focus:border-red-500 transition-all cursor-pointer hover:border-red-700"
          >
            {models.length === 0 ? (
              <option value={model}>{model}</option>
            ) : (
              models.map(m => (
                <option key={m} value={m} className="bg-black">{m}</option>
              ))
            )}
          </select>

          <button
            onClick={clearChat}
            className="text-gray-600 hover:text-red-400 text-xs px-3 py-1.5 rounded-lg hover:bg-red-950 hover:bg-opacity-40 transition-all tracking-wider border border-transparent hover:border-red-900"
          >
            LIMPIAR
          </button>
        </div>
      </header>

      <ChatWindow />
      <InputBar />
    </div>
  )
}
