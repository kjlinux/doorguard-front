export interface DoorEvent {
  id: string
  doorId: string
  doorName: string
  status: "open" | "closed"
  timestamp: Date
  cardId: string
  cardHolder?: string
}

export interface Sensor {
  id: string
  name: string
  location: string
  doorId: string
  mqttTopic: string
  status: "online" | "offline"
  lastSeen?: Date
}

export interface MetricsData {
  totalEvents: number
  openDoors: number
  uniqueCards: number
  sensorsOnline: number
  hourlyActivity: { hour: string; events: number }[]
  doorActivity: { door: string; events: number }[]
}
