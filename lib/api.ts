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

import type { MetricsData, SensorEvent, Sensor } from "./types"

export async function getMetrics(): Promise<MetricsData> {
  const [metricsRes, hourlyRes, sensorRes] = await Promise.all([
    request<{
      totalEvents: number
      openSensors: number
      sensorsOnline: number
    }>("/dashboard/metrics"),
    request<{
      hourlyActivity: { hour: string; events: number }[]
    }>("/dashboard/hourly-activity"),
    request<{
      sensorActivity: { sensor: string; events: number }[]
    }>("/dashboard/sensor-activity"),
  ])

  return {
    totalEvents: metricsRes.totalEvents,
    openSensors: metricsRes.openSensors,
    sensorsOnline: metricsRes.sensorsOnline,
    hourlyActivity: hourlyRes.hourlyActivity,
    sensorActivity: sensorRes.sensorActivity,
  }
}

export async function getEvents(
  limit = 10
): Promise<SensorEvent[]> {
  const res = await request<{
    data: {
      id: string
      sensorId: string
      sensorName: string
      sensorLocation: string
      status: "open" | "closed"
      detectedAt: string
    }[]
  }>(`/events?limit=${limit}`)

  return res.data.map((e) => ({
    ...e,
    detectedAt: new Date(e.detectedAt),
  }))
}

// --- Sensors ---

export async function getSensors(): Promise<Sensor[]> {
  const res = await request<{
    data: {
      id: string
      name: string
      location: string
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
  mqtt_topic: string
}): Promise<Sensor> {
  const res = await request<{
    data: {
      id: string
      name: string
      location: string
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
  topic: string
): Promise<{ success: boolean; message: string }> {
  return request("/mqtt/test", {
    method: "POST",
    body: JSON.stringify({ topic }),
  })
}

