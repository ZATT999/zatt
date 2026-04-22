// Maps model name patterns to their capabilities
// Add entries here as you pull new models
const CAPABILITY_MAP = [
  { pattern: /llava|bakllava|moondream|minicpm-v|qwen.*vl|llama.*vision/i, caps: ['vision', 'chat'] },
  { pattern: /deepseek-coder|qwen.*coder|codellama|starcoder|magicoder|codegemma/i, caps: ['code', 'tools', 'chat'] },
  { pattern: /qwen3|qwen2\.5|llama3\.[12]|mistral|gemma|phi/i, caps: ['chat', 'tools', 'code'] },
  { pattern: /minimax|gpt-oss|kimi/i, caps: ['chat', 'tools', 'code', 'vision'] },
]

const DEFAULT_CAPS = ['chat']

export function getCapabilities(modelName) {
  for (const { pattern, caps } of CAPABILITY_MAP) {
    if (pattern.test(modelName)) return caps
  }
  return DEFAULT_CAPS
}

export function hasCapability(modelName, cap) {
  return getCapabilities(modelName).includes(cap)
}

// Embedding models can't do chat — always exclude them from chat/tool selection
const EMBED_RE = /embed|nomic|bge|e5-|gte-|all-minilm/i

function chatModels(models) {
  const filtered = models.filter(m => !EMBED_RE.test(m))
  return filtered.length ? filtered : models
}

// Given a list of available models, find best one for a capability
export function bestModelFor(cap, availableModels) {
  const candidates = chatModels(availableModels)
  return candidates.find(m => hasCapability(m, cap)) ?? candidates[0]
}

// Returns the smallest chat-capable model by parameter size hint in the name.
// Used for micro-agents that need speed over intelligence (router, summarizer).
export function smallestModel(models) {
  const candidates = chatModels(models)
  const sizes = ['0.5b', '1b', '1.5b', '2b', '3b', '4b', '7b', '8b']
  for (const size of sizes) {
    const found = candidates.find(m => m.toLowerCase().includes(size))
    if (found) return found
  }
  return candidates[0]
}
