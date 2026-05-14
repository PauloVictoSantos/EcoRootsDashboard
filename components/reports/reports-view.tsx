"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Plant, AIReport, Sensor, Actuator } from "@/lib/types"
import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import {
  Leaf, AlertTriangle, CheckCircle2, Sparkles, Calendar,
  Activity, Thermometer, Zap, TrendingUp, ChevronDown,
  ChevronUp, X, MapPin, Bell, Eye, ArrowUpRight, ArrowDownRight,
  Minus, Clock, Target, Sprout,
} from "lucide-react"
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Period = "7d" | "30d" | "90d" | "all"

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "7d", "30d": "30d", "90d": "90d", all: "Tudo",
}

// Grupos de sensores por unidade para gráficos separados
const SENSOR_GROUPS: { label: string; types: string[]; unit: string; color: string }[] = [
  { label: "Umidade", types: ["umidade", "umidade_solo", "umidade_ar"], unit: "%", color: "#22d3ee" },
  { label: "Temperatura", types: ["temperatura"], unit: "°C", color: "#f97316" },
  { label: "Luminosidade", types: ["luminosidade", "lux", "uv"], unit: "lux", color: "#facc15" },
  { label: "pH", types: ["ph", "ph_solo"], unit: "pH", color: "#a78bfa" },
  { label: "Pressão", types: ["pressao"], unit: "hPa", color: "#fb7185" },
]

export type RawResponse = {
  next_action?: string
  growth_stage?: string
  status?: string
}
export interface AIReport {
  id: string
  created_at: string
  health_score?: number
  summary?: string
  problems: string[]
  recommendations: string[]

  raw_response?: RawResponse
}
function getSensorGroup(type: string) {
  return SENSOR_GROUPS.find((g) => g.types.includes(type.toLowerCase()))
}

function filterByPeriod<T extends { created_at?: string; recorded_at?: string }>(items: T[], period: Period): T[] {
  if (period === "all") return items
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return items.filter((item) => {
    const date = new Date((item.created_at ?? item.recorded_at) as string)
    return date >= cutoff
  })
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function PlantCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card animate-pulse overflow-hidden">
      <div className="flex items-center gap-4 p-5">
        <div className="h-20 w-20 rounded-xl bg-muted shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-5 w-40 rounded bg-muted" />
          <div className="h-3 w-28 rounded bg-muted" />
          <div className="flex gap-3 mt-1">
            <div className="h-4 w-16 rounded bg-muted" />
            <div className="h-4 w-20 rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Modal de imagem ─────────────────────────────────────────────────────────
function ImageModal({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={name} className="w-full max-h-[80vh] object-contain bg-black" />
        <button
          onClick={onClose}
          className="absolute top-3 right-3 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-5 py-4">
          <p className="text-white font-semibold">{name}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Alerta crítico ───────────────────────────────────────────────────────────
function CriticalAlert({ plants }: { plants: Plant[] }) {
  const critical = plants.filter((p) => p.status === "critical")
  const warning = plants.filter((p) => p.status === "warning")
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || (critical.length === 0 && warning.length === 0)) return null

  return (
    <div className={cn(
      "relative rounded-2xl border p-4 flex items-start gap-3",
      critical.length > 0
        ? "border-red-500/40 bg-red-500/10 text-red-400"
        : "border-amber-500/40 bg-amber-500/10 text-amber-400"
    )}>
      <Bell className="h-5 w-5 mt-0.5 shrink-0 animate-pulse" />
      <div className="flex-1">
        <p className="font-semibold text-sm">
          {critical.length > 0
            ? `${critical.length} planta(s) em estado CRÍTICO`
            : `${warning.length} planta(s) precisam de atenção`}
        </p>
        <p className="text-xs mt-0.5 opacity-80">
          {[...critical, ...warning].map((p) => p.name).join(", ")}
        </p>
      </div>
      <button onClick={() => setDismissed(true)} className="opacity-60 hover:opacity-100 transition">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// ─── Mapa da estufa ───────────────────────────────────────────────────────────
function GreenhouseMap({ plants, onSelect, selectedId }: {
  plants: Plant[]
  onSelect: (id: string) => void
  selectedId: string | null
}) {
  // Estufa: 54cm x 120cm → renderizamos com ratio proporcional
  const W = 270 // px = 54cm * 5
  const H = 600 // px = 120cm * 5

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <MapPin className="h-4 w-4 text-emerald-400" />
          Mapa da Estufa
        </h3>
        <span className="text-xs text-muted-foreground">54cm × 120cm</span>
      </div>
      <div
        className="relative rounded-xl border-2 border-emerald-500/30 bg-emerald-950/20 overflow-hidden mx-auto"
        style={{ width: W, height: H, minWidth: W }}
      >
        {/* Grid */}
        <svg className="absolute inset-0 opacity-10" width={W} height={H}>
          {Array.from({ length: 10 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 27} y1={0} x2={i * 27} y2={H} stroke="#22c55e" strokeWidth={0.5} />
          ))}
          {Array.from({ length: 24 }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 25} x2={W} y2={i * 25} stroke="#22c55e" strokeWidth={0.5} />
          ))}
        </svg>

        {/* Rótulos de escala */}
        <span className="absolute top-1 left-1 text-[9px] text-emerald-500/50">0,0</span>
        <span className="absolute bottom-1 right-1 text-[9px] text-emerald-500/50">54,120</span>

        {/* Plantas */}
        {plants.map((p) => {
          const x = (Number(p.position_x) / 54) * W
          const y = (Number(p.position_y) / 120) * H
          const isSelected = p.id === selectedId
          const color = p.status === "critical" ? "#ef4444" : p.status === "warning" ? "#f59e0b" : "#22c55e"

          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              style={{ left: x - 16, top: y - 16, borderColor: color }}
              className={cn(
                "absolute w-8 h-8 rounded-full border-2 overflow-hidden transition-all duration-200 hover:scale-110 hover:z-10",
                isSelected ? "scale-125 z-20 ring-2 ring-white/40 ring-offset-1 ring-offset-transparent" : "",
              )}
            >
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: color + "30" }}>
                  <Leaf className="h-3.5 w-3.5" style={{ color }} />
                </div>
              )}
              {/* Pulse para crítico */}
              {p.status === "critical" && (
                <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ background: color }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Badge de status ──────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    healthy: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    critical: "bg-red-500/15 text-red-400 border-red-500/20",
  }
  const label: Record<string, string> = { healthy: "Saudável", warning: "Atenção", critical: "Crítica" }
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium border", map[status] ?? "bg-muted text-muted-foreground border-border")}>
      {label[status] ?? status}
    </span>
  )
}

// ─── Filtro de período ────────────────────────────────────────────────────────
function PeriodFilter({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
      {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
        <button key={p} onClick={() => onChange(p)}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-medium transition-colors",
            value === p ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {PERIOD_LABELS[p]}
        </button>
      ))}
    </div>
  )
}

// ─── Gráfico de saúde ─────────────────────────────────────────────────────────
function HealthChart({ reports }: { reports: AIReport[] }) {
  const data = [...reports].reverse().map((r) => ({
    date: new Date(r.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    score: r.health_score ?? 0,
    fullDate: new Date(r.created_at).toLocaleString("pt-BR"),
  }))
  if (data.length < 2) return <p className="text-xs text-muted-foreground py-4 text-center">Mínimo 2 análises para exibir gráfico.</p>
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} />
        <Tooltip
          contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, fontSize: 12 }}
          formatter={(v: number) => [`${v}%`, "Saúde"]}
          labelFormatter={(_l, p) => p?.[0]?.payload?.fullDate ?? _l}
        />
        <Area type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2.5} fill="url(#hg)" dot={{ r: 3, fill: "#22c55e" }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── Gráficos de sensores por grupo/unidade ───────────────────────────────────
function SensorGroupChart({ sensors, group }: {
  sensors: Sensor[]
  group: { label: string; types: string[]; unit: string; color: string }
}) {
  const filtered = sensors.filter((s) => group.types.includes(s.type.toLowerCase()))
  const types = [...new Set(filtered.map((s) => s.type))]

  const data = useMemo(() => {
    const byDate: Record<string, Record<string, unknown>> = {}
      ;[...filtered].reverse().forEach((s) => {
        const date = new Date(s.recorded_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
        if (!byDate[date]) byDate[date] = { date }
        byDate[date][s.type] = Number(s.value)
      })
    return Object.values(byDate)
  }, [filtered])

  if (data.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{group.label} ({group.unit})</p>
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} />
          <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
          <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, fontSize: 12 }} />
          {types.map((type, i) => (
            <Line key={type} type="monotone" dataKey={type} stroke={group.color}
              strokeWidth={2} dot={false} name={type.replace(/_/g, " ")}
              strokeDasharray={i > 0 ? "4 2" : undefined}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Gráfico de atuadores ─────────────────────────────────────────────────────
function ActuatorsChart({ actuators }: { actuators: Actuator[] }) {
  const data = useMemo(() => {
    const byName: Record<string, { name: string; ligado: number; desligado: number }> = {}
    actuators.forEach((a) => {
      if (!byName[a.name]) byName[a.name] = { name: a.name, ligado: 0, desligado: 0 }
      if (a.status) byName[a.name].ligado += 1
      else byName[a.name].desligado += 1
    })
    return Object.values(byName)
  }, [actuators])

  if (data.length === 0) return <p className="text-xs text-muted-foreground py-4 text-center">Sem dados.</p>

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} />
        <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
        <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="ligado" name="Ligado" fill="#22c55e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="desligado" name="Desligado" fill="#475569" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Tabela de histórico ──────────────────────────────────────────────────────
function HistoryTable({ reports }: { reports: AIReport[] }) {
  if (reports.length === 0) return <p className="text-xs text-muted-foreground py-4 text-center">Sem análises no período.</p>

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data</th>
            <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Score</th>
            <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resumo</th>
            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Problemas</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r, i) => {
            const prev = reports[i + 1]
            const delta = prev?.health_score != null && r.health_score != null
              ? r.health_score - prev.health_score : null

            return (
              <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(r.created_at).toLocaleString("pt-BR")}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="font-bold text-base">{r.health_score ?? "—"}</span>
                    {delta !== null && (
                      <span className={cn("flex items-center text-xs font-medium", delta > 0 ? "text-emerald-400" : delta < 0 ? "text-red-400" : "text-muted-foreground")}>
                        {delta > 0 ? <ArrowUpRight className="h-3 w-3" /> : delta < 0 ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                        {Math.abs(delta)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge status={r.raw_response ? (r.raw_response as { status?: string }).status ?? "healthy" : "healthy"} />
                </td>
                <td className="px-4 py-3 text-xs max-w-xs">
                  <p className="line-clamp-2 text-muted-foreground">{r.summary ?? "—"}</p>
                </td>
                <td className="px-4 py-3 text-xs">
                  {r.problems.length === 0 ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Nenhum
                    </span>
                  ) : (
                    <ul className="space-y-0.5">
                      {r.problems.slice(0, 2).map((p, j) => (
                        <li key={j} className="flex items-start gap-1 text-red-400/80">
                          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                          <span className="line-clamp-1">{p}</span>
                        </li>
                      ))}
                      {r.problems.length > 2 && (
                        <li className="text-muted-foreground">+{r.problems.length - 2} mais</li>
                      )}
                    </ul>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Card de planta ───────────────────────────────────────────────────────────
function PlantCard({ plant, defaultOpen }: { plant: Plant; defaultOpen?: boolean }) {
  const [period, setPeriod] = useState<Period>("30d")
  const [expanded, setExpanded] = useState(defaultOpen ?? false)
  const [activeTab, setActiveTab] = useState<"overview" | "sensors" | "actuators" | "history">("overview")
  const [imageOpen, setImageOpen] = useState(false)

  const { data: allReports = [], isLoading: loadingReports } = useSWR<AIReport[]>(`/api/reports?plant_id=${plant.id}`, fetcher)
  const { data: allSensors = [], isLoading: loadingSensors } = useSWR<Sensor[]>(`/api/sensors?plant_id=${plant.id}&limit=500`, fetcher)
  const { data: allActuators = [], isLoading: loadingActuators } = useSWR<Actuator[]>(`/api/actuators?plant_id=${plant.id}&limit=500`, fetcher)

  const isLoading = loadingReports || loadingSensors || loadingActuators

  const reports = filterByPeriod(allReports, period)
  const sensors = filterByPeriod(allSensors, period)
  const actuators = filterByPeriod(allActuators, period)

  const latestReport = allReports[0]
  const prevReport = allReports[1]
  const scoreDelta = latestReport?.health_score != null && prevReport?.health_score != null
    ? latestReport.health_score - prevReport.health_score : null

  const sensorGroups = SENSOR_GROUPS.filter((g) =>
    sensors.some((s) => g.types.includes(s.type.toLowerCase()))
  )

  const tabs = [
    { key: "overview", label: "Visão Geral", icon: <Activity className="h-3.5 w-3.5" /> },
    { key: "sensors", label: "Sensores", icon: <Thermometer className="h-3.5 w-3.5" /> },
    { key: "actuators", label: "Atuadores", icon: <Zap className="h-3.5 w-3.5" /> },
    { key: "history", label: "Histórico", icon: <Clock className="h-3.5 w-3.5" /> },
  ] as const

  const status = (plant.status ?? "healthy") as string
  const statusColor = status === "critical" ? "#ef4444" : status === "warning" ? "#f59e0b" : "#22c55e"

  return (
    <>
      {imageOpen && plant.image_url && (
        <ImageModal url={plant.image_url} name={plant.name} onClose={() => setImageOpen(false)} />
      )}

      <div className={cn(
        "rounded-2xl border overflow-hidden transition-all duration-200",
        plant.status === "critical" ? "border-red-500/40" : plant.status === "warning" ? "border-amber-500/30" : "border-border",
        "bg-card"
      )}>
        {/* ── Header ── */}
        <div className="flex items-center gap-4 p-5">
          {/* Imagem clicável */}
          <div
            className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 cursor-pointer group"
            style={{ borderColor: statusColor + "60" }}
            onClick={() => plant.image_url && setImageOpen(true)}
          >
            {plant.image_url ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={plant.image_url} alt={plant.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Eye className="h-5 w-5 text-white" />
                </div>
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <Leaf className="h-7 w-7 text-muted-foreground" />
              </div>
            )}
            {/* Indicador de status */}
            <span
              className="absolute bottom-1.5 right-1.5 h-2.5 w-2.5 rounded-full border-2 border-card"
              style={{ background: statusColor }}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold truncate">{plant.name}</h2>
              <StatusBadge status={plant.status} />
            </div>
            <p className="text-xs text-muted-foreground italic truncate">{plant.species ?? "Espécie não identificada"}</p>

            <div className="flex items-center gap-4 mt-1 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: statusColor + "20", color: statusColor }}
                >
                  {plant.health_score as React.ReactNode}
                </div>
                <span className="text-xs text-muted-foreground">saúde</span>
                {scoreDelta !== null && (
                  <span className={cn(
                    "flex items-center gap-0.5 text-xs font-semibold",
                    scoreDelta > 0 ? "text-emerald-400" : scoreDelta < 0 ? "text-red-400" : "text-muted-foreground"
                  )}>
                    {scoreDelta > 0
                      ? <ArrowUpRight className="h-3 w-3" />
                      : scoreDelta < 0
                        ? <ArrowDownRight className="h-3 w-3" />
                        : <Minus className="h-3 w-3" />}
                    {Math.abs(scoreDelta)}pts
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                📍 {Number(plant.position_x).toFixed(0)}cm, {Number(plant.position_y).toFixed(0)}cm
              </span>
              <span className="text-xs text-muted-foreground">{allReports.length} análises</span>
            </div>

            {latestReport?.raw_response?.next_action && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 w-fit">
                <Target className="h-3 w-3 text-amber-400 shrink-0" />

                <span className="text-amber-300">
                  {latestReport.raw_response.next_action}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 rounded-xl p-2 hover:bg-muted transition-colors"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* ── Expandido ── */}
        {expanded && (
          <div className="border-t border-border">
            {/* Tabs + período */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-3 bg-muted/10">
              <div className="flex gap-1 flex-wrap">
                {tabs.map((t) => (
                  <button key={t.key} onClick={() => setActiveTab(t.key)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                      activeTab === t.key
                        ? "bg-background text-foreground border border-border shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                    )}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
              <PeriodFilter value={period} onChange={setPeriod} />
            </div>

            {/* Loading skeleton interno */}
            {isLoading ? (
              <div className="p-5 flex flex-col gap-3 animate-pulse">
                <div className="h-4 w-48 rounded bg-muted" />
                <div className="h-40 rounded-xl bg-muted" />
                <div className="h-4 w-32 rounded bg-muted" />
              </div>
            ) : (
              <div className="p-5">

                {/* ── Aba: Visão Geral ── */}
                {activeTab === "overview" && (
                  <div className="flex flex-col gap-5">
                    {/* KPIs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "Score atual", value: `${plant.health_score}%`, icon: <TrendingUp className="h-4 w-4" />, color: statusColor },
                        { label: "Análises", value: allReports.length, icon: <Sparkles className="h-4 w-4" />, color: "#818cf8" },
                        { label: "Variação", value: scoreDelta == null ? "—" : `${scoreDelta > 0 ? "+" : ""}${scoreDelta}`, icon: scoreDelta == null ? <Minus className="h-4 w-4" /> : scoreDelta >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />, color: scoreDelta == null ? "#64748b" : scoreDelta >= 0 ? "#22c55e" : "#ef4444" },
                        { label: "Estágio", value: (latestReport?.raw_response as { growth_stage?: string })?.growth_stage ?? "—", icon: <Sprout className="h-4 w-4" />, color: "#34d399" },
                      ].map((kpi) => (
                        <div key={kpi.label} className="rounded-xl border border-border bg-muted/20 p-4 flex flex-col gap-2">
                          <div className="flex items-center gap-2" style={{ color: kpi.color }}>
                            {kpi.icon}
                            <span className="text-xs text-muted-foreground">{kpi.label}</span>
                          </div>
                          <p className="text-xl font-bold capitalize" style={{ color: kpi.color }}>{kpi.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Gráfico de evolução */}
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Evolução da saúde</p>
                      <HealthChart reports={reports} />
                    </div>

                    {/* Último relatório detalhado */}
                    {latestReport && (
                      <div className="rounded-xl border border-border bg-muted/10 p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-primary" /> Última análise IA
                          </p>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(latestReport.created_at).toLocaleString("pt-BR")}
                          </span>
                        </div>
                        {latestReport.summary && <p className="text-sm leading-relaxed">{latestReport.summary}</p>}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-xs uppercase tracking-wider text-red-400/80 mb-2 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Problemas
                            </h4>
                            {latestReport.problems.length === 0 ? (
                              <p className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Nenhum problema</p>
                            ) : (
                              <ul className="flex flex-col gap-1.5">
                                {latestReport.problems.map((p, i) => (
                                  <li key={i} className="flex items-start gap-2 text-xs">
                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                                    <span>{p}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs uppercase tracking-wider text-emerald-400/80 mb-2 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Recomendações
                            </h4>
                            {latestReport.recommendations.length === 0 ? (
                              <p className="text-xs text-muted-foreground">Nenhuma.</p>
                            ) : (
                              <ul className="flex flex-col gap-1.5">
                                {latestReport.recommendations.map((r, i) => (
                                  <li key={i} className="flex items-start gap-2 text-xs">
                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                                    <span>{r}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Aba: Sensores ── */}
                {activeTab === "sensors" && (
                  <div className="flex flex-col gap-5">
                    {/* Cards com última leitura */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {[...new Set(sensors.map((s) => s.type))].map((type) => {
                        const last = sensors.find((s) => s.type === type)
                        const group = getSensorGroup(type)
                        return (
                          <div key={type} className="rounded-xl border border-border bg-muted/20 p-3">
                            <p className="text-xs text-muted-foreground capitalize mb-1">{type.replace(/_/g, " ")}</p>
                            <p className="text-2xl font-bold" style={{ color: group?.color ?? "#94a3b8" }}>
                              {last ? Number(last.value).toFixed(1) : "—"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">{last?.unit ?? group?.unit ?? ""}</p>
                          </div>
                        )
                      })}
                    </div>

                    {/* Um gráfico por grupo de unidade */}
                    {sensorGroups.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">Sem leituras no período.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {sensorGroups.map((g) => (
                          <SensorGroupChart key={g.label} sensors={sensors} group={g} />
                        ))}
                      </div>
                    )}

                    {/* Tabela de leituras */}
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data</th>
                            <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo</th>
                            <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valor</th>
                            <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unidade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sensors.slice(0, 30).map((s) => {
                            const g = getSensorGroup(s.type)
                            return (
                              <tr key={s.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(s.recorded_at).toLocaleString("pt-BR")}</td>
                                <td className="px-4 py-2 text-xs capitalize">{s.type.replace(/_/g, " ")}</td>
                                <td className="px-4 py-2 text-right font-bold" style={{ color: g?.color ?? "#94a3b8" }}>
                                  {Number(s.value).toFixed(1)}
                                </td>
                                <td className="px-4 py-2 text-xs text-muted-foreground">{s.unit ?? "—"}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── Aba: Atuadores ── */}
                {activeTab === "actuators" && (
                  <div className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[...new Set(actuators.map((a) => a.name))].map((name) => {
                        const last = actuators.find((a) => a.name === name)
                        const onCount = actuators.filter((a) => a.name === name && a.status).length
                        const total = actuators.filter((a) => a.name === name).length
                        const pct = total > 0 ? Math.round((onCount / total) * 100) : 0
                        return (
                          <div key={name} className="rounded-xl border border-border bg-muted/20 p-4 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={cn("h-2 w-2 rounded-full", last?.status ? "bg-emerald-400" : "bg-muted-foreground")} />
                                <p className="text-sm font-semibold truncate">{name}</p>
                              </div>
                              <span className="text-xs capitalize text-muted-foreground">{last?.type.replace(/_/g, " ")}</span>
                            </div>
                            {/* Barra de uso */}
                            <div>
                              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Uso no período</span>
                                <span>{pct}%</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">{last?.consumption ?? 0}W por ativação</p>
                          </div>
                        )
                      })}
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Uso total por atuador</p>
                    <ActuatorsChart actuators={actuators} />
                  </div>
                )}

                {/* ── Aba: Histórico ── */}
                {activeTab === "history" && (
                  <HistoryTable reports={reports} />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// ─── ReportsView principal ────────────────────────────────────────────────────
export function ReportsView() {
  const { data: plants, isLoading } = useSWR<Plant[]>("/api/plants", fetcher)
  const [mapSelected, setMapSelected] = useState<string | null>(null)

  const sorted = useMemo(() => {
    if (!plants) return []
    return [...plants].sort((a, b) => {
      const order = { critical: 0, warning: 1, healthy: 2 }
      return (order[a.status as keyof typeof order] ?? 3) - (order[b.status as keyof typeof order] ?? 3)
    })
  }, [plants])

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Histórico completo, gráficos de evolução e análises de cada planta da estufa.
        </p>
      </header>

      {/* Alertas */}
      {plants && <CriticalAlert plants={plants} />}

      {/* Mapa + lista lado a lado em telas grandes */}
      <div className="grid grid-cols-1 xl:grid-cols-[auto_1fr] gap-6 items-start">
        {/* Mapa */}
        {plants && plants.length > 0 && (
          <Card className="p-5 xl:sticky xl:top-4">
            <GreenhouseMap
              plants={plants}
              selectedId={mapSelected}
              onSelect={(id) => setMapSelected((prev) => prev === id ? null : id)}
            />
          </Card>
        )}

        {/* Cards das plantas */}
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <>
              <PlantCardSkeleton />
              <PlantCardSkeleton />
              <PlantCardSkeleton />
            </>
          ) : sorted.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center">
                <Leaf className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Nenhuma planta cadastrada.</p>
                <p className="text-xs text-muted-foreground mt-1">Envie uma imagem na aba Análise IA.</p>
              </CardContent>
            </Card>
          ) : (
            sorted.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                defaultOpen={plant.id === mapSelected}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}