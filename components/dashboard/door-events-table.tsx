"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DoorEvent } from "@/lib/types"
import { DoorOpen, DoorClosed, CreditCard, Clock } from "lucide-react"

interface DoorEventsTableProps {
  events: DoorEvent[]
}

export function DoorEventsTable({ events }: DoorEventsTableProps) {
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
              Activite d'acces aux portes en temps reel
            </p>
          </div>
          <Badge variant="outline" className="text-xs border-primary/30 text-primary">
            En direct
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Porte
                </th>
                <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Statut
                </th>
                <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Carte
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
                      <span className="text-sm text-foreground font-medium">
                        {event.doorName}
                      </span>
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
                      {event.status === "open" ? "Ouverte" : "Fermee"}
                    </Badge>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-foreground font-mono">{event.cardId}</p>
                        {event.cardHolder && (
                          <p className="text-xs text-muted-foreground">{event.cardHolder}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-foreground">{formatTime(event.timestamp)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(event.timestamp)}</p>
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
