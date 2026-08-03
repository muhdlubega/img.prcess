"use client"

import type React from "react"
import { createContext, useCallback, useContext, useState } from "react"
import {
  BUILTIN_MODEL,
  BUILTIN_PROVIDER,
  defaultModelForProvider,
  type AiProviderId,
  type ApiMode,
} from "@/lib/models"

interface ApiSessionContextType {
  apiMode: ApiMode
  setApiMode: (mode: ApiMode) => void
  selectedProvider: AiProviderId
  setSelectedProvider: (provider: AiProviderId, options?: { clearKey?: boolean }) => void
  /** In-memory only. Never written to localStorage, cookies, or the database. */
  apiKey: string
  setApiKey: (key: string) => void
  clearApiKey: () => void
  selectedModel: string
  setSelectedModel: (model: string) => void
  hasCustomKey: boolean
}

const ApiSessionContext = createContext<ApiSessionContextType | undefined>(undefined)

export function ApiSessionProvider({ children }: { children: React.ReactNode }) {
  const [apiMode, setApiMode] = useState<ApiMode>("builtin")
  const [selectedProvider, setSelectedProviderState] = useState<AiProviderId>(BUILTIN_PROVIDER)
  const [apiKey, setApiKeyState] = useState("")
  const [selectedModel, setSelectedModel] = useState(BUILTIN_MODEL)

  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key)
  }, [])

  const setSelectedProvider = useCallback(
    (provider: AiProviderId, options?: { clearKey?: boolean }) => {
      setSelectedProviderState((current) => {
        if (current !== provider) {
          setSelectedModel(defaultModelForProvider(provider))
          if (options?.clearKey !== false) {
            setApiKeyState("")
          }
        }
        return provider
      })
    },
    [],
  )

  const clearApiKey = useCallback(() => {
    setApiKeyState("")
    setApiMode("builtin")
    setSelectedProviderState(BUILTIN_PROVIDER)
    setSelectedModel(BUILTIN_MODEL)
  }, [])

  return (
    <ApiSessionContext.Provider
      value={{
        apiMode,
        setApiMode,
        selectedProvider,
        setSelectedProvider,
        apiKey,
        setApiKey,
        clearApiKey,
        selectedModel,
        setSelectedModel,
        hasCustomKey: apiKey.trim().length > 0,
      }}
    >
      {children}
    </ApiSessionContext.Provider>
  )
}

export function useApiSession() {
  const context = useContext(ApiSessionContext)
  if (!context) {
    throw new Error("useApiSession must be used within an ApiSessionProvider")
  }
  return context
}
