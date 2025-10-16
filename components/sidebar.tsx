"use client"

import { useState, useEffect } from "react"
import { FileText, Menu, X, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "@/components/theme-provider"
import { cn, formatDate } from "@/lib/utils"
import { ExtractedData } from "./document-processor"

interface SavedDocument {
  id: string
  document_name: string
  processed_at: string
  fields: Record<string, any>
  raw_text: string
  confidence?: Record<string, number>
  total_accuracy?: number
}

interface SidebarProps {
  onSelectDocument: (doc: ExtractedData) => void
  isOpen: boolean
  onToggle: () => void
}

export function Sidebar({ onSelectDocument, isOpen, onToggle }: SidebarProps) {
  const [documents, setDocuments] = useState<SavedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/get-history")
      const data = await response.json()
      if (data.history) {
        setDocuments(data.history)
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectDocument = (doc: SavedDocument) => {
    setSelectedId(doc.id)

    const transformedDoc: ExtractedData = {
      id: doc.id,
      document_name: doc.document_name,
      fields: doc.fields || {},
      confidence: doc.confidence || {},
      rawText: doc.raw_text || "",
      processedAt: doc.processed_at || new Date().toISOString(),
    }

    onSelectDocument(transformedDoc)
    if (window.innerWidth < 768) {
      onToggle()
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 right-4 z-50 md:hidden bg-transparent"
        onClick={onToggle}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={onToggle} />}

      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-background border-r border-border z-40 transition-transform duration-300 ease-in-out",
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-lg">Saved Documents</h2>
            <p className="text-sm text-muted-foreground">Your extraction history</p>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No saved documents yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleSelectDocument(doc)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-colors cursor-pointer",
                      "hover:bg-accent hover:text-accent-foreground",
                      selectedId === doc.id && "bg-accent text-accent-foreground",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{doc.document_name}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(doc.processed_at)}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <span className="text-sm font-medium">{theme === "dark" ? "Dark" : "Light"} Mode</span>
              </div>
              <Switch className="cursor-pointer" checked={theme === "light"} onCheckedChange={toggleTheme} />
            </div>
            <Button variant="outline" size="sm" className="w-full bg-transparent cursor-pointer" onClick={fetchDocuments}>
              Refresh List
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
