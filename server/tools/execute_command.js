import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export default {
  name: 'execute_command',
  description: 'Ejecuta un comando en la terminal del sistema Linux.',
  parameters: {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'El comando shell a ejecutar' },
      cwd: { type: 'string', description: 'Directorio de trabajo (opcional)' },
    },
    required: ['command'],
  },
  async execute({ command, cwd }) {
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: cwd ?? process.env.HOME,
        timeout: 30000,
        shell: '/bin/bash',
      })
      return (stdout + stderr).trim() || '(sin salida)'
    } catch (err) {
      return `ERROR: ${err.message}`
    }
  },
}
