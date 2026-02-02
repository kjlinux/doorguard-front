const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem("doorguard_token")
}

function setToken(token: string): void {
  sessionStorage.setItem("doorguard_token", token)
}

function clearToken(): void {
  sessionStorage.removeItem("doorguard_token")
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  if (res.status === 401) {
    clearToken()
    if (typeof window !== "undefined") {
      window.location.href = "/"
    }
    throw new Error("Non authentifie")
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `Erreur ${res.status}`)
  }

  if (res.status === 204) return null as T

  return res.json()
}

// --- Auth ---

export async function login(
  email: string,
  password: string
): Promise<{ user: { id: number; name: string; email: string }; token: string }> {
  const data = await request<{
    user: { id: number; name: string; email: string }
    token: string
  }>("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
  setToken(data.token)
  return data
}

export async function logout(): Promise<void> {
  try {
    await request("/logout", { method: "POST" })
  } finally {
    clearToken()
  }
}

export async function getMe(): Promise<{
  id: number
  name: string
  email: string
}> {
  return request("/me")
}

// --- Dashboard ---

import type { MetricsData, DoorEvent, Sensor } from "./types"

export async function getMetrics(): Promise<MetricsData> {
  const [metricsRes, hourlyRes, doorRes] = await Promise.all([
    request<{
      totalEvents: number
      openDoors: number
      uniqueCards: number
      sensorsOnline: number
    }>("/dashboard/metrics"),
    request<{
      hourlyActivity: { hour: string; events: number }[]
    }>("/dashboard/hourly-activity"),
    request<{
      doorActivity: { door: string; events: number }[]
    }>("/dashboard/door-activity"),
  ])

  return {
    totalEvents: metricsRes.totalEvents,
    openDoors: metricsRes.openDoors,
    uniqueCards: metricsRes.uniqueCards,
    sensorsOnline: metricsRes.sensorsOnline,
    hourlyActivity: hourlyRes.hourlyActivity,
    doorActivity: doorRes.doorActivity,
  }
}

export async function getEvents(
  limit = 10
): Promise<DoorEvent[]> {
  const res = await request<{
    data: {
      id: string
      doorId: string
      doorName: string
      status: "open" | "closed"
      timestamp: string
      cardId: string
      cardHolder?: string
    }[]
  }>(`/events?limit=${limit}`)

  return res.data.map((e) => ({
    ...e,
    timestamp: new Date(e.timestamp),
  }))
}

// --- Sensors ---

export async function getSensors(): Promise<Sensor[]> {
  const res = await request<{
    data: {
      id: string
      name: string
      location: string
      doorId: string
      mqttBroker: string | null
      mqttPort: number
      mqttTopic: string
      status: "online" | "offline"
      lastSeen: string | null
    }[]
  }>("/sensors")

  return res.data.map((s) => ({
    ...s,
    mqttTopic: s.mqttTopic,
    lastSeen: s.lastSeen ? new Date(s.lastSeen) : undefined,
  }))
}

export async function createSensor(data: {
  name: string
  location: string
  door_id: number
  mqtt_broker?: string
  mqtt_port?: number
  mqtt_topic: string
}): Promise<Sensor> {
  const res = await request<{
    data: {
      id: string
      name: string
      location: string
      doorId: string
      mqttBroker: string | null
      mqttPort: number
      mqttTopic: string
      status: "online" | "offline"
      lastSeen: string | null
    }
  }>("/sensors", {
    method: "POST",
    body: JSON.stringify(data),
  })

  return {
    ...res.data,
    lastSeen: res.data.lastSeen ? new Date(res.data.lastSeen) : undefined,
  }
}

export async function testMqttConnection(
  broker: string,
  port: number,
  topic: string
): Promise<{ success: boolean; message: string }> {
  return request("/mqtt/test", {
    method: "POST",
    body: JSON.stringify({ broker, port, topic }),
  })
}

// --- Doors ---

export async function getDoors(): Promise<
  { id: string; name: string; slug: string; location: string | null }[]
> {
  const res = await request<{
    data: { id: string; name: string; slug: string; location: string | null }[]
  }>("/doors")
  return res.data
}
