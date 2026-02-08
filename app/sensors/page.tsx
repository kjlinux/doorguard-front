"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import { SensorForm } from "@/components/sensors/sensor-form"
import { SensorList } from "@/components/sensors/sensor-list"
import { isAuthenticated, getSensors, createSensor, updateSensor, deleteSensor } from "@/lib/api"
import { Sensor } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function SensorsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [sensors, setSensors] = useState<Sensor[]>([])

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/")
      return
    }

    const fetchSensors = async () => {
      try {
        const data = await getSensors()
        setSensors(data)
      } catch {
        router.push("/")
        return
      }
      setIsLoading(false)
    }

    fetchSensors()
  }, [router])

  const handleSaveSensor = async (formData: {
    doorName: string
    location: string
    mqttTopic: string
  }) => {
    try {
      const newSensor = await createSensor({
        name: formData.doorName,
        location: formData.location,
        mqtt_topic: formData.mqttTopic,
      })

      setSensors((prev) => [newSensor, ...prev])

      toast({
        title: "Capteur ajoute",
        description: `${formData.doorName} a ete enregistre avec succes.`,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'enregistrement"
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      })
    }
  }

  const handleUpdateSensor = async (id: number, data: { name: string; location: string }) => {
    try {
      const updated = await updateSensor(id, data)
      setSensors((prev) => prev.map((s) => (s.id === id ? updated : s)))
      toast({
        title: "Capteur modifie",
        description: `${data.name} a ete mis a jour.`,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de la modification"
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      })
    }
  }

  const handleDeleteSensor = async (id: number) => {
    try {
      await deleteSensor(id)
      setSensors((prev) => prev.filter((s) => s.id !== id))
      toast({
        title: "Capteur supprime",
        description: "Le capteur a ete supprime avec succes.",
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de la suppression"
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Chargement des capteurs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header currentPage="sensors" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground">Gestion des capteurs</h1>
          <p className="text-sm text-muted-foreground">
            Enregistrer et configurer les capteurs de porte MQTT
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SensorForm onSave={handleSaveSensor} />
          <SensorList sensors={sensors} onUpdate={handleUpdateSensor} onDelete={handleDeleteSensor} />
        </div>
      </main>

      <Toaster />
    </div>
  )
}
