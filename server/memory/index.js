import { db } from './db.js'
import { Ollama } from 'ollama'
import { config } from '../config/index.js'

const ollama = new Ollama({ host: config.ollama.host })

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

async function embed(text) {
  try {
    const { embedding } = await ollama.embeddings({
      model: config.ollama.embedModel,
      prompt: text,
    })
    return embedding
  } catch {
    return null
  }
}

export async function save(content, type = 'fact') {
  const embedding = await embed(content)
  return db
    .prepare('INSERT INTO memories (content, embedding, type) VALUES (?, ?, ?)')
    .run(content, embedding ? JSON.stringify(embedding) : null, type)
}

export async function recall(query, limit = 5) {
  // Cap at 200 candidates — cosine sort in JS is O(n), keeps it bounded as DB grows
  const rows = db.prepare('SELECT * FROM memories ORDER BY created_at DESC LIMIT 200').all()
  if (!rows.length) return []

  const queryEmbed = await embed(query)

  let picked
  if (queryEmbed) {
    picked = rows
      .filter(r => r.embedding)
      .map(r => ({ ...r, score: cosineSimilarity(queryEmbed, JSON.parse(r.embedding)) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  } else {
    picked = rows.slice(0, limit)
  }

  const now = new Date().toISOString()
  const upd = db.prepare('UPDATE memories SET accessed_at = ?, access_count = access_count + 1 WHERE id = ?')
  for (const m of picked) upd.run(now, m.id)

  return picked
}

const TRIVIAL_RE = /^(hola|gracias|ok|sí|no|dale|listo|perfecto|bien|bueno|okay|thanks|hi|hello|sure|👍|👋)[\s!?.]*$/i

// Fire-and-forget: extract key facts from conversation and store them.
// Uses config.ollama.extractModel — set EXTRACT_MODEL env var to a small/fast model (e.g. qwen2.5:1.5b).
export async function extractAndSave(messages) {
  const lastUser = [...messages].reverse().find(m => m.role === 'user')?.content ?? ''
  if (TRIVIAL_RE.test(lastUser.trim())) return // skip trivial exchanges

  const snippet = messages
    .slice(-6)
    .map(m => `${m.role}: ${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`)
    .join('\n')

  try {
    const { message } = await ollama.chat({
      model: config.ollama.extractModel, // small fast model, not the main one
      messages: [{
        role: 'user',
        content: `Del siguiente fragmento de conversación, extraé máximo 2 hechos concretos que valga la pena recordar (preferencias, configuraciones, decisiones técnicas). Respondé SOLO con los hechos, uno por línea. Si no hay nada importante, respondé "NADA".\n\n${snippet}`,
      }],
    })

    const text = message.content.trim()
    if (!text || text.toUpperCase().startsWith('NADA')) return

    const facts = text.split('\n').filter(Boolean).slice(0, 2)
    for (const fact of facts) await save(fact, 'fact')
  } catch {
    // non-critical
  }
}

export function list() {
  return db
    .prepare('SELECT id, content, type, created_at, access_count FROM memories ORDER BY created_at DESC')
    .all()
}

export function remove(id) {
  return db.prepare('DELETE FROM memories WHERE id = ?').run(id)
}
