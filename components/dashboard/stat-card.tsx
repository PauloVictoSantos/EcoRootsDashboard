import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Line, LineChart, ResponsiveContainer } from "recharts"

type TempStatus = "ideal" | "warning" | "critical"

function getTempStatus(value: number): TempStatus {
  if (value >= 18 && value <= 24) return "ideal"
  if ((value >= 15 && value < 18) || (value > 24 && value <= 27)) return "warning"
  return "critical"
}

export function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  hint,
  variant,
  trend,
  sparklineData,
}: {
  label: string
  value: string | number
  unit?: string
  icon: LucideIcon
  hint?: string
  trend?: string
  sparklineData?: number[]
  variant?: "temperature" | "light" | "default"
}) {
  const isTemp = variant === "temperature"
  
  const numVal = Number(value)
  const tempStatus: TempStatus | null = isTemp && !isNaN(numVal) ? getTempStatus(numVal) : null

  const statusStyles: Record<TempStatus, { card: string; icon: string; badge: string; label: string }> = {
    ideal: {
      card: "border-emerald-500/40 bg-emerald-950/10",
      icon: "bg-emerald-500/15 text-emerald-400",
      badge: "bg-emerald-500/15 text-emerald-400",
      label: "Ideal",
    },
    warning: {
      card: "border-amber-500/40 bg-amber-950/10",
      icon: "bg-amber-500/15 text-amber-400",
      badge: "bg-amber-500/15 text-amber-400",
      label: "Atenção",
    },
    critical: {
      card: "border-red-500/40 bg-red-950/10",
      icon: "bg-red-500/15 text-red-400",
      badge: "bg-red-500/15 text-red-400",
      label: "Crítico",
    },
  }

  const st = tempStatus ? statusStyles[tempStatus] : null

  return (
    <Card className={cn("border-border/70 transition-colors duration-300", st?.card)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-semibold text-foreground">{value}</span>
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            </div>

            {isTemp && tempStatus && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", st?.badge)}>
                  {statusStyles[tempStatus].label}
                </span>
                <span className="text-xs text-muted-foreground">Ideal 18–24 °C</span>
              </div>
            )}

            {trend && (
              <span className="text-xs text-emerald-400 font-medium">
                {trend}
              </span>
            )}
          </div>

          <div className={cn("flex h-9 w-9 items-center justify-center rounded-md", st?.icon ?? "bg-primary/10 text-primary")}>
            <Icon className="h-4 w-4" />
          </div>
        </div>

        {isTemp && !isNaN(numVal) && (
          <div className="mt-3">
            <div className="relative h-1.5 w-full rounded-full bg-border/60 overflow-hidden">
              <div
                className="absolute top-0 h-full bg-emerald-500/30 rounded-full"
                style={{ left: `${((18 - 10) / 25) * 100}%`, width: `${((24 - 18) / 25) * 100}%` }}
              />
              <div
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full ring-2 ring-background transition-all duration-500",
                  tempStatus === "ideal" ? "bg-emerald-400" : tempStatus === "warning" ? "bg-amber-400" : "bg-red-400"
                )}
                style={{ left: `calc(${Math.min(Math.max(((numVal - 10) / 25) * 100, 2), 98)}% - 5px)` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">10°</span>
              <span className="text-[10px] text-emerald-500">18–24°</span>
              <span className="text-[10px] text-muted-foreground">35°</span>
            </div>
          </div>
        )}

        {sparklineData && sparklineData.length > 1 && (
          <div className="mt-4 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={sparklineData.map((v: number, i: number) => ({
                  i,
                  value: v,
                }))}
              >
                <Line
                  type="monotone"
                  dataKey="value"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}