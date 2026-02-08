"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Activity, ShieldX, DoorOpen, Wifi } from "lucide-react"
import { MetricsData } from "@/lib/types"

interface MetricsCardsProps {
  metrics: MetricsData
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  const cards = [
    {
      title: "Total acces",
      value: metrics.totalAccess.toLocaleString(),
      description: "Dernieres 24 heures",
      icon: Activity,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Acces refuses",
      value: metrics.refusedAccess.toString(),
      description: "Dernieres 24 heures",
      icon: ShieldX,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Portes actives",
      value: metrics.activeDoors.toString(),
      description: "Capteur en ligne",
      icon: DoorOpen,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Capteurs en ligne",
      value: metrics.sensorsOnline.toString(),
      description: "Actuellement connectes",
      icon: Wifi,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-semibold text-card-foreground">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </div>
              <div className={`p-2 rounded-md ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
