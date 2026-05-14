import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

export function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  hint,
}: {
  label: string
  value: string | number
  unit?: string
  icon: LucideIcon
  hint?: string
}) {
  return (
    <Card className="border-border/70">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-semibold text-foreground">{value}</span>
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            </div>
            {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
