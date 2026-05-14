export type Plant = {
  id: string
  name: string
  species: string | null
  position_x: number
  position_y: number
  image_url: string | null
  status: string
  health_score: number
  created_at: string
}

export type Sensor = {
  id: string
  plant_id: string | null
  type: string
  value: number
  unit: string | null
  recorded_at: string
}

export type Actuator = {
  id: string
  plant_id: string | null
  name: string
  type: string
  status: boolean
  consumption: number
  recorded_at: string
}

export type AIReport = {
  id: string
  plant_id: string | null
  image_url: string | null
  health_score: number | null
  problems: string[]
  recommendations: string[]
  summary: string | null
  raw_response: unknown
  created_at: string
}
