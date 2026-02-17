import { useEffect, useRef, useState, useCallback } from "react"
import { getEcho } from "@/lib/echo"

export interface SensorStatusData {
  sensorId: string
  sensorName: string
  sensorLocation: string
  uniqueId: string
  status: string
  lastSeen: string
  data: {
    ssid?: string
    ip?: string
    status?: boolean
    action?: string
    [key: string]: unknown
  }
}

export function useSensorStatus() {
  const [statusData, setStatusData] = useState<SensorStatusData | null>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    try {
      const echo = getEcho()
      const channel = echo.channel("sensor-events")

      channel.listen(".sensor.status.updated", (data: SensorStatusData) => {
        setStatusData(data)
      })
    } catch (err) {
      console.error("[useSensorStatus] INIT ERROR:", err)
    }

    return () => {
      initializedRef.current = false
    }
  }, [])

  const clearStatus = useCallback(() => setStatusData(null), [])

  return { statusData, clearStatus }
}
