import { config } from '../config/index.js'
import { agentRegistry } from './registry.js'
import { bestModelFor, smallestModel } from '../models/capabilities.js'
import { getSoulPrompt } from '../soul/index.js'
import { recall, extractAndSave } from '../memory/index.js'
import { RouterAgent } from './micro/router.js'
import { PlannerAgent } from './micro/planner.js'
import { CommandBuilderAgent } from './micro/command_builder.js'
import { SummarizerAgent } from './micro/summarizer.js'

export class Orchestrator {
  constructor({ ollama, tools, send, availableModels = [] }) {
    this.ollama = ollama
    this.tools = tools
    this.send = send
    this.availableModels = availableModels

    // Model selection for micro-agents
    const cfg = config.ollama
    const tiny = cfg.routerModel ?? smallestModel(availableModels)
    const planner = cfg.plannerModel ?? bestModelFor('chat', availableModels)
    const summ = cfg.summarizerModel ?? tiny

    this.router = new RouterAgent({ ollama, model: tiny })
    this.planner = new PlannerAgent({ ollama, model: planner })
    this.commandBuilder = new CommandBuilderAgent({ ollama, model: tiny })
    this.summarizer = new SummarizerAgent({ ollama, model: summ })
  }

  async run({ messages, orchestratorModel }) {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content ?? ''

    const [soul, memories] = await Promise.all([
      getSoulPrompt(),
      recall(lastUserMsg, 5),
    ])

    const memBlock = memories.length
      ? `\n\nRecordatorios de sesiones previas:\n${memories.map(m => `- ${m.content}`).join('\n')}`
      : ''

    // ── Step 1: Fast routing (tiny model, non-streaming, JSON) ────────────
    const route = await this.router.classify(lastUserMsg)
    this.send('route', { intent: route.intent, complexity: route.complexity })

    // ── Step 2: Dispatch to the right pipeline ────────────────────────────
    switch (route.intent) {
      case 'vision':
        return this.#pipelineVision(lastUserMsg, messages)

      case 'code':
        return this.#pipelineCode(lastUserMsg, messages, orchestratorModel)

      case 'shell':
        return this.#pipelineShell(route, lastUserMsg, messages, orchestratorModel, soul, memBlock)

      case 'file':
      case 'mixed':
        // file and mixed tasks need full tool access + LLM reasoning → ToolsExecutorAgent
        return this.#pipelineTools(lastUserMsg, messages, orchestratorModel, soul, memBlock)

      default: // 'chat'
        return this.#pipelineChat(messages, orchestratorModel, soul, memBlock)
    }
  }

  // ── CHAT: direct streaming response, no tools ─────────────────────────────
  async #pipelineChat(messages, model, soul, memBlock) {
    const history = [
      { role: 'system', content: `${soul}\n\n${config.systemPrompt}${memBlock}` },
      ...messages,
    ]

    const stream = await this.ollama.chat({
      model,
      messages: history,
      stream: true,
      think: false,
    })

    for await (const chunk of stream) {
      if (chunk.message.content) this.send('token', { content: chunk.message.content })
    }

    extractAndSave(messages).catch(() => {})
  }

  // ── CODE: focused code-writing agent, streams directly ───────────────────
  async #pipelineCode(task, messages, mainModel) {
    const codeModel = bestModelFor('code', this.availableModels)
    const agent = agentRegistry.create('coder', {
      ollama: this.ollama,
      tools: this.tools,
      send: this.send,
    })
    await agent.run({ task, context: messages.slice(-4), model: codeModel })
    extractAndSave(messages).catch(() => {})
  }

  // ── VISION: image analysis agent ─────────────────────────────────────────
  async #pipelineVision(task, messages) {
    const visionModel = bestModelFor('vision', this.availableModels)
    const agent = agentRegistry.create('vision', {
      ollama: this.ollama,
      tools: this.tools,
      send: this.send,
    })
    const imagePaths = this.#extractImagePaths(messages)
    await agent.run({ task, context: messages.slice(-4), model: visionModel, imagePaths })
  }

  // ── SHELL: CommandBuilder pipeline ───────────────────────────────────────
  // Simple:  CommandBuilder → execute → [Summarize] → Responder
  // Complex: Planner → [CommandBuilder → execute → Summarize] × N → Responder
  async #pipelineShell(route, task, messages, mainModel, soul, memBlock) {
    let steps

    if (route.complexity === 'complex') {
      steps = await this.planner.plan(task, 'shell')
      this.send('plan', { steps })
    } else {
      steps = [{ id: 1, description: task, type: 'shell' }]
    }

    const results = []

    for (const step of steps) {
      // Build the command (previous results passed as context)
      const prevContext = results.map(r => `${r.step}: ${r.summary}`).join('\n')
      const { command, cwd } = await this.commandBuilder.build(step.description, prevContext)

      // Execute
      this.send('tool_call', { agent: 'shell-pipeline', name: 'execute_command', args: { command, cwd } })
      const rawOutput = await this.tools.execute('execute_command', { command, cwd })
      this.send('tool_result', { agent: 'shell-pipeline', name: 'execute_command', result: rawOutput })

      // Compress long output before feeding it to the next step or final responder
      const summary = await this.summarizer.summarize(rawOutput)
      results.push({ step: step.description, command, summary })
    }

    // Final synthesis — main model streams the response
    await this.#respond(task, results, messages, mainModel, soul, memBlock)
    extractAndSave(messages).catch(() => {})
  }

  // ── FILE / MIXED: full tool access via ToolsExecutorAgent ─────────────────
  async #pipelineTools(task, messages, mainModel, soul, memBlock) {
    const toolsModel = bestModelFor('tools', this.availableModels)
    const agent = agentRegistry.create('tools', {
      ollama: this.ollama,
      tools: this.tools,
      send: this.send,
    })
    await agent.run({ task, context: messages.slice(-4), model: toolsModel })
    extractAndSave(messages).catch(() => {})
  }

  // ── RESPONDER: synthesize shell pipeline results into a final answer ──────
  async #respond(task, results, messages, model, soul, memBlock) {
    const resultsText = results
      .map((r, i) => `Paso ${i + 1}: ${r.step}\nComando: ${r.command}\nResultado: ${r.summary}`)
      .join('\n\n')

    const history = [
      {
        role: 'system',
        content: `${soul}\n\n${config.systemPrompt}${memBlock}

Los comandos ya fueron ejecutados. Reportá los resultados al usuario de forma clara y concisa.
No repitas los comandos a menos que sea relevante. Enfocate en qué pasó y qué significa.`,
      },
      ...messages.slice(-4),
      { role: 'user', content: `Tarea original: ${task}\n\nResultados:\n${resultsText}` },
    ]

    const stream = await this.ollama.chat({ model, messages: history, stream: true, think: false })
    for await (const chunk of stream) {
      if (chunk.message.content) this.send('token', { content: chunk.message.content })
    }
  }

  #extractImagePaths(messages) {
    const paths = []
    for (const msg of messages) {
      if (msg.attachments) {
        paths.push(...msg.attachments.filter(a => /image/i.test(a.mime)).map(a => a.path))
      }
    }
    return paths
  }
}
