"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles, Upload, Plus, Trash2, Zap, MapPin, Thermometer } from "lucide-react"
import { useRef, useState } from "react"
import type { Plant } from "@/lib/types"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Analysis = {
  name?: string
  species?: string
  health_score?: number
  status?: string
  problems?: string[]
  recommendations?: string[]
  summary?: string
  growth_stage?: string
  next_action?: string
}

type SensorInput = { type: string; value: string; unit: string }
type ActuatorInput = { name: string; type: string; status: boolean; consumption: string }

const SENSOR_TYPES = ["umidade_solo", "temperatura", "luminosidade", "ph_solo", "umidade_ar", "pressao"]
const ACTUATOR_TYPES = ["irrigacao", "ventilacao", "iluminacao", "aquecedor"]

export function AnalyzeView() {
  const { mutate: mutatePlants } = useSWR<Plant[]>("/api/plants", fetcher)

  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Analysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Posição na estufa (cm)
  const [posX, setPosX] = useState("27")
  const [posY, setPosY] = useState("60")

  // Sensores dinâmicos
  const [sensors, setSensors] = useState<SensorInput[]>([
    { type: "umidade_solo", value: "", unit: "%" },
  ])

  // Atuadores dinâmicos
  const [actuators, setActuators] = useState<ActuatorInput[]>([
    { name: "", type: "irrigacao", status: false, consumption: "0" },
  ])

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
    setError(null)
  }

  function addSensor() {
    setSensors((prev) => [...prev, { type: "temperatura", value: "", unit: "°C" }])
  }

  function removeSensor(i: number) {
    setSensors((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateSensor(i: number, field: keyof SensorInput, value: string | boolean) {
    setSensors((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  function addActuator() {
    setActuators((prev) => [...prev, { name: "", type: "irrigacao", status: false, consumption: "0" }])
  }

  function removeActuator(i: number) {
    setActuators((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateActuator(i: number, field: keyof ActuatorInput, value: string | boolean) {
    setActuators((prev) => prev.map((a, idx) => idx === i ? { ...a, [field]: value } : a))
  }

  async function analyze() {
    if (!file) { setError("Selecione uma imagem."); return }

    setLoading(true)
    setError(null)

    try {
      // 1. Upload da imagem pro Supabase Storage
      const formData = new FormData()
      formData.append("file", file)

      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
      const uploadJson = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadJson.error || "Falha no upload")

      const imageUrl = uploadJson.url as string

      // 2. Analisa
      const validSensors = sensors
        .filter((s) => s.value.trim() !== "")
        .map((s) => ({ type: s.type, value: Number(s.value), unit: s.unit }))

      const validActuators = actuators
        .filter((a) => a.name.trim() !== "")
        .map((a) => ({ name: a.name, type: a.type, status: a.status, consumption: Number(a.consumption) }))

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          position_x: Number(posX),
          position_y: Number(posY),
          sensors: validSensors,
          actuators: validActuators,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Falha na análise")
      setResult(json.analysis)
      await mutatePlants()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro")
    } finally {
      setLoading(false)
    }
  }

  const statusColor = result?.status === "critical" ? "#ef4444" : result?.status === "warning" ? "#f59e0b" : "#22c55e"

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Análise por IA</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Envie a imagem, informe a posição e os dados dos sensores. A IA identifica a planta e gera o laudo completo.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* ── Coluna esquerda: imagem + posição + sensores + atuadores ── */}
        <div className="flex flex-col gap-4">

          {/* Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" /> Imagem da planta
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div
                className={cn(
                  "flex h-64 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed overflow-hidden transition-colors",
                  preview ? "border-primary/40" : "border-border hover:border-primary/40 bg-muted/20",
                )}
                onClick={() => fileRef.current?.click()}
              >
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="Preview" className="h-full w-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Upload className="h-8 w-8" />
                    <span className="text-sm">Clique para selecionar uma imagem</span>
                    <span className="text-xs">JPG, PNG, WEBP</span>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
              </div>
            </CardContent>
          </Card>

          {/* Posição na estufa */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Posição na estufa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                Estufa de 54cm × 120cm. Se já existe uma planta próxima (±5cm), os dados serão atualizados nela.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="posX">X — largura (0–54 cm)</Label>
                  <Input id="posX" type="number" min={0} max={54} value={posX} onChange={(e) => setPosX(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="posY">Y — comprimento (0–120 cm)</Label>
                  <Input id="posY" type="number" min={0} max={120} value={posY} onChange={(e) => setPosY(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sensores */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-primary" /> Sensores
                </CardTitle>
                <Button variant="outline" size="sm" onClick={addSensor} className="h-7 text-xs gap-1">
                  <Plus className="h-3 w-3" /> Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {sensors.map((s, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-end">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Tipo</Label>
                    <select
                      value={s.type}
                      onChange={(e) => {
                        const unit = e.target.value.includes("temp") ? "°C" : e.target.value.includes("ph") ? "pH" : e.target.value.includes("pressao") ? "hPa" : e.target.value.includes("lux") || e.target.value.includes("luminosidade") ? "lux" : "%"
                        updateSensor(i, "type", e.target.value)
                        updateSensor(i, "unit", unit)
                      }}
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {SENSOR_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Valor</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      value={s.value}
                      onChange={(e) => updateSensor(i, "value", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Unidade</Label>
                    <Input className="w-16" value={s.unit} onChange={(e) => updateSensor(i, "unit", e.target.value)} />
                  </div>
                  <button onClick={() => removeSensor(i)} className="mb-0.5 rounded-md p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {sensors.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">Nenhum sensor. Clique em Adicionar.</p>
              )}
            </CardContent>
          </Card>

          {/* Atuadores */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" /> Atuadores
                </CardTitle>
                <Button variant="outline" size="sm" onClick={addActuator} className="h-7 text-xs gap-1">
                  <Plus className="h-3 w-3" /> Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {actuators.map((a, i) => (
                <div key={i} className="rounded-xl border border-border p-3 flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Nome</Label>
                      <Input placeholder="ex: Bomba 1" value={a.name} onChange={(e) => updateActuator(i, "name", e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Tipo</Label>
                      <select
                        value={a.type}
                        onChange={(e) => updateActuator(i, "type", e.target.value)}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        {ACTUATOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Consumo (W)</Label>
                      <Input
                        type="number" step="0.1" className="w-28"
                        value={a.consumption}
                        onChange={(e) => updateActuator(i, "consumption", e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <div
                          onClick={() => updateActuator(i, "status", !a.status)}
                          className={cn(
                            "relative h-5 w-10 rounded-full transition-colors cursor-pointer",
                            a.status ? "bg-emerald-500" : "bg-muted",
                          )}
                        >
                          <div className={cn(
                            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                            a.status ? "translate-x-5" : "translate-x-0.5",
                          )} />
                        </div>
                        <span className={a.status ? "text-emerald-400" : "text-muted-foreground"}>
                          {a.status ? "Ligado" : "Desligado"}
                        </span>
                      </label>
                      <button onClick={() => removeActuator(i)} className="rounded-md p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {actuators.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">Nenhum atuador. Clique em Adicionar.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Coluna direita: botão + resultado ── */}
        <div className="flex flex-col gap-4">
          <Button
            onClick={analyze}
            disabled={loading || !file}
            size="lg"
            className="w-full gap-2 h-12 text-base font-semibold"
          >
            <Sparkles className={cn("h-5 w-5", loading && "animate-spin")} />
            {loading ? "Analisando com Gemini..." : "Analisar planta"}
          </Button>

          {error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Resultado */}
          {result && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Resultado da análise
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                {/* Identidade + score */}
                <div className="flex items-center gap-4">
                  <div
                    className="h-16 w-16 rounded-full flex items-center justify-center text-xl font-black shrink-0"
                    style={{ background: statusColor + "20", color: statusColor }}
                  >
                    {result.health_score ?? "—"}
                  </div>
                  <div>
                    <p className="text-lg font-bold">{result.name ?? "Planta"}</p>
                    <p className="text-sm text-muted-foreground italic">{result.species ?? ""}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-semibold border"
                        style={{ color: statusColor, borderColor: statusColor + "40", background: statusColor + "15" }}
                      >
                        {result.status === "healthy" ? "Saudável" : result.status === "warning" ? "Atenção" : "Crítica"}
                      </span>
                      {result.growth_stage && (
                        <span className="text-xs text-muted-foreground capitalize">{result.growth_stage}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Resumo */}
                {result.summary && (
                  <p className="text-sm leading-relaxed border-l-2 border-primary/40 pl-3">{result.summary}</p>
                )}

                {/* Ação urgente */}
                {result.next_action && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300 flex items-start gap-2">
                    <span className="font-semibold shrink-0">⚡ Ação urgente:</span>
                    <span>{result.next_action}</span>
                  </div>
                )}

                {/* Problemas + recomendações */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-red-400/80 mb-2 font-semibold">Problemas</h4>
                    {!result.problems?.length ? (
                      <p className="text-xs text-emerald-400">✓ Nenhum problema</p>
                    ) : (
                      <ul className="flex flex-col gap-1.5">
                        {result.problems.map((p, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-emerald-400/80 mb-2 font-semibold">Recomendações</h4>
                    {!result.recommendations?.length ? (
                      <p className="text-xs text-muted-foreground">Nenhuma.</p>
                    ) : (
                      <ul className="flex flex-col gap-1.5">
                        {result.recommendations.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Placeholder quando sem resultado */}
          {!result && !loading && (
            <Card className="border-dashed">
              <CardContent className="p-10 flex flex-col items-center gap-3 text-center text-muted-foreground">
                <Sparkles className="h-10 w-10 opacity-30" />
                <p className="text-sm">O resultado da análise aparecerá aqui.</p>
                <p className="text-xs opacity-70">Preencha os dados à esquerda e clique em Analisar.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}