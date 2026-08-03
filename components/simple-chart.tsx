"use client"

import type { ChartSpec } from "@/lib/types"
import { cn } from "@/lib/utils"

interface SimpleChartProps {
  chart: ChartSpec
  className?: string
}

export function SimpleChart({ chart, className }: SimpleChartProps) {
  const values = chart.data.map((d) => d.value)
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = Math.max(max - min, 1)
  const width = 400
  const height = 180
  const padX = 28
  const padY = 20
  const plotW = width - padX * 2
  const plotH = height - padY * 2

  if (chart.type === "line" && chart.data.length > 1) {
    const points = chart.data
      .map((d, i) => {
        const x = padX + (i / (chart.data.length - 1)) * plotW
        const y = padY + plotH - ((d.value - min) / range) * plotH
        return `${x},${y}`
      })
      .join(" ")

    return (
      <div className={cn("rounded-lg border border-border bg-secondary/40 p-4", className)}>
        <h4 className="mb-3 text-sm font-semibold text-foreground">{chart.title}</h4>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label={chart.title}>
          <polyline
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={points}
          />
          {chart.data.map((d, i) => {
            const x = padX + (i / (chart.data.length - 1)) * plotW
            const y = padY + plotH - ((d.value - min) / range) * plotH
            return <circle key={d.label + i} cx={x} cy={y} r="3.5" fill="var(--primary)" />
          })}
        </svg>
        <div className="mt-2 flex justify-between gap-1 text-[10px] text-muted-foreground">
          {chart.data.map((d) => (
            <span key={d.label} className="truncate max-w-[4.5rem] text-center">
              {d.label}
            </span>
          ))}
        </div>
        {(chart.xLabel || chart.yLabel) && (
          <p className="mt-2 text-xs text-muted-foreground">
            {[chart.xLabel, chart.yLabel].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={cn("rounded-lg border border-border bg-secondary/40 p-4", className)}>
      <h4 className="mb-3 text-sm font-semibold text-foreground">{chart.title}</h4>
      <div className="flex items-end gap-2 h-40">
        {chart.data.map((d) => {
          const pct = Math.max(((d.value - min) / range) * 100, 4)
          return (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5 min-w-0 h-full justify-end">
              <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                {Number.isInteger(d.value) ? d.value : d.value.toFixed(1)}
              </span>
              <div
                className="w-full max-w-10 rounded-t-sm bg-primary/80 transition-all"
                style={{ height: `${pct}%` }}
                title={`${d.label}: ${d.value}`}
              />
              <span className="text-[10px] text-muted-foreground truncate w-full text-center">{d.label}</span>
            </div>
          )
        })}
      </div>
      {(chart.xLabel || chart.yLabel) && (
        <p className="mt-2 text-xs text-muted-foreground">
          {[chart.xLabel, chart.yLabel].filter(Boolean).join(" · ")}
        </p>
      )}
    </div>
  )
}
