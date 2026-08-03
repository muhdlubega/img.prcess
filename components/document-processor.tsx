"use client"

import { useEffect, useRef, useState } from "react"
import { FileUpload } from "./file-upload"
import { ProcessingStatus } from "./processing-status"
import { DataDisplay } from "./data-display"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { usePreferences } from "./preferences-provider"
import { useApiSession } from "./api-session-provider"
import { useSelection } from "./selection-provider"
import {
  DOCUMENT_TYPES,
  type DocumentType,
  type ExtractedData,
} from "@/lib/types"
import { getModel, getProvider } from "@/lib/models"
import { cn } from "@/lib/utils"
import {
  BadgeCheck,
  CircleAlert,
  DatabaseZap,
  FileCheck2,
  KeyRound,
  Play,
  Trash2,
  X,
} from "lucide-react"

interface DocumentProcessorProps {
  selectedDocument?: ExtractedData | null
}

const MAX_FILE_BYTES = 10 * 1024 * 1024

export function DocumentProcessor({ selectedDocument }: DocumentProcessorProps) {
  const { preferences } = usePreferences()
  const { apiMode, apiKey, selectedModel, selectedProvider, hasCustomKey } = useApiSession()
  const { notifyHistoryChanged } = useSelection()
  const providerMeta = getProvider(selectedProvider)
  const modelMeta = getModel(selectedProvider, selectedModel)
  const [documentType, setDocumentType] = useState<DocumentType>(preferences.defaultDocumentType)
  const [extractionPrompt, setExtractionPrompt] = useState("")
  const [question, setQuestion] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [pipelineStep, setPipelineStep] = useState(0)
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [documentName, setDocumentName] = useState("")
  const stepTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!extractedData && !uploadedFile && !isProcessing) {
      setDocumentType(preferences.defaultDocumentType)
    }
  }, [preferences.defaultDocumentType])

  useEffect(() => {
    if (selectedDocument) {
      setExtractedData(selectedDocument)
      setDocumentName(selectedDocument.document_name || "")
      setUploadedFile(null)
      setError(null)
      setIsProcessing(false)
      if (selectedDocument.documentType) {
        setDocumentType(selectedDocument.documentType)
      }
      setExtractionPrompt(selectedDocument.extractionPrompt || "")
      setQuestion(selectedDocument.question || "")
    }
  }, [selectedDocument])

  useEffect(() => {
    return () => {
      if (stepTimer.current) clearInterval(stepTimer.current)
    }
  }, [])

  const typeMeta = DOCUMENT_TYPES.find((t) => t.id === documentType) || DOCUMENT_TYPES[0]
  const showQuestion =
    documentType === "csv" || documentType === "custom" || !!uploadedFile?.name.endsWith(".csv")

  const clearPipeline = () => {
    if (stepTimer.current) {
      clearInterval(stepTimer.current)
      stepTimer.current = null
    }
  }

  const startPipeline = () => {
    clearPipeline()
    setPipelineStep(0)
    if (!preferences.showPipelineSteps) return
    stepTimer.current = setInterval(() => {
      setPipelineStep((s) => Math.min(s + 1, 4))
    }, 1400)
  }

  const handleFileSelect = (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      setError("File exceeds the 10MB limit.")
      return
    }
    setUploadedFile(file)
    setExtractedData(null)
    setError(null)
    setDocumentName(file.name.replace(/\.[^/.]+$/, ""))
  }

  const handleAnalyze = async () => {
    if (!uploadedFile) {
      setError("Upload a file first.")
      return
    }

    if (apiMode === "custom" && !hasCustomKey) {
      setError("Add your API key in Preferences, or switch back to the built-in API.")
      return
    }

    const isCsv =
      documentType === "csv" ||
      uploadedFile.type === "text/csv" ||
      uploadedFile.name.toLowerCase().endsWith(".csv")

    if (apiMode === "custom" && !isCsv) {
      if (modelMeta && !modelMeta.vision) {
        setError(
          `${modelMeta.label} does not support images. Choose a vision model in Preferences, or upload a CSV.`,
        )
        return
      }
    }

    setIsProcessing(true)
    setError(null)
    setExtractedData(null)
    startPipeline()

    try {
      let body: Record<string, unknown> = {
        documentType,
        extractionPrompt: extractionPrompt.trim() || undefined,
        question: question.trim() || undefined,
        preferences,
        fileName: uploadedFile.name,
      }

      if (apiMode === "custom" && hasCustomKey) {
        body.apiKey = apiKey.trim()
        body.provider = selectedProvider
        body.model = selectedModel
      }

      if (isCsv) {
        const csvText = await uploadedFile.text()
        if (!csvText.trim()) throw new Error("CSV file is empty")
        body.csvText = csvText.slice(0, 200_000)
      } else {
        const base64 = await fileToBase64(uploadedFile)
        body.image = base64
      }

      const response = await fetch("/api/process-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        const detail = typeof errBody.detail === "string" ? ` (${errBody.detail})` : ""
        throw new Error(`${errBody.error || "Failed to process document"}${detail}`)
      }

      const data = (await response.json()) as ExtractedData
      const name = documentName || uploadedFile.name.replace(/\.[^/.]+$/, "")
      setExtractedData({ ...data, document_name: name })
      setPipelineStep(4)

      if (preferences.autoSave) {
        const saveResponse = await fetch("/api/save-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            document_name: name,
            confidence: data.confidence,
          }),
        })

        if (!saveResponse.ok) {
          const errorData = await saveResponse.json().catch(() => ({}))
          setError(
            `Analysis ready, but save failed: ${errorData.details || errorData.error || "unknown error"}`,
          )
        } else {
          const saved = (await saveResponse.json().catch(() => ({}))) as { id?: string }
          if (typeof saved.id === "string") {
            setExtractedData((prev) => (prev ? { ...prev, id: saved.id } : prev))
            notifyHistoryChanged(saved.id)
          } else {
            notifyHistoryChanged()
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      clearPipeline()
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    clearPipeline()
    setUploadedFile(null)
    setExtractedData(null)
    setError(null)
    setIsProcessing(false)
    setDocumentName("")
    setQuestion("")
    setExtractionPrompt("")
    setPipelineStep(0)
  }

  return (
    <div className="space-y-6 animate-page-in">
      {!extractedData && (
        <header className="space-y-2">
          <div className="inline-flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
              <DatabaseZap className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Analysis workspace
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
              {apiMode === "custom" && hasCustomKey
                ? <BadgeCheck className="h-3 w-3 text-primary" aria-hidden="true" />
                : <KeyRound className="h-3 w-3" aria-hidden="true" />}
              {apiMode === "custom" && hasCustomKey
                ? `${providerMeta?.shortLabel || "Custom"} · ${modelMeta?.label || selectedModel}`
                : "Built-in Mistral API"}
            </div>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Turn files into clear answers.
          </h1>
          <p className="max-w-2xl text-muted-foreground leading-relaxed">
            Add a CSV or document, tell us what matters, then ask a question such as
            &ldquo;Why did sales drop in March?&rdquo; We will organize the data, check the
            patterns, and show the result.
          </p>
        </header>
      )}

      {!extractedData && !isProcessing && (
        <div className="space-y-5">
          <section className="space-y-3" data-tour="document-type">
            <Label className="text-muted-foreground">Document type</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {DOCUMENT_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    setDocumentType(type.id)
                    setUploadedFile(null)
                    setError(null)
                  }}
                  className={cn(
                    "group rounded-xl border px-3 py-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    documentType === type.id
                      ? "border-primary bg-primary/10 text-foreground shadow-sm"
                      : "border-border bg-card text-muted-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground hover:shadow-md",
                  )}
                  aria-pressed={documentType === type.id}
                >
                  <div className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">{type.label}</div>
                  <div className="mt-0.5 text-[11px] leading-snug opacity-80">{type.description}</div>
                </button>
              ))}
            </div>
          </section>

          <div data-tour="upload">
            {!uploadedFile ? (
              <FileUpload
                onFileSelect={handleFileSelect}
                accept={typeMeta.accept}
                documentType={documentType}
              />
            ) : (
              <Card className="gap-0 py-4 animate-content-in">
                <div className="flex items-center justify-between gap-3 px-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <FileCheck2 className="size-4 text-primary" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{uploadedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadedFile.size / 1024).toFixed(1)} KB · {typeMeta.label}
                    </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setUploadedFile(null)}
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2" data-tour="prompts">
            <div className="space-y-2">
              <Label htmlFor="extraction-prompt">What should be extracted?</Label>
              <Textarea
                id="extraction-prompt"
                value={extractionPrompt}
                onChange={(e) => setExtractionPrompt(e.target.value)}
                placeholder={typeMeta.placeholder}
                maxLength={2000}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="analysis-question">
                Ask {showQuestion ? "(recommended for CSV)" : "(optional)"}
              </Label>
              <Textarea
                id="analysis-question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder='e.g. Why did sales drop in March?'
                maxLength={2000}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3" data-tour="run-analysis">
            <Button
              size="lg"
              onClick={handleAnalyze}
              disabled={!uploadedFile}
              className="group gap-2 shadow-sm hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
            >
              <Play className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              Analyze file
            </Button>
            {uploadedFile && (
              <Button variant="ghost" onClick={handleReset} className="group">
                <Trash2 className="h-4 w-4 transition-transform group-hover:rotate-6" aria-hidden="true" />
                Remove file
              </Button>
            )}
          </div>
        </div>
      )}

      {isProcessing && (
        <Card className="p-6 md:p-8 animate-content-in" aria-live="polite" aria-busy="true">
          <ProcessingStatus
            fileName={uploadedFile?.name || ""}
            activeStep={preferences.showPipelineSteps ? pipelineStep : 2}
            question={question || undefined}
          />
        </Card>
      )}

      {error && (
        <Card className="gap-0 border-destructive/50 py-4 animate-content-in" role="alert">
          <div className="flex items-start gap-3 px-6">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
            <div>
              <h3 className="font-semibold text-destructive">We could not finish that request</h3>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {extractedData && !isProcessing && (
        <DataDisplay
          data={extractedData}
          onReset={handleReset}
          documentName={documentName}
          onDocumentNameChange={setDocumentName}
        />
      )}
    </div>
  )
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(",")[1])
    }
    reader.onerror = reject
  })
}
