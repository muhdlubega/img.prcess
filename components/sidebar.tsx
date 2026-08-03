"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  ChartNoAxesCombined,
  Clock3,
  FileChartColumn,
  Menu,
  Moon,
  PanelLeftClose,
  RefreshCw,
  ScanSearch,
  SlidersHorizontal,
  Sun,
  Telescope,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "@/components/theme-provider"
import { startWalkthrough } from "@/components/walkthrough-host"
import { useSelection } from "@/components/selection-provider"
import { cn, formatDate } from "@/lib/utils"
import type { ExtractedData } from "@/lib/types"

interface SavedDocument {
  id: string
  document_name: string
  processed_at: string
  fields: Record<string, string | number>
  raw_text: string
  confidence?: Record<string, number>
  total_accuracy?: number
}

interface SidebarProps {
  onSelectDocument: (doc: ExtractedData) => void
  isOpen: boolean
  onToggle: () => void
}

const NAV = [
  { href: "/", label: "Workspace", icon: ChartNoAxesCombined },
  { href: "/settings", label: "Preferences", icon: SlidersHorizontal },
] as const

export function Sidebar({ onSelectDocument, isOpen, onToggle }: SidebarProps) {
  const [documents, setDocuments] = useState<SavedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()
  const { historyVersion, lastSavedId } = useSelection()

  const fetchDocuments = async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) setLoading(true)
    try {
      const response = await fetch("/api/get-history")
      const data = await response.json()
      if (data.history) setDocuments(data.history)
    } catch {
      // history is non-critical
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  useEffect(() => {
    if (historyVersion === 0) return
    fetchDocuments({ quiet: true })
  }, [historyVersion])

  useEffect(() => {
    if (lastSavedId) setSelectedId(lastSavedId)
  }, [lastSavedId])

  const handleSelectDocument = (doc: SavedDocument) => {
    setSelectedId(doc.id)

    const fields = { ...(doc.fields || {}) }
    let analysis: ExtractedData["analysis"]
    let question: string | undefined
    let documentType: ExtractedData["documentType"]

    if (typeof fields.__analysis === "string") {
      try {
        analysis = JSON.parse(fields.__analysis)
      } catch {
        analysis = undefined
      }
      delete fields.__analysis
    }
    if (typeof fields.__question === "string") {
      question = fields.__question
      delete fields.__question
    }
    if (typeof fields.__document_type === "string") {
      documentType = fields.__document_type as ExtractedData["documentType"]
      delete fields.__document_type
    }

    const transformedDoc: ExtractedData = {
      id: doc.id,
      document_name: doc.document_name,
      fields,
      confidence: doc.confidence || {},
      rawText: doc.raw_text || "",
      processedAt: doc.processed_at || new Date().toISOString(),
      analysis,
      question,
      documentType,
    }

    onSelectDocument(transformedDoc)
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      onToggle()
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 right-4 z-50 bg-background/80 backdrop-blur transition-transform hover:scale-105 active:scale-95 md:hidden"
        onClick={onToggle}
        aria-label={isOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={isOpen}
        aria-controls="app-sidebar"
      >
        {isOpen ? <PanelLeftClose className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px] md:hidden"
          onClick={onToggle}
          aria-label="Close navigation"
        />
      )}

      <aside
        id="app-sidebar"
        aria-label="Primary navigation"
        className={cn(
          "fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-in-out",
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="border-b border-sidebar-border px-4 py-4">
          <Link
            href="/"
            className="group flex items-center gap-3 rounded-xl p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => pathname !== "/" && selectedId && setSelectedId(null)}
            aria-label="IMG.prcess home"
          >
            <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/8 ring-1 ring-primary/15 transition-all duration-300 group-hover:scale-105 group-hover:bg-primary/12 group-hover:ring-primary/30">
              <Image
                src="/logo.png"
                alt=""
                width={40}
                height={40}
                priority
                className="size-10 object-contain animate-spin-slow"
              />
            </span>
            <span className="min-w-0">
              <span className="block text-lg font-semibold tracking-tight">
                <span className="text-primary">IMG</span>
                <span className="text-sidebar-foreground/70">.prcess</span>
              </span>
              <span className="block text-xs text-muted-foreground">Document intelligence</span>
            </span>
          </Link>
        </div>

        <nav className="space-y-1 px-3 py-4">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                data-tour={href === "/settings" ? "nav-settings" : "nav-analyze"}
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  if (window.innerWidth < 768) onToggle()
                }}
                className={cn(
                  "group flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:translate-x-0.5 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <Icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="mx-3 mb-2 flex items-center gap-2 px-3 pt-2" data-tour="history">
          <Clock3 className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            History
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2" data-tour="history-list">
          {loading ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground" role="status">Loading history...</p>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
              <FileChartColumn className="mb-2 h-7 w-7 text-muted-foreground/60" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">Your recent work will appear here</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => handleSelectDocument(doc)}
                  className={cn(
                    "group w-full rounded-lg p-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    "hover:translate-x-0.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    selectedId === doc.id && "bg-sidebar-accent text-sidebar-accent-foreground",
                  )}
                >
                  <div className="flex items-start gap-2">
                    <ScanSearch className="mt-0.5 h-4 w-4 shrink-0 opacity-70 transition-transform group-hover:scale-110" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{doc.document_name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDate(doc.processed_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 border-t border-sidebar-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {theme === "dark" ? <Moon className="h-4 w-4" aria-hidden="true" /> : <Sun className="h-4 w-4" aria-hidden="true" />}
              <span className="text-sm">{theme === "dark" ? "Dark" : "Light"}</span>
            </div>
            <Switch
              checked={theme === "light"}
              onCheckedChange={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={() => {
              startWalkthrough()
              if (typeof window !== "undefined" && window.innerWidth < 768) onToggle()
            }}
          >
            <Telescope className="h-3.5 w-3.5" aria-hidden="true" />
            Take a tour
          </Button>
          <Button variant="outline" size="sm" className="group w-full" onClick={() => fetchDocuments()}>
            <RefreshCw className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-180" aria-hidden="true" />
            Refresh
          </Button>
        </div>
      </aside>
    </>
  )
}
