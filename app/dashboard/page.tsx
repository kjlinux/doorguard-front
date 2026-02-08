"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import { MetricsCards } from "@/components/dashboard/metrics-cards"
import { ActivityChart } from "@/components/dashboard/activity-chart"
import { DoorActivityChart } from "@/components/dashboard/door-activity-chart"
import { DoorEventsTable } from "@/components/dashboard/door-events-table"
import { isAuthenticated, getMetrics, getAccessLogs } from "@/lib/api"
import { AccessLog, MetricsData } from "@/lib/types"
import { useAccessLogs } from "@/hooks/use-access-logs"

export default function DashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [fetchedLogs, setFetchedLogs] = useState<AccessLog[]>([])
  const [metrics, setMetrics] = useState<MetricsData | null>(null)

  const { logs, connected } = useAccessLogs(fetchedLogs)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/")
      return
    }

    const fetchData = async () => {
      try {
        const [metricsData, logsData] = await Promise.all([
          getMetrics(),
          getAccessLogs(10),
        ])
        setMetrics(metricsData)
        setFetchedLogs(logsData)
      } catch {
        router.push("/")
        return
      }
      setIsLoading(false)
    }

    fetchData()

    const interval = setInterval(async () => {
      try {
        const metricsData = await getMetrics()
        setMetrics(metricsData)
      } catch {
        // silently ignore polling errors
      }
    }, 15000)

    return () => clearInterval(interval)
  }, [router])

  if (isLoading || !metrics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Chargement du tableau de bord...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header currentPage="dashboard" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">
            Controle d'acces par badge RFID en temps reel
          </p>
        </div>

        <div className="space-y-6">
          <MetricsCards metrics={metrics} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ActivityChart data={metrics.hourlyActivity} />
            <DoorActivityChart data={metrics.doorActivity} />
          </div>

          <DoorEventsTable logs={logs} connected={connected} />
        </div>
      </main>
    </div>
  )
}
