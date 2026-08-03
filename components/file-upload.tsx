"use client"

import type React from "react"
import { useCallback, useId, useState } from "react"
import { FileImage, FileSpreadsheet, FolderUp } from "lucide-react"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import type { DocumentType } from "@/lib/types"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onFileSelect: (file: File) => void
  accept: string
  documentType: DocumentType
  disabled?: boolean
}

export function FileUpload({ onFileSelect, accept, documentType, disabled }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputId = useId()

  const isCsv = documentType === "csv" || accept.includes(".csv")

  const matchesAccept = (file: File) => {
    if (isCsv && (file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv"))) {
      return true
    }
    if (file.type.startsWith("image/")) return true
    if (documentType === "custom") {
      return (
        file.type.startsWith("image/") ||
        file.type === "text/csv" ||
        file.name.toLowerCase().endsWith(".csv")
      )
    }
    return file.type.startsWith("image/")
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true)
    } else if (e.type === "dragleave") {
      setIsDragging(false)
    }
  }, [disabled])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      if (disabled) return

      const files = Array.from(e.dataTransfer.files)
      const match = files.find(matchesAccept)
      if (match) onFileSelect(match)
    },
    [onFileSelect, disabled, documentType, accept],
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && matchesAccept(file)) {
      onFileSelect(file)
    }
    e.target.value = ""
  }

  return (
    <Card
      role="region"
      aria-label={documentType === "csv" ? "CSV file upload" : "Document file upload"}
      className={cn(
        "group p-8 border-2 border-dashed transition-all duration-300",
        isDragging
          ? "scale-[1.01] border-primary bg-primary/8 shadow-lg"
          : "border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg",
        disabled && "opacity-60 pointer-events-none",
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-all duration-300 group-hover:scale-105 group-hover:bg-primary/15">
          {isCsv && documentType === "csv" ? (
            <FileSpreadsheet className="h-7 w-7 text-primary transition-transform duration-300 group-hover:-rotate-3" aria-hidden="true" />
          ) : (
            <FileImage className="h-7 w-7 text-primary transition-transform duration-300 group-hover:-rotate-3" aria-hidden="true" />
          )}
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold text-foreground tracking-tight">
            {documentType === "csv" ? "Add a CSV file" : "Add a document image"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            {documentType === "csv"
              ? "Drop it here or browse your device. We will inspect the columns before answering your question."
              : "Drop an image here or browse your device. JPG and PNG work best."}
          </p>
        </div>

        <Button asChild size="lg" className="group/button gap-2 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0">
          <label className="cursor-pointer" htmlFor={inputId}>
            <FolderUp className="h-4 w-4 transition-transform group-hover/button:-translate-y-0.5" aria-hidden="true" />
            <input
              id={inputId}
              type="file"
              className="sr-only"
              accept={accept}
              onChange={handleFileInput}
              disabled={disabled}
            />
            Browse files
          </label>
        </Button>

        <p className="text-xs text-muted-foreground">Maximum file size: 10MB</p>
      </div>
    </Card>
  )
}
