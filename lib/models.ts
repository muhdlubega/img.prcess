export type ApiMode = "builtin" | "custom"

export type AiProviderId =
  | "mistral"
  | "openai"
  | "anthropic"
  | "google"
  | "xai"
  | "deepseek"

export interface ModelOption {
  id: string
  label: string
  description: string
  vision: boolean
  tier: "standard" | "premium"
}

export interface ProviderOption {
  id: AiProviderId
  label: string
  shortLabel: string
  description: string
  consoleUrl: string
  consoleLabel: string
  keyHint: string
  models: ModelOption[]
}

/** Built-in default used when the user does not supply their own key. */
export const BUILTIN_PROVIDER: AiProviderId = "mistral"
export const BUILTIN_MODEL = "pixtral-12b-2409"

export const AI_PROVIDERS: ProviderOption[] = [
  {
    id: "mistral",
    label: "Mistral",
    shortLabel: "Mistral",
    description: "Pixtral vision and Mistral text models",
    consoleUrl: "https://console.mistral.ai/",
    consoleLabel: "console.mistral.ai",
    keyHint: "Mistral API key",
    models: [
      {
        id: "pixtral-12b-2409",
        label: "Pixtral 12B",
        description: "Fast vision and OCR for documents.",
        vision: true,
        tier: "standard",
      },
      {
        id: "pixtral-large-latest",
        label: "Pixtral Large",
        description: "Stronger vision for dense pages.",
        vision: true,
        tier: "premium",
      },
      {
        id: "mistral-small-latest",
        label: "Mistral Small",
        description: "Fast text analysis for CSV work.",
        vision: false,
        tier: "standard",
      },
      {
        id: "mistral-medium-latest",
        label: "Mistral Medium",
        description: "Balanced quality for data questions.",
        vision: false,
        tier: "standard",
      },
      {
        id: "mistral-large-latest",
        label: "Mistral Large",
        description: "Deep reasoning for complex CSV analysis.",
        vision: false,
        tier: "premium",
      },
    ],
  },
  {
    id: "openai",
    label: "OpenAI",
    shortLabel: "OpenAI",
    description: "GPT-4o and GPT-4.1 with strong document vision",
    consoleUrl: "https://platform.openai.com/api-keys",
    consoleLabel: "platform.openai.com",
    keyHint: "OpenAI API key (sk-...)",
    models: [
      {
        id: "gpt-4o",
        label: "GPT-4o",
        description: "Reliable multimodal model for OCR and analysis.",
        vision: true,
        tier: "premium",
      },
      {
        id: "gpt-4o-mini",
        label: "GPT-4o mini",
        description: "Faster and cheaper multimodal option.",
        vision: true,
        tier: "standard",
      },
      {
        id: "gpt-4.1",
        label: "GPT-4.1",
        description: "Strong document understanding and reasoning.",
        vision: true,
        tier: "premium",
      },
      {
        id: "gpt-4.1-mini",
        label: "GPT-4.1 mini",
        description: "Efficient text and vision for most files.",
        vision: true,
        tier: "standard",
      },
    ],
  },
  {
    id: "anthropic",
    label: "Anthropic (Claude)",
    shortLabel: "Claude",
    description: "Claude models with excellent document reading",
    consoleUrl: "https://console.anthropic.com/",
    consoleLabel: "console.anthropic.com",
    keyHint: "Anthropic API key (sk-ant-...)",
    models: [
      {
        id: "claude-sonnet-4-20250514",
        label: "Claude Sonnet 4",
        description: "Strong default for documents and analysis.",
        vision: true,
        tier: "premium",
      },
      {
        id: "claude-3-5-haiku-latest",
        label: "Claude 3.5 Haiku",
        description: "Fast and economical for lighter jobs.",
        vision: true,
        tier: "standard",
      },
      {
        id: "claude-opus-4-20250514",
        label: "Claude Opus 4",
        description: "Highest quality for hard documents.",
        vision: true,
        tier: "premium",
      },
    ],
  },
  {
    id: "google",
    label: "Google (Gemini)",
    shortLabel: "Gemini",
    description: "Gemini vision models for OCR and CSV analysis",
    consoleUrl: "https://aistudio.google.com/apikey",
    consoleLabel: "aistudio.google.com",
    keyHint: "Google AI Studio API key",
    models: [
      {
        id: "gemini-2.0-flash",
        label: "Gemini 2.0 Flash",
        description: "Fast multimodal model for documents.",
        vision: true,
        tier: "standard",
      },
      {
        id: "gemini-2.5-flash",
        label: "Gemini 2.5 Flash",
        description: "Updated Flash with strong document handling.",
        vision: true,
        tier: "standard",
      },
      {
        id: "gemini-2.5-pro",
        label: "Gemini 2.5 Pro",
        description: "Higher quality reasoning for complex files.",
        vision: true,
        tier: "premium",
      },
    ],
  },
  {
    id: "xai",
    label: "xAI (Grok)",
    shortLabel: "Grok",
    description: "Grok models with vision and analysis",
    consoleUrl: "https://console.x.ai/",
    consoleLabel: "console.x.ai",
    keyHint: "xAI API key",
    models: [
      {
        id: "grok-2-vision-1212",
        label: "Grok 2 Vision",
        description: "Vision model for document images.",
        vision: true,
        tier: "premium",
      },
      {
        id: "grok-2-1212",
        label: "Grok 2",
        description: "Text analysis for CSV and extracted data.",
        vision: false,
        tier: "premium",
      },
      {
        id: "grok-3-mini",
        label: "Grok 3 Mini",
        description: "Faster Grok option for lighter analysis.",
        vision: false,
        tier: "standard",
      },
    ],
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    shortLabel: "DeepSeek",
    description: "Strong reasoning models for CSV analysis",
    consoleUrl: "https://platform.deepseek.com/",
    consoleLabel: "platform.deepseek.com",
    keyHint: "DeepSeek API key (sk-...)",
    models: [
      {
        id: "deepseek-chat",
        label: "DeepSeek Chat",
        description: "General analysis for CSV and text.",
        vision: false,
        tier: "standard",
      },
      {
        id: "deepseek-reasoner",
        label: "DeepSeek Reasoner",
        description: "Deeper reasoning for complex questions.",
        vision: false,
        tier: "premium",
      },
    ],
  },
]

export const PROVIDER_IDS = AI_PROVIDERS.map((p) => p.id)

export function getProvider(id: string | undefined): ProviderOption | undefined {
  return AI_PROVIDERS.find((p) => p.id === id)
}

export function getModel(providerId: string | undefined, modelId: string | undefined): ModelOption | undefined {
  const provider = getProvider(providerId)
  if (!provider || !modelId) return undefined
  return provider.models.find((m) => m.id === modelId)
}

export function isAllowedModel(providerId: string, modelId: string): boolean {
  return Boolean(getModel(providerId, modelId))
}

export function defaultModelForProvider(providerId: AiProviderId): string {
  const provider = getProvider(providerId)
  return provider?.models[0]?.id || BUILTIN_MODEL
}

export function isValidProviderApiKey(providerId: AiProviderId, key: string): boolean {
  const trimmed = key.trim()
  if (trimmed.length < 16 || trimmed.length > 256) return false
  if (/\s/.test(trimmed)) return false

  switch (providerId) {
    case "openai":
    case "deepseek":
      return /^sk-[A-Za-z0-9_-]{16,}$/.test(trimmed)
    case "anthropic":
      return /^sk-ant-[A-Za-z0-9_-]{16,}$/.test(trimmed)
    case "google":
      return /^AIza[A-Za-z0-9_-]{20,}$/.test(trimmed) || /^[A-Za-z0-9_-]{20,}$/.test(trimmed)
    case "xai":
      return /^(xai-|sk-)[A-Za-z0-9_-]{16,}$/.test(trimmed) || /^[A-Za-z0-9_-]{20,}$/.test(trimmed)
    case "mistral":
      return /^[A-Za-z0-9._-]{20,}$/.test(trimmed)
    default:
      return false
  }
}

/** @deprecated Use AI_PROVIDERS / getModel instead */
export const MISTRAL_MODELS = getProvider("mistral")?.models || []

/** @deprecated Use isValidProviderApiKey("mistral", key) */
export function isValidMistralApiKey(key: string): boolean {
  return isValidProviderApiKey("mistral", key)
}

/** @deprecated Prefer isAllowedModel(provider, model) */
export const ALLOWED_MODEL_IDS = new Set(
  AI_PROVIDERS.flatMap((p) => p.models.map((m) => m.id)),
)
