"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles, Upload, Plus, Power } from "lucide-react"
import { useRef, useState } from "react"
import type { Plant } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Analysis = {
  health_score?: number
  status?: string
  species_guess?: string
  problems?: string[]
  recommendations?: string[]
  summary?: string
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function AnalyzeView() {
  const { data: plants = [], mutate: mutatePlants } = useSWR<Plant[]>("/api/plants", fetcher)
  const [selectedPlantId, setSelectedPlantId] = useState<string>("")
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Analysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileData, setFileData] = useState<string | null>(null)

  // plant form
  const [pName, setPName] = useState("")
  const [pSpecies, setPSpecies] = useState("")
  const [pX, setPX] = useState("50")
  const [pY, setPY] = useState("50")

  // actuator form
  const [aName, setAName] = useState("")
  const [aType, setAType] = useState("irrigacao")
  const [aStatus, setAStatus] = useState(false)
  const [aConsumption, setAConsumption] = useState("0")

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const data = await fileToBase64(f)
    setFileData(data)
    setPreview(data)
    setResult(null)
    setError(null)
  }

  async function analyze() {
    if (!fileData) {
      setError("Selecione uma imagem.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plant_id: selectedPlantId || null,
          image_base64: fileData,
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

  async function createPlant(e: React.FormEvent) {
    e.preventDefault()
    if (!pName.trim()) return
    await fetch("/api/plants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: pName,
        species: pSpecies || null,
        position_x: Number(pX),
        position_y: Number(pY),
      }),
    })
    setPName("")
    setPSpecies("")
    setPX("50")
    setPY("50")
    mutatePlants()
  }

  async function createActuator(e: React.FormEvent) {
    e.preventDefault()
    if (!aName.trim()) return
    await fetch("/api/actuators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plant_id: selectedPlantId || null,
        name: aName,
        type: aType,
        status: aStatus,
        consumption: Number(aConsumption),
      }),
    })
    setAName("")
    setAConsumption("0")
    setAStatus(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Análise por IA</h1>
        <p className="text-sm text-muted-foreground">
          Envie uma imagem da planta para o Gemini analisar. O laudo é salvo no histórico automaticamente.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Nova análise
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="plant">Planta (opcional)</Label>
              <select
                id="plant"
                value={selectedPlantId}
                onChange={(e) => setSelectedPlantId(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Não vincular</option>
                {plants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div
              className="flex h-56 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-border bg-muted/30 overflow-hidden"
              onClick={() => fileRef.current?.click()}
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview || "/placeholder.svg"} alt="Pré-visualização" className="h-full w-full object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="h-6 w-6" />
                  <span className="text-sm">Clique para enviar uma imagem</span>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </div>

            <Button onClick={analyze} disabled={loading || !fileData}>
              <Sparkles className="h-4 w-4" />
              {loading ? "Analisando..." : "Analisar com Gemini"}
            </Button>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            {!result && <p className="text-sm text-muted-foreground">Aguardando análise.</p>}
            {result && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-semibold">
                    {result.health_score ?? "-"}%
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">{result.status ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{result.species_guess ?? ""}</p>
                  </div>
                </div>
                {result.summary && <p className="text-sm">{result.summary}</p>}
                {result.problems && result.problems.length > 0 && (
                  <div>
                    <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Problemas</h4>
                    <ul className="list-disc pl-4 text-sm space-y-0.5">
                      {result.problems.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.recommendations && result.recommendations.length > 0 && (
                  <div>
                    <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Recomendações</h4>
                    <ul className="list-disc pl-4 text-sm space-y-0.5">
                      {result.recommendations.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Cadastrar planta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-2 gap-3" onSubmit={createPlant}>
              <div className="col-span-2 flex flex-col gap-1">
                <Label htmlFor="pname">Nome</Label>
                <Input id="pname" value={pName} onChange={(e) => setPName(e.target.value)} required />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <Label htmlFor="pspecies">Espécie</Label>
                <Input id="pspecies" value={pSpecies} onChange={(e) => setPSpecies(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="px">Posição X (0-100)</Label>
                <Input id="px" type="number" value={pX} onChange={(e) => setPX(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="py">Posição Y (0-100)</Label>
                <Input id="py" type="number" value={pY} onChange={(e) => setPY(e.target.value)} />
              </div>
              <Button type="submit" className="col-span-2">
                Salvar planta
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Power className="h-4 w-4 text-primary" />
              Registrar atuador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-2 gap-3" onSubmit={createActuator}>
              <div className="col-span-2 flex flex-col gap-1">
                <Label htmlFor="aname">Nome</Label>
                <Input id="aname" value={aName} onChange={(e) => setAName(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="atype">Tipo</Label>
                <select
                  id="atype"
                  value={aType}
                  onChange={(e) => setAType(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="irrigacao">Irrigação</option>
                  <option value="ventilacao">Ventilação</option>
                  <option value="iluminacao">Iluminação</option>
                  <option value="aquecedor">Aquecedor</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="aconsumption">Consumo (W)</Label>
                <Input
                  id="aconsumption"
                  type="number"
                  step="0.1"
                  value={aConsumption}
                  onChange={(e) => setAConsumption(e.target.value)}
                />
              </div>
              <label className="col-span-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={aStatus}
                  onChange={(e) => setAStatus(e.target.checked)}
                  className="h-4 w-4 accent-[var(--color-primary)]"
                />
                Ligado
              </label>
              <Button type="submit" className="col-span-2">
                Registrar atuador
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
