"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Droplets, Thermometer, Gauge, Sun, Leaf, RefreshCw, Plus } from "lucide-react"
import type { Plant, Sensor, Actuator } from "@/lib/types"
import { StatCard } from "./stat-card"
import { SensorChart } from "./sensor-chart"
import { PlantMap } from "./plant-map"
import { ActuatorList } from "./actuator-list"
import { useState } from "react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function avg(values: number[]) {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function DashboardView() {
  const { data: plants = [], mutate: mutatePlants } = useSWR<Plant[]>("/api/plants", fetcher, { refreshInterval: 15000 })
  const { data: sensors = [], mutate: mutateSensors } = useSWR<Sensor[]>("/api/sensors?limit=200", fetcher, { refreshInterval: 10000 })
  const { data: actuators = [], mutate: mutateActuators } = useSWR<Actuator[]>("/api/actuators?limit=50", fetcher, { refreshInterval: 10000 })

  const [seeding, setSeeding] = useState(false)

  const temperature = sensors.filter((s) => s.type === "temperatura")
  const humidity = sensors.filter((s) => s.type === "umidade")
  const soil = sensors.filter((s) => s.type === "solo")
  const light = sensors.filter((s) => s.type === "luminosidade")

  async function refreshAll() {
    await Promise.all([mutatePlants(), mutateSensors(), mutateActuators()])
  }

  async function seedDemo() {
    setSeeding(true)
    try {
      const types = [
        { type: "temperatura", unit: "°C", min: 22, max: 30 },
        { type: "umidade", unit: "%", min: 50, max: 85 },
        { type: "solo", unit: "%", min: 30, max: 70 },
        { type: "luminosidade", unit: "lux", min: 200, max: 900 },
      ]
      const plant = plants[0]
      await Promise.all(
        types.map((t) =>
          fetch("/api/sensors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              plant_id: plant?.id ?? null,
              type: t.type,
              unit: t.unit,
              value: +(t.min + Math.random() * (t.max - t.min)).toFixed(1),
            }),
          }),
        ),
      )
      await mutateSensors()
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Monitoramento em tempo real das plantas da estufa.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshAll}>
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          <Button size="sm" onClick={seedDemo} disabled={seeding}>
            <Plus className="h-4 w-4" />
            {seeding ? "Gerando..." : "Leitura demo"}
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Plantas"
          value={plants.length}
          icon={Leaf}
          hint={`${plants.filter((p) => p.status === "healthy").length} saudáveis`}
        />
        <StatCard
          label="Temperatura"
          value={avg(temperature.map((s) => Number(s.value))).toFixed(1)}
          unit="°C"
          icon={Thermometer}
          hint="Média atual"
        />
        <StatCard
          label="Umidade do solo"
          value={avg(soil.map((s) => Number(s.value))).toFixed(0)}
          unit="%"
          icon={Droplets}
          hint="Média atual"
        />
        <StatCard
          label="Luminosidade"
          value={avg(light.map((s) => Number(s.value))).toFixed(0)}
          unit="lux"
          icon={Sun}
          hint="Média atual"
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-primary" />
              Temperatura (°C)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SensorChart data={sensors} type="temperatura" unit="°C" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Droplets className="h-4 w-4 text-primary" />
              Umidade do ar (%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SensorChart data={sensors} type="umidade" unit="%" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              Umidade do solo (%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SensorChart data={sensors} type="solo" unit="%" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Sun className="h-4 w-4 text-primary" />
              Luminosidade (lux)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SensorChart data={sensors} type="luminosidade" unit="lux" />
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium">Mapa de posição das plantas</CardTitle>
          </CardHeader>
          <CardContent>
            <PlantMap plants={plants} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Atuadores</CardTitle>
          </CardHeader>
          <CardContent>
            <ActuatorList actuators={actuators} />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
