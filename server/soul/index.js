import { promises as fs } from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const execAsync = promisify(exec)
const __dir = dirname(fileURLToPath(import.meta.url))
const HEART_PATH = join(__dir, 'heart.json')

async function collectSystemInfo() {
  const run = async (cmd) => {
    try { return (await execAsync(cmd)).stdout.trim() } catch { return 'desconocido' }
  }

  const [hostname, user, os, kernel, shell, home, diskFree] = await Promise.all([
    run('hostname'),
    run('whoami'),
    run('cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2 | tr -d \'"\''),
    run('uname -r'),
    run('echo $SHELL'),
    run('echo $HOME'),
    run('df -h / | tail -1 | awk \'{print $4}\''),
  ])

  return { hostname, user, os, kernel, shell, home, diskFree }
}

async function loadHeart() {
  try {
    const raw = await fs.readFile(HEART_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export async function buildSoul() {
  const [sys, heart] = await Promise.all([collectSystemInfo(), loadHeart()])

  const lines = [
    '═══════════════════════════════',
    '  CORAZÓN Y ALMA DE ZATT',
    '═══════════════════════════════',
    '',
    '## Sistema',
    `- OS: ${sys.os}`,
    `- Kernel: ${sys.kernel}`,
    `- Host: ${sys.hostname}`,
    `- Usuario: ${sys.user}`,
    `- Home: ${sys.home}`,
    `- Shell: ${sys.shell}`,
    `- Disco libre (/): ${sys.diskFree}`,
    '',
  ]

  if (heart.usuario) {
    lines.push('## Usuario')
    for (const [k, v] of Object.entries(heart.usuario)) {
      lines.push(`- ${k}: ${v}`)
    }
    lines.push('')
  }

  if (heart.personalidad?.length) {
    lines.push('## Personalidad (cómo sos)')
    heart.personalidad.forEach(p => lines.push(`- ${p}`))
    lines.push('')
  }

  if (heart.reglas?.length) {
    lines.push('## Reglas absolutas')
    heart.reglas.forEach(r => lines.push(`- ${r}`))
    lines.push('')
  }

  if (heart.contexto_extra) {
    lines.push('## Contexto adicional')
    lines.push(heart.contexto_extra)
    lines.push('')
  }

  lines.push('═══════════════════════════════')

  return lines.join('\n')
}

let _cache = null
let _cacheAt = 0
const CACHE_TTL = 60_000 // 1 min — disk/OS info doesn't change mid-session

export async function getSoulPrompt() {
  const now = Date.now()
  if (!_cache || now - _cacheAt > CACHE_TTL) {
    _cache = await buildSoul()
    _cacheAt = now
  }
  return _cache
}

// Call this if heart.json is edited at runtime
export function invalidateSoulCache() {
  _cache = null
}
