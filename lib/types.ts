export type DocumentType =
  | "image"
  | "csv"
  | "invoice"
  | "receipt"
  | "id"
  | "custom"

export type ResponseStyle = "concise" | "detailed" | "technical"
export type OutputFormat = "structured" | "narrative" | "both"
export type ChartPreference = "bar" | "line" | "none" | "auto"
export type DetailLevel = "summary" | "standard" | "exhaustive"

export interface UserPreferences {
  responseStyle: ResponseStyle
  outputFormat: OutputFormat
  includeConfidence: boolean
  autoSave: boolean
  defaultDocumentType: DocumentType
  chartPreference: ChartPreference
  detailLevel: DetailLevel
  showPipelineSteps: boolean
  maxFields: number
  /** Preferred provider when using a custom key (key itself is never persisted). */
  preferredProvider: string
  /** Preferred model id when using a custom key (key itself is never persisted). */
  preferredModel: string
  walkthroughCompleted: boolean
}

export interface ChartSeries {
  label: string
  value: number
}

export interface ChartSpec {
  type: "bar" | "line"
  title: string
  xLabel?: string
  yLabel?: string
  data: ChartSeries[]
}

export interface AnalysisResult {
  summary: string
  findings: string[]
  methodology?: string
  charts?: ChartSpec[]
  codeSketch?: string
}

export interface ExtractedData {
  id?: string
  document_name?: string
  documentType?: DocumentType
  fields: Record<string, string | number>
  confidence?: Record<string, number>
  rawText: string
  processedAt: string
  imageUrl?: string
  analysis?: AnalysisResult
  question?: string
  extractionPrompt?: string
}

export interface ProcessDocumentRequest {
  image?: string
  csvText?: string
  documentType: DocumentType
  extractionPrompt?: string
  question?: string
  preferences?: Partial<UserPreferences>
  fileName?: string
  /** Session-only client key. Never logged or persisted server-side. */
  apiKey?: string
  /** Provider for the custom key: mistral | openai | anthropic | google | xai | deepseek */
  provider?: string
  model?: string
}

export const DOCUMENT_TYPES: {
  id: DocumentType
  label: string
  description: string
  accept: string
  placeholder: string
}[] = [
  {
    id: "csv",
    label: "CSV / Data",
    description: "Analyze spreadsheets and answer questions",
    accept: ".csv,text/csv",
    placeholder: "e.g. Extract monthly sales, region, and product category",
  },
  {
    id: "image",
    label: "Document Image",
    description: "OCR any scanned page or photo",
    accept: "image/*",
    placeholder: "e.g. Extract all names, dates, and amounts",
  },
  {
    id: "invoice",
    label: "Invoice",
    description: "Vendor, line items, totals, dates",
    accept: "image/*",
    placeholder: "e.g. Invoice number, vendor, line items, tax, total",
  },
  {
    id: "receipt",
    label: "Receipt",
    description: "Merchant, items, payment method",
    accept: "image/*",
    placeholder: "e.g. Merchant, date, items, tip, total",
  },
  {
    id: "id",
    label: "ID / Form",
    description: "IDs, forms, and structured paperwork",
    accept: "image/*",
    placeholder: "e.g. Full name, ID number, issue/expiry dates",
  },
  {
    id: "custom",
    label: "Custom",
    description: "Your own extraction rules",
    accept: "image/*,.csv,text/csv",
    placeholder: "Describe exactly what to extract or analyze…",
  },
]
