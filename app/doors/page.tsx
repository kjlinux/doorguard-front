"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import {
  isAuthenticated,
  getDoors,
  createDoor,
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
} from "lucide-react"
import { toast } from "sonner"

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
      setDoors((prev) => [newDoor, ...prev])
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

  const handleAssignBadges = async () => {
    if (!assignDoorId || selectedBadgeIds.length === 0) return
    try {
      await assignBadgesToDoor(assignDoorId, selectedBadgeIds)
      // Refresh doors
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
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("Erreur lors de l'envoi de la commande")
    }
  }

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
              <CardDescription>Configurer une nouvelle porte avec capteur</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-card-foreground">Nom</Label>
                <Input
                  placeholder="Entree principale"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-card-foreground">Emplacement</Label>
                <Input
                  placeholder="Batiment A"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-card-foreground">Capteur associe</Label>
                <Select value={sensorId} onValueChange={setSensorId}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Selectionner un capteur" />
                  </SelectTrigger>
                  <SelectContent>
                    {sensors.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name} ({s.location})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                {door.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" /> {door.location}
                                  </span>
                                )}
                                {door.sensor && (
                                  <span className="flex items-center gap-1">
                                    <Radio className="h-3.5 w-3.5" /> {door.sensor.name}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <CreditCard className="h-3.5 w-3.5" /> {door.badgesCount} badge{door.badgesCount !== 1 ? "s" : ""}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {/* Commands */}
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
                                    La porte "{door.name}" sera definitivement supprimee.
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
    </div>
  )
}
