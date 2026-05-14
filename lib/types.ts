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

export type RawResponse = {
  next_action?: string
  growth_stage?: string
  status?: string
}
export interface AIReport {
  id: string
  created_at: string
  health_score?: number
  summary?: string
  problems: string[]
  recommendations: string[]

  raw_response?: RawResponse
}