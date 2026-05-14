import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const plantId = searchParams.get("plant_id")
  const limit = Number(searchParams.get("limit") ?? 100)

  const supabase = await createClient()
  let query = supabase
    .from("sensors")
    .select("*")
    .order("recorded_at", { ascending: false })
    .limit(limit)

  if (plantId) query = query.eq("plant_id", plantId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await request.json()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("sensors")
    .insert({
      plant_id: body.plant_id ?? null,
      type: body.type,
      value: body.value,
      unit: body.unit ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
