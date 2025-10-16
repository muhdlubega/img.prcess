"use client"

import { useState, useEffect } from "react"
import { FileUpload } from "./file-upload"
import { ProcessingStatus } from "./processing-status"
import { DataDisplay } from "./data-display"
import { Card } from "./ui/card"
import logo from '../public/logo.png'

export interface ExtractedData {
  id?: string
  document_name?: string
  fields: Record<string, string | number>
  confidence?: Record<string, number>
  rawText: string
  processedAt: string
  imageUrl?: string
}

interface DocumentProcessorProps {
  selectedDocument?: ExtractedData | null
}

export function DocumentProcessor({ selectedDocument }: DocumentProcessorProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [documentName, setDocumentName] = useState("")

  useEffect(() => {
    if (selectedDocument) {
      setExtractedData(selectedDocument)
      setDocumentName(selectedDocument.document_name || "")
      setUploadedFile(null)
      setError(null)
      setIsProcessing(false)
    }
  }, [selectedDocument])

  const handleFileSelect = async (file: File) => {
    setUploadedFile(file)
    setExtractedData(null)
    setError(null)
    setIsProcessing(true)
    setDocumentName(file.name.replace(/\.[^/.]+$/, ""))

    try {
      const base64 = await fileToBase64(file)

      const response = await fetch("/api/process-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: base64 }),
      })

      if (!response.ok) {
        throw new Error("Failed to process document")
      }

      const data = await response.json()
      setExtractedData(data)

      const saveResponse = await fetch("/api/save-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          document_name: documentName || file.name.replace(/\.[^/.]+$/, ""),
          confidence: data.confidence,
        }),
      })

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json()
        setError(
          `Document processed but failed to save: ${errorData.details || errorData.error}. ${errorData.hint || ""}`,
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setUploadedFile(null)
    setExtractedData(null)
    setError(null)
    setIsProcessing(false)
    setDocumentName("")
  }

  const handleDocumentNameChange = (name: string) => {
    setDocumentName(name)
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <div
          className={`transition-all duration-700 ease-in-out ${
            extractedData ? "flex items-start justify-start gap-3" : "flex flex-col items-center"
          }`}
        >
          <div className="relative">
            <img src={logo.src} className={`transition-all duration-700 ${
                extractedData ? "w-24" : "w-56 mt-16 mb-12"
              } text-primary animate-spin-slow`} />
          </div>
          <div className={extractedData ? "text-left" : "text-center"}>
            <h1 className="text-4xl font-bold text-foreground mb-3 text-balance"><span className="text-[#5b9385] font-extrabold text-5xl">IMG</span>.prcess</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Upload document images and extract structured data with AI-powered analysis
            </p>
          </div>
        </div>
      </div>

      {!uploadedFile && !isProcessing && !extractedData && <FileUpload onFileSelect={handleFileSelect} />}

      {isProcessing && (
        <Card className="p-8">
          <ProcessingStatus fileName={uploadedFile?.name || ""} />
        </Card>
      )}

      {error && (
        <Card className="p-6 border-destructive">
          <div className="flex items-start gap-3">
            <div className="text-destructive">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-destructive mb-1">Error</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {extractedData && (
        <DataDisplay
        data={extractedData}
        onReset={handleReset}
        documentName={documentName}
        onDocumentNameChange={handleDocumentNameChange}
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
      const base64 = result.split(",")[1]
      resolve(base64)
    }
    reader.onerror = reject
  })
}
