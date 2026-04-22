import { promises as fs } from 'fs'

export default {
  name: 'list_directory',
  description: 'Lista el contenido de una carpeta.',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Ruta de la carpeta a listar' },
    },
    required: ['path'],
  },
  async execute({ path }) {
    try {
      const entries = await fs.readdir(path, { withFileTypes: true })
      if (!entries.length) return '(directorio vacío)'
      return entries
        .map(e => `${e.isDirectory() ? '[dir]' : '[file]'} ${e.name}`)
        .join('\n')
    } catch (err) {
      return `ERROR: ${err.message}`
    }
  },
}
