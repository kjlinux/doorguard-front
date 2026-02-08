"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AccessLog } from "@/lib/types"
import { ShieldCheck, ShieldX, Clock, MapPin, User } from "lucide-react"

interface AccessLogsTableProps {
  logs: AccessLog[]
  connected?: boolean
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  accepted: { label: "Accepte", color: "text-success", bgColor: "bg-success/10 border-success/20" },
  refused: { label: "Refuse", color: "text-destructive", bgColor: "bg-destructive/10 border-destructive/20" },
  rejected: { label: "Rejete", color: "text-destructive", bgColor: "bg-destructive/10 border-destructive/20" },
  forced_open: { label: "Force", color: "text-warning", bgColor: "bg-warning/10 border-warning/20" },
}

export function DoorEventsTable({ logs, connected }: AccessLogsTableProps) {
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

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium text-card-foreground">
              Derniers acces
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Tentatives d'acces par badge en temps reel
            </p>
          </div>
          <Badge variant="outline" className={`text-xs ${connected ? "border-green-500/30 text-green-500" : "border-primary/30 text-primary"}`}>
            <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${connected ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
            {connected ? "En direct" : "Connexion..."}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Porte
                </th>
                <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Statut
                </th>
                <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Heure
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.slice(0, 10).map((log) => {
                const config = statusConfig[log.status] || statusConfig.refused
                return (
                  <tr key={log.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-secondary rounded-md">
                          {log.status === "accepted" || log.status === "forced_open" ? (
                            <ShieldCheck className="h-4 w-4 text-success" />
                          ) : (
                            <ShieldX className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-foreground font-medium">{log.holderName}</p>
                          <p className="text-xs text-muted-foreground font-mono">{log.badgeUid}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div>
                        <p className="text-sm text-foreground">{log.doorName}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {log.doorLocation}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <Badge
                        variant="default"
                        className={config.bgColor + " " + config.color}
                      >
                        {config.label}
                      </Badge>
                    </td>
                    <td className="py-3 px-2">
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
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
