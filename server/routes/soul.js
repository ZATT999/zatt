import { Router } from 'express'
import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { getSoulPrompt } from '../soul/index.js'

const __dir = dirname(fileURLToPath(import.meta.url))
const HEART_PATH = join(__dir, '../soul/heart.json')

export function soulRouter() {
  const router = Router()

  // GET current heart config
  router.get('/heart', async (req, res) => {
    try {
      const raw = await fs.readFile(HEART_PATH, 'utf-8')
      res.json(JSON.parse(raw))
    } catch {
      res.status(500).json({ error: 'No se pudo leer el corazón' })
    }
  })

  // PATCH update heart config
  const ALLOWED_KEYS = new Set(['usuario', 'personalidad', 'reglas', 'contexto_extra'])
  router.patch('/heart', async (req, res) => {
    const unknown = Object.keys(req.body).filter(k => !ALLOWED_KEYS.has(k))
    if (unknown.length) return res.status(400).json({ error: `Keys no permitidas: ${unknown.join(', ')}` })
    try {
      const current = JSON.parse(await fs.readFile(HEART_PATH, 'utf-8'))
      const updated = { ...current, ...req.body }
      await fs.writeFile(HEART_PATH, JSON.stringify(updated, null, 2))
      res.json({ ok: true })
    } catch {
      res.status(500).json({ error: 'No se pudo actualizar el corazón' })
    }
  })

  // GET compiled soul prompt (debug)
  router.get('/preview', async (req, res) => {
    const soul = await getSoulPrompt()
    res.type('text/plain').send(soul)
  })

  return router
}
