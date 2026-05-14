"use client"

import type { Plant } from "@/lib/types"
import { cn } from "@/lib/utils"

export function PlantMap({ plants }: { plants: Plant[] }) {
  return (
    <div className="relative h-64 w-full rounded-md border border-border bg-muted/30 overflow-hidden">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      {plants.map((p) => {
        const x = Math.max(0, Math.min(100, Number(p.position_x)))
        const y = Math.max(0, Math.min(100, Number(p.position_y)))
        const color =
          p.status === "critical"
            ? "bg-destructive"
            : p.status === "warning"
              ? "bg-chart-4"
              : "bg-primary"
        return (
          <div
            key={p.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <div className={cn("h-3 w-3 rounded-full ring-4 ring-background", color)} />
            <div className="absolute left-4 top-0 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100">
              {p.name} · {p.health_score}%
            </div>
          </div>
        )
      })}
      {plants.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          Nenhuma planta cadastrada
        </div>
      )}
    </div>
  )
}
