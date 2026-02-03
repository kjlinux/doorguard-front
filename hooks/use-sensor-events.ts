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

    console.log("[useSensorEvents] Initializing WebSocket connection...")
    const echo = getEcho()
    const channel = echo.channel("sensor-events")

    console.log("[useSensorEvents] Channel created:", channel)

    channel
      .subscribed(() => {
        console.log("[useSensorEvents] ✅ Successfully subscribed to sensor-events channel")
        setConnected(true)
      })
      .listen(".sensor.event.created", (raw: RawSensorEvent) => {
        console.log("[useSensorEvents] 🔔 Event received:", raw)
        const event: SensorEvent = {
          ...raw,
          detectedAt: new Date(raw.detectedAt),
        }
        console.log("[useSensorEvents] Processed event:", event)

        // Play notification sound
        try {
          const audio = new Audio("/notification.mp3")
          audio.volume = 0.5
          audio.play().catch((error) => {
            console.warn("[useSensorEvents] ⚠️ Could not play notification sound:", error)
          })
        } catch (error) {
          console.warn("[useSensorEvents] ⚠️ Audio error:", error)
        }

        // Show toast notification
        const statusText = event.status === "open" ? "Ouvert" : "Fermé"
        const statusEmoji = event.status === "open" ? "🚪" : "🔒"

        toast.success(`${statusEmoji} ${event.sensorName}`, {
          description: `${event.sensorLocation} - ${statusText}`,
          duration: 5000,
        })

        setEvents((prev) => {
          // Avoid duplicates
          if (prev.some((e) => e.id === event.id)) {
            console.log("[useSensorEvents] ⚠️ Duplicate event ignored:", event.id)
            return prev
          }
          // Prepend and cap at 50
          const newEvents = [event, ...prev].slice(0, 50)
          console.log("[useSensorEvents] ✅ Events updated. Total:", newEvents.length)
          return newEvents
        })
      })

    // Listen for errors
    channel.error((error: Error) => {
      console.error("[useSensorEvents] ❌ Channel error:", error)
    })

    return () => {
      console.log("[useSensorEvents] Cleaning up WebSocket connection...")
      echo.leaveChannel("sensor-events")
      setConnected(false)
      initializedRef.current = false
    }
  }, [])

  return { events, connected }
}
