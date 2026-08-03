"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { usePreferences } from "@/components/preferences-provider"
import { useSelection } from "@/components/selection-provider"
import { useApiSession } from "@/components/api-session-provider"
import { DOCUMENT_TYPES } from "@/lib/types"
import type {
  ChartPreference,
  DetailLevel,
  DocumentType,
  OutputFormat,
  ResponseStyle,
} from "@/lib/types"
import {
  AI_PROVIDERS,
  BUILTIN_MODEL,
  getModel,
  getProvider,
  isValidProviderApiKey,
  type AiProviderId,
  type ApiMode,
} from "@/lib/models"
import { cn } from "@/lib/utils"
import { Eye, EyeOff, KeyRound, RotateCcw, Save, Shield } from "lucide-react"

function OptionGroup<T extends string>({
  label,
  description,
  value,
  options,
  onChange,
}: {
  label: string
  description: string
  value: T
  options: { id: T; label: string; hint?: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-foreground">{label}</Label>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            aria-pressed={value === opt.id}
            className={cn(
              "rounded-lg border px-3.5 py-2 text-left text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              value === opt.id
                ? "border-primary bg-primary/10 text-foreground shadow-sm"
                : "border-border bg-card text-muted-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground hover:shadow-sm",
            )}
          >
            <span className="font-medium">{opt.label}</span>
            {opt.hint && (
              <span className="mt-0.5 block text-[11px] opacity-75">{opt.hint}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { preferences, updatePreferences, resetPreferences } = usePreferences()
  const { selectDocument } = useSelection()
  const {
    apiMode,
    setApiMode,
    selectedProvider,
    setSelectedProvider,
    apiKey,
    setApiKey,
    clearApiKey,
    selectedModel,
    setSelectedModel,
    hasCustomKey,
  } = useApiSession()
  const [savedFlash, setSavedFlash] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [keyError, setKeyError] = useState<string | null>(null)

  const activeProvider = getProvider(selectedProvider) || AI_PROVIDERS[0]
  const providerModels = activeProvider.models

  useEffect(() => {
    if (preferences.preferredProvider && getProvider(preferences.preferredProvider)) {
      setSelectedProvider(preferences.preferredProvider as AiProviderId, { clearKey: false })
    }
    if (preferences.preferredModel) {
      setSelectedModel(preferences.preferredModel)
    }
  }, [preferences.preferredProvider, preferences.preferredModel, setSelectedProvider, setSelectedModel])

  const flashSaved = () => {
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1500)
  }

  const patch = <K extends keyof typeof preferences>(key: K, value: (typeof preferences)[K]) => {
    updatePreferences({ [key]: value })
    flashSaved()
  }

  const handleModeChange = (mode: ApiMode) => {
    setApiMode(mode)
    if (mode === "builtin") {
      setKeyError(null)
    }
  }

  const handleProviderChange = (providerId: AiProviderId) => {
    setSelectedProvider(providerId, { clearKey: true })
    setKeyError(null)
    setShowKey(false)
    const nextModel = getProvider(providerId)?.models[0]?.id || BUILTIN_MODEL
    updatePreferences({
      preferredProvider: providerId,
      preferredModel: nextModel,
    })
    flashSaved()
  }

  const handleKeyChange = (value: string) => {
    setApiKey(value)
    if (!value.trim()) {
      setKeyError(null)
      return
    }
    if (!isValidProviderApiKey(selectedProvider, value)) {
      setKeyError(`That does not look like a valid ${activeProvider.shortLabel} API key.`)
    } else {
      setKeyError(null)
    }
  }

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId)
    updatePreferences({ preferredModel: modelId, preferredProvider: selectedProvider })
    flashSaved()
  }

  return (
    <main id="main-content" className="min-h-screen bg-background" tabIndex={-1}>
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-primary/8 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onSelectDocument={(doc) => {
          selectDocument(doc)
          router.push("/")
        }}
      />

      <div className="md:ml-64 transition-[margin] duration-300">
        <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-8 md:py-10">
          <header className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Preferences</h1>
            <p className="text-muted-foreground leading-relaxed">
              Choose how results are written, which visuals appear, and which Mistral model handles your files.
            </p>
            {savedFlash && (
              <p className="flex items-center gap-1.5 text-xs text-primary">
                <Save className="h-3.5 w-3.5" /> Saved
              </p>
            )}
          </header>

          <Card className="gap-6 py-6" data-tour="api-settings">
            <div className="space-y-6 px-6">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <KeyRound className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    API & model
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    Use the built-in Mistral API, or bring your own key from OpenAI, Claude, Gemini, Grok, DeepSeek, or Mistral.
                  </p>
                </div>
              </div>

              <div
                className="flex gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground/90"
                role="note"
              >
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Your API key is not stored</p>
                  <p className="mt-0.5 text-muted-foreground leading-relaxed">
                    Keys stay in memory for this browser tab only. They are never written to localStorage,
                    cookies, disk, or our database. Closing the tab clears the key. It is sent only to the
                    provider you selected for that analysis.
                  </p>
                </div>
              </div>

              <OptionGroup<ApiMode>
                label="API source"
                description="Built-in uses the app Mistral key. Your own key unlocks other providers and models."
                value={apiMode}
                onChange={handleModeChange}
                options={[
                  { id: "builtin", label: "Built-in", hint: "Pixtral 12B" },
                  { id: "custom", label: "Your API key", hint: "Any supported provider" },
                ]}
              />

              {apiMode === "custom" && (
                <div className="space-y-5 rounded-xl border border-border bg-secondary/30 p-4">
                  <div className="space-y-3">
                    <Label>Provider</Label>
                    <p className="text-sm text-muted-foreground">
                      Pick where your key comes from. Models update to match.
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {AI_PROVIDERS.map((provider) => (
                        <button
                          key={provider.id}
                          type="button"
                          onClick={() => handleProviderChange(provider.id)}
                          aria-pressed={selectedProvider === provider.id}
                          className={cn(
                            "rounded-lg border px-3.5 py-3 text-left text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            selectedProvider === provider.id
                              ? "border-primary bg-primary/10 text-foreground shadow-sm"
                              : "border-border bg-card text-muted-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground hover:shadow-sm",
                          )}
                        >
                          <span className="font-medium text-foreground">{provider.shortLabel}</span>
                          <span className="mt-1 block text-[11px] leading-snug opacity-80">
                            {provider.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="provider-api-key">{activeProvider.keyHint}</Label>
                    <div className="flex gap-2">
                      <Input
                        id="provider-api-key"
                        type={showKey ? "text" : "password"}
                        autoComplete="off"
                        spellCheck={false}
                        placeholder={`${activeProvider.shortLabel} key (session only)`}
                        value={apiKey}
                        onChange={(e) => handleKeyChange(e.target.value)}
                        className="font-mono text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowKey((v) => !v)}
                        aria-label={showKey ? "Hide API key" : "Show API key"}
                      >
                        {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {keyError && <p className="text-xs text-destructive">{keyError}</p>}
                    {hasCustomKey && !keyError && (
                      <p className="text-xs text-primary">{activeProvider.shortLabel} key loaded for this session</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Get a key from{" "}
                      <a
                        href={activeProvider.consoleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        {activeProvider.consoleLabel}
                      </a>
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label>Model</Label>
                    <p className="text-sm text-muted-foreground">
                      Vision models work with document images. Text-only models are best for CSV.
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {providerModels.map((model) => (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => handleModelChange(model.id)}
                          aria-pressed={selectedModel === model.id}
                          className={cn(
                            "rounded-lg border px-3.5 py-3 text-left text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            selectedModel === model.id
                              ? "border-primary bg-primary/10 text-foreground shadow-sm"
                              : "border-border bg-card text-muted-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground hover:shadow-sm",
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-foreground">{model.label}</span>
                            <span className="text-[10px] uppercase tracking-wider opacity-70">
                              {model.vision ? "Vision" : "Text"}
                              {model.tier === "premium" ? " · Premium" : ""}
                            </span>
                          </div>
                          <span className="mt-1 block text-[11px] leading-snug opacity-80">
                            {model.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {hasCustomKey && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        clearApiKey()
                        setKeyError(null)
                        setShowKey(false)
                      }}
                    >
                      Clear key and use built-in
                    </Button>
                  )}
                </div>
              )}

              {apiMode === "builtin" && (
                <p className="text-sm text-muted-foreground">
                  Currently using built-in{" "}
                  <span className="font-medium text-foreground">{BUILTIN_MODEL}</span>
                  {" "}via Mistral.
                </p>
              )}
              {apiMode === "custom" && hasCustomKey && !keyError && (
                <p className="text-sm text-muted-foreground">
                  Ready with{" "}
                  <span className="font-medium text-foreground">{activeProvider.shortLabel}</span>
                  {" · "}
                  <span className="font-medium text-foreground">
                    {getModel(selectedProvider, selectedModel)?.label || selectedModel}
                  </span>
                </p>
              )}
            </div>
          </Card>

          <Card className="gap-6 py-6">
            <div className="space-y-8 px-6">
              <section>
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Response
                </h2>
                <div className="space-y-6">
                  <OptionGroup<ResponseStyle>
                    label="Response style"
                    description="Tone and density of explanations."
                    value={preferences.responseStyle}
                    onChange={(v) => patch("responseStyle", v)}
                    options={[
                      { id: "concise", label: "Concise", hint: "Short bullets" },
                      { id: "detailed", label: "Detailed", hint: "Balanced" },
                      { id: "technical", label: "Technical", hint: "Analyst depth" },
                    ]}
                  />

                  <OptionGroup<DetailLevel>
                    label="Detail level"
                    description="How many insights to surface."
                    value={preferences.detailLevel}
                    onChange={(v) => patch("detailLevel", v)}
                    options={[
                      { id: "summary", label: "Summary" },
                      { id: "standard", label: "Standard" },
                      { id: "exhaustive", label: "Exhaustive" },
                    ]}
                  />

                  <OptionGroup<OutputFormat>
                    label="Output format"
                    description="Prefer structured fields, narrative, or both."
                    value={preferences.outputFormat}
                    onChange={(v) => patch("outputFormat", v)}
                    options={[
                      { id: "structured", label: "Structured" },
                      { id: "narrative", label: "Narrative" },
                      { id: "both", label: "Both" },
                    ]}
                  />
                </div>
              </section>

              <div className="h-px bg-border" />

              <section>
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Input & output
                </h2>
                <div className="space-y-6">
                  <OptionGroup<DocumentType>
                    label="Default document type"
                    description="Pre-selected type on the Analyze page."
                    value={preferences.defaultDocumentType}
                    onChange={(v) => patch("defaultDocumentType", v)}
                    options={DOCUMENT_TYPES.map((t) => ({
                      id: t.id,
                      label: t.label,
                    }))}
                  />

                  <OptionGroup<ChartPreference>
                    label="Charts"
                    description="How analysis visualizations are preferred."
                    value={preferences.chartPreference}
                    onChange={(v) => patch("chartPreference", v)}
                    options={[
                      { id: "auto", label: "Auto" },
                      { id: "bar", label: "Bar" },
                      { id: "line", label: "Line" },
                      { id: "none", label: "None" },
                    ]}
                  />

                  <div className="space-y-4 rounded-xl border border-border bg-secondary/30 p-4">
                    <ToggleRow
                      label="Include confidence scores"
                      description="Show per-field OCR / extraction confidence."
                      checked={preferences.includeConfidence}
                      onChange={(v) => patch("includeConfidence", v)}
                    />
                    <ToggleRow
                      label="Auto-save analyses"
                      description="Save results to history after each run."
                      checked={preferences.autoSave}
                      onChange={(v) => patch("autoSave", v)}
                    />
                    <ToggleRow
                      label="Show pipeline steps"
                      description="Animate clean → analyze → chart → explain while running."
                      checked={preferences.showPipelineSteps}
                      onChange={(v) => patch("showPipelineSteps", v)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-fields">Max structured fields</Label>
                    <p className="text-sm text-muted-foreground">
                      Cap how many fields the model returns ({preferences.maxFields}).
                    </p>
                    <input
                      id="max-fields"
                      type="range"
                      min={10}
                      max={80}
                      step={5}
                      value={preferences.maxFields}
                      onChange={(e) => patch("maxFields", Number(e.target.value))}
                      className="w-full accent-[var(--primary)]"
                    />
                  </div>
                </div>
              </section>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                resetPreferences()
                clearApiKey()
                flashSaved()
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Reset to defaults
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  )
}
