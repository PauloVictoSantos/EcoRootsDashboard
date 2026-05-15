// lib/supabase/server.ts
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log("[supabase/server] URL:", url?.slice(0, 30))
console.log("[supabase/server] KEY:", key?.slice(0, 20))

if (!url || !key) {
  throw new Error(`Supabase env missing — URL: ${url}, KEY: ${key?.slice(0,10)}`)
}

export function createClient() {
  return createSupabaseClient(url, key)
}