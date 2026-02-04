import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { getEcho } from "@/lib/echo"
import type { SensorEvent } from "@/lib/types"

interface RawSensorEvent {
  id: string
  sensorId: string
  sensorName: string
  sensorLocation: string
  status: "open" | "closed"
  detectedAt: string
}

export function useSensorEvents(initialEvents: SensorEvent[] = []) {
  const [events, setEvents] = useState<SensorEvent[]>(initialEvents)
  const [connected, setConnected] = useState(false)
  const initializedRef = useRef(false)

  // Sync initial events when they change (from polling/fetch)
  useEffect(() => {
    setEvents(initialEvents)
  }, [initialEvents])

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    try {
      console.log("[useSensorEvents] Initializing WebSocket connection...")
      const echo = getEcho()
      console.log("[useSensorEvents] Echo instance obtained")
      const channel = echo.channel("sensor-events")

      console.log("[useSensorEvents] Channel created, subscribing...")

      channel
        .subscribed(() => {
          console.log("[useSensorEvents] Subscribed to sensor-events channel")
          setConnected(true)
        })
        .listen(".sensor.event.created", (raw: RawSensorEvent) => {
          console.log("[useSensorEvents] Event received:", raw)
          const event: SensorEvent = {
            ...raw,
            detectedAt: new Date(raw.detectedAt),
          }

          try {
            const audio = new Audio("/notification.mp3")
            audio.volume = 0.5
            audio.play().catch(() => {})
          } catch {
            // ignore audio errors
          }

          const statusText = event.status === "open" ? "Ouvert" : "Ferme"
          const statusEmoji = event.status === "open" ? ">" : "x"

          toast.success(`${statusEmoji} ${event.sensorName}`, {
            description: `${event.sensorLocation} - ${statusText}`,
            duration: 5000,
          })

          setEvents((prev) => {
            if (prev.some((e) => e.id === event.id)) return prev
            return [event, ...prev].slice(0, 50)
          })
        })

      channel.error((error: Error) => {
        console.error("[useSensorEvents] Channel error:", error)
      })
    } catch (err) {
      console.error("[useSensorEvents] INIT ERROR:", err)
    }

    return () => {
      try {
        const echo = getEcho()
        echo.leaveChannel("sensor-events")
      } catch {
        // ignore cleanup errors
      }
      setConnected(false)
      initializedRef.current = false
    }
  }, [])

  return { events, connected }
}
