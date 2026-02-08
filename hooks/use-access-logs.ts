import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { getEcho } from "@/lib/echo"
import type { AccessLog } from "@/lib/types"

interface RawAccessLog {
  id: number
  badgeUid: string
  holderName: string
  doorName: string
  doorLocation: string
  sensorName: string
  status: "accepted" | "refused" | "rejected" | "forced_open"
  respondedAt: string
  createdAt: string
}

const statusLabels: Record<string, string> = {
  accepted: "Accepte",
  refused: "Refuse",
  rejected: "Rejete",
  forced_open: "Ouverture forcee",
}

export function useAccessLogs(initialLogs: AccessLog[] = []) {
  const [logs, setLogs] = useState<AccessLog[]>(initialLogs)
  const [connected, setConnected] = useState(false)
  const initializedRef = useRef(false)

  useEffect(() => {
    setLogs(initialLogs)
  }, [initialLogs])

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    try {
      const echo = getEcho()
      const channel = echo.channel("access-logs")

      channel
        .subscribed(() => {
          setConnected(true)
        })
        .listen(".access.log.created", (raw: RawAccessLog) => {
          const log: AccessLog = {
            ...raw,
            respondedAt: new Date(raw.respondedAt),
          }

          try {
            const audio = new Audio("/notification.mp3")
            audio.volume = 0.5
            audio.play().catch(() => {})
          } catch {
            // ignore
          }

          const statusText = statusLabels[log.status] || log.status
          const isSuccess = log.status === "accepted"

          if (isSuccess) {
            toast.success(`${log.holderName} - ${log.doorName}`, {
              description: `${log.doorLocation} - ${statusText}`,
              duration: 5000,
            })
          } else {
            toast.error(`${log.holderName} - ${log.doorName}`, {
              description: `${log.doorLocation} - ${statusText}`,
              duration: 5000,
            })
          }

          setLogs((prev) => {
            if (prev.some((e) => e.id === log.id)) return prev
            return [log, ...prev].slice(0, 50)
          })
        })

      channel.error((error: Error) => {
        console.error("[useAccessLogs] Channel error:", error)
      })
    } catch (err) {
      console.error("[useAccessLogs] INIT ERROR:", err)
    }

    return () => {
      try {
        const echo = getEcho()
        echo.leaveChannel("access-logs")
      } catch {
        // ignore
      }
      setConnected(false)
      initializedRef.current = false
    }
  }, [])

  return { logs, connected }
}
