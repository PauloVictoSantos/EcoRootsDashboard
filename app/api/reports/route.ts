import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const plantId = searchParams.get("plant_id")

  const supabase = await createClient()
  let query = supabase
    .from("ai_reports")
    .select("*")
    .order("created_at", { ascending: false })

  if (plantId) query = query.eq("plant_id", plantId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
