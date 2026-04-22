import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { mkdirSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '../../data')
mkdirSync(DATA_DIR, { recursive: true })

export const db = new Database(join(DATA_DIR, 'zatt.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS memories (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT    NOT NULL,
    embedding TEXT,
    type    TEXT    DEFAULT 'fact',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    accessed_at DATETIME,
    access_count INTEGER DEFAULT 0
  )
`)
