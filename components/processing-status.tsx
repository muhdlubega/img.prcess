"use client"

import {
  BarChart3,
  Check,
  FileSearch,
  LoaderCircle,
  MessageSquareText,
  Rows3,
  Sigma,
} from "lucide-react"
import { cn } from "@/lib/utils"

const STEPS = [
  { id: "clean", label: "Reviewing the file", icon: FileSearch },
  { id: "code", label: "Organizing the data", icon: Rows3 },
  { id: "run", label: "Checking the numbers", icon: Sigma },
  { id: "chart", label: "Preparing visuals", icon: BarChart3 },
  { id: "explain", label: "Writing the findings", icon: MessageSquareText },
] as const

interface ProcessingStatusProps {
  fileName: string
  activeStep?: number
  question?: string
}

export function ProcessingStatus({ fileName, activeStep = 0, question }: ProcessingStatusProps) {
  return (
    <div className="flex flex-col gap-8 py-4" role="status" aria-live="polite">
      <div className="text-center space-y-2">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <LoaderCircle className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
        </div>
        <h3 className="text-xl font-semibold tracking-tight text-foreground">Analyzing</h3>
        <p className="text-sm text-muted-foreground">
          Working on <span className="font-medium text-foreground">{fileName}</span>
        </p>
        {question && (
          <p className="mx-auto max-w-lg text-sm text-muted-foreground italic">
            &ldquo;{question}&rdquo;
          </p>
        )}
      </div>

      <ol className="mx-auto w-full max-w-md space-y-3">
        {STEPS.map((step, index) => {
          const StepIcon = step.icon
          const done = index < activeStep
          const current = index === activeStep
          return (
            <li
              key={step.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-all duration-300",
                current && "border-primary/40 bg-primary/5 text-foreground",
                done && "border-border bg-secondary/50 text-muted-foreground",
                !done && !current && "border-transparent text-muted-foreground/50",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  done && "bg-primary text-primary-foreground",
                  current && "bg-primary/20 text-primary",
                  !done && !current && "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <StepIcon className="h-3.5 w-3.5" aria-hidden="true" />}
              </span>
              <span className={cn(current && "font-medium")}>{step.label}</span>
              {current && <LoaderCircle className="ml-auto h-3.5 w-3.5 animate-spin text-primary" aria-hidden="true" />}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
