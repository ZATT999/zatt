import { useState } from 'react'

const toolIcons = {
  execute_command: '▶',
  create_directory: '◈',
  read_file: '◎',
  write_file: '◉',
  list_directory: '≡',
}

const agentMeta = {
  coder:  { label: 'Coder Agent',  color: '#60a5fa', icon: '⌨' },
  vision: { label: 'Vision Agent', color: '#a78bfa', icon: '◉' },
  tools:  { label: 'Tools Agent',  color: '#f87171', icon: '⚙' },
}

function AgentCard({ event }) {
  const [open, setOpen] = useState(false)
  const meta = agentMeta[event.agent] ?? { label: event.agent, color: '#6b7280', icon: '◆' }
  const done = event.type === 'agent_done'

  return (
    <div
      className="rounded-lg overflow-hidden text-xs mb-1.5"
      style={{ background: 'rgba(5,5,20,0.7)', border: `1px solid ${meta.color}22` }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-white hover:bg-opacity-5"
      >
        <span style={{ color: meta.color }}>{meta.icon}</span>
        <span className="font-mono tracking-wider" style={{ color: meta.color }}>{meta.label}</span>
        {event.model && (
          <span className="text-gray-700 text-xs ml-1">({event.model})</span>
        )}
        <span className="text-gray-700 truncate flex-1 ml-2">{event.task}</span>
        {!done && (
          <span className="animate-spin text-xs ml-auto" style={{ color: meta.color }}>⟳</span>
        )}
        {done && (
          <span className="text-xs ml-auto text-gray-700">{open ? '▲' : '▼'}</span>
        )}
      </button>

      {/* Live streaming output */}
      {!done && event.streaming && (
        <div className="px-3 pb-2 border-t" style={{ borderColor: `${meta.color}15` }}>
          <pre className="text-gray-500 whitespace-pre-wrap font-mono text-xs max-h-32 overflow-y-auto mt-1">
            {event.streaming}
          </pre>
        </div>
      )}

      {/* Final result */}
      {done && open && (
        <div className="px-3 pb-2 border-t" style={{ borderColor: `${meta.color}15` }}>
          <pre className="text-gray-400 whitespace-pre-wrap font-mono text-xs max-h-48 overflow-y-auto mt-1">
            {event.result}
          </pre>
        </div>
      )}
    </div>
  )
}

function ToolPair({ call, result, idx, expanded, toggle }) {
  return (
    <div
      className="rounded-lg overflow-hidden text-xs mb-1.5"
      style={{ background: 'rgba(15,0,0,0.6)', border: '1px solid rgba(220,38,38,0.2)' }}
    >
      <button
        onClick={() => toggle(idx)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-red-950 hover:bg-opacity-20"
      >
        <span className="text-red-600 w-4 shrink-0">{toolIcons[call.name] ?? '◆'}</span>
        {call.agent && (
          <span className="text-gray-700 text-xs">[{call.agent}]</span>
        )}
        <span className="text-red-400 font-mono tracking-wider">{call.name}</span>
        <span className="text-gray-600 truncate flex-1 ml-1">
          {call.args?.command || call.args?.path || JSON.stringify(call.args)}
        </span>
        {result && <span className="text-gray-700 ml-auto shrink-0">{expanded ? '▲' : '▼'}</span>}
      </button>

      {expanded && result && (
        <div className="border-t px-3 py-2" style={{ borderColor: 'rgba(220,38,38,0.15)', background: 'rgba(5,0,0,0.8)' }}>
          <p className="text-red-900 mb-1 text-xs tracking-wider uppercase">Output</p>
          <pre className="text-gray-400 whitespace-pre-wrap font-mono text-xs max-h-48 overflow-y-auto">
            {result.result}
          </pre>
        </div>
      )}

      {!result && (
        <div className="px-3 py-1.5 flex items-center gap-2 text-gray-700">
          <span className="animate-spin text-red-800">⟳</span>
          <span className="text-xs tracking-wider">ejecutando...</span>
        </div>
      )}
    </div>
  )
}

export default function ToolCall({ events }) {
  const [expanded, setExpanded] = useState({})
  const toggle = (i) => setExpanded(e => ({ ...e, [i]: !e[i] }))

  // Separate agent events from tool call pairs
  const rendered = []
  let i = 0

  while (i < events.length) {
    const ev = events[i]

    if (ev.type === 'agent_start' || ev.type === 'agent_done') {
      rendered.push(<AgentCard key={i} event={ev} />)
      i++
      continue
    }

    if (ev.type === 'call') {
      const result = events[i + 1]?.type === 'result' ? events[i + 1] : null
      rendered.push(
        <ToolPair
          key={i}
          call={ev}
          result={result}
          idx={i}
          expanded={!!expanded[i]}
          toggle={toggle}
        />
      )
      i += result ? 2 : 1
      continue
    }

    i++
  }

  return <div className="mt-2 mb-2">{rendered}</div>
}
