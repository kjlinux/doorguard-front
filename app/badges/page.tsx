"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import { isAuthenticated, getBadges, createBadge, deleteBadge, toggleBadge } from "@/lib/api"
import { Badge as BadgeType } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
import { CreditCard, Loader2, Trash2, DoorOpen } from "lucide-react"
import { toast } from "sonner"

export default function BadgesPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [badges, setBadges] = useState<BadgeType[]>([])
  const [uid, setUid] = useState("")
  const [holderName, setHolderName] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/")
      return
    }

    const fetch = async () => {
      try {
        const data = await getBadges()
        setBadges(data)
      } catch {
        router.push("/")
        return
      }
      setIsLoading(false)
    }

    fetch()
  }, [router])

  const handleCreate = async () => {
    if (!uid || !holderName) return
    setIsSaving(true)
    try {
      const newBadge = await createBadge({ uid, holder_name: holderName })
      setBadges((prev) => [newBadge, ...prev])
      setUid("")
      setHolderName("")
      toast.success("Badge cree", { description: `${holderName} (${uid})` })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur"
      toast.error("Erreur", { description: msg })
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggle = async (badge: BadgeType) => {
    try {
      const updated = await toggleBadge(badge.id)
      setBadges((prev) => prev.map((b) => (b.id === badge.id ? updated : b)))
      toast.success(updated.isActive ? "Badge active" : "Badge desactive")
    } catch {
      toast.error("Erreur lors du changement de statut")
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteBadge(id)
      setBadges((prev) => prev.filter((b) => b.id !== id))
      toast.success("Badge supprime")
    } catch {
      toast.error("Erreur lors de la suppression")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Chargement des badges...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header currentPage="badges" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground">Gestion des badges RFID</h1>
          <p className="text-sm text-muted-foreground">
            Enregistrer et gerer les badges d'acces
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulaire */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg text-card-foreground">Ajouter un badge</CardTitle>
              <CardDescription>
                Enregistrer un nouveau badge RFID
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="uid" className="text-card-foreground">UID du badge</Label>
                <Input
                  id="uid"
                  placeholder="AB:CD:EF:12:34"
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="holderName" className="text-card-foreground">Nom du porteur</Label>
                <Input
                  id="holderName"
                  placeholder="Jean Dupont"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={!uid || !holderName || isSaving}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Ajouter le badge"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Liste */}
          <div className="lg:col-span-2">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg text-card-foreground">Badges enregistres</CardTitle>
                <CardDescription>
                  {badges.length} badge{badges.length !== 1 ? "s" : ""} enregistre{badges.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {badges.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun badge enregistre</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {badges.map((badge) => (
                      <div
                        key={badge.id}
                        className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-md ${badge.isActive ? "bg-success/10" : "bg-destructive/10"}`}>
                            <CreditCard className={`h-5 w-5 ${badge.isActive ? "text-success" : "text-destructive"}`} />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-foreground">{badge.holderName}</h4>
                              <Badge
                                variant={badge.isActive ? "default" : "secondary"}
                                className={badge.isActive
                                  ? "bg-success/10 text-success border-success/20"
                                  : "bg-destructive/10 text-destructive border-destructive/20"
                                }
                              >
                                {badge.isActive ? "Actif" : "Inactif"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground font-mono">{badge.uid}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <DoorOpen className="h-3 w-3" />
                              {badge.doorsCount} porte{badge.doorsCount !== 1 ? "s" : ""} autorisee{badge.doorsCount !== 1 ? "s" : ""}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={badge.isActive}
                            onCheckedChange={() => handleToggle(badge)}
                          />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer le badge ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Le badge de {badge.holderName} ({badge.uid}) sera definitivement supprime.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(badge.id)}>
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
          </div>
        </div>
      </main>
    </div>
  )
}
