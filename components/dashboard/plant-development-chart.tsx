// components/dashboard/plant-development-chart.tsx
"use client"

import {
  LineChart,
  Line,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface PlantHistory {
  plant_id: string
  plant_name: string
  day: number
  health_score: number
}

interface Props {
  data: PlantHistory[]
}

export function PlantDevelopmentChart({ data }: Props) {
  // agrupando média geral por dia
  const grouped = data.reduce((acc: any, item) => {
    if (!acc[item.day]) {
      acc[item.day] = {
        day: item.day,
        total: 0,
        count: 0,
      }
    }

    acc[item.day].total += item.health_score
    acc[item.day].count += 1

    return acc
  }, {})

  const chartData = Object.values(grouped).map((item: any) => ({
    day: item.day,
    media: Number((item.total / item.count).toFixed(1)),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Desenvolvimento Geral das Plantas
        </CardTitle>
      </CardHeader>

      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="day"
              label={{
                value: "Dias desde o plantio",
                position: "insideBottom",
                offset: -5,
              }}
            />

            <YAxis
              domain={[0, 100]}
              label={{
                value: "Health Score",
                angle: -90,
                position: "insideLeft",
              }}
            />

            <Tooltip />
            <Legend />

            <Line
              type="monotone"
              dataKey="media"
              strokeWidth={3}
              dot={false}
              name="Saúde média"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}