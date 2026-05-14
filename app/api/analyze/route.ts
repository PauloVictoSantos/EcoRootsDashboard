import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      image_base64,
      image_url,
      mime_type,
      position_x,
      position_y,
      sensors = [],
      actuators = [],
    } = body as {
      image_base64?: string
      image_url?: string
      mime_type?: string
      position_x: number
      position_y: number
      sensors: { type: string; value: number; unit?: string }[]
      actuators: { name: string; type: string; status: boolean; consumption: number }[]
    }

    if (!image_base64 && !image_url) {
      return NextResponse.json({ error: "image_base64 ou image_url é obrigatório" }, { status: 400 })
    }

    // Prepara base64
    let base64 = image_base64 ?? ""
    let detectedMime = mime_type ?? "image/jpeg"

    if (!base64 && image_url) {
      const res = await fetch(image_url)
      if (!res.ok) return NextResponse.json({ error: "Não foi possível baixar a imagem" }, { status: 400 })
      detectedMime = res.headers.get("content-type") ?? detectedMime
      base64 = Buffer.from(await res.arrayBuffer()).toString("base64")
    } else if (base64.startsWith("data:")) {
      const match = base64.match(/^data:(.+?);base64,(.*)$/)
      if (match) { detectedMime = match[1]; base64 = match[2] }
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY não configurada" }, { status: 500 })

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const contextData = `
Dados dos sensores: ${sensors.length > 0 ? JSON.stringify(sensors) : "Nenhum sensor disponível"}
Atuadores ativos: ${actuators.length > 0 ? JSON.stringify(actuators) : "Nenhum atuador disponível"}
Posição no ambiente: x=${position_x}, y=${position_y}
`

    const prompt = `Você é um agrônomo especialista. Analise a imagem desta planta junto com os dados abaixo:

${contextData}

Responda EXCLUSIVAMENTE em JSON válido (sem markdown, sem \`\`\`) no formato:
{
  "name": "<nome popular da planta>",
  "species": "<nome científico>",
  "health_score": <número de 0 a 100>,
  "status": "healthy" | "warning" | "critical",
  "problems": ["<problema 1>", "<problema 2>"],
  "recommendations": ["<recomendação 1>", "<recomendação 2>"],
  "summary": "<resumo de 2-3 frases em português considerando imagem, sensores e atuadores>"
}`

    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { data: base64, mimeType: detectedMime } },
    ])

    const text = result.response.text().trim()
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim()

    let parsed: {
      name?: string
      species?: string
      health_score?: number
      status?: string
      problems?: string[]
      recommendations?: string[]
      summary?: string
    } = {}

    try {
      parsed = JSON.parse(cleaned)
    } catch {
      parsed = { summary: cleaned, health_score: 70, problems: [], recommendations: [] }
    }

    const supabase = await createClient()

    // Verifica se já existe planta na mesma posição
    const { data: existing } = await supabase
      .from("plants")
      .select("id")
      .eq("position_x", position_x)
      .eq("position_y", position_y)
      .single()

    let plantId: string

    if (existing) {
      // Atualiza planta existente
      plantId = existing.id
      await supabase
        .from("plants")
        .update({
          name: parsed.name ?? "Planta",
          species: parsed.species ?? null,
          health_score: parsed.health_score ?? 100,
          status: parsed.status ?? "healthy",
          image_url: image_url ?? null,
        })
        .eq("id", plantId)
    } else {
      // Cria nova planta
      const { data: newPlant, error: plantError } = await supabase
        .from("plants")
        .insert({
          name: parsed.name ?? "Planta",
          species: parsed.species ?? null,
          position_x,
          position_y,
          health_score: parsed.health_score ?? 100,
          status: parsed.status ?? "healthy",
          image_url: image_url ?? null,
        })
        .select()
        .single()

      if (plantError) return NextResponse.json({ error: plantError.message }, { status: 500 })
      plantId = newPlant.id
    }

    // Salva sensores
    if (sensors.length > 0) {
      await supabase.from("sensors").insert(
        sensors.map((s) => ({
          plant_id: plantId,
          type: s.type,
          value: s.value,
          unit: s.unit ?? null,
        }))
      )
    }

    // Salva atuadores (upsert por nome+planta)
    if (actuators.length > 0) {
      await supabase.from("actuators").insert(
        actuators.map((a) => ({
          plant_id: plantId,
          name: a.name,
          type: a.type,
          status: a.status,
          consumption: a.consumption,
        }))
      )
    }

    // Salva relatório da IA
    const { data: report, error: reportError } = await supabase
      .from("ai_reports")
      .insert({
        plant_id: plantId,
        image_url: image_url ?? null,
        health_score: parsed.health_score ?? null,
        problems: parsed.problems ?? [],
        recommendations: parsed.recommendations ?? [],
        summary: parsed.summary ?? null,
        raw_response: parsed,
      })
      .select()
      .single()

    if (reportError) return NextResponse.json({ error: reportError.message }, { status: 500 })

    return NextResponse.json({
      plant_id: plantId,
      is_new_plant: !existing,
      report,
      analysis: parsed,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}