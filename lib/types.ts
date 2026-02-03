export interface SensorEvent {
  id: string
  sensorId: string
  sensorName: string
  sensorLocation: string
  status: "open" | "closed"
  detectedAt: Date
}

export interface Sensor {
  id: string
  name: string
  location: string
  mqttTopic: string
  status: "online" | "offline"
  lastSeen?: Date
}

export interface MetricsData {
  totalEvents: number
  openSensors: number
  sensorsOnline: number
  hourlyActivity: { hour: string; events: number }[]
  sensorActivity: { sensor: string; events: number }[]
}
