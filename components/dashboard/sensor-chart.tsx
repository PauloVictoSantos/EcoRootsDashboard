"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { Sensor } from "@/lib/types"

export function SensorChart({ data, type, unit }: { data: Sensor[]; type: string; unit?: string }) {
  const series = data
    .filter((s) => s.type === type)
    .slice(0, 30)
    .reverse()
    .map((s) => ({
      time: new Date(s.recorded_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      value: Number(s.value),
    }))

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${type}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="time" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} width={40} />
          <Tooltip
            contentStyle={{
              background: "var(--color-popover)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v: number) => [`${v}${unit ? ` ${unit}` : ""}`, type]}
          />
          <Area type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={2} fill={`url(#grad-${type})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
