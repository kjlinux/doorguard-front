import { SensorEvent, Sensor, MetricsData } from "./types"

// Generate realistic sensor events
export function generateMockSensorEvents(): SensorEvent[] {
  const sensors = [
    { id: "sensor-1", name: "Main Entrance Sensor", location: "Building A - Ground Floor" },
    { id: "sensor-2", name: "Server Room Sensor", location: "Building A - Basement" },
  ]

  const events: SensorEvent[] = []
  const now = new Date()

  for (let i = 0; i < 20; i++) {
    const sensor = sensors[Math.floor(Math.random() * sensors.length)]
    const minutesAgo = Math.floor(Math.random() * 480) // Last 8 hours

    events.push({
      id: `event-${i}`,
      sensorId: sensor.id,
      sensorName: sensor.name,
      sensorLocation: sensor.location,
      status: Math.random() > 0.3 ? "open" : "closed",
      detectedAt: new Date(now.getTime() - minutesAgo * 60 * 1000),
    })
  }

  return events.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())
}

export function generateMockSensors(): Sensor[] {
  return [
    {
      id: "sensor-1",
      name: "Main Entrance Sensor",
      location: "Building A - Ground Floor",
      mqttTopic: "doorguard/sensor/1/event",
      status: "online",
      lastSeen: new Date(),
    },
    {
      id: "sensor-2",
      name: "Server Room Sensor",
      location: "Building A - Basement",
      mqttTopic: "doorguard/sensor/2/event",
      status: "online",
      lastSeen: new Date(Date.now() - 30000),
    },
  ]
}

export function generateMockMetrics(): MetricsData {
  const hourlyActivity = []
  for (let i = 0; i < 12; i++) {
    const hour = new Date()
    hour.setHours(hour.getHours() - (11 - i))
    hourlyActivity.push({
      hour: hour.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      events: Math.floor(Math.random() * 15) + 2,
    })
  }

  return {
    totalEvents: 124,
    openSensors: 1,
    sensorsOnline: 2,
    hourlyActivity,
    sensorActivity: [
      { sensor: "Main Entrance Sensor", events: 78 },
      { sensor: "Server Room Sensor", events: 46 },
    ],
  }
}
