import type { MetricsData, AccessLog, Sensor, Badge, Door } from "./types"

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

export async function getMetrics(): Promise<MetricsData> {
  const [metricsRes, hourlyRes, doorRes] = await Promise.all([
    request<{
      totalAccess: number
      refusedAccess: number
      activeDoors: number
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
    totalAccess: metricsRes.totalAccess,
    refusedAccess: metricsRes.refusedAccess,
    activeDoors: metricsRes.activeDoors,
    sensorsOnline: metricsRes.sensorsOnline,
    hourlyActivity: hourlyRes.hourlyActivity,
    doorActivity: doorRes.doorActivity,
  }
}

// --- Access Logs ---

export async function getAccessLogs(
  limit = 15,
  filters?: { door_id?: number; badge_id?: number; status?: string }
): Promise<AccessLog[]> {
  const params = new URLSearchParams({ limit: String(limit) })
  if (filters?.door_id) params.set("door_id", String(filters.door_id))
  if (filters?.badge_id) params.set("badge_id", String(filters.badge_id))
  if (filters?.status) params.set("status", filters.status)

  const res = await request<{
    data: {
      id: number
      badgeUid: string
      holderName: string
      doorName: string
      doorLocation: string
      sensorName: string
      status: "accepted" | "refused" | "rejected" | "forced_open"
      respondedAt: string
      createdAt: string
    }[]
  }>(`/access-logs?${params}`)

  return res.data.map((e) => ({
    ...e,
    respondedAt: new Date(e.respondedAt),
  }))
}

// --- Badges ---

export async function getBadges(): Promise<Badge[]> {
  const res = await request<{ data: Badge[] }>("/badges")
  return res.data
}

export async function createBadge(data: {
  uid: string
  holder_name: string
}): Promise<Badge> {
  const res = await request<{ data: Badge }>("/badges", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return res.data
}

export async function updateBadge(
  id: number,
  data: { uid?: string; holder_name?: string; is_active?: boolean }
): Promise<Badge> {
  const res = await request<{ data: Badge }>(`/badges/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
  return res.data
}

export async function deleteBadge(id: number): Promise<void> {
  await request(`/badges/${id}`, { method: "DELETE" })
}

export async function toggleBadge(id: number): Promise<Badge> {
  const res = await request<{ data: Badge }>(`/badges/${id}/toggle`, {
    method: "POST",
  })
  return res.data
}

// --- Doors ---

export async function getDoors(): Promise<Door[]> {
  const res = await request<{ data: Door[] }>("/doors")
  return res.data
}

export async function getDoor(id: number): Promise<Door> {
  const res = await request<{ data: Door }>(`/doors/${id}`)
  return res.data
}

export async function createDoor(data: {
  name: string
  slug: string
  location?: string
  sensor_id?: number | null
}): Promise<Door> {
  const res = await request<{ data: Door }>("/doors", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return res.data
}

export async function updateDoor(
  id: number,
  data: { name?: string; slug?: string; location?: string; sensor_id?: number | null }
): Promise<Door> {
  const res = await request<{ data: Door }>(`/doors/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
  return res.data
}

export async function deleteDoor(id: number): Promise<void> {
  await request(`/doors/${id}`, { method: "DELETE" })
}

export async function assignBadgesToDoor(
  doorId: number,
  badgeIds: number[]
): Promise<void> {
  await request(`/doors/${doorId}/badges`, {
    method: "POST",
    body: JSON.stringify({ badge_ids: badgeIds }),
  })
}

export async function removeBadgeFromDoor(
  doorId: number,
  badgeId: number
): Promise<void> {
  await request(`/doors/${doorId}/badges/${badgeId}`, {
    method: "DELETE",
  })
}

// --- Sensors ---

export async function getSensors(): Promise<Sensor[]> {
  const res = await request<{
    data: {
      id: number
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
      id: number
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

export async function updateSensor(
  id: number,
  data: { name?: string; location?: string; mqtt_topic?: string }
): Promise<Sensor> {
  const res = await request<{
    data: {
      id: number
      name: string
      location: string
      mqttBroker: string | null
      mqttPort: number
      mqttTopic: string
      status: "online" | "offline"
      lastSeen: string | null
    }
  }>(`/sensors/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })

  return {
    ...res.data,
    lastSeen: res.data.lastSeen ? new Date(res.data.lastSeen) : undefined,
  }
}

export async function deleteSensor(id: number): Promise<void> {
  await request(`/sensors/${id}`, { method: "DELETE" })
}

// --- MQTT Commands ---

export async function sendMqttCommand(
  sensorId: number,
  command: "FORCED_OPEN" | "REBOOT" | "RESET" | "SLEEP" | "WAKE_UP" | "STATUS"
): Promise<{ success: boolean; message: string }> {
  return request("/mqtt/send-command", {
    method: "POST",
    body: JSON.stringify({ sensor_id: sensorId, command }),
  })
}

export async function testMqttConnection(
  topic: string
): Promise<{ success: boolean; message: string }> {
  return request("/mqtt/test", {
    method: "POST",
    body: JSON.stringify({ topic }),
  })
}
