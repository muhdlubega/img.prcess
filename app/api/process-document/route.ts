import { type NextRequest, NextResponse } from "next/server"
import { buildSystemInstructions } from "@/lib/prompt-builder"
import { completeWithProvider } from "@/lib/ai/complete"
import { parseAiJson } from "@/lib/ai/parse-json"
import {
  BUILTIN_MODEL,
  BUILTIN_PROVIDER,
  isAllowedModel,
  isValidProviderApiKey,
  type AiProviderId,
  PROVIDER_IDS,
} from "@/lib/models"
import type { DocumentType, ProcessDocumentRequest } from "@/lib/types"

const MAX_IMAGE_CHARS = 12_000_000
const MAX_CSV_CHARS = 200_000
const ALLOWED_TYPES: DocumentType[] = [
  "image",
  "csv",
  "invoice",
  "receipt",
  "id",
  "custom",
]

function sanitizeString(value: unknown, maxLen: number): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return trimmed.slice(0, maxLen)
}

function isProviderId(value: string | undefined): value is AiProviderId {
  return Boolean(value && (PROVIDER_IDS as string[]).includes(value))
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

function normalizeFields(value: unknown): Record<string, string | number> {
  const source = asRecord(value)
  if (!source) return {}

  const out: Record<string, string | number> = {}
  for (const [key, raw] of Object.entries(source)) {
    if (typeof raw === "string" || typeof raw === "number") {
      out[key] = raw
    } else if (raw !== null && raw !== undefined) {
      out[key] = String(
        typeof raw === "object" ? JSON.stringify(raw) : raw,
      ).slice(0, 2000)
    }
  }
  return out
}

function normalizeConfidence(value: unknown): Record<string, number> {
  const source = asRecord(value)
  if (!source) return {}

  const out: Record<string, number> = {}
  for (const [key, raw] of Object.entries(source)) {
    const num = typeof raw === "number" ? raw : Number(raw)
    if (Number.isFinite(num)) {
      out[key] = Math.min(100, Math.max(0, num))
    }
  }
  return out
}

function normalizeCharts(value: unknown) {
  if (!Array.isArray(value)) return []

  return value
    .map((entry) => asRecord(entry))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && Array.isArray(entry!.data))
    .slice(0, 4)
    .map((entry) => ({
      type: entry.type === "line" ? ("line" as const) : ("bar" as const),
      title: typeof entry.title === "string" ? entry.title.slice(0, 120) : "Chart",
      xLabel: typeof entry.xLabel === "string" ? entry.xLabel.slice(0, 60) : undefined,
      yLabel: typeof entry.yLabel === "string" ? entry.yLabel.slice(0, 60) : undefined,
      data: (entry.data as unknown[])
        .slice(0, 24)
        .map((point) => {
          const record = asRecord(point)
          const rawValue = record?.value
          const num = typeof rawValue === "number" ? rawValue : Number(rawValue)
          return {
            label: String(record?.label ?? "").slice(0, 40),
            value: Number.isFinite(num) ? num : 0,
          }
        })
        .filter((point) => point.label),
    }))
    .filter((chart) => chart.data.length > 0)
}

function normalizeAnalysis(value: unknown) {
  const source = asRecord(value)
  if (!source) return undefined

  return {
    summary: typeof source.summary === "string" ? source.summary : "",
    findings: Array.isArray(source.findings)
      ? source.findings.filter((f): f is string => typeof f === "string").slice(0, 20)
      : [],
    methodology: typeof source.methodology === "string" ? source.methodology : undefined,
    charts: normalizeCharts(source.charts),
    codeSketch:
      typeof source.codeSketch === "string" ? source.codeSketch.slice(0, 4000) : undefined,
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: ProcessDocumentRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const documentType = body.documentType
    if (!documentType || !ALLOWED_TYPES.includes(documentType)) {
      return NextResponse.json({ error: "Invalid document type" }, { status: 400 })
    }

    const extractionPrompt = sanitizeString(body.extractionPrompt, 2000)
    const question = sanitizeString(body.question, 2000)
    const csvText = sanitizeString(body.csvText, MAX_CSV_CHARS)
    const image = sanitizeString(body.image, MAX_IMAGE_CHARS)
    const preferences = body.preferences && typeof body.preferences === "object" ? body.preferences : undefined

    const clientApiKey = sanitizeString(body.apiKey, 256)
    const requestedModel = sanitizeString(body.model, 80)
    const requestedProvider = sanitizeString(body.provider, 32)

    const isCsvFlow = documentType === "csv" || (documentType === "custom" && !!csvText && !image)

    if (isCsvFlow && !csvText) {
      return NextResponse.json({ error: "No CSV data provided" }, { status: 400 })
    }
    if (!isCsvFlow && !image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    let apiKey: string
    let model: string
    let provider: AiProviderId

    if (clientApiKey) {
      if (!isProviderId(requestedProvider)) {
        return NextResponse.json({ error: "Unsupported AI provider" }, { status: 400 })
      }
      if (!isValidProviderApiKey(requestedProvider, clientApiKey)) {
        return NextResponse.json({ error: "Invalid API key format for selected provider" }, { status: 400 })
      }
      if (!requestedModel || !isAllowedModel(requestedProvider, requestedModel)) {
        return NextResponse.json({ error: "Unsupported model for selected provider" }, { status: 400 })
      }
      // DeepSeek models are text-only
      if (!isCsvFlow && requestedProvider === "deepseek") {
        return NextResponse.json(
          { error: "DeepSeek models are text-only. Use an image-capable provider or upload a CSV." },
          { status: 400 },
        )
      }
      provider = requestedProvider
      apiKey = clientApiKey
      model = requestedModel
    } else {
      if (!process.env.MISTRAL_API_KEY) {
        return NextResponse.json({ error: "Built-in AI service not configured" }, { status: 500 })
      }
      provider = BUILTIN_PROVIDER
      apiKey = process.env.MISTRAL_API_KEY
      model = BUILTIN_MODEL
    }

    const instructions = buildSystemInstructions(
      documentType,
      extractionPrompt,
      question,
      preferences,
    )

    let promptText = instructions
    let imagePayload: string | undefined

    if (isCsvFlow && csvText) {
      promptText = `${instructions}

CSV DATA (may be truncated):
\`\`\`csv
${csvText}
\`\`\``
    } else if (image) {
      imagePayload = image
    }

    const text = await completeWithProvider({
      provider,
      apiKey,
      model,
      text: promptText,
      image: imagePayload,
    })

    const { data: extractedData, usedFallback } = parseAiJson(text)
    if (usedFallback) {
      console.warn(
        `Model response was not parseable as JSON (provider=${provider}, model=${model}, length=${text.length}). Head: ${text.slice(0, 200)}`,
      )
    }

    const fields = normalizeFields(extractedData.fields)
    const confidence = normalizeConfidence(extractedData.confidence)

    let rawText =
      typeof extractedData.rawText === "string" ? extractedData.rawText : text

    rawText = rawText
      .replace(/(\b\w+\b)(?:,\s*\1){3,}/g, "$1")
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim()

    if (preferences?.includeConfidence !== false) {
      Object.keys(fields).forEach((key) => {
        if (typeof confidence[key] !== "number") {
          confidence[key] = 85
        }
      })
    }

    const analysis = normalizeAnalysis(extractedData.analysis)

    return NextResponse.json({
      fields,
      confidence: preferences?.includeConfidence === false ? {} : confidence,
      rawText,
      analysis,
      documentType,
      question: question || undefined,
      extractionPrompt: extractionPrompt || undefined,
      providerUsed: provider,
      modelUsed: model,
      processedAt: new Date().toISOString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown"
    const safeMessage = message.replace(/[A-Za-z0-9_-]{16,}/g, "[redacted]")
    console.error("Error processing document:", safeMessage)

    const lower = safeMessage.toLowerCase()
    if (lower.includes("api key") || lower.includes("unauthorized") || lower.includes("401")) {
      return NextResponse.json(
        { error: "The provider rejected this API key. Check the key and try again." },
        { status: 401 },
      )
    }
    if (lower.includes("vision") || lower.includes("image") || lower.includes("multimodal")) {
      return NextResponse.json(
        { error: "This model could not process the image. Try a vision model or a CSV file." },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { error: "Failed to process document", detail: safeMessage.slice(0, 300) },
      { status: 500 },
    )
  }
}
