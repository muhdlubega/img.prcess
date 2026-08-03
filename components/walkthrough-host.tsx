"use client"

import { useEffect, useState } from "react"
import { Walkthrough } from "@/components/walkthrough"
import { usePreferences } from "@/components/preferences-provider"

export const WALKTHROUGH_EVENT = "img-prcess:start-walkthrough"
export const OPEN_SIDEBAR_EVENT = "img-prcess:open-sidebar"
export const CLOSE_SIDEBAR_EVENT = "img-prcess:close-sidebar"

export function startWalkthrough() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(WALKTHROUGH_EVENT))
  }
}

export function WalkthroughHost() {
  const { preferences, mounted } = usePreferences()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!mounted) return
    if (!preferences.walkthroughCompleted) {
      const t = setTimeout(() => setOpen(true), 600)
      return () => clearTimeout(t)
    }
  }, [mounted, preferences.walkthroughCompleted])

  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener(WALKTHROUGH_EVENT, handler)
    return () => window.removeEventListener(WALKTHROUGH_EVENT, handler)
  }, [])

  return <Walkthrough open={open} onOpenChange={setOpen} />
}
