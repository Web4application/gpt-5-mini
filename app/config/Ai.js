export const defaultAIConfig = {
  model: "gpt-5-mini",
  input: [],
  preamble: "You are a helpful, precise assistant specialized in reasoning, coding, and web tasks.",
  role: "multi-purpose-agent",
  text: { format: { type: "text" }, verbosity: "high" },
  reasoning: { effort: "high", carryover: true },
  tools: [
    { type: "function", function: { name: "web-search" } },
    { type: "function", function: { name: "code-exec" } }
  ],
  allowed_tools: ["web-search", "code-exec", "sql", "python"],
  toolExplain: true,
  parallelTools: true,
  toolRuntime: "python",
  store: "encrypted",
  memory: { persist: true, scope: "session" },
  temperature: 0.7,
  maxTokens: 1000,
  contextSize: 400000,
  planning: { enabled: true, strategy: "TODO-first" },
  output: {
    type: "json",
    schema: {
      summary: "string",
      insights: ["string"],
      actions: ["string"]
    }
  },
  uiHints: { format: "Tailwind", icons: "Lucide" }
};
