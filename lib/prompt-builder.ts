import type { DocumentType, UserPreferences } from "@/lib/types"

export function buildSystemInstructions(
  documentType: DocumentType,
  extractionPrompt: string | undefined,
  question: string | undefined,
  preferences: Partial<UserPreferences> | undefined,
): string {
  const style = preferences?.responseStyle ?? "detailed"
  const detail = preferences?.detailLevel ?? "standard"
  const output = preferences?.outputFormat ?? "both"
  const maxFields = preferences?.maxFields ?? 40
  const charts = preferences?.chartPreference ?? "auto"
  const includeConfidence = preferences?.includeConfidence ?? true

  const styleGuide =
    style === "concise"
      ? "Keep findings brief and scannable. Prefer bullets over paragraphs."
      : style === "technical"
        ? "Use precise analytical language. Mention assumptions, edge cases, and statistical caveats."
        : "Write clear, accessible explanations with enough context for a non-expert."

  const detailGuide =
    detail === "summary"
      ? "Limit to the top 3–5 insights."
      : detail === "exhaustive"
        ? "Be thorough: cover trends, outliers, segment comparisons, and data quality notes."
        : "Balance depth and clarity; cover key drivers and notable anomalies."

  const outputGuide =
    output === "structured"
      ? "Prioritize fields/JSON structure; keep narrative short."
      : output === "narrative"
        ? "Prioritize a written explanation; still include fields when useful."
        : "Return both structured fields and a full narrative analysis."

  const chartGuide =
    charts === "none"
      ? "Do not include charts."
      : charts === "bar"
        ? "Prefer bar charts when charting."
        : charts === "line"
          ? "Prefer line charts when charting."
          : "Choose bar or line charts that best answer the question."

  const typeHints: Record<DocumentType, string> = {
    csv: "You are an AI data analyst. Clean messy CSV concepts, reason about trends, and explain findings.",
    image: "You are an OCR and document intelligence engine. Extract structured data from the image.",
    invoice: "You specialize in invoices: vendor, invoice #, dates, line items, tax, totals.",
    receipt: "You specialize in receipts: merchant, date/time, items, tax, tip, payment method, total.",
    id: "You specialize in IDs and forms: names, ID numbers, dates, addresses, document type.",
    custom: "Follow the user's custom extraction instructions precisely.",
  }

  const promptBlock = extractionPrompt?.trim()
    ? `\nUSER EXTRACTION GOALS:\n${extractionPrompt.trim()}`
    : ""

  const questionBlock = question?.trim()
    ? `\nUSER QUESTION:\n${question.trim()}\nAnswer this question using the data. Explain cause/effect when possible.`
    : ""

  return `${typeHints[documentType]}

BEHAVIOR (similar to Advanced Data Analysis):
1. Mentally clean / normalize the data (fix obvious OCR noise, unify date formats, note missing values)
2. Extract structured fields relevant to the task
3. Analyze patterns and answer the user's question if provided
4. Propose chart-ready aggregates when useful
5. Explain findings clearly

RESPONSE STYLE: ${styleGuide}
DETAIL LEVEL: ${detailGuide}
OUTPUT EMPHASIS: ${outputGuide}
CHARTS: ${chartGuide}
${includeConfidence ? "Include per-field confidence scores 0–100." : "Omit confidence scores; set confidence to {}."}
Cap structured fields at about ${maxFields} keys.
${promptBlock}
${questionBlock}

IMPORTANT:
- Return ONLY valid JSON (no markdown fences, no commentary outside JSON)
- Do not invent values that are not supported by the input
- For CSV analysis, put key metrics in fields and deeper explanation in analysis

Required JSON structure:
{
  "fields": { "field_name": "value or number" },
  "confidence": { "field_name": 90 },
  "rawText": "Cleaned / consolidated text or CSV summary",
  "analysis": {
    "summary": "2–4 sentence answer / overview",
    "findings": ["finding 1", "finding 2"],
    "methodology": "Brief note on cleaning and analysis steps",
    "charts": [
      {
        "type": "bar",
        "title": "Chart title",
        "xLabel": "X",
        "yLabel": "Y",
        "data": [{ "label": "A", "value": 10 }]
      }
    ],
    "codeSketch": "Optional short Python-like pseudocode showing the analysis approach"
  }
}`
}
