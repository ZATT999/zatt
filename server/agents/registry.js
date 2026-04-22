import { CoderAgent } from './specialists/coder.js'
import { VisionAgent } from './specialists/vision.js'
import { ToolsExecutorAgent } from './specialists/tools_executor.js'

const AGENT_CLASSES = {
  coder: CoderAgent,
  vision: VisionAgent,
  tools: ToolsExecutorAgent,
}

export class AgentRegistry {
  #classes = new Map(Object.entries(AGENT_CLASSES))

  create(type, opts) {
    const Cls = this.#classes.get(type)
    if (!Cls) throw new Error(`Unknown agent type: ${type}`)
    return new Cls(opts)
  }

  get types() {
    return [...this.#classes.keys()]
  }

  register(type, AgentClass) {
    this.#classes.set(type, AgentClass)
  }
}

export const agentRegistry = new AgentRegistry()
