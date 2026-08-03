/**
 * Tolerant JSON parsing for model output.
 *
 * Models routinely return JSON that `JSON.parse` rejects: fenced in markdown,
 * wrapped in prose, containing literal newlines inside string values, carrying
 * trailing commas, or cut off mid-object when the response hits a token limit.
 * Each repair below targets one of those failure modes. Repairs never throw, so
 * a malformed response degrades to a text blob instead of failing the request.
 */

export type ParsedAiObject = Record<string, unknown>

function tryParseObject(candidate: string): ParsedAiObject | undefined {
  try {
    const parsed = JSON.parse(candidate)
    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      Object.keys(parsed).length > 0
    ) {
      return parsed as ParsedAiObject
    }
  } catch {
    // Caller falls through to the next repair strategy.
  }
  return undefined
}

/**
 * Escape literal control characters that appear inside string values, leaving
 * structural characters outside string literals untouched.
 */
function escapeControlCharsInStrings(input: string): string {
  let out = ""
  let inString = false
  let escaped = false

  for (const char of input) {
    if (escaped) {
      out += char
      escaped = false
      continue
    }
    if (inString && char === "\\") {
      out += char
      escaped = true
      continue
    }
    if (char === '"') {
      inString = !inString
      out += char
      continue
    }

    const code = char.charCodeAt(0)
    if (inString && code < 0x20) {
      if (char === "\n") out += "\\n"
      else if (char === "\r") out += "\\r"
      else if (char === "\t") out += "\\t"
      else out += `\\u${code.toString(16).padStart(4, "0")}`
      continue
    }

    out += char
  }

  return out
}

function stripTrailingCommas(input: string): string {
  return input.replace(/,(\s*[}\]])/g, "$1")
}

/** Brackets left open at the end of the input, outermost first. */
function pendingClosers(input: string): string[] {
  const stack: string[] = []
  let inString = false
  let escaped = false

  for (const char of input) {
    if (escaped) {
      escaped = false
      continue
    }
    if (inString) {
      if (char === "\\") escaped = true
      else if (char === '"') inString = false
      continue
    }
    if (char === '"') inString = true
    else if (char === "{") stack.push("}")
    else if (char === "[") stack.push("]")
    else if (char === "}" || char === "]") stack.pop()
  }

  return inString ? [] : stack
}

/**
 * Repair output cut off mid-object by trimming back to a complete member and
 * closing the open brackets. Returns candidates ordered from most to least data
 * retained: a trailing string may be an unfinished key rather than a finished
 * value, in which case the first candidate fails to parse and the next is used.
 */
function closeTruncatedJson(input: string): string[] {
  let inString = false
  let escaped = false
  let cutAfterValue = -1
  let cutAtComma = -1

  for (let i = 0; i < input.length; i++) {
    const char = input[i]
    if (escaped) {
      escaped = false
      continue
    }
    if (inString) {
      if (char === "\\") escaped = true
      else if (char === '"') {
        inString = false
        cutAfterValue = i + 1
      }
      continue
    }
    if (char === '"') inString = true
    else if (char === "{" || char === "[" || char === "}" || char === "]") cutAfterValue = i + 1
    else if (char === ",") cutAtComma = i
    else if (/[0-9a-zA-Z]/.test(char)) cutAfterValue = i + 1
  }

  if (!inString && pendingClosers(input).length === 0) return [input]

  const candidates: string[] = []
  for (const cut of [cutAfterValue, cutAtComma]) {
    if (cut < 0) continue
    const prefix = input.slice(0, cut)
    const repaired = prefix + pendingClosers(prefix).reverse().join("")
    if (!candidates.includes(repaired)) candidates.push(repaired)
  }

  return candidates.length > 0 ? candidates : [input]
}

/** Text blob used when no repair produces a usable object. */
export function fallbackAiObject(text: string): ParsedAiObject {
  return {
    fields: { content: text.slice(0, 2000) },
    confidence: { content: 50 },
    rawText: text,
    analysis: {
      summary: text.slice(0, 500),
      findings: [],
      methodology: "Fallback parse because the model returned non-JSON text.",
      charts: [],
    },
  }
}

export interface ParseAiJsonResult {
  data: ParsedAiObject
  /** True when no repair produced a usable object and the text blob was used. */
  usedFallback: boolean
}

export function parseAiJson(text: string): ParseAiJsonResult {
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim()

  const sources = [cleaned]
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (jsonMatch && jsonMatch[0] !== cleaned) {
    sources.push(jsonMatch[0])
  }
  // Truncated output has no closing brace, so also try everything after the first one.
  const firstBrace = cleaned.indexOf("{")
  if (firstBrace > 0) {
    sources.push(cleaned.slice(firstBrace))
  }

  for (const source of sources) {
    const escapedSource = escapeControlCharsInStrings(source)
    const repairs = [
      source,
      escapedSource,
      stripTrailingCommas(escapedSource),
      ...closeTruncatedJson(escapedSource).map(stripTrailingCommas),
    ]
    for (const candidate of repairs) {
      const parsed = tryParseObject(candidate)
      if (parsed) return { data: parsed, usedFallback: false }
    }
  }

  return { data: fallbackAiObject(cleaned), usedFallback: true }
}
