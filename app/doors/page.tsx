"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import {
  isAuthenticated,
  getDoors,
  createDoor,
  updateDoor,
  deleteDoor,
  getSensors,
  getBadges,
  assignBadgesToDoor,
  removeBadgeFromDoor,
  sendMqttCommand,
} from "@/lib/api"
import { Door, Sensor, Badge as BadgeType } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  DoorOpen,
  Loader2,
  Trash2,
  MapPin,
  Radio,
  CreditCard,
  Plus,
  Power,
  RotateCcw,
  Unlock,
  Unlink,
  Link,
} from "lucide-react"
import { toast } from "sonner"
import { useSensorStatus } from "@/hooks/use-sensor-status"
import { Wifi, Monitor } from "lucide-react"

export default function DoorsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [doors, setDoors] = useState<Door[]>([])
  const [sensors, setSensors] = useState<Sensor[]>([])
  const [allBadges, setAllBadges] = useState<BadgeType[]>([])

  // Form
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [sensorId, setSensorId] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)

  // Badge assignment dialog
  const [assignDoorId, setAssignDoorId] = useState<number | null>(null)
  const [selectedBadgeIds, setSelectedBadgeIds] = useState<number[]>([])

  // Sensor reassignment dialog
  const [reassignDoorId, setReassignDoorId] = useState<number | null>(null)
  const [reassignSensorId, setReassignSensorId] = useState<string>("")

  // Sensor status dialog
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const { statusData, clearStatus } = useSensorStatus()

  // Capteurs deja attaches a une porte
  const usedSensorIds = doors.filter((d) => d.sensorId).map((d) => d.sensorId)
  const availableSensors = sensors.filter((s) => !usedSensorIds.includes(s.id))

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/")
      return
    }

    const fetchAll = async () => {
      try {
        const [doorsData, sensorsData, badgesData] = await Promise.all([
          getDoors(),
          getSensors(),
          getBadges(),
        ])
        setDoors(doorsData)
        setSensors(sensorsData)
        setAllBadges(badgesData)
      } catch {
        router.push("/")
        return
      }
      setIsLoading(false)
    }

    fetchAll()
  }, [router])

  // Quand on selectionne un capteur, remplir nom et location
  const handleSensorChange = (value: string) => {
    setSensorId(value)
    const sensor = sensors.find((s) => String(s.id) === value)
    if (sensor) {
      setName(sensor.name)
      setLocation(sensor.location)
    }
  }

  const handleCreate = async () => {
    if (!name) return
    setIsSaving(true)
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")

    try {
      const newDoor = await createDoor({
        name,
        slug,
        location: location || undefined,
        sensor_id: sensorId ? Number(sensorId) : null,
      })
      // Refresh pour avoir les relations
      const doorsData = await getDoors()
      setDoors(doorsData)
      setName("")
      setLocation("")
      setSensorId("")
      toast.success("Porte creee", { description: name })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur"
      toast.error("Erreur", { description: msg })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteDoor(id)
      setDoors((prev) => prev.filter((d) => d.id !== id))
      toast.success("Porte supprimee")
    } catch {
      toast.error("Erreur lors de la suppression")
    }
  }

  const handleDetachSensor = async (door: Door) => {
    try {
      await updateDoor(door.id, { sensor_id: null })
      const doorsData = await getDoors()
      setDoors(doorsData)
      toast.success("Capteur detache", { description: `${door.name} n'a plus de capteur` })
    } catch {
      toast.error("Erreur lors du detachement")
    }
  }

  const handleReassignSensor = async () => {
    if (!reassignDoorId || !reassignSensorId) return
    try {
      await updateDoor(reassignDoorId, { sensor_id: Number(reassignSensorId) })
      const doorsData = await getDoors()
      setDoors(doorsData)
      setReassignDoorId(null)
      setReassignSensorId("")
      toast.success("Capteur assigne")
    } catch {
      toast.error("Erreur lors de l'assignation du capteur")
    }
  }

  const handleAssignBadges = async () => {
    if (!assignDoorId || selectedBadgeIds.length === 0) return
    try {
      await assignBadgesToDoor(assignDoorId, selectedBadgeIds)
      const doorsData = await getDoors()
      setDoors(doorsData)
      setAssignDoorId(null)
      setSelectedBadgeIds([])
      toast.success("Badges assignes")
    } catch {
      toast.error("Erreur lors de l'assignation")
    }
  }

  const handleRemoveBadge = async (doorId: number, badgeId: number) => {
    try {
      await removeBadgeFromDoor(doorId, badgeId)
      const doorsData = await getDoors()
      setDoors(doorsData)
      toast.success("Badge retire")
    } catch {
      toast.error("Erreur lors du retrait")
    }
  }

  const handleCommand = async (sId: number, command: "FORCED_OPEN" | "REBOOT" | "STATUS") => {
    try {
      const res = await sendMqttCommand(sId, command)
      if (res.success) {
        if (command === "STATUS") {
          toast.info("Commande STATUS envoyee, en attente de reponse...")
        } else {
          toast.success(res.message)
        }
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("Erreur lors de l'envoi de la commande")
    }
  }

  // Ouvrir le dialog quand on recoit une reponse STATUS
  useEffect(() => {
    if (statusData) {
      setStatusDialogOpen(true)
      // Mettre a jour le status du sensor dans la liste des portes
      setDoors((prev) =>
        prev.map((d) =>
          d.sensor && String(d.sensor.id) === statusData.sensorId
            ? { ...d, sensor: { ...d.sensor, status: "online" as const, lastSeen: new Date(statusData.lastSeen) } }
            : d
        )
      )
    }
  }, [statusData])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Chargement des portes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header currentPage="doors" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground">Gestion des portes</h1>
          <p className="text-sm text-muted-foreground">
            Configurer les portes, assigner des badges et envoyer des commandes
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulaire */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg text-card-foreground">Ajouter une porte</CardTitle>
              <CardDescription>Selectionnez un capteur pour pre-remplir les informations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-card-foreground">Capteur associe</Label>
                <Select value={sensorId} onValueChange={handleSensorChange}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Selectionner un capteur" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSensors.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name} - {s.location}
                      </SelectItem>
                    ))}
                    {availableSensors.length === 0 && (
                      <SelectItem value="_none" disabled>
                        Aucun capteur disponible
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {availableSensors.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Tous les capteurs sont deja rattaches a une porte.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-card-foreground">Nom de la porte</Label>
                <Input
                  placeholder="Rempli automatiquement par le capteur"
                  value={name}
                  disabled
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-card-foreground">Emplacement</Label>
                <Input
                  placeholder="Rempli automatiquement par le capteur"
                  value={location}
                  disabled
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={!name || isSaving}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Ajouter la porte"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Liste */}
          <div className="lg:col-span-2">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg text-card-foreground">Portes configurees</CardTitle>
                <CardDescription>
                  {doors.length} porte{doors.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {doors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DoorOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucune porte configuree</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {doors.map((door) => (
                      <div
                        key={door.id}
                        className="p-4 bg-secondary/30 rounded-lg border border-border space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-md bg-primary/10">
                              <DoorOpen className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground">{door.name}</h4>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                                {door.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" /> {door.location}
                                  </span>
                                )}
                                {door.sensor ? (
                                  <span className="flex items-center gap-1">
                                    <Radio className="h-3.5 w-3.5" />
                                    {door.sensor.name}
                                    <span className={`h-1.5 w-1.5 rounded-full ${door.sensor.status === "online" ? "bg-green-500" : "bg-muted-foreground"}`} />
                                    <button
                                      onClick={() => handleDetachSensor(door)}
                                      className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                                      title="Detacher le capteur"
                                    >
                                      <Unlink className="h-3.5 w-3.5" />
                                    </button>
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-warning">
                                    <Radio className="h-3.5 w-3.5" /> Aucun capteur
                                    <button
                                      onClick={() => {
                                        setReassignDoorId(door.id)
                                        setReassignSensorId("")
                                      }}
                                      className="ml-1 text-primary hover:text-primary/80 transition-colors"
                                      title="Assigner un capteur"
                                    >
                                      <Link className="h-3.5 w-3.5" />
                                    </button>
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <CreditCard className="h-3.5 w-3.5" /> {door.badgesCount} badge{door.badgesCount !== 1 ? "s" : ""}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {door.sensorId && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Ouverture forcee"
                                  onClick={() => handleCommand(door.sensorId!, "FORCED_OPEN")}
                                >
                                  <Unlock className="h-4 w-4 text-warning" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Reboot"
                                  onClick={() => handleCommand(door.sensorId!, "REBOOT")}
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Status"
                                  onClick={() => handleCommand(door.sensorId!, "STATUS")}
                                >
                                  <Power className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer la porte ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    La porte &quot;{door.name}&quot; sera definitivement supprimee.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(door.id)}>Supprimer</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>

                        {/* Badges assigned */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                          {door.badges && door.badges.length > 0 ? (
                            door.badges.map((b) => (
                              <Badge
                                key={b.id}
                                variant="secondary"
                                className="flex items-center gap-1 bg-secondary"
                              >
                                {b.holderName}
                                <button
                                  onClick={() => handleRemoveBadge(door.id, b.id)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  x
                                </button>
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">Aucun badge assigne</span>
                          )}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => {
                                  setAssignDoorId(door.id)
                                  setSelectedBadgeIds([])
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Assigner
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Assigner des badges a {door.name}</DialogTitle>
                                <DialogDescription>
                                  Selectionnez les badges a autoriser
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-3 max-h-60 overflow-y-auto">
                                {allBadges
                                  .filter((b) => b.isActive)
                                  .map((b) => (
                                    <div key={b.id} className="flex items-center gap-3 p-2 rounded hover:bg-secondary/50">
                                      <Checkbox
                                        checked={selectedBadgeIds.includes(b.id)}
                                        onCheckedChange={(checked) => {
                                          setSelectedBadgeIds((prev) =>
                                            checked
                                              ? [...prev, b.id]
                                              : prev.filter((id) => id !== b.id)
                                          )
                                        }}
                                      />
                                      <div>
                                        <p className="text-sm font-medium">{b.holderName}</p>
                                        <p className="text-xs text-muted-foreground font-mono">{b.uid}</p>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Button
                                onClick={handleAssignBadges}
                                disabled={selectedBadgeIds.length === 0}
                                className="w-full"
                              >
                                Assigner {selectedBadgeIds.length} badge{selectedBadgeIds.length !== 1 ? "s" : ""}
                              </Button>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Sensor status dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={(open) => { if (!open) { setStatusDialogOpen(false); clearStatus() } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Status du capteur {statusData?.sensorName}
            </DialogTitle>
            <DialogDescription>
              {statusData?.sensorLocation}
            </DialogDescription>
          </DialogHeader>
          {statusData && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-green-500">En ligne</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {statusData.data.ssid && (
                  <div className="p-3 rounded-md bg-secondary/50">
                    <p className="text-muted-foreground flex items-center gap-1"><Wifi className="h-3.5 w-3.5" /> SSID</p>
                    <p className="font-medium">{statusData.data.ssid}</p>
                  </div>
                )}
                {statusData.data.ip && (
                  <div className="p-3 rounded-md bg-secondary/50">
                    <p className="text-muted-foreground">IP</p>
                    <p className="font-mono font-medium">{statusData.data.ip}</p>
                  </div>
                )}
                {statusData.data.rssi !== undefined && (
                  <div className="p-3 rounded-md bg-secondary/50">
                    <p className="text-muted-foreground">Signal WiFi</p>
                    <p className="font-medium">{String(statusData.data.rssi)} dBm</p>
                  </div>
                )}
                {statusData.data.freeHeap !== undefined && (
                  <div className="p-3 rounded-md bg-secondary/50">
                    <p className="text-muted-foreground">RAM libre</p>
                    <p className="font-medium">{String(statusData.data.freeHeap)} bytes</p>
                  </div>
                )}
                {statusData.data.uptime && (
                  <div className="p-3 rounded-md bg-secondary/50">
                    <p className="text-muted-foreground">Uptime</p>
                    <p className="font-medium">{String(statusData.data.uptime)}</p>
                  </div>
                )}
                {statusData.data.chipModel && (
                  <div className="p-3 rounded-md bg-secondary/50">
                    <p className="text-muted-foreground">Chip</p>
                    <p className="font-medium">{String(statusData.data.chipModel)}</p>
                  </div>
                )}
                {statusData.data.cpuFreq !== undefined && (
                  <div className="p-3 rounded-md bg-secondary/50">
                    <p className="text-muted-foreground">CPU</p>
                    <p className="font-medium">{String(statusData.data.cpuFreq)} MHz</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Derniere activite: {new Date(statusData.lastSeen).toLocaleString()}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sensor reassignment dialog */}
      <Dialog open={!!reassignDoorId} onOpenChange={(open) => { if (!open) { setReassignDoorId(null); setReassignSensorId("") } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigner un capteur</DialogTitle>
            <DialogDescription>
              Selectionnez le capteur a rattacher a cette porte
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={reassignSensorId} onValueChange={setReassignSensorId}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Selectionner un capteur" />
              </SelectTrigger>
              <SelectContent>
                {availableSensors.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name} - {s.location}
                  </SelectItem>
                ))}
                {availableSensors.length === 0 && (
                  <SelectItem value="_none" disabled>
                    Aucun capteur disponible
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <Button
              onClick={handleReassignSensor}
              disabled={!reassignSensorId}
              className="w-full"
            >
              Assigner
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
