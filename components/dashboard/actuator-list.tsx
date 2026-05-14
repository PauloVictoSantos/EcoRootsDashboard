import type { Actuator } from "@/lib/types"
import { Droplets, Fan, Lightbulb, Power } from "lucide-react"

function iconFor(type: string) {
  const t = type.toLowerCase()
  if (t.includes("water") || t.includes("irrig") || t.includes("agua")) return Droplets
  if (t.includes("fan") || t.includes("vent")) return Fan
  if (t.includes("light") || t.includes("luz") || t.includes("lamp")) return Lightbulb
  return Power
}

export function ActuatorList({ actuators }: { actuators: Actuator[] }) {
  // Deduplicate by name keeping the most recent
  const seen = new Set<string>()
  const latest = actuators.filter((a) => {
    if (seen.has(a.name)) return false
    seen.add(a.name)
    return true
  })

  if (latest.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum atuador registrado.</p>
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {latest.map((a) => {
        const Icon = iconFor(a.type)
        return (
          <li key={a.id} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{a.name}</span>
                <span className="text-xs text-muted-foreground capitalize">{a.type}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{Number(a.consumption).toFixed(1)} W</span>
              <span
                className={
                  a.status
                    ? "rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary"
                    : "rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                }
              >
                {a.status ? "Ligado" : "Desligado"}
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
