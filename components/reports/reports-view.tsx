"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Plant, AIReport, Sensor } from "@/lib/types"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Leaf, AlertTriangle, CheckCircle2, Sparkles, Calendar } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    healthy: "bg-primary/15 text-primary",
    warning: "bg-chart-4/20 text-chart-4",
    critical: "bg-destructive/15 text-destructive",
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

export function ReportsView() {
  const { data: plants = [] } = useSWR<Plant[]>("/api/plants", fetcher)
  const [selected, setSelected] = useState<string | null>(null)

  const plantId = selected ?? plants[0]?.id ?? null

  const { data: reports = [] } = useSWR<AIReport[]>(
    plantId ? `/api/reports?plant_id=${plantId}` : null,
    fetcher,
  )
  const { data: sensors = [] } = useSWR<Sensor[]>(
    plantId ? `/api/sensors?plant_id=${plantId}&limit=200` : null,
    fetcher,
  )

  const plant = plants.find((p) => p.id === plantId)

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Histórico completo de cada planta cadastrada.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Plantas ({plants.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            {plants.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                Nenhuma planta. Cadastre uma na aba Análise IA.
              </p>
            )}
            <ul className="flex flex-col">
              {plants.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => setSelected(p.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                      p.id === plantId ? "bg-accent text-accent-foreground" : "hover:bg-muted",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-primary" />
                      <span className="font-medium">{p.name}</span>
                    </span>
                    <StatusBadge status={p.status} />
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          {plant ? (
            <>
              <Card>
                <CardContent className="p-5 flex flex-col md:flex-row gap-5">
                  <div className="h-40 w-40 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                    {plant.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={plant.image_url || "/placeholder.svg"} alt={plant.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Leaf className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold">{plant.name}</h2>
                      <StatusBadge status={plant.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">{plant.species ?? "Espécie não informada"}</p>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Saúde</p>
                        <p className="text-lg font-semibold">{plant.health_score}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Posição</p>
                        <p className="text-sm">
                          x:{Number(plant.position_x).toFixed(0)} y:{Number(plant.position_y).toFixed(0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Leituras</p>
                        <p className="text-lg font-semibold">{sensors.length}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Histórico de análises por IA ({reports.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reports.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma análise registrada ainda.</p>
                  ) : (
                    <ul className="flex flex-col gap-3">
                      {reports.map((r) => (
                        <li key={r.id} className="rounded-md border border-border p-4">
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
                                  {r.problems.map((p, i) => (
                                    <li key={i}>{p}</li>
                                  ))}
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
                                  {r.recommendations.map((p, i) => (
                                    <li key={i}>{p}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Histórico de leituras de sensores</CardTitle>
                </CardHeader>
                <CardContent>
                  {sensors.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem leituras.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                            <th className="py-2 pr-2">Data</th>
                            <th className="py-2 pr-2">Tipo</th>
                            <th className="py-2 pr-2 text-right">Valor</th>
                            <th className="py-2 pl-2">Unidade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sensors.slice(0, 50).map((s) => (
                            <tr key={s.id} className="border-b border-border/60">
                              <td className="py-2 pr-2 text-muted-foreground">
                                {new Date(s.recorded_at).toLocaleString("pt-BR")}
                              </td>
                              <td className="py-2 pr-2 capitalize">{s.type}</td>
                              <td className="py-2 pr-2 text-right font-medium">{Number(s.value).toFixed(1)}</td>
                              <td className="py-2 pl-2 text-muted-foreground">{s.unit ?? "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Selecione uma planta para ver seu relatório.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
