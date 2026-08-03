"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { usePreferences } from "@/components/preferences-provider"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Route, X } from "lucide-react"

interface TourStep {
  id: string
  title: string
  body: string
  /** Optional CSS selector / data-tour target */
  target?: string
  href?: string
}

const STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to IMG.prcess",
    body: "Turn a CSV or document into useful answers, charts, and structured data. This short tour shows where everything lives.",
  },
  {
    id: "doc-type",
    title: "Choose a document type",
    body: "Pick CSV for spreadsheets, or Invoice / Receipt / ID for specialized extraction. Custom lets you define your own rules.",
    target: "[data-tour='document-type']",
    href: "/",
  },
  {
    id: "upload",
    title: "Upload your file",
    body: "Drag and drop or browse. CSV for analysis questions; images for OCR and document extraction. Max 10MB.",
    target: "[data-tour='upload']",
    href: "/",
  },
  {
    id: "prompts",
    title: "Tell it what you need",
    body: "Describe what to extract, then ask a direct question, such as “Why did sales drop in March?” We will organize the data and explain what stands out.",
    target: "[data-tour='prompts']",
    href: "/",
  },
  {
    id: "run",
    title: "Start the analysis",
    body: "Select Analyze file to start. Results include the main findings, useful charts, structured fields, and export options.",
    target: "[data-tour='run-analysis']",
    href: "/",
  },
  {
    id: "history",
    title: "History sidebar",
    body: "Past analyses are listed here. Click any item to reopen it. Use Refresh to sync the latest saves.",
    target: "[data-tour='history']",
    href: "/",
  },
  {
    id: "settings",
    title: "Settings & API",
    body: "Tune response style, charts, and defaults. You can also use your own API key from OpenAI, Claude, Gemini, Grok, DeepSeek, or Mistral. Keys stay in memory for this session only.",
    target: "[data-tour='nav-settings']",
    href: "/settings",
  },
  {
    id: "api",
    title: "Bring your own key",
    body: "Under Preferences, choose a provider (OpenAI, Claude, Gemini, Grok, DeepSeek, or Mistral), paste your key, and pick a model. The key is held in memory until you close the tab. It is not saved to disk, localStorage, or the database.",
    target: "[data-tour='api-settings']",
    href: "/settings",
  },
]

interface WalkthroughProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function Walkthrough({ open, onOpenChange }: WalkthroughProps) {
  const [step, setStep] = useState(0)
  const [highlight, setHighlight] = useState<DOMRect | null>(null)
  const { updatePreferences } = usePreferences()
  const router = useRouter()
  const pathname = usePathname()
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const current = STEPS[step]

  const measureTarget = useCallback(() => {
    if (!current?.target) {
      setHighlight(null)
      return
    }
    const el = document.querySelector(current.target)
    if (el) {
      setHighlight(el.getBoundingClientRect())
    } else {
      setHighlight(null)
    }
  }, [current])

  useEffect(() => {
    if (!open) return
    let cancelled = false

    const go = async () => {
      if (current.href && pathname !== current.href) {
        router.push(current.href)
        await new Promise((r) => setTimeout(r, 350))
      }
      if (!cancelled) {
        requestAnimationFrame(measureTarget)
      }
    }

    void go()
    window.addEventListener("resize", measureTarget)
    window.addEventListener("scroll", measureTarget, true)
    return () => {
      cancelled = true
      window.removeEventListener("resize", measureTarget)
      window.removeEventListener("scroll", measureTarget, true)
    }
  }, [open, step, current, pathname, router, measureTarget])

  useEffect(() => {
    if (!open) return
    closeButtonRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish()
      if (event.key === "ArrowRight") next()
      if (event.key === "ArrowLeft") back()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  })

  const finish = () => {
    updatePreferences({ walkthroughCompleted: true })
    onOpenChange(false)
    setStep(0)
  }

  const next = () => {
    if (step >= STEPS.length - 1) {
      finish()
      return
    }
    setStep((s) => s + 1)
  }

  const back = () => {
    setStep((s) => Math.max(0, s - 1))
  }

  if (!open) return null

  const pad = 8

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-labelledby="walkthrough-title">
      <button className="absolute inset-0 bg-black/65" onClick={finish} aria-label="Close walkthrough" />

      {highlight && (
        <div
          className="pointer-events-none absolute z-[101] rounded-xl ring-2 ring-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] transition-all duration-300"
          style={{
            top: highlight.top - pad,
            left: highlight.left - pad,
            width: highlight.width + pad * 2,
            height: highlight.height + pad * 2,
          }}
        />
      )}

      <div
        className="absolute z-[102] w-[min(100%-2rem,24rem)] rounded-2xl border border-border bg-card p-5 shadow-2xl left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={
          highlight
            ? (() => {
                const below = highlight.bottom + 16
                const spaceBelow = window.innerHeight - below
                const cardH = 220
                if (spaceBelow > cardH) {
                  return {
                    top: below,
                    left: Math.min(
                      Math.max(16, highlight.left + highlight.width / 2 - 192),
                      window.innerWidth - 400,
                    ),
                    transform: "none",
                  }
                }
                return {
                  top: Math.max(16, highlight.top - cardH - 16),
                  left: Math.min(
                    Math.max(16, highlight.left + highlight.width / 2 - 192),
                    window.innerWidth - 400,
                  ),
                  transform: "none",
                }
              })()
            : undefined
        }
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-primary">
            <Route className="h-4 w-4" aria-hidden="true" />
            <span className="text-xs font-medium uppercase tracking-wider" aria-live="polite">
              Product tour · {step + 1}/{STEPS.length}
            </span>
          </div>
          <Button ref={closeButtonRef} variant="ghost" size="icon" className="h-7 w-7" onClick={finish} aria-label="Close walkthrough">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <h2 id="walkthrough-title" className="text-lg font-semibold tracking-tight text-foreground">{current.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{current.body}</p>

        <div className="mt-4 mb-4 flex gap-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              aria-hidden="true"
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={back} disabled={step === 0} className="gap-1">
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={finish}>
              Skip
            </Button>
            <Button size="sm" onClick={next} className="gap-1">
              {step >= STEPS.length - 1 ? "Done" : "Next"}
              {step < STEPS.length - 1 && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
