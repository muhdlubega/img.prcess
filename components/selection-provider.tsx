"use client"

import type React from "react"
import { createContext, useCallback, useContext, useState } from "react"
import type { ExtractedData } from "@/lib/types"

interface SelectionContextType {
  selectedDocument: ExtractedData | null
  selectDocument: (doc: ExtractedData) => void
  clearSelection: () => void
  /** Increments whenever history should be reloaded (e.g. after a successful save). */
  historyVersion: number
  /** Most recently saved document id, used to highlight it in the sidebar. */
  lastSavedId: string | null
  notifyHistoryChanged: (savedId?: string) => void
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined)

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedDocument, setSelectedDocument] = useState<ExtractedData | null>(null)
  const [historyVersion, setHistoryVersion] = useState(0)
  const [lastSavedId, setLastSavedId] = useState<string | null>(null)

  const selectDocument = useCallback((doc: ExtractedData) => {
    setSelectedDocument(doc)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedDocument(null)
  }, [])

  const notifyHistoryChanged = useCallback((savedId?: string) => {
    if (savedId) setLastSavedId(savedId)
    setHistoryVersion((v) => v + 1)
  }, [])

  return (
    <SelectionContext.Provider
      value={{
        selectedDocument,
        selectDocument,
        clearSelection,
        historyVersion,
        lastSavedId,
        notifyHistoryChanged,
      }}
    >
      {children}
    </SelectionContext.Provider>
  )
}

export function useSelection() {
  const context = useContext(SelectionContext)
  if (!context) {
    throw new Error("useSelection must be used within a SelectionProvider")
  }
  return context
}
