// app/api/upload/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    const supabase = await createClient()

    const ext = file.name.split(".").pop() ?? "jpg"
    const filename = `plants/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage
      .from("plant-images") // nome do bucket — crie no Supabase dashboard com acesso público
      .upload(filename, file, {
        contentType: file.type,
        upsert: false,
      })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: publicUrl } = supabase.storage
      .from("plant-images")
      .getPublicUrl(filename)

    return NextResponse.json({ url: publicUrl.publicUrl })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}