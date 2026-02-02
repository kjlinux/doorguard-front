"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Check, X, Wifi, WifiOff } from "lucide-react"
import { testMqttConnection } from "@/lib/api"

interface SensorFormData {
  name: string
  location: string
  doorId: string
  mqttBroker: string
  mqttTopic: string
  mqttPort: string
}

interface SensorFormProps {
  onSave: (sensor: SensorFormData) => void | Promise<void>
}

export function SensorForm({ onSave }: SensorFormProps) {
  const [formData, setFormData] = useState<SensorFormData>({
    name: "",
    location: "",
    doorId: "",
    mqttBroker: "",
    mqttTopic: "",
    mqttPort: "1883",
  })
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<"success" | "failed" | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleChange = (field: keyof SensorFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setTestResult(null)
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      const result = await testMqttConnection(
        formData.mqttBroker,
        parseInt(formData.mqttPort, 10) || 1883,
        formData.mqttTopic
      )
      setTestResult(result.success ? "success" : "failed")
    } catch {
      setTestResult("failed")
    }
    setIsTesting(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    await onSave(formData)
    setIsSaving(false)
    setFormData({
      name: "",
      location: "",
      doorId: "",
      mqttBroker: "",
      mqttTopic: "",
      mqttPort: "1883",
    })
    setTestResult(null)
  }

  const isFormValid =
    formData.name &&
    formData.location &&
    formData.doorId &&
    formData.mqttBroker &&
    formData.mqttTopic

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
              <Label htmlFor="name" className="text-card-foreground">
                Nom du capteur
              </Label>
              <Input
                id="name"
                placeholder="Capteur entree principale"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
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
            <div className="space-y-2">
              <Label htmlFor="doorId" className="text-card-foreground">
                ID de la porte
              </Label>
              <Input
                id="doorId"
                placeholder="porte-001"
                value={formData.doorId}
                onChange={(e) => handleChange("doorId", e.target.value)}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* MQTT Configuration */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-sm font-medium text-foreground">Configuration MQTT</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mqttBroker" className="text-card-foreground">
                Adresse du broker
              </Label>
              <Input
                id="mqttBroker"
                placeholder="mqtt.exemple.com"
                value={formData.mqttBroker}
                onChange={(e) => handleChange("mqttBroker", e.target.value)}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mqttPort" className="text-card-foreground">
                Port
              </Label>
              <Input
                id="mqttPort"
                placeholder="1883"
                value={formData.mqttPort}
                onChange={(e) => handleChange("mqttPort", e.target.value)}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="mqttTopic" className="text-card-foreground">
                Sujet MQTT
              </Label>
              <Input
                id="mqttTopic"
                placeholder="doorguard/capteurs/entree-principale"
                value={formData.mqttTopic}
                onChange={(e) => handleChange("mqttTopic", e.target.value)}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground font-mono text-sm"
              />
            </div>
          </div>
        </div>

        {/* Connection Test */}
        <div className="flex items-center gap-4 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={!formData.mqttBroker || !formData.mqttTopic || isTesting}
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
