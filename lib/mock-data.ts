import { DoorEvent, Sensor, MetricsData } from "./types"

// Generate realistic door events
export function generateMockDoorEvents(): DoorEvent[] {
  const doors = [
    { id: "door-1", name: "Main Entrance" },
    { id: "door-2", name: "Server Room" },
    { id: "door-3", name: "Office A" },
    { id: "door-4", name: "Storage" },
    { id: "door-5", name: "Emergency Exit" },
  ]

  const cardHolders = [
    { id: "CARD-0042", name: "John Smith" },
    { id: "CARD-0118", name: "Sarah Connor" },
    { id: "CARD-0233", name: "Mike Johnson" },
    { id: "CARD-0456", name: "Emily Davis" },
    { id: "CARD-0789", name: "Alex Chen" },
  ]

  const events: DoorEvent[] = []
  const now = new Date()

  for (let i = 0; i < 20; i++) {
    const door = doors[Math.floor(Math.random() * doors.length)]
    const card = cardHolders[Math.floor(Math.random() * cardHolders.length)]
    const minutesAgo = Math.floor(Math.random() * 480) // Last 8 hours

    events.push({
      id: `event-${i}`,
      doorId: door.id,
      doorName: door.name,
      status: Math.random() > 0.3 ? "open" : "closed",
      timestamp: new Date(now.getTime() - minutesAgo * 60 * 1000),
      cardId: card.id,
      cardHolder: card.name,
    })
  }

  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

export function generateMockSensors(): Sensor[] {
  return [
    {
      id: "sensor-1",
      name: "Main Entrance Sensor",
      location: "Building A - Ground Floor",
      doorId: "door-1",
      mqttTopic: "doorguard/sensors/main-entrance",
      status: "online",
      lastSeen: new Date(),
    },
    {
      id: "sensor-2",
      name: "Server Room Sensor",
      location: "Building A - Basement",
      doorId: "door-2",
      mqttTopic: "doorguard/sensors/server-room",
      status: "online",
      lastSeen: new Date(Date.now() - 30000),
    },
    {
      id: "sensor-3",
      name: "Office A Sensor",
      location: "Building A - 2nd Floor",
      doorId: "door-3",
      mqttTopic: "doorguard/sensors/office-a",
      status: "online",
      lastSeen: new Date(Date.now() - 60000),
    },
    {
      id: "sensor-4",
      name: "Storage Sensor",
      location: "Building B - Ground Floor",
      doorId: "door-4",
      mqttTopic: "doorguard/sensors/storage",
      status: "offline",
      lastSeen: new Date(Date.now() - 3600000),
    },
    {
      id: "sensor-5",
      name: "Emergency Exit Sensor",
      location: "Building A - Ground Floor",
      doorId: "door-5",
      mqttTopic: "doorguard/sensors/emergency",
      status: "online",
      lastSeen: new Date(Date.now() - 15000),
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
    totalEvents: 847,
    openDoors: 2,
    uniqueCards: 45,
    sensorsOnline: 4,
    hourlyActivity,
    doorActivity: [
      { door: "Main Entrance", events: 245 },
      { door: "Server Room", events: 87 },
      { door: "Office A", events: 312 },
      { door: "Storage", events: 98 },
      { door: "Emergency Exit", events: 105 },
    ],
  }
}
