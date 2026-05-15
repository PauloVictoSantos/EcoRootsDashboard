"use client"

import { useState } from "react"
import useSWR from "swr"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import {
  Thermometer,
  Sun,
  Leaf,
  RefreshCw,
  Plus,
} from "lucide-react"

import type {
  Plant,
  Sensor,
  Actuator,
  AIReport,
} from "@/lib/types"

import { StatCard } from "./stat-card"
import { SensorChart } from "./sensor-chart"
import { PlantMap } from "./plant-map"
import { ActuatorList } from "./actuator-list"
import { LightCycleBlock } from "./light-cycle-block"
import { PlantDevelopmentChart } from "./plant-development-chart"

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json())

function avg(values: number[]) {
  if (values.length === 0) return 0

  return values.reduce((a, b) => a + b, 0) / values.length
}

export function DashboardView() {
  const {
    data: plantsData,
    mutate: mutatePlants,
  } = useSWR<Plant[]>(
    "/api/plants",
    fetcher,
    {
      refreshInterval: 15000,
    }
  )

  const {
    data: sensorsData,
    mutate: mutateSensors,
  } = useSWR<Sensor[]>(
    "/api/sensors?limit=200",
    fetcher,
    {
      refreshInterval: 10000,
    }
  )

  const {
    data: actuatorsData,
    mutate: mutateActuators,
  } = useSWR<Actuator[]>(
    "/api/actuators?limit=50",
    fetcher,
    {
      refreshInterval: 10000,
    }
  )

  const [seeding, setSeeding] = useState(false)

  const plants: Plant[] = Array.isArray(plantsData)
    ? plantsData
    : (plantsData as any)?.plants ?? []

  const sensors: Sensor[] = Array.isArray(sensorsData)
    ? sensorsData
    : (sensorsData as any)?.sensors ?? []

  const actuators: Actuator[] = Array.isArray(actuatorsData)
    ? actuatorsData
    : (actuatorsData as any)?.actuators ?? []

  const temperature = sensors.filter(
    (s) => s.type === "temperatura"
  )

  const light = sensors.filter(
    (s) => s.type === "luminosidade"
  )

  const avgTemp = avg(
    temperature.map((s) => Number(s.value))
  )

  const avgLux = avg(
    light.map((s) => Number(s.value))
  )

  const latestTemp = Number(
    temperature.at(-1)?.value ?? 0
  )

  const previousTemp = Number(
    temperature.at(-10)?.value ?? latestTemp
  )

  const tempDelta = latestTemp - previousTemp

  const tempTrend =
    tempDelta >= 0
      ? `↑ +${tempDelta.toFixed(1)}° última hora`
      : `↓ ${Math.abs(tempDelta).toFixed(1)}° última hora`

  const developmentData = plants.flatMap((plant) =>
    ((plant as any).ai_reports ?? [])
      .filter(
        (report: AIReport) =>
          report.health_score != null
      )
      .map(
        (
          report: AIReport,
          index: number
        ) => ({
          plant_id: plant.id,
          plant_name: plant.name,
          day: index + 1,
          health_score: Number(
            report.health_score
          ),
        })
      )
  )

  async function refreshAll() {
    await Promise.all([
      mutatePlants(),
      mutateSensors(),
      mutateActuators(),
    ])
  }

  async function seedDemo() {
    setSeeding(true)

    try {
      const types = [
        {
          type: "temperatura",
          unit: "°C",
          min: 16,
          max: 30,
        },
        {
          type: "luminosidade",
          unit: "lux",
          min: 0,
          max: 900,
        },
      ]

      const plant = plants[0]

      await Promise.all(
        types.map((t) =>
          fetch("/api/sensors", {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              plant_id: plant?.id ?? null,
              type: t.type,
              unit: t.unit,
              value: +(
                t.min +
                Math.random() *
                (t.max - t.min)
              ).toFixed(1),
            }),
          })
        )
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
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Dashboard
          </h1>

          <p className="text-sm text-muted-foreground">
            Monitoramento em tempo real da
            estufa hidropônica.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>

          <Button
            size="sm"
            onClick={seedDemo}
            disabled={seeding}
          >
            <Plus className="h-4 w-4" />

            {seeding
              ? "Gerando..."
              : "Leitura demo"}
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Plantas"
          value={plants.length}
          icon={Leaf}
          hint={`${plants.filter((p) => p.status === "healthy").length} saudáveis`}
          trend={`${plants.filter((p) => p.status === "critical").length} críticas`}
        />

        <StatCard
          label="Temperatura"
          value={avgTemp.toFixed(1)}
          unit="°C"
          icon={Thermometer}
          variant="temperature"
          hint="Faixa ideal: 18°C – 24°C"
          trend={tempTrend}
          sparklineData={temperature
            .slice(-20)
            .map((s) => Number(s.value))}
        />

        <StatCard
          label="Luminosidade"
          value={avgLux.toFixed(0)}
          unit="lux"
          icon={Sun}
          variant="light"
          hint="Ideal: 10k – 20k lux"
          trend={
            avgLux < 10000
              ? "↓ abaixo do ideal"
              : avgLux > 20000
                ? "↑ excesso de luz"
                : "✓ luminosidade ideal"
          }
          sparklineData={light
            .slice(-20)
            .map((s) => Number(s.value))}
        />
      </section>

      <section>
        <PlantDevelopmentChart
          data={developmentData}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-primary" />
              Temperatura da água (°C)
            </CardTitle>
          </CardHeader>

          <CardContent>
            <SensorChart
              data={sensors}
              type="temperatura"
              unit="°C"
              referenceLines={[
                {
                  value: 18,
                  label: "mín ideal",
                  color: "#34d399",
                },
                {
                  value: 24,
                  label: "máx ideal",
                  color: "#f87171",
                },
              ]}
            />

            <p className="mt-2 text-xs text-muted-foreground">
              Acima de 24 °C o oxigênio
              dissolvido cai e o risco de
              <em> Pythium</em> aumenta.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Sun className="h-4 w-4 text-primary" />
              Luminosidade / UV (lux)
            </CardTitle>
          </CardHeader>

          <CardContent>
            <SensorChart
              data={sensors}
              type="luminosidade"
              unit="lux"
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-400" />
              Ciclo de luz
            </CardTitle>
          </CardHeader>

          <CardContent>
            <LightCycleBlock
              sensors={sensors}
            />
          </CardContent>
        </Card>

        {/* MAP */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Mapa das plantas
            </CardTitle>
          </CardHeader>

          <CardContent>
            <PlantMap plants={plants} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Atuadores
            </CardTitle>
          </CardHeader>

          <CardContent>
            <ActuatorList
              actuators={actuators}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}