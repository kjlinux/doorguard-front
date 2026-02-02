"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sensor } from "@/lib/types"
import { Radio, MapPin, Clock } from "lucide-react"

interface SensorListProps {
  sensors: Sensor[]
}

export function SensorList({ sensors }: SensorListProps) {
  const formatLastSeen = (date?: Date) => {
    if (!date) return "Jamais"
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diff < 60) return `il y a ${diff}s`
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)}m`
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
    return date.toLocaleDateString("fr-FR")
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg text-card-foreground">Capteurs enregistres</CardTitle>
        <CardDescription>
          {sensors.length} capteur{sensors.length !== 1 ? "s" : ""} configure{sensors.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sensors.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Radio className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Aucun capteur enregistre</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sensors.map((sensor) => (
              <div
                key={sensor.id}
                className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-2 rounded-md ${
                      sensor.status === "online" ? "bg-success/10" : "bg-destructive/10"
                    }`}
                  >
                    <Radio
                      className={`h-5 w-5 ${
                        sensor.status === "online" ? "text-success" : "text-destructive"
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground">{sensor.name}</h4>
                      <Badge
                        variant={sensor.status === "online" ? "default" : "secondary"}
                        className={
                          sensor.status === "online"
                            ? "bg-success/10 text-success border-success/20"
                            : "bg-destructive/10 text-destructive border-destructive/20"
                        }
                      >
                        {sensor.status === "online" ? "En ligne" : "Hors ligne"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {sensor.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatLastSeen(sensor.lastSeen)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {sensor.mqttTopic}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
