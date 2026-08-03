"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useState } from "react"
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
} from "@/lib/preferences"
import type { UserPreferences } from "@/lib/types"

interface PreferencesContextType {
  preferences: UserPreferences
  updatePreferences: (patch: Partial<UserPreferences>) => void
  resetPreferences: () => void
  mounted: boolean
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined)

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setPreferences(loadPreferences())
    setMounted(true)
  }, [])

  const updatePreferences = useCallback((patch: Partial<UserPreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...patch }
      savePreferences(next)
      return next
    })
  }, [])

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES)
    savePreferences(DEFAULT_PREFERENCES)
  }, [])

  return (
    <PreferencesContext.Provider
      value={{ preferences, updatePreferences, resetPreferences, mounted }}
    >
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider")
  }
  return context
}
