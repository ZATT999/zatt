/**
 * Skills registry.
 * Skills = predefined multi-step sequences that the agent can call by name.
 *
 * Usage (future):
 *   skillRegistry.register({
 *     name: 'setup_node_project',
 *     description: 'Initializes a Node.js project with best practices',
 *     steps: ['create_directory', 'execute_command:npm init', ...],
 *     execute: async (args, runner) => { ... }
 *   })
 */
class SkillRegistry {
  #skills = new Map()

  register(skill) {
    this.#skills.set(skill.name, skill)
    console.log(`  [skills] registered: ${skill.name}`)
  }

  get(name) {
    return this.#skills.get(name)
  }

  get list() {
    return [...this.#skills.values()].map(({ name, description }) => ({ name, description }))
  }

  // Exposes skills as tools so the agent can invoke them
  get asTools() {
    return [...this.#skills.values()].map(s => ({
      type: 'function',
      function: {
        name: `skill_${s.name}`,
        description: s.description,
        parameters: s.parameters ?? { type: 'object', properties: {} },
      },
    }))
  }
}

export const skillRegistry = new SkillRegistry()
