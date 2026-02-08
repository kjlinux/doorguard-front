"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import { isAuthenticated, getAccessLogs } from "@/lib/api"
import { AccessLog } from "@/lib/types"
import { useAccessLogs } from "@/hooks/use-access-logs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ShieldCheck, ShieldX, Clock, MapPin, CreditCard, Zap } from "lucide-react"

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  accepted: { label: "Accepte", color: "text-success", bgColor: "bg-success/10 border-success/20" },
  refused: { label: "Refuse", color: "text-destructive", bgColor: "bg-destructive/10 border-destructive/20" },
  rejected: { label: "Rejete", color: "text-destructive", bgColor: "bg-destructive/10 border-destructive/20" },
  forced_open: { label: "Force", color: "text-warning", bgColor: "bg-warning/10 border-warning/20" },
}

export default function AccessLogsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [fetchedLogs, setFetchedLogs] = useState<AccessLog[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const { logs, connected } = useAccessLogs(fetchedLogs)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/")
      return
    }

    const fetch = async () => {
      try {
        const data = await getAccessLogs(50)
        setFetchedLogs(data)
      } catch {
        router.push("/")
        return
      }
      setIsLoading(false)
    }

    fetch()
  }, [router])

  const filteredLogs = statusFilter === "all"
    ? logs
    : logs.filter((l) => l.status === statusFilter)

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    if (isToday) return "Aujourd'hui"
    return date.toLocaleDateString("fr-FR", { month: "short", day: "numeric" })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Chargement des logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header currentPage="access-logs" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Logs d'acces</h1>
            <p className="text-sm text-muted-foreground">
              Historique complet des tentatives d'acces par badge
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] bg-input border-border">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="accepted">Acceptes</SelectItem>
                <SelectItem value="refused">Refuses</SelectItem>
                <SelectItem value="rejected">Rejetes</SelectItem>
                <SelectItem value="forced_open">Forces</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className={`text-xs ${connected ? "border-green-500/30 text-green-500" : "border-primary/30 text-primary"}`}>
              <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${connected ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
              {connected ? "En direct" : "Connexion..."}
            </Badge>
          </div>
        </div>

        <Card className="border-border bg-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Badge UID
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Porte
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date & Heure
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        Aucun log d'acces
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const config = statusConfig[log.status] || statusConfig.refused
                      return (
                        <tr key={log.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-secondary rounded-md">
                                {log.status === "accepted" || log.status === "forced_open" ? (
                                  <ShieldCheck className="h-4 w-4 text-success" />
                                ) : (
                                  <ShieldX className="h-4 w-4 text-destructive" />
                                )}
                              </div>
                              <span className="text-sm text-foreground font-medium">{log.holderName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-muted-foreground font-mono">{log.badgeUid}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-sm text-foreground">{log.doorName}</p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {log.doorLocation}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="default" className={config.bgColor + " " + config.color}>
                              {config.label}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                              <div>
                                <p className="text-sm text-foreground">{formatTime(log.respondedAt)}</p>
                                <p className="text-xs text-muted-foreground">{formatDate(log.respondedAt)}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
