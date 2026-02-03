"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Check, X, Wifi, WifiOff } from "lucide-react"
import { testMqttConnection } from "@/lib/api"

interface SensorFormData {
  doorName: string
  location: string
  topicSlug: string
}

interface SensorFormProps {
  onSave: (sensor: SensorFormData) => void | Promise<void>
}

export function SensorForm({ onSave }: SensorFormProps) {
  const [formData, setFormData] = useState<SensorFormData>({
    doorName: "",
    location: "",
    topicSlug: "",
  })

  // Generate full MQTT topic from slug
  const mqttTopic = formData.topicSlug
    ? `doorguard/sensor/${formData.topicSlug}/event`
    : ""
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<"success" | "failed" | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleChange = (field: keyof SensorFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setTestResult(null)

    // Auto-generate slug from door name if doorName changes and slug is empty or was auto-generated
    if (field === "doorName" && value) {
      const slug = value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with dashes
        .replace(/^-+|-+$/g, "") // Remove leading/trailing dashes
      setFormData((prev) => ({ ...prev, topicSlug: slug }))
    }
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      const result = await testMqttConnection(mqttTopic)
      setTestResult(result.success ? "success" : "failed")
    } catch {
      setTestResult("failed")
    }
    setIsTesting(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    await onSave({
      doorName: formData.doorName,
      location: formData.location,
      mqttTopic,
    })
    setIsSaving(false)
    setFormData({
      doorName: "",
      location: "",
      topicSlug: "",
    })
    setTestResult(null)
  }

  const isFormValid =
    formData.doorName &&
    formData.location &&
    formData.topicSlug

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg text-card-foreground">Ajouter un nouveau capteur</CardTitle>
        <CardDescription>
          Configurer un nouveau capteur de porte et tester la connectivite MQTT
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sensor Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground">Details du capteur</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="doorName" className="text-card-foreground">
                Nom de la porte
              </Label>
              <Input
                id="doorName"
                placeholder="Entree principale"
                value={formData.doorName}
                onChange={(e) => handleChange("doorName", e.target.value)}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="text-card-foreground">
                Emplacement
              </Label>
              <Input
                id="location"
                placeholder="Batiment A - Rez-de-chaussee"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* MQTT Configuration */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-sm font-medium text-foreground">Configuration MQTT</h3>
          <div className="space-y-2">
            <Label htmlFor="topicSlug" className="text-card-foreground">
              Sujet MQTT
            </Label>
            <div className="flex items-center gap-0 border border-border rounded-md overflow-hidden bg-input">
              <span className="px-3 py-2 text-sm font-mono text-muted-foreground bg-muted/50">
                doorguard/sensor/
              </span>
              <Input
                id="topicSlug"
                placeholder="entree-principale"
                value={formData.topicSlug}
                onChange={(e) => handleChange("topicSlug", e.target.value)}
                className="border-0 flex-1 font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <span className="px-3 py-2 text-sm font-mono text-muted-foreground bg-muted/50">
                /event
              </span>
            </div>
            {mqttTopic && (
              <p className="text-xs text-muted-foreground">
                Topic complet : <code className="bg-muted px-1.5 py-0.5 rounded font-mono">{mqttTopic}</code>
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Le topic MQTT sera utilisé par le capteur IoT pour publier les événements
            </p>
          </div>
        </div>

        {/* Connection Test */}
        <div className="flex items-center gap-4 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={!formData.topicSlug || isTesting}
            className="gap-2 bg-transparent"
          >
            {isTesting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Test en cours...
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4" />
                Tester la connexion
              </>
            )}
          </Button>

          {testResult && (
            <div
              className={`flex items-center gap-2 text-sm ${
                testResult === "success" ? "text-success" : "text-destructive"
              }`}
            >
              {testResult === "success" ? (
                <>
                  <Check className="h-4 w-4" />
                  Connexion reussie
                </>
              ) : (
                <>
                  <X className="h-4 w-4" />
                  Connexion echouee
                </>
              )}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-border">
          <Button
            onClick={handleSave}
            disabled={!isFormValid || isSaving}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer le capteur"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
