"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { Progress } from "./ui/progress"
import { CircularProgress } from "./ui/circular-progress"
import { Input } from "./ui/input"
import { SimpleChart } from "./simple-chart"
import type { ExtractedData } from "@/lib/types"
import { formatDate, formatFieldName } from "@/lib/utils"
import { usePreferences } from "./preferences-provider"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import { Check, ClipboardCopy, FileDown, FileSpreadsheet, RotateCcw } from "lucide-react"

interface DataDisplayProps {
  data: ExtractedData
  onReset: () => void
  documentName: string
  onDocumentNameChange: (name: string) => void
}

export function DataDisplay({ data, onReset, documentName, onDocumentNameChange }: DataDisplayProps) {
  const [copied, setCopied] = useState(false)
  const { preferences } = usePreferences()
  const displayName = documentName || data.document_name || "Untitled analysis"

  const totalAccuracy =
    data.confidence && Object.keys(data.confidence).length > 0
      ? Object.values(data.confidence).reduce((sum, val) => sum + val, 0) / Object.values(data.confidence).length
      : 0

  const showStructured =
    preferences.outputFormat === "structured" || preferences.outputFormat === "both"
  const showNarrative =
    preferences.outputFormat === "narrative" || preferences.outputFormat === "both"

  const handleExportExcel = () => {
    const formattedData = Object.entries(data.fields).reduce(
      (acc, [key, value]) => {
        acc[formatFieldName(key)] = value
        return acc
      },
      {} as Record<string, string | number>,
    )

    const worksheet = XLSX.utils.json_to_sheet([formattedData])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Extracted Data")
    XLSX.writeFile(workbook, `${displayName.replace(/\s+/g, "-")}-${Date.now()}.xlsx`)
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const maxWidth = pageWidth - 2 * margin
    let yPosition = 20

    const addText = (text: string, fontSize: number, isBold = false) => {
      doc.setFontSize(fontSize)
      doc.setFont("helvetica", isBold ? "bold" : "normal")
      const lines = doc.splitTextToSize(text, maxWidth)
      if (yPosition + lines.length * (fontSize * 0.5) > pageHeight - margin) {
        doc.addPage()
        yPosition = margin
      }
      lines.forEach((line: string) => {
        doc.text(line, margin, yPosition)
        yPosition += fontSize * 0.5
      })
      return yPosition
    }

    addText("AI Data Analysis", 18, true)
    yPosition += 5
    addText(displayName, 14, true)
    yPosition += 8

    if (data.question) {
      addText(`Question: ${data.question}`, 11)
      yPosition += 6
    }

    if (data.analysis?.summary) {
      addText("Summary", 12, true)
      yPosition += 4
      addText(data.analysis.summary, 11)
      yPosition += 8
    }

    if (Object.keys(data.fields).length > 0) {
      addText("Structured Fields", 12, true)
      yPosition += 4
      Object.entries(data.fields).forEach(([key, value]) => {
        const confidence = data.confidence?.[key]
        const conf =
          preferences.includeConfidence && typeof confidence === "number"
            ? ` (${Math.round(confidence)}%)`
            : ""
        addText(`${formatFieldName(key)}: ${value}${conf}`, 11)
        yPosition += 2
      })
    }

    if (data.rawText?.trim()) {
      yPosition += 8
      addText("Raw Text", 12, true)
      yPosition += 4
      addText(data.rawText, 10)
    }

    yPosition += 10
    addText(`Processed at: ${data.processedAt}`, 9)
    doc.save(`${displayName.replace(/\s+/g, "-")}-${Date.now()}.pdf`)
  }

  const handleCopyRawText = async () => {
    try {
      await navigator.clipboard.writeText(data.rawText || data.analysis?.summary || "")
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard may be unavailable
    }
  }

  return (
    <div className="space-y-5 animate-page-in" aria-live="polite">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Results</h2>
            <Button variant="outline" size="sm" className="group gap-1.5 hover:-translate-y-0.5" onClick={onReset}>
              <RotateCcw className="h-3.5 w-3.5" />
              Start another
            </Button>
          </div>
          <Input
            value={displayName}
            onChange={(e) => onDocumentNameChange(e.target.value)}
            className="max-w-md border-border/60 bg-card"
            placeholder="Analysis name"
            aria-label="Analysis name"
          />
          <p className="text-xs text-muted-foreground">Processed {formatDate(data.processedAt)}</p>
        </div>
        {preferences.includeConfidence && totalAccuracy > 0 && (
          <CircularProgress value={totalAccuracy} size={88} strokeWidth={7} />
        )}
      </div>

      {data.question && (
        <Card className="gap-2 border-primary/20 bg-primary/5 py-4 hover:border-primary/35 hover:shadow-md">
          <div className="px-6">
            <p className="text-xs font-medium uppercase tracking-wider text-primary">Question</p>
            <p className="mt-1 text-sm text-foreground">{data.question}</p>
          </div>
        </Card>
      )}

      {showNarrative && data.analysis && (
        <Card className="gap-4 py-5 hover:border-primary/20 hover:shadow-md">
          <div className="space-y-4 px-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Findings
              </h3>
              {data.analysis.summary && (
                <p className="mt-2 text-base leading-relaxed text-foreground">{data.analysis.summary}</p>
              )}
            </div>

            {data.analysis.findings?.length > 0 && (
              <ul className="space-y-2">
                {data.analysis.findings.map((finding, i) => (
                  <li key={i} className="flex gap-2 text-sm text-foreground/90">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {finding}
                  </li>
                ))}
              </ul>
            )}

            {data.analysis.methodology && (
              <div className="rounded-lg bg-secondary/60 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  How it was analyzed
                </p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {data.analysis.methodology}
                </p>
              </div>
            )}

            {data.analysis.codeSketch && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Analysis sketch
                </p>
                <pre className="overflow-x-auto rounded-lg border border-border bg-[#0c1214] p-4 text-xs leading-relaxed text-emerald-200/90 font-mono">
                  {data.analysis.codeSketch}
                </pre>
              </div>
            )}
          </div>
        </Card>
      )}

      {data.analysis?.charts && data.analysis.charts.length > 0 && preferences.chartPreference !== "none" && (
        <div className="grid gap-4 md:grid-cols-2">
          {data.analysis.charts.map((chart, i) => (
            <SimpleChart key={`${chart.title}-${i}`} chart={chart} />
          ))}
        </div>
      )}

      {showStructured && Object.keys(data.fields).length > 0 && (
        <Card className="gap-4 py-5">
          <div className="px-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Structured fields
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(data.fields)
                .filter(([key]) => !key.startsWith("__"))
                .map(([key, value]) => {
                const confidence = data.confidence?.[key] || 0
                return (
                  <div key={key} className="rounded-lg border border-border bg-secondary/40 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-secondary/60 hover:shadow-sm">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <div className="text-xs font-medium text-muted-foreground">
                        {formatFieldName(key)}
                      </div>
                      {preferences.includeConfidence && (
                        <div className="flex w-28 items-center gap-2">
                          <Progress value={confidence} className="h-1" />
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {Math.round(confidence)}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-sm font-medium text-foreground break-words">{String(value)}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      )}

      {data.rawText?.trim() && (
        <Card className="gap-3 py-5">
          <div className="px-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Raw output
              </h3>
              <Button variant="ghost" size="sm" onClick={handleCopyRawText} className="gap-1.5 h-8">
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <ClipboardCopy className="h-3.5 w-3.5" /> Copy
                  </>
                )}
              </Button>
            </div>
            <div className="rounded-lg border border-border bg-secondary/40 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{data.rawText}</p>
            </div>
          </div>
        </Card>
      )}

      <Card className="gap-3 py-5">
        <div className="px-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Export
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleExportExcel} className="group gap-2 hover:-translate-y-0.5">
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
            <Button onClick={handleExportPDF} variant="outline" className="group gap-2 hover:-translate-y-0.5">
              <FileDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
              PDF
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
