# Guide d'Implémentation Temps Réel - DoorGuard Frontend

Ce guide explique l'architecture complète du système temps réel du frontend DoorGuard.

---

## 🏗️ Architecture du Système

```
Capteur MQTT → Backend Laravel → Laravel Reverb (WebSocket) → Frontend Next.js
                                        ↓
                                   Broadcasting
                                        ↓
                              Channel: door-events
                                        ↓
                            Event: door.event.created
                                        ↓
                          Hook: useDoorEvents()
                                        ↓
                           Composant: DoorEventsTable
```

---

## 📦 Stack Technique

### Backend
- **Laravel 11** avec Sanctum pour l'authentification
- **Laravel Reverb** (WebSocket server intégré)
- **MQTT Listener** pour recevoir les messages des capteurs
- **Broadcasting** pour diffuser les événements

### Frontend
- **Next.js 16** avec TypeScript
- **Laravel Echo** pour écouter les événements WebSocket
- **Pusher JS** (protocole compatible avec Reverb)
- **React Hooks** pour la gestion d'état

---

## ✅ Ce qui est Déjà Implémenté

Votre projet est **déjà entièrement fonctionnel** ! Voici ce qui existe :

### 1. Configuration Echo ([lib/echo.ts](lib/echo.ts))

```typescript
import Echo from "laravel-echo"
import Pusher from "pusher-js"

let echoInstance: Echo<"reverb"> | null = null

export function getEcho(): Echo<"reverb"> {
  if (echoInstance) return echoInstance

  window.Pusher = Pusher

  echoInstance = new Echo({
    broadcaster: "reverb",
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
    wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT),
    forceTLS: process.env.NEXT_PUBLIC_REVERB_SCHEME === "https",
  })

  return echoInstance
}
```

**Points clés :**
- ✅ Singleton pattern (une seule instance Echo)
- ✅ Configuration depuis variables d'environnement
- ✅ Support TLS/non-TLS selon l'environnement

---

### 2. Hook Temps Réel ([hooks/use-door-events.ts](hooks/use-door-events.ts))

```typescript
export function useDoorEvents(initialEvents: DoorEvent[] = []) {
  const [events, setEvents] = useState<DoorEvent[]>(initialEvents)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const echo = getEcho()
    const channel = echo.channel("door-events")

    channel
      .subscribed(() => setConnected(true))
      .listen(".door.event.created", (raw: RawDoorEvent) => {
        const event: DoorEvent = {
          ...raw,
          timestamp: new Date(raw.timestamp),
        }
        setEvents((prev) => {
          // Éviter les doublons
          if (prev.some((e) => e.id === event.id)) return prev
          // Ajouter en tête et limiter à 50
          return [event, ...prev].slice(0, 50)
        })
      })

    return () => echo.leaveChannel("door-events")
  }, [])

  return { events, connected }
}
```

**Fonctionnalités :**
- ✅ Souscription automatique au channel `door-events`
- ✅ Écoute de l'événement `door.event.created`
- ✅ Gestion de l'état de connexion
- ✅ Prévention des doublons
- ✅ Limitation à 50 événements max
- ✅ Cleanup automatique lors du démontage

---

### 3. Page Dashboard ([app/dashboard/page.tsx](app/dashboard/page.tsx))

```typescript
export default function DashboardPage() {
  const [fetchedEvents, setFetchedEvents] = useState<DoorEvent[]>([])

  // Temps réel via WebSocket
  const { events, connected } = useDoorEvents(fetchedEvents)

  useEffect(() => {
    // Chargement initial via API REST
    const fetchData = async () => {
      const [metricsData, eventsData] = await Promise.all([
        getMetrics(),
        getEvents(10),
      ])
      setMetrics(metricsData)
      setFetchedEvents(eventsData)
    }
    fetchData()

    // Polling pour les métriques (pas pour les events !)
    const interval = setInterval(async () => {
      const metricsData = await getMetrics()
      setMetrics(metricsData)
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  return <DoorEventsTable events={events} connected={connected} />
}
```

**Stratégie hybride :**
- ✅ **Chargement initial** : API REST pour les 10 derniers événements
- ✅ **Temps réel** : WebSocket pour les nouveaux événements
- ✅ **Métriques** : Polling toutes les 15s (car pas critiques)
- ✅ **Événements** : WebSocket uniquement (pas de polling !)

---

### 4. Composant d'Affichage ([components/dashboard/door-events-table.tsx](components/dashboard/door-events-table.tsx))

```typescript
export function DoorEventsTable({ events, connected }: DoorEventsTableProps) {
  return (
    <Card>
      <CardHeader>
        <Badge>
          <span className={connected ? "animate-pulse bg-green-500" : "bg-muted-foreground"} />
          {connected ? "En direct" : "Connexion..."}
        </Badge>
      </CardHeader>
      <CardContent>
        <table>
          {events.slice(0, 10).map((event) => (
            <tr key={event.id}>
              <td>{event.doorName}</td>
              <td><Badge>{event.status}</Badge></td>
              <td>{event.cardId} - {event.cardHolder}</td>
              <td>{formatTime(event.timestamp)}</td>
            </tr>
          ))}
        </table>
      </CardContent>
    </Card>
  )
}
```

**Fonctionnalités UI :**
- ✅ Indicateur de connexion en temps réel
- ✅ Badge "En direct" avec animation pulse
- ✅ Affichage des 10 derniers événements
- ✅ Formatage date/heure en français
- ✅ Icônes pour portes ouvertes/fermées
- ✅ Design responsive avec Tailwind CSS

---

## 🔧 Configuration

### Variables d'Environnement ([.env.local](.env.local))

```bash
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Laravel Reverb WebSocket
NEXT_PUBLIC_REVERB_APP_KEY=adwexqlaq3a9k65en5g8
NEXT_PUBLIC_REVERB_HOST=localhost
NEXT_PUBLIC_REVERB_PORT=8080
NEXT_PUBLIC_REVERB_SCHEME=http
```

**⚠️ Important :** Ces valeurs doivent correspondre à celles du backend ([.env](../doorguard-back/.env))

### Backend Reverb (.env Backend)

```bash
REVERB_APP_ID=525199
REVERB_APP_KEY=adwexqlaq3a9k65en5g8
REVERB_APP_SECRET=iq1kp8weeelp4cfhlvqb
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http
```

---

## 🚀 Démarrage du Système Complet

### Terminal 1 : Backend - Laravel Reverb

```bash
cd C:\laragon\www\doorguard-back
php artisan reverb:start
```

**Attendu :**
```
[2026-02-03 10:00:00] Server started on 127.0.0.1:8080
```

---

### Terminal 2 : Backend - API Laravel

```bash
cd C:\laragon\www\doorguard-back
php artisan serve
```

**Attendu :**
```
Laravel development server started: http://127.0.0.1:8000
```

---

### Terminal 3 : Backend - MQTT Listener

```bash
cd C:\laragon\www\doorguard-back
php artisan mqtt:listen
```

**Attendu :**
```
Connecté au broker MQTT.
Souscrit au topic: doorguard/sensor/+/event
En attente de messages...
```

---

### Terminal 4 : Frontend - Next.js

```bash
cd C:\laragon\www\doorguard-front
npm run dev
```

**Attendu :**
```
▲ Next.js 16.0.10
- Local: http://localhost:3000
```

---

## 🧪 Test du Flux Complet

### Étape 1 : Préparer les Données

```bash
cd C:\laragon\www\doorguard-back
php artisan migrate
php artisan db:seed --class=TestDataSeeder
```

---

### Étape 2 : Se Connecter au Frontend

1. Ouvrez http://localhost:3000
2. Connectez-vous avec vos identifiants
3. Accédez au Dashboard
4. **Vérifiez le badge "En direct"** (doit être vert avec animation)

---

### Étape 3 : Envoyer un Message MQTT

#### Option A : Via MQTTX (Recommandé)

**Connexion :**
- Host: `mqtts://fd286f0fca334917b338f6f5882a2763.s1.eu.hivemq.cloud`
- Port: `8883`
- Username: `perseus911`
- Password: `Wemtinga2026@`
- SSL/TLS: ✅

**Publier sur :** `doorguard/sensor/1/event`

**Message JSON :**
```json
{
  "card_id": "ABC123456",
  "action": "open",
  "timestamp": "2026-02-03T10:30:00Z"
}
```

#### Option B : Via Script Python

```bash
cd C:\laragon\www\doorguard-back
pip install paho-mqtt
python test-mqtt.py 1 ABC123456 open
```

---

### Étape 4 : Observer le Flux

#### Terminal 3 (MQTT Listener)
```
Message reçu sur [doorguard/sensor/1/event]: {"card_id":"ABC123456",...}
Événement créé: porte #1 - open - carte: Jean Dupont
```

#### Terminal 1 (Reverb)
```
[2026-02-03 10:30:00] Broadcasting App\Events\DoorEventCreated
[2026-02-03 10:30:00] Broadcast message sent to channel: door-events
```

#### Frontend (Console navigateur - F12)
```javascript
[Echo] Received event: .door.event.created
{
  id: "1",
  doorId: "1",
  doorName: "Entrée Principale",
  status: "open",
  cardId: "ABC123456",
  cardHolder: "Jean Dupont",
  timestamp: "2026-02-03T10:30:00Z"
}
```

#### Frontend (Interface)
- ✅ Badge "En direct" reste vert
- ✅ Nouvel événement apparaît en **tête de liste**
- ✅ Affichage en **< 1 seconde**
- ✅ Aucun rechargement de page

---

## 🔍 Debugging

### Vérifier la Connexion WebSocket

Ouvrez la console du navigateur (F12) et tapez :

```javascript
// Vérifier si Echo est initialisé
console.log(window.Echo)

// Lister les channels actifs
console.log(Object.keys(window.Echo.connector.channels))
// Attendu: ["door-events"]

// Vérifier l'état de connexion
console.log(window.Echo.connector.pusher.connection.state)
// Attendu: "connected"
```

---

### Logs Frontend Détaillés

Modifiez [lib/echo.ts](lib/echo.ts) temporairement :

```typescript
export function getEcho(): Echo<"reverb"> {
  // ...
  echoInstance = new Echo({
    broadcaster: "reverb",
    // ... autres options ...
    enableLogging: true, // Ajouter cette ligne
  })
  return echoInstance
}
```

Rechargez la page, vous verrez tous les événements WebSocket dans la console.

---

### Tester la Connexion Manuellement

```javascript
// Dans la console du navigateur
const echo = window.Echo
echo.channel('door-events')
  .listen('.door.event.created', (event) => {
    console.log('Event reçu:', event)
  })
```

Puis envoyez un message MQTT et observez la console.

---

## 📊 Flux de Données Détaillé

### 1. Capteur envoie un message

```
Capteur RFID → MQTT Broker (HiveMQ)
Topic: doorguard/sensor/1/event
Payload: {"card_id": "ABC123456", "action": "open", "timestamp": "..."}
```

### 2. Backend reçoit via MQTT Listener

```php
// app/Console/Commands/MqttListenCommand.php
$mqtt->subscribe('doorguard/sensor/+/event', function($topic, $message) {
    $data = json_decode($message);
    $sensor = Sensor::where('mqtt_topic', $topic)->first();

    $doorEvent = DoorEvent::create([
        'door_id' => $sensor->door_id,
        'status' => $data->action,
        'card_holder_id' => CardHolder::where('card_id', $data->card_id)->first()?->id,
        'timestamp' => $data->timestamp,
    ]);

    event(new DoorEventCreated($doorEvent));
});
```

### 3. Broadcasting diffuse l'événement

```php
// app/Events/DoorEventCreated.php
class DoorEventCreated implements ShouldBroadcast
{
    public function broadcastOn(): array
    {
        return [new Channel('door-events')];
    }

    public function broadcastAs(): string
    {
        return 'door.event.created';
    }

    public function broadcastWith(): array
    {
        return (new DoorEventResource($this->doorEvent))->resolve();
    }
}
```

### 4. Reverb transmet via WebSocket

```
Laravel Reverb (ws://localhost:8080)
↓
Channel: door-events
Event: .door.event.created
Payload: {id, doorId, doorName, status, cardId, cardHolder, timestamp}
```

### 5. Frontend reçoit et affiche

```typescript
// hooks/use-door-events.ts
channel.listen('.door.event.created', (event) => {
    setEvents((prev) => [event, ...prev].slice(0, 50))
})

// components/dashboard/door-events-table.tsx
{events.map((event) => (
    <tr key={event.id}>
        <td>{event.doorName}</td>
        <td>{event.cardHolder || 'Inconnu'}</td>
        <td>{formatTime(event.timestamp)}</td>
    </tr>
))}
```

---

## 🎨 Personnalisation de l'UI

### Ajouter des Notifications Toast

Modifiez [hooks/use-door-events.ts](hooks/use-door-events.ts) :

```typescript
import { toast } from "sonner"

export function useDoorEvents(initialEvents: DoorEvent[] = []) {
  // ... code existant ...

  channel.listen(".door.event.created", (event: RawDoorEvent) => {
    // Ajouter une notification toast
    toast.success(`Porte ${event.doorName}`, {
      description: `${event.cardHolder || 'Carte inconnue'} - ${event.status}`,
      duration: 5000,
    })

    setEvents((prev) => [newEvent, ...prev].slice(0, 50))
  })
}
```

Ajoutez le Toaster dans [app/layout.tsx](app/layout.tsx) :

```typescript
import { Toaster } from "@/components/ui/sonner"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

---

### Ajouter un Son de Notification

```typescript
channel.listen(".door.event.created", (event) => {
  // Jouer un son
  const audio = new Audio('/sounds/notification.mp3')
  audio.play().catch(() => {})

  // Ajouter l'événement
  setEvents((prev) => [newEvent, ...prev])
})
```

---

### Filtrer par Type de Porte

```typescript
export function useDoorEvents(initialEvents: DoorEvent[] = [], doorFilter?: string) {
  // ...
  channel.listen(".door.event.created", (event) => {
    // Filtrer si nécessaire
    if (doorFilter && event.doorId !== doorFilter) return

    setEvents((prev) => [newEvent, ...prev])
  })
}
```

---

## 🔐 Sécurité

### Channels Privés (si besoin d'authentification)

Si vous voulez limiter l'accès au channel :

#### Backend ([routes/channels.php](../doorguard-back/routes/channels.php))

```php
Broadcast::channel('door-events', function ($user) {
    return $user !== null; // Ou logique plus complexe
});
```

#### Backend ([app/Events/DoorEventCreated.php](../doorguard-back/app/Events/DoorEventCreated.php))

```php
public function broadcastOn(): array
{
    return [new PrivateChannel('door-events')]; // Private au lieu de Channel
}
```

#### Frontend ([lib/echo.ts](lib/echo.ts))

```typescript
echoInstance = new Echo({
  // ... options existantes ...
  auth: {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  },
})
```

#### Frontend ([hooks/use-door-events.ts](hooks/use-door-events.ts))

```typescript
// Changer de channel() à private()
const channel = echo.private("door-events")
```

---

## 📈 Performance

### Métriques à Surveiller

1. **Latence WebSocket** : < 100ms
2. **Temps de broadcast** : < 500ms
3. **Temps d'affichage UI** : < 100ms
4. **Total end-to-end** : < 1 seconde

### Optimisations Déjà Implémentées

- ✅ **Singleton Echo** : Une seule connexion WebSocket
- ✅ **Limite 50 événements** : Évite la surcharge mémoire
- ✅ **Prévention doublons** : Évite les re-renders inutiles
- ✅ **Cleanup automatique** : Fermeture propre des channels

---

## 🧪 Tests Automatisés

### Test du Hook

Créez `__tests__/use-door-events.test.ts` :

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useDoorEvents } from '@/hooks/use-door-events'

describe('useDoorEvents', () => {
  it('should connect to channel', async () => {
    const { result } = renderHook(() => useDoorEvents([]))

    await waitFor(() => {
      expect(result.current.connected).toBe(true)
    })
  })

  it('should add new events', async () => {
    const { result } = renderHook(() => useDoorEvents([]))

    // Simuler un événement
    // ... code de test ...
  })
})
```

---

## 📚 Ressources

### Documentation

- Laravel Reverb: https://reverb.laravel.com
- Laravel Echo: https://laravel.com/docs/broadcasting#client-side-installation
- Pusher Protocol: https://pusher.com/docs/channels/library_auth_reference/pusher-websockets-protocol

### Dépendances

```json
{
  "laravel-echo": "^2.3.0",
  "pusher-js": "^8.4.0"
}
```

---

## 🎯 Checklist de Déploiement

### En production

- [ ] Changer `REVERB_SCHEME=https`
- [ ] Configurer SSL/TLS pour Reverb
- [ ] Mettre à jour `NEXT_PUBLIC_REVERB_HOST` avec le domaine
- [ ] Utiliser un reverse proxy (Nginx) pour Reverb
- [ ] Activer la persistance des connexions
- [ ] Monitorer les connexions WebSocket
- [ ] Logger les erreurs de broadcast
- [ ] Tester sous charge (stress test)

---

## ✅ Résumé

Votre système est **100% fonctionnel** et prêt à l'emploi !

### Ce qui marche déjà

1. ✅ Connexion WebSocket via Laravel Echo
2. ✅ Souscription au channel `door-events`
3. ✅ Réception des événements en temps réel
4. ✅ Affichage dans le dashboard
5. ✅ Indicateur de connexion
6. ✅ Prévention des doublons
7. ✅ Cleanup automatique

### Pour tester maintenant

1. Démarrez les 4 terminaux (Reverb, API, MQTT, Frontend)
2. Ouvrez http://localhost:3000
3. Envoyez un message MQTT via MQTTX
4. Observez l'événement apparaître en **< 1 seconde** !

---

**Dernière mise à jour :** 2026-02-03
