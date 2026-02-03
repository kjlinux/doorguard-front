"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SensorEvent } from "@/lib/types"
import { DoorOpen, DoorClosed, Clock, MapPin } from "lucide-react"

interface SensorEventsTableProps {
  events: SensorEvent[]
  connected?: boolean
}

export function SensorEventsTable({ events, connected }: SensorEventsTableProps) {
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
              Evenements recents
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Détections des capteurs en temps réel
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
                  Capteur
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
              {events.slice(0, 10).map((event) => (
                <tr key={event.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-secondary rounded-md">
                        {event.status === "open" ? (
                          <DoorOpen className="h-4 w-4 text-warning" />
                        ) : (
                          <DoorClosed className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-foreground font-medium">
                          {event.sensorName}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {event.sensorLocation}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <Badge
                      variant={event.status === "open" ? "default" : "secondary"}
                      className={
                        event.status === "open"
                          ? "bg-warning/10 text-warning border-warning/20"
                          : "bg-secondary text-muted-foreground"
                      }
                    >
                      {event.status === "open" ? "Ouvert" : "Fermé"}
                    </Badge>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-foreground">{formatTime(event.detectedAt)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(event.detectedAt)}</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
