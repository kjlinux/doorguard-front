"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Sensor } from "@/lib/types"
import { Radio, MapPin, Clock, Pencil, Trash2, Loader2 } from "lucide-react"

interface SensorListProps {
  sensors: Sensor[]
  onUpdate: (id: number, data: { name: string; location: string }) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

export function SensorList({ sensors, onUpdate, onDelete }: SensorListProps) {
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null)
  const [editName, setEditName] = useState("")
  const [editLocation, setEditLocation] = useState("")
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const openEdit = (sensor: Sensor) => {
    setEditingSensor(sensor)
    setEditName(sensor.name)
    setEditLocation(sensor.location)
  }

  const handleSaveEdit = async () => {
    if (!editingSensor || !editName || !editLocation) return
    setIsSavingEdit(true)
    await onUpdate(editingSensor.id, { name: editName, location: editLocation })
    setIsSavingEdit(false)
    setEditingSensor(null)
  }

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
    <>
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
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Modifier"
                      onClick={() => openEdit(sensor)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" title="Supprimer">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer le capteur ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Le capteur &quot;{sensor.name}&quot; sera definitivement supprime. Les portes associees perdront leur capteur.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(sensor.id)}>
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editingSensor} onOpenChange={(open) => !open && setEditingSensor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le capteur</DialogTitle>
            <DialogDescription>
              Modifier les informations du capteur. Le topic MQTT ne peut pas etre change.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-card-foreground">Nom</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground">Emplacement</Label>
              <Input
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="bg-input border-border text-foreground"
              />
            </div>
            {editingSensor && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Topic MQTT</Label>
                <Input
                  value={editingSensor.mqttTopic}
                  disabled
                  className="bg-muted border-border text-muted-foreground font-mono"
                />
              </div>
            )}
            <Button
              onClick={handleSaveEdit}
              disabled={!editName || !editLocation || isSavingEdit}
              className="w-full"
            >
              {isSavingEdit ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
