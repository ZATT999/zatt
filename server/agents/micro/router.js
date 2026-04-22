// Single job: classify user intent in one fast non-streaming call.
// Runs on the smallest available model — result is JSON only.
export class RouterAgent {
  #ollama
  #model

  constructor({ ollama, model }) {
    this.#ollama = ollama
    this.#model = model
  }

  async classify(userMessage) {
    try {
      const { message } = await this.#ollama.chat({
        model: this.#model,
        format: 'json',
        stream: false,
        think: false,
        options: { num_predict: 64, temperature: 0 },
        messages: [
          {
            role: 'system',
            content: `Classify the user request. Return ONLY valid JSON: {"intent":"code|shell|file|vision|chat|mixed","complexity":"simple|complex"}

intent rules (pick ONE):
- code: write/edit/fix/explain code, programming questions, scripts
- shell: run commands, install packages, start/stop services, system operations
- file: read/search/list/open file contents (no execution needed)
- vision: analyze images (only when images are attached)
- mixed: task requires BOTH writing code AND running it, or combines multiple intents
- chat: general questions, explanations, conversation, no system operations needed

complexity rules:
- simple: one clear action
- complex: multiple sequential steps needed`,
          },
          { role: 'user', content: userMessage.slice(0, 400) },
        ],
      })
      const parsed = JSON.parse(message.content)
      const validIntents = ['code', 'shell', 'file', 'vision', 'chat', 'mixed']
      if (!validIntents.includes(parsed.intent)) parsed.intent = 'chat'
      if (!['simple', 'complex'].includes(parsed.complexity)) parsed.complexity = 'simple'
      return parsed
    } catch {
      return { intent: 'chat', complexity: 'simple' }
    }
  }
}
