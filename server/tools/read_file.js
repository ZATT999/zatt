import { promises as fs } from 'fs'

export default {
  name: 'read_file',
  description: 'Lee y devuelve el contenido de un archivo del sistema.',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Ruta completa del archivo' },
    },
    required: ['path'],
  },
  async execute({ path }) {
    try {
      return await fs.readFile(path, 'utf-8')
    } catch (err) {
      return `ERROR: ${err.message}`
    }
  },
}
