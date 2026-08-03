import { Mistral } from "@mistralai/mistralai"
import type { AiProviderId } from "@/lib/models"

export interface CompletionInput {
  provider: AiProviderId
  apiKey: string
  model: string
  /** Full user prompt text (instructions + CSV or caption). */
  text: string
  /** Optional image as raw base64 or data URL. */
  image?: string
}

function toDataUrl(image: string): string {
  return image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`
}

function splitDataUrl(image: string): { mediaType: string; data: string } {
  const dataUrl = toDataUrl(image)
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (match) {
    return { mediaType: match[1], data: match[2] }
  }
  return { mediaType: "image/jpeg", data: image.replace(/^data:[^;]+;base64,/, "") }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json()
    if (typeof data?.error?.message === "string") return data.error.message
    if (typeof data?.error === "string") return data.error
    if (typeof data?.message === "string") return data.message
  } catch {
    // ignore parse errors
  }
  return `Provider request failed (${response.status})`
}

async function completeOpenAiCompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  text: string,
  image: string | undefined,
): Promise<string> {
  const content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [{ type: "text", text }]

  if (image) {
    content.push({
      type: "image_url",
      image_url: { url: toDataUrl(image) },
    })
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [{ role: "user", content }],
    }),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  const data = await response.json()
  const textOut = data?.choices?.[0]?.message?.content
  if (typeof textOut === "string") return textOut
  if (Array.isArray(textOut)) {
    return textOut
      .map((part: { text?: string; type?: string }) =>
        typeof part?.text === "string" ? part.text : "",
      )
      .join("")
  }
  return ""
}

async function completeAnthropic(
  apiKey: string,
  model: string,
  text: string,
  image: string | undefined,
): Promise<string> {
  const content: Array<
    | { type: "text"; text: string }
    | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
  > = []

  if (image) {
    const { mediaType, data } = splitDataUrl(image)
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: mediaType,
        data,
      },
    })
  }

  content.push({ type: "text", text })

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      temperature: 0.2,
      messages: [{ role: "user", content }],
    }),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  const data = await response.json()
  const parts = Array.isArray(data?.content) ? data.content : []
  return parts
    .map((part: { type?: string; text?: string }) =>
      part?.type === "text" && typeof part.text === "string" ? part.text : "",
    )
    .join("")
}

async function completeGoogle(
  apiKey: string,
  model: string,
  text: string,
  image: string | undefined,
): Promise<string> {
  const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [
    { text },
  ]

  if (image) {
    const { mediaType, data } = splitDataUrl(image)
    parts.push({
      inline_data: {
        mime_type: mediaType,
        data,
      },
    })
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4096,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  const data = await response.json()
  const partsOut = data?.candidates?.[0]?.content?.parts
  if (!Array.isArray(partsOut)) return ""
  return partsOut
    .map((part: { text?: string }) => (typeof part?.text === "string" ? part.text : ""))
    .join("")
}

async function completeMistral(
  apiKey: string,
  model: string,
  text: string,
  image: string | undefined,
): Promise<string> {
  const mistral = new Mistral({ apiKey })
  const content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; imageUrl: string }
  > = [{ type: "text", text }]

  if (image) {
    content.push({
      type: "image_url",
      imageUrl: toDataUrl(image),
    })
  }

  const response = await mistral.chat.complete({
    model,
    messages: [{ role: "user", content }],
  })

  const out = response.choices?.[0]?.message?.content
  return typeof out === "string" ? out : ""
}

/**
 * Run a single multimodal chat completion against the selected provider.
 * Never logs the API key.
 */
export async function completeWithProvider(input: CompletionInput): Promise<string> {
  const { provider, apiKey, model, text, image } = input

  switch (provider) {
    case "mistral":
      return completeMistral(apiKey, model, text, image)
    case "openai":
      return completeOpenAiCompatible("https://api.openai.com/v1", apiKey, model, text, image)
    case "xai":
      return completeOpenAiCompatible("https://api.x.ai/v1", apiKey, model, text, image)
    case "deepseek":
      return completeOpenAiCompatible("https://api.deepseek.com/v1", apiKey, model, text, image)
    case "anthropic":
      return completeAnthropic(apiKey, model, text, image)
    case "google":
      return completeGoogle(apiKey, model, text, image)
    default:
      throw new Error("Unsupported AI provider")
  }
}
