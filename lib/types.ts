export interface Badge {
  id: number
  uid: string
  holderName: string
  isActive: boolean
  doorsCount: number
  doors?: Door[]
  createdAt: string
}

export interface Door {
  id: number
  name: string
  slug: string
  location: string
  sensorId: number | null
  sensor?: Sensor
  badgesCount: number
  badges?: Badge[]
  createdAt: string
}

export interface Sensor {
  id: number
  name: string
  location: string
  mqttTopic: string
  mqttBroker?: string | null
  mqttPort?: number
  status: "online" | "offline"
  lastSeen?: Date
}

export interface AccessLog {
  id: number
  badgeUid: string
  holderName: string
  doorName: string
  doorLocation: string
  sensorName: string
  status: "accepted" | "refused" | "rejected" | "forced_open"
  respondedAt: Date
  createdAt: string
}

export interface MetricsData {
  totalAccess: number
  refusedAccess: number
  activeDoors: number
  sensorsOnline: number
  hourlyActivity: { hour: string; events: number }[]
  doorActivity: { door: string; events: number }[]
}
