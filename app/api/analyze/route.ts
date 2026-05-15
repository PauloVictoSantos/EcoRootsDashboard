import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";

export const maxDuration = 60;

const POSITION_TOLERANCE = 5;

function detectFormat(buf: Buffer): "jpeg" | "png" | "bmp" | "raw" {
  if (buf[0] === 0xff && buf[1] === 0xd8) return "jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50) return "png";
  if (buf[0] === 0x42 && buf[1] === 0x4d) return "bmp";
  return "raw";
}

async function toJpeg(buf: Buffer): Promise<Buffer> {
  const fmt = detectFormat(buf);

  if (fmt === "raw") {
    const size = buf.length;
    let width = 160,
      height = 120;
    if (size === 80 * 60) {
      width = 80;
      height = 60;
    }
    if (size === 160 * 120) {
      width = 160;
      height = 120;
    }
    if (size === 320 * 240) {
      width = 320;
      height = 240;
    }

    return sharp(buf, {
      raw: { width, height, channels: 1 },
    })
      .jpeg({ quality: 85 })
      .toBuffer();
  }

  if (fmt === "bmp") {
    return sharp(buf).jpeg({ quality: 85 }).toBuffer();
  }

  if (fmt === "png") {
    return sharp(buf).jpeg({ quality: 85 }).toBuffer();
  }

  return buf;
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const url = new URL(request.url);

    let base64: string;
    let position_x: number;
    let position_y: number;
    let sensors: { type: string; value: number; unit?: string }[] = [];
    let actuators: {
      name: string;
      type: string;
      status: boolean;
      consumption: number;
    }[] = [];
    let image_url: string | undefined;

    if (
      contentType.includes("application/octet-stream") ||
      contentType.includes("image/")
    ) {
      const raw = Buffer.from(await request.arrayBuffer());
      const jpeg = await toJpeg(raw);
      base64 = jpeg.toString("base64");
      position_x = Number(url.searchParams.get("x") ?? 27);
      position_y = Number(url.searchParams.get("y") ?? 60);
    } else {
      const body = (await request.json()) as {
        image_base64?: string;
        image_url?: string;
        mime_type?: string;
        position_x: number;
        position_y: number;
        sensors?: typeof sensors;
        actuators?: typeof actuators;
      };

      position_x = body.position_x;
      position_y = body.position_y;
      sensors = body.sensors ?? [];
      actuators = body.actuators ?? [];
      image_url = body.image_url;

      if (body.image_base64) {
        let raw64 = body.image_base64;
        let mime = body.mime_type ?? "image/jpeg";

        if (raw64.startsWith("data:")) {
          const match = raw64.match(/^data:(.+?);base64,(.*)$/);
          if (match) {
            mime = match[1];
            raw64 = match[2];
          }
        }

        const buf = Buffer.from(raw64, "base64");
        const jpeg = await toJpeg(buf);
        base64 = jpeg.toString("base64");
      } else if (image_url) {
        const res = await fetch(image_url);
        if (!res.ok)
          return NextResponse.json(
            { error: "Não foi possível baixar a imagem" },
            { status: 400 }
          );
        const buf = Buffer.from(await res.arrayBuffer());
        const jpeg = await toJpeg(buf);
        base64 = jpeg.toString("base64");
      } else {
        return NextResponse.json(
          { error: "image_base64 ou image_url é obrigatório" },
          { status: 400 }
        );
      }
    }

    const supabase = await createClient();
    let savedImageUrl: string | null = image_url ?? null;

    if (!savedImageUrl) {
      const buffer = Buffer.from(base64, "base64");
      const filename = `plants/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("plant-images")
        .upload(filename, buffer, { contentType: "image/jpeg", upsert: false });

      if (!uploadError) {
        const { data: pub } = supabase.storage
          .from("plant-images")
          .getPublicUrl(filename);
        savedImageUrl = pub.publicUrl;
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
      return NextResponse.json(
        { error: "GEMINI_API_KEY não configurada" },
        { status: 500 }
      );

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const contextData = `
Dados dos sensores: ${
      sensors.length > 0 ? JSON.stringify(sensors) : "Nenhum sensor disponível"
    }
Atuadores: ${
      actuators.length > 0
        ? JSON.stringify(actuators)
        : "Nenhum atuador disponível"
    }
Posição na estufa (cm): x=${position_x}cm, y=${position_y}cm (estufa de 54cm x 120cm)
`;

    const prompt = `Você é um agrônomo especialista em hidroponia, fitopatologia, fisiologia vegetal e monitoramento de estufas inteligentes.

Sua função é analisar:
1. A imagem da planta
2. Dados de sensores
3. Estado dos atuadores
4. Condições ambientais da estufa

IMPORTANTE:
- Seja técnico e preciso.
- Não invente informações.
- Caso não tenha certeza, indique baixa confiança.
- Relacione sintomas visuais com sensores.
- Considere hidroponia indoor.
- Considere estresse térmico, hídrico, luminoso e doenças fúngicas/bacterianas.
- Use linguagem técnica mas compreensível.
- Retorne SOMENTE JSON válido.
- NÃO use markdown.
- NÃO use crases.
- NÃO explique fora do JSON.

========================
DADOS DA ESTUFA
========================

${contextData}

========================
REGRAS DE ANÁLISE
========================

TEMPERATURA:
- Ideal: 18°C a 24°C
- Atenção: 15°C–18°C ou 24°C–27°C
- Crítico: abaixo de 15°C ou acima de 27°C

LUMINOSIDADE:
- Ideal frutificação: 10000–20000 lux
- Baixa luminosidade pode causar:
  - crescimento lento
  - frutos fracos
  - fungos
  - estiolamento

SINAIS VISUAIS IMPORTANTES:
- manchas escuras
- podridão
- amarelecimento
- necrose
- mofo
- murcha
- desidratação
- deficiência nutricional
- queimadura solar
- ataque fúngico
- ataque bacteriano

HEALTH SCORE:
- 90–100 = excelente
- 70–89 = saudável
- 50–69 = atenção
- 30–49 = ruim
- 0–29 = crítico

STATUS:
- healthy
- warning
- critical

========================
INSTRUÇÕES
========================

Analise:
- estado geral da planta
- possíveis doenças
- nível de severidade
- impacto ambiental
- relação entre sensores e sintomas
- risco para outras plantas
- estágio de crescimento
- urgência da ação

As recomendações devem ser:
- específicas
- acionáveis
- priorizadas
- técnicas
Responda EXCLUSIVAMENTE em JSON válido (sem markdown, sem \`\`\`) no formato:
{
  "name": "<nome popular da planta>",
  "species": "<nome científico>",
  "health_score": <número de 0 a 100>,
  "status": "healthy" | "warning" | "critical",
  "problems": ["<problema detalhado 1>"],
  "recommendations": ["<recomendação acionável 1>"],
  "summary": "<análise completa de 3-4 frases em português>",
  "growth_stage": "<muda | vegetativo | floração | frutificação | maturação>",
  "next_action": "<ação mais urgente agora>"
}`;

    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { data: base64, mimeType: "image/jpeg" } },
    ]);

    const text = result.response.text().trim();
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let parsed: {
      name?: string;
      species?: string;
      health_score?: number;
      status?: string;
      problems?: string[];
      recommendations?: string[];
      summary?: string;
      growth_stage?: string;
      next_action?: string;
    } = {};

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        summary: cleaned,
        health_score: 70,
        problems: [],
        recommendations: [],
      };
    }

    const { data: nearby } = await supabase
      .from("plants")
      .select("id, position_x, position_y")
      .gte("position_x", position_x - POSITION_TOLERANCE)
      .lte("position_x", position_x + POSITION_TOLERANCE)
      .gte("position_y", position_y - POSITION_TOLERANCE)
      .lte("position_y", position_y + POSITION_TOLERANCE)
      .limit(1)
      .single();

    let plantId: string;
    const isNew = !nearby;

    if (nearby) {
      plantId = nearby.id;
      await supabase
        .from("plants")
        .update({
          name: parsed.name ?? "Planta",
          species: parsed.species ?? null,
          health_score: parsed.health_score ?? 100,
          status: parsed.status ?? "healthy",
          image_url: savedImageUrl,
        })
        .eq("id", plantId);
    } else {
      const { data: newPlant, error: plantError } = await supabase
        .from("plants")
        .insert({
          name: parsed.name ?? "Planta",
          species: parsed.species ?? null,
          position_x,
          position_y,
          health_score: parsed.health_score ?? 100,
          status: parsed.status ?? "healthy",
          image_url: savedImageUrl,
        })
        .select()
        .single();

      if (plantError)
        return NextResponse.json(
          { error: plantError.message },
          { status: 500 }
        );
      plantId = newPlant.id;
    }

    if (sensors.length > 0) {
      await supabase.from("sensors").insert(
        sensors.map((s) => ({
          plant_id: plantId,
          type: s.type,
          value: s.value,
          unit: s.unit ?? null,
        }))
      );
    }

    for (const a of actuators) {
      const { data: existing } = await supabase
        .from("actuators")
        .select("id")
        .eq("plant_id", plantId)
        .eq("name", a.name)
        .single();

      if (existing) {
        await supabase
          .from("actuators")
          .update({
            type: a.type,
            status: a.status,
            consumption: a.consumption,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("actuators").insert({
          plant_id: plantId,
          name: a.name,
          type: a.type,
          status: a.status,
          consumption: a.consumption,
        });
      }
    }

    const { data: report, error: reportError } = await supabase
      .from("ai_reports")
      .insert({
        plant_id: plantId,
        image_url: savedImageUrl,
        health_score: parsed.health_score ?? null,
        problems: parsed.problems ?? [],
        recommendations: parsed.recommendations ?? [],
        summary: parsed.summary ?? null,
        raw_response: parsed,
      })
      .select()
      .single();

    if (reportError)
      return NextResponse.json({ error: reportError.message }, { status: 500 });

    return NextResponse.json({
      plant_id: plantId,
      is_new_plant: isNew,
      image_url: savedImageUrl,
      report,
      analysis: parsed,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
