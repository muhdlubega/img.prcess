import type { UserPreferences } from "./types"

export const PREFERENCES_STORAGE_KEY = "img-prcess-preferences"

export const DEFAULT_PREFERENCES: UserPreferences = {
  responseStyle: "detailed",
  outputFormat: "both",
  includeConfidence: true,
  autoSave: true,
  defaultDocumentType: "csv",
  chartPreference: "auto",
  detailLevel: "standard",
  showPipelineSteps: true,
  maxFields: 40,
  preferredProvider: "mistral",
  preferredModel: "pixtral-12b-2409",
  walkthroughCompleted: false,
}

export function loadPreferences(): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES
  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY)
    if (!raw) return DEFAULT_PREFERENCES
    const parsed = JSON.parse(raw) as Partial<UserPreferences> & { apiKey?: unknown }
    // Never persist or restore API keys from storage.
    delete parsed.apiKey
    return { ...DEFAULT_PREFERENCES, ...parsed }
  } catch {
    return DEFAULT_PREFERENCES
  }
}

export function savePreferences(prefs: UserPreferences): void {
  if (typeof window === "undefined") return
  const { ...safe } = prefs
  // Defensive: strip any accidental secret fields before writing.
  const payload = { ...safe } as UserPreferences & { apiKey?: unknown }
  delete payload.apiKey
  localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(payload))
}
