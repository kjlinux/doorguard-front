import { useEffect, useRef, useState } from "react"
import { getEcho } from "@/lib/echo"
import type { DoorEvent } from "@/lib/types"

interface RawDoorEvent {
  id: string
  doorId: string
  doorName: string
  status: "open" | "closed"
  timestamp: string
  cardId: string
  cardHolder?: string
}

export function useDoorEvents(initialEvents: DoorEvent[] = []) {
  const [events, setEvents] = useState<DoorEvent[]>(initialEvents)
  const [connected, setConnected] = useState(false)
  const initializedRef = useRef(false)

  // Sync initial events when they change (from polling/fetch)
  useEffect(() => {
    setEvents(initialEvents)
  }, [initialEvents])

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const echo = getEcho()
    const channel = echo.channel("door-events")

    channel
      .subscribed(() => {
        setConnected(true)
      })
      .listen(".door.event.created", (raw: RawDoorEvent) => {
        const event: DoorEvent = {
          ...raw,
          timestamp: new Date(raw.timestamp),
        }
        setEvents((prev) => {
          // Avoid duplicates
          if (prev.some((e) => e.id === event.id)) return prev
          // Prepend and cap at 50
          return [event, ...prev].slice(0, 50)
        })
      })

    return () => {
      echo.leaveChannel("door-events")
      setConnected(false)
      initializedRef.current = false
    }
  }, [])

  return { events, connected }
}
