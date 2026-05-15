"use client"

import type { Sensor } from "@/lib/types"
import { Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"

type LightPhase = "vegetativa" | "floracao" | "desconhecido"

function detectPhase(hoursOn: number): LightPhase {
  if (hoursOn >= 17 && hoursOn <= 19) return "vegetativa" // ~18/6
  if (hoursOn >= 11 && hoursOn <= 13) return "floracao"   // ~12/12
  return "desconhecido"
}

/**
 * Estima horas de luz ligada no dia de hoje a partir dos registros de luminosidade.
 * Considera "luz ligada" quando lux > threshold.
 */
function estimateLightHours(sensors: Sensor[], threshold = 100): number {
  const todayStr = new Date().toDateString()
  const todayReadings = sensors
    .filter((s) => s.type === "luminosidade" && new Date(s.recorded_at).toDateString() === todayStr)
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())

  if (todayReadings.length < 2) return 0

  // Integra intervalos em que lux > threshold
  let lightMs = 0
  for (let i = 1; i < todayReadings.length; i++) {
    const prev = todayReadings[i - 1]
    const curr = todayReadings[i]
    if (Number(prev.value) > threshold && Number(curr.value) > threshold) {
      lightMs += new Date(curr.recorded_at).getTime() - new Date(prev.recorded_at).getTime()
    }
  }
  return lightMs / 1000 / 3600
}

const phaseConfig: Record<LightPhase, { label: string; desc: string; on: number; off: number; color: string }> = {
  vegetativa: { label: "Vegetativa", desc: "18h luz / 6h escuro", on: 18, off: 6, color: "text-emerald-400" },
  floracao: { label: "Floração", desc: "12h luz / 12h escuro", on: 12, off: 12, color: "text-amber-400" },
  desconhecido: { label: "Indefinido", desc: "Ciclo não reconhecido", on: 0, off: 0, color: "text-muted-foreground" },
}

export function LightCycleBlock({ sensors }: { sensors: Sensor[] }) {
  const latestLux = sensors
    .filter((s) => s.type === "luminosidade")
    .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())[0]

  const currentLux = latestLux ? Number(latestLux.value) : 0
  const isOn = currentLux > 100
  const hoursOn = estimateLightHours(sensors)
  const phase = detectPhase(hoursOn)
  const cfg = phaseConfig[phase]

  // Progresso do ciclo (0–1) baseado em horas ligada sobre o total do ciclo esperado
  const cycleTotal = cfg.on + cfg.off || 24
  const progress = Math.min(hoursOn / cycleTotal, 1)

  return (
    <div className="flex flex-col gap-4">
      {/* Status atual */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isOn ? (
            <Sun className="h-5 w-5 text-amber-400 animate-pulse" />
          ) : (
            <Moon className="h-5 w-5 text-slate-400" />
          )}
          <span className="text-sm font-medium">{isOn ? "Luz ligada" : "Luz apagada"}</span>
        </div>
        <span className="text-sm text-muted-foreground">{currentLux.toFixed(0)} lux</span>
      </div>

      {/* Fase */}
      <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
        <div>
          <p className={cn("text-sm font-medium", cfg.color)}>{cfg.label}</p>
          <p className="text-xs text-muted-foreground">{cfg.desc}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold">{hoursOn.toFixed(1)}h</p>
          <p className="text-xs text-muted-foreground">hoje ligada</p>
        </div>
      </div>

      {/* Barra de ciclo 24h */}
      <div>
        <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
          <span>0h</span>
          <span>Ciclo diário</span>
          <span>24h</span>
        </div>
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-border/50">
          {/* Zona de luz esperada */}
          {cfg.on > 0 && (
            <div
              className="absolute top-0 h-full rounded-full bg-amber-500/20"
              style={{ width: `${(cfg.on / 24) * 100}%` }}
            />
          )}
          {/* Progresso atual */}
          <div
            className="absolute top-0 h-full rounded-full bg-amber-400 transition-all duration-700"
            style={{ width: `${progress * (cfg.on / 24) * 100}%` }}
          />
        </div>
        <div className="mt-1 flex gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
            Ligada: {cfg.on}h
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-border" />
            Escuro: {cfg.off}h
          </span>
        </div>
      </div>
    </div>
  )
}