"use client"

import { Spinner } from "./ui/spinner"

interface ProcessingStatusProps {
  fileName: string
}

export function ProcessingStatus({ fileName }: ProcessingStatusProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8">
      <Spinner className="w-12 h-12 text-primary" />

      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-foreground">Processing Document</h3>
        <p className="text-muted-foreground leading-relaxed">
          Analyzing <span className="font-medium text-foreground">{fileName}</span> with AI...
        </p>
      </div>

      <div className="flex flex-col gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>Extracting text and data</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse delay-150" />
          <span>Structuring information</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse delay-300" />
          <span>Preparing results</span>
        </div>
      </div>
    </div>
  )
}
