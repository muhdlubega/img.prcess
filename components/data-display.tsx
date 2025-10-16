"use client"

import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { Progress } from "./ui/progress"
import { CircularProgress } from "./ui/circular-progress"
import type { ExtractedData } from "./document-processor"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import { formatDate, formatFieldName } from "@/lib/utils"
import { Input } from "./ui/input"
import { useState } from "react"

interface DataDisplayProps {
  data: ExtractedData
  onReset: () => void
  documentName: string
  onDocumentNameChange: (name: string) => void
}

export function DataDisplay({ data, onReset, documentName, onDocumentNameChange }: DataDisplayProps) {
  const [copied, setCopied] = useState(false)

  const displayName = documentName || data.document_name || "Untitled Document"

  const totalAccuracy =
    data.confidence && Object.keys(data.confidence).length > 0
      ? Object.values(data.confidence).reduce((sum, val) => sum + val, 0) / Object.values(data.confidence).length
      : 0

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

    doc.setFontSize(18)
    doc.text("Extracted Document Data", 20, 20)

    doc.setFontSize(14)
    doc.text(displayName, 20, 30)

    doc.setFontSize(12)
    let yPosition = 45

    Object.entries(data.fields).forEach(([key, value]) => {
      doc.text(`${formatFieldName(key)}: ${value}`, 20, yPosition)
      yPosition += 10
    })

    doc.setFontSize(10)
    doc.text(`Processed at: ${data.processedAt}`, 20, yPosition + 10)

    doc.save(`${displayName.replace(/\s+/g, "-")}-${Date.now()}.pdf`)
  }

  const handleCopyRawText = async () => {
    try {
      await navigator.clipboard.writeText(data.rawText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text:", err)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
          <div className="flex items-start gap-4">
            <h2 className="text-2xl font-bold text-foreground mb-2">Extracted Data</h2>
            <Button className="cursor-pointer" variant="outline" onClick={onReset}>
              Process Another
            </Button>
          </div>
            <div className="flex items-center gap-2 mt-2 mb-2">
              <Input
                value={displayName}
                onChange={(e) => onDocumentNameChange(e.target.value)}
                className="max-w-md bg-card border-none -ml-[12px]"
                placeholder="Document name"
              />
            </div>
            <p className="text-sm text-muted-foreground">Processed at {formatDate(data.processedAt)}</p>
          </div>
          <div className="flex items-start gap-4">
            <CircularProgress value={totalAccuracy} size={100} strokeWidth={8} />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Structured Fields</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(data.fields).map(([key, value]) => {
                const confidence = data.confidence?.[key] || 0
                return (
                  <div key={key} className="p-4 rounded-lg bg-secondary border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-muted-foreground">{formatFieldName(key)}</div>
                      <div className="flex flex-row w-40 items-center gap-4">
                    <Progress value={confidence} className="h-1.5" />
                      <div className="text-sm font-semibold text-foreground">{Math.round(confidence)}%</div>
                      </div>
                    </div>
                    <div className="text-base text-foreground font-medium mb-2">{value}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Raw Extracted Text</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyRawText}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="p-4 rounded-lg bg-secondary border border-border">
              {data.rawText && data.rawText.trim() ? (
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{data.rawText}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No raw text available for this document</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Export Options</h3>
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleExportExcel} className="gap-2 cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export as Excel
          </Button>
          <Button onClick={handleExportPDF} variant="outline" className="gap-2 bg-transparent cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            Export as PDF
          </Button>
        </div>
      </Card>
    </div>
  )
}
