"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Plant, AIReport, Sensor, Actuator } from "@/lib/types"
import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import {
  Leaf,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Calendar,
  Activity,
  Thermometer,
  Droplets,
  Zap,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Period = "7d" | "30d" | "90d" | "all"

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "7 dias",
  "30d": "30 dias",
  "90d": "90 dias",
  all: "Tudo",
}

const SENSOR_COLORS: Record<string, string> = {
  umidade_solo: "#22c55e",
  temperatura: "#f97316",
  luminosidade: "#eab308",
  ph_solo: "#8b5cf6",
  umidade: "#06b6d4",
  pressao: "#ec4899",
}

function getColor(type: string) {
  return SENSOR_COLORS[type] ?? "#64748b"
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    healthy: "bg-emerald-500/15 text-emerald-500",
    warning: "bg-amber-500/20 text-amber-500",
    critical: "bg-red-500/15 text-red-500",
  }
  const label: Record<string, string> = {
    healthy: "Saudável",
    warning: "Atenção",
    critical: "Crítica",
  }
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", map[status] ?? "bg-muted text-muted-foreground")}>
      {label[status] ?? status}
    </span>
  )
}

function PeriodFilter({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1">
      {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-medium transition-colors",
            value === p
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {PERIOD_LABELS[p]}
        </button>
      ))}
    </div>
  )
}

function filterByPeriod<T extends { created_at?: string; recorded_at?: string }>(
  items: T[],
  period: Period,
): T[] {
  if (period === "all") return items
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return items.filter((item) => {
    const date = new Date((item.created_at ?? item.recorded_at) as string)
    return date >= cutoff
  })
}

function HealthScoreChart({ reports }: { reports: AIReport[] }) {
  const data = [...reports]
    .reverse()
    .map((r) => ({
      date: new Date(r.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      score: r.health_score ?? 0,
      fullDate: new Date(r.created_at).toLocaleString("pt-BR"),
    }))

  if (data.length === 0) return <p className="text-sm text-muted-foreground">Sem dados suficientes.</p>

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
        <Tooltip
          contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
          formatter={(value: number) => [`${value}%`, "Saúde"]}
          labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate ?? label}
        />
        <Area type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2} fill="url(#healthGrad)" dot={{ r: 3 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function SensorsChart({ sensors }: { sensors: Sensor[] }) {
  const types = [...new Set(sensors.map((s) => s.type))]

  const data = useMemo(() => {
    const byDate: Record<string, Record<string, number>> = {}
    ;[...sensors].reverse().forEach((s) => {
      const date = new Date(s.recorded_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
      if (!byDate[date]) byDate[date] = { date }
      byDate[date][s.type] = Number(s.value)
    })
    return Object.values(byDate)
  }, [sensors])

  if (data.length === 0) return <p className="text-sm text-muted-foreground">Sem leituras de sensores.</p>

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
        <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
        <Tooltip
          contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {types.map((type) => (
          <Line
            key={type}
            type="monotone"
            dataKey={type}
            stroke={getColor(type)}
            strokeWidth={2}
            dot={false}
            name={type.replace("_", " ")}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

function ActuatorsChart({ actuators }: { actuators: Actuator[] }) {
  const data = useMemo(() => {
    const byName: Record<string, { name: string; ligado: number; desligado: number; consumo: number }> = {}
    actuators.forEach((a) => {
      if (!byName[a.name]) byName[a.name] = { name: a.name, ligado: 0, desligado: 0, consumo: 0 }
      if (a.status) {
        byName[a.name].ligado += 1
        byName[a.name].consumo += Number(a.consumption)
      } else {
        byName[a.name].desligado += 1
      }
    })
    return Object.values(byName)
  }, [actuators])

  if (data.length === 0) return <p className="text-sm text-muted-foreground">Sem dados de atuadores.</p>

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
        <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
        <Tooltip
          contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="ligado" name="Ligado" fill="#22c55e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="desligado" name="Desligado" fill="#64748b" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function PlantCard({ plant }: { plant: Plant }) {
  const [period, setPeriod] = useState<Period>("30d")
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<"health" | "sensors" | "actuators" | "reports">("health")

  const { data: allReports = [] } = useSWR<AIReport[]>(`/api/reports?plant_id=${plant.id}`, fetcher)
  const { data: allSensors = [] } = useSWR<Sensor[]>(`/api/sensors?plant_id=${plant.id}&limit=500`, fetcher)
  const { data: allActuators = [] } = useSWR<Actuator[]>(`/api/actuators?plant_id=${plant.id}&limit=500`, fetcher)

  const reports = filterByPeriod(allReports, period)
  const sensors = filterByPeriod(allSensors, period)
  const actuators = filterByPeriod(allActuators, period)

  const latestReport = allReports[0]
  const prevReport = allReports[1]
  const scoreDelta =
    latestReport?.health_score != null && prevReport?.health_score != null
      ? latestReport.health_score - prevReport.health_score
      : null

  const tabs = [
    { key: "health", label: "Saúde", icon: <TrendingUp className="h-3.5 w-3.5" /> },
    { key: "sensors", label: "Sensores", icon: <Thermometer className="h-3.5 w-3.5" /> },
    { key: "actuators", label: "Atuadores", icon: <Zap className="h-3.5 w-3.5" /> },
    { key: "reports", label: "Análises IA", icon: <Sparkles className="h-3.5 w-3.5" /> },
  ] as const

  return (
    <Card className="overflow-hidden">
      {/* Header da planta */}
      <div className="flex items-center gap-4 p-5">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
          {plant.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={plant.image_url} alt={plant.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Leaf className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold truncate">{plant.name}</h2>
            <StatusBadge status={plant.status} />
          </div>
          <p className="text-xs text-muted-foreground truncate">{plant.species ?? "Espécie não identificada"}</p>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1">
              <Activity className="h-3.5 w-3.5 text-primary" />
              <span className="text-sm font-semibold">{plant.health_score}%</span>
              {scoreDelta !== null && (
                <span className={cn("text-xs font-medium", scoreDelta >= 0 ? "text-emerald-500" : "text-red-500")}>
                  {scoreDelta >= 0 ? "+" : ""}{scoreDelta}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              x:{Number(plant.position_x).toFixed(0)} y:{Number(plant.position_y).toFixed(0)}
            </span>
            <span className="text-xs text-muted-foreground">{allReports.length} análises</span>
          </div>
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 rounded-md p-1.5 hover:bg-muted transition-colors"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Conteúdo expandido */}
      {expanded && (
        <div className="border-t border-border">
          {/* Filtro de período + tabs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-3 bg-muted/20">
            <div className="flex gap-1 border-b border-transparent">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                    activeTab === t.key
                      ? "bg-background text-foreground shadow-sm border border-border"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
            <PeriodFilter value={period} onChange={setPeriod} />
          </div>

          <div className="p-5">
            {/* Tab: Saúde */}
            {activeTab === "health" && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Score atual</p>
                    <p className="text-2xl font-bold text-primary">{plant.health_score}%</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Análises</p>
                    <p className="text-2xl font-bold">{reports.length}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Variação</p>
                    <p className={cn("text-2xl font-bold", scoreDelta == null ? "text-muted-foreground" : scoreDelta >= 0 ? "text-emerald-500" : "text-red-500")}>
                      {scoreDelta == null ? "—" : `${scoreDelta >= 0 ? "+" : ""}${scoreDelta}`}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Evolução do health score
                  </p>
                  <HealthScoreChart reports={reports} />
                </div>
              </div>
            )}

            {/* Tab: Sensores */}
            {activeTab === "sensors" && (
              <div className="flex flex-col gap-4">
                {/* Últimas leituras */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[...new Set(sensors.map((s) => s.type))].map((type) => {
                    const last = sensors.find((s) => s.type === type)
                    return (
                      <div key={type} className="rounded-lg border border-border bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground capitalize mb-1">{type.replace("_", " ")}</p>
                        <p className="text-xl font-bold" style={{ color: getColor(type) }}>
                          {last ? Number(last.value).toFixed(1) : "—"}
                          <span className="text-xs font-normal text-muted-foreground ml-1">{last?.unit ?? ""}</span>
                        </p>
                      </div>
                    )
                  })}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Leituras ao longo do tempo
                  </p>
                  <SensorsChart sensors={sensors} />
                </div>
                {/* Tabela das últimas leituras */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                        <th className="py-2 pr-3">Data</th>
                        <th className="py-2 pr-3">Tipo</th>
                        <th className="py-2 pr-3 text-right">Valor</th>
                        <th className="py-2">Unidade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sensors.slice(0, 20).map((s) => (
                        <tr key={s.id} className="border-b border-border/50">
                          <td className="py-1.5 pr-3 text-muted-foreground text-xs">
                            {new Date(s.recorded_at).toLocaleString("pt-BR")}
                          </td>
                          <td className="py-1.5 pr-3 capitalize text-xs">{s.type.replace("_", " ")}</td>
                          <td className="py-1.5 pr-3 text-right font-medium">{Number(s.value).toFixed(1)}</td>
                          <td className="py-1.5 text-muted-foreground text-xs">{s.unit ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab: Atuadores */}
            {activeTab === "actuators" && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[...new Set(actuators.map((a) => a.name))].map((name) => {
                    const last = actuators.find((a) => a.name === name)
                    const onCount = actuators.filter((a) => a.name === name && a.status).length
                    const total = actuators.filter((a) => a.name === name).length
                    return (
                      <div key={name} className="rounded-lg border border-border bg-muted/30 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={cn("h-2 w-2 rounded-full", last?.status ? "bg-emerald-500" : "bg-muted-foreground")} />
                          <p className="text-xs font-medium truncate">{name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">{last?.type.replace("_", " ")}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Ligado {onCount}/{total} vezes · {last?.consumption ?? 0}W
                        </p>
                      </div>
                    )
                  })}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Uso dos atuadores
                  </p>
                  <ActuatorsChart actuators={actuators} />
                </div>
              </div>
            )}

            {/* Tab: Análises IA */}
            {activeTab === "reports" && (
              <div className="flex flex-col gap-3">
                {reports.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma análise no período.</p>
                ) : (
                  reports.map((r) => (
                    <div key={r.id} className="rounded-lg border border-border p-4">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(r.created_at).toLocaleString("pt-BR")}
                        </div>
                        {typeof r.health_score === "number" && (
                          <span className="text-sm font-semibold text-primary">{r.health_score}%</span>
                        )}
                      </div>
                      {r.summary && <p className="text-sm mb-3">{r.summary}</p>}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Problemas
                          </h4>
                          {r.problems.length === 0 ? (
                            <p className="text-xs text-muted-foreground">Nenhum.</p>
                          ) : (
                            <ul className="list-disc pl-4 text-sm space-y-0.5">
                              {r.problems.map((p, i) => <li key={i}>{p}</li>)}
                            </ul>
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Recomendações
                          </h4>
                          {r.recommendations.length === 0 ? (
                            <p className="text-xs text-muted-foreground">Nenhuma.</p>
                          ) : (
                            <ul className="list-disc pl-4 text-sm space-y-0.5">
                              {r.recommendations.map((p, i) => <li key={i}>{p}</li>)}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

export function ReportsView() {
  const { data: plants = [] } = useSWR<Plant[]>("/api/plants", fetcher)

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>
        <p className="text-sm text-muted-foreground">
          Histórico completo, gráficos de evolução e análises de cada planta.
        </p>
      </header>

      {plants.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma planta cadastrada. Envie uma imagem na aba Análise IA.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {plants.map((plant) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
        </div>
      )}
    </div>
  )
}