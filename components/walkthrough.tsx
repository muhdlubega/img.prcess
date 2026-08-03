"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { usePreferences } from "@/components/preferences-provider"
import { CLOSE_SIDEBAR_EVENT, OPEN_SIDEBAR_EVENT } from "@/components/walkthrough-host"
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
    href: "/",
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

interface CardPosition {
  top: number
  left: number
  width: number
  maxHeight: number
  placement: "center" | "anchor" | "sheet"
}

const MOBILE_BREAKPOINT = 768
const VIEW_MARGIN = 12
const GAP = 14
const HIGHLIGHT_PAD = 8

function isMobileViewport() {
  return typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function clampRect(rect: DOMRect, pad: number, maxBottom?: number): DOMRect {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const limitBottom = maxBottom ?? vh - VIEW_MARGIN
  const left = clamp(rect.left - pad, VIEW_MARGIN, vw - VIEW_MARGIN)
  const top = clamp(rect.top - pad, VIEW_MARGIN, Math.max(VIEW_MARGIN, limitBottom - 24))
  const right = clamp(rect.right + pad, left + 8, vw - VIEW_MARGIN)
  const bottom = clamp(rect.bottom + pad, top + 8, limitBottom)
  return new DOMRect(left, top, right - left, bottom - top)
}

function dispatchSidebar(open: boolean) {
  window.dispatchEvent(new Event(open ? OPEN_SIDEBAR_EVENT : CLOSE_SIDEBAR_EVENT))
}

export function Walkthrough({ open, onOpenChange }: WalkthroughProps) {
  const [step, setStep] = useState(0)
  const [highlight, setHighlight] = useState<DOMRect | null>(null)
  const [cardPos, setCardPos] = useState<CardPosition | null>(null)
  const { updatePreferences } = usePreferences()
  const router = useRouter()
  const pathname = usePathname()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const current = STEPS[step]

  const finish = useCallback(() => {
    updatePreferences({ walkthroughCompleted: true })
    onOpenChange(false)
    setStep(0)
    dispatchSidebar(false)
  }, [onOpenChange, updatePreferences])

  const next = useCallback(() => {
    if (step >= STEPS.length - 1) {
      finish()
      return
    }
    setStep((s) => s + 1)
  }, [finish, step])

  const back = useCallback(() => {
    setStep((s) => Math.max(0, s - 1))
  }, [])

  const placeCard = useCallback((targetRect: DOMRect | null) => {
    const card = cardRef.current
    if (!card) return

    const vw = window.innerWidth
    const vh = window.innerHeight
    const mobile = isMobileViewport()

    const cardWidth = Math.min(vw - VIEW_MARGIN * 2, mobile ? vw - VIEW_MARGIN * 2 : 384)
    // Prefer measured height; fall back until first layout paint.
    const measuredH = card.offsetHeight || 240

    if (mobile) {
      // Bottom sheet keeps the tip on-screen and leaves the upper area for the step target.
      const maxHeight = Math.min(measuredH, Math.floor(vh * 0.48))
      setCardPos({
        top: vh - maxHeight - VIEW_MARGIN,
        left: VIEW_MARGIN,
        width: cardWidth,
        maxHeight,
        placement: "sheet",
      })
      return
    }

    if (!targetRect) {
      const width = Math.min(384, vw - VIEW_MARGIN * 2)
      const height = Math.min(measuredH, vh - VIEW_MARGIN * 2)
      setCardPos({
        top: Math.max(VIEW_MARGIN, (vh - height) / 2),
        left: Math.max(VIEW_MARGIN, (vw - width) / 2),
        width,
        maxHeight: vh - VIEW_MARGIN * 2,
        placement: "center",
      })
      return
    }

    const width = Math.min(384, vw - VIEW_MARGIN * 2)
    const height = Math.min(measuredH, vh - VIEW_MARGIN * 2)
    const spaceBelow = vh - targetRect.bottom - GAP - VIEW_MARGIN
    const spaceAbove = targetRect.top - GAP - VIEW_MARGIN

    let top: number
    if (spaceBelow >= height || spaceBelow >= spaceAbove) {
      top = targetRect.bottom + GAP
    } else {
      top = targetRect.top - GAP - height
    }

    const preferredLeft = targetRect.left + targetRect.width / 2 - width / 2
    const left = clamp(preferredLeft, VIEW_MARGIN, vw - width - VIEW_MARGIN)
    top = clamp(top, VIEW_MARGIN, vh - height - VIEW_MARGIN)

    setCardPos({
      top,
      left,
      width,
      maxHeight: vh - VIEW_MARGIN * 2,
      placement: "anchor",
    })
  }, [])

  const remasure = useCallback(() => {
    const mobile = isMobileViewport()

    if (!current?.target) {
      setHighlight(null)
      requestAnimationFrame(() => placeCard(null))
      return
    }

    const el = document.querySelector<HTMLElement>(current.target)
    if (!el) {
      setHighlight(null)
      requestAnimationFrame(() => placeCard(null))
      return
    }

    const clamped = clampRect(
      el.getBoundingClientRect(),
      HIGHLIGHT_PAD,
      mobile ? Math.floor(window.innerHeight * 0.5) - VIEW_MARGIN : undefined,
    )
    setHighlight(clamped)
    requestAnimationFrame(() => placeCard(clamped))
  }, [current, placeCard])

  const focusStep = useCallback(async () => {
    if (!current) return

    const mobile = isMobileViewport()

    let el = current.target ? document.querySelector<HTMLElement>(current.target) : null
    const inSidebar = Boolean(el?.closest("#app-sidebar"))

    if (mobile) {
      dispatchSidebar(inSidebar)
      await new Promise((r) => setTimeout(r, inSidebar ? 320 : 80))
      el = current.target ? document.querySelector<HTMLElement>(current.target) : null
    } else {
      dispatchSidebar(false)
    }

    if (el) {
      const sheetReserve = mobile ? Math.floor(window.innerHeight * 0.5) : 0
      el.scrollIntoView({
        behavior: "smooth",
        block: mobile ? "start" : "center",
        inline: "nearest",
      })

      if (mobile) {
        await new Promise((r) => setTimeout(r, 280))
        const rect = el.getBoundingClientRect()
        const maxBottom = window.innerHeight - sheetReserve - VIEW_MARGIN
        if (rect.bottom > maxBottom || rect.top < VIEW_MARGIN + 48) {
          const delta = rect.top - (VIEW_MARGIN + 56)
          window.scrollBy({ top: delta, behavior: "smooth" })
          await new Promise((r) => setTimeout(r, 220))
        }
      } else {
        await new Promise((r) => setTimeout(r, 280))
      }
    }

    remasure()
  }, [current, remasure])

  useEffect(() => {
    if (!open) return
    let cancelled = false

    const go = async () => {
      if (current.href && pathname !== current.href) {
        router.push(current.href)
        await new Promise((r) => setTimeout(r, 380))
      }
      if (!cancelled) await focusStep()
    }

    void go()

    window.addEventListener("resize", remasure)
    window.addEventListener("scroll", remasure, true)
    return () => {
      cancelled = true
      window.removeEventListener("resize", remasure)
      window.removeEventListener("scroll", remasure, true)
    }
  }, [open, step, current, pathname, router, focusStep, remasure])

  useLayoutEffect(() => {
    if (!open) return
    placeCard(highlight)
  }, [open, highlight, step, placeCard, current?.body, current?.title])

  useEffect(() => {
    if (!open || !cardRef.current) return
    const observer = new ResizeObserver(() => placeCard(highlight))
    observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [open, highlight, placeCard])

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
  }, [open, finish, next, back])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="walkthrough-title">
      <button className="absolute inset-0 bg-black/65" onClick={finish} aria-label="Close walkthrough" />

      {highlight && (
        <div
          className="pointer-events-none absolute z-[101] rounded-xl ring-2 ring-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] transition-all duration-300"
          style={{
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
          }}
        />
      )}

      <div
        ref={cardRef}
        className={cn(
          "absolute z-[102] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-card p-5 shadow-2xl",
          "transition-[top,left,width,max-height] duration-300 ease-out",
          cardPos?.placement === "sheet" &&
            "rounded-t-2xl rounded-b-xl pb-[max(1.25rem,env(safe-area-inset-bottom))]",
          !cardPos && "left-1/2 top-1/2 w-[min(100%-1.5rem,24rem)] -translate-x-1/2 -translate-y-1/2",
        )}
        style={
          cardPos
            ? {
                top: cardPos.top,
                left: cardPos.left,
                width: cardPos.width,
                maxHeight: cardPos.maxHeight,
                transform: "none",
              }
            : undefined
        }
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-primary">
            <Route className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="text-xs font-medium uppercase tracking-wider" aria-live="polite">
              Product tour · {step + 1}/{STEPS.length}
            </span>
          </div>
          <Button
            ref={closeButtonRef}
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={finish}
            aria-label="Close walkthrough"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <h2 id="walkthrough-title" className="text-lg font-semibold tracking-tight text-foreground">
          {current.title}
        </h2>
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
