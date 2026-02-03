# Guide d'Ajout de Capteur - DoorGuard IoT

Ce guide explique le flux complet d'ajout d'un capteur depuis le frontend et les actions à effectuer par l'équipe IoT.

---

## 🔄 Flux Complet d'Ajout de Capteur

### 1️⃣ Création du Capteur depuis le Frontend

Un administrateur accède à la page **Capteurs** (`/sensors`) et remplit le formulaire :

#### Informations saisies :

**Détails du Capteur :**
- **Nom de la porte** : `Entrée Principale` (unique - servira aussi de nom au capteur)
- **Emplacement** : `Bâtiment A - Rez-de-chaussée`

**Configuration MQTT :**
- **Sujet MQTT** : `doorguard/sensor/entree-principale/event`

> **Note** : Le broker MQTT et le port sont configurés automatiquement depuis le fichier `.env` du backend. Pas besoin de les saisir !

#### Test de Connexion (Optionnel)

Avant d'enregistrer, l'administrateur peut cliquer sur **"Tester la connexion"** :
- Le frontend envoie une requête à `/api/mqtt/test` avec uniquement le topic
- Le backend utilise la configuration MQTT centralisée (HiveMQ Cloud)
- Un message de test est publié sur le topic
- Résultat : ✅ "Connexion réussie" ou ❌ "Connexion échouée"

#### Enregistrement

Lorsque l'administrateur clique sur **"Enregistrer le capteur"** :

1. **Frontend** → **Backend API** : `POST /api/sensors`
   ```json
   {
     "door_name": "Entrée Principale",
     "location": "Bâtiment A - Rez-de-chaussée",
     "mqtt_topic": "doorguard/sensor/entree-principale/event"
   }
   ```

2. **Backend** crée automatiquement :
   - Une **porte** dans la table `doors` :
     ```sql
     INSERT INTO doors (name, slug, location)
     VALUES ('Entrée Principale', 'entree-principale', 'Bâtiment A...');
     ```
   - Un **capteur** dans la table `sensors` lié à cette porte :
     ```sql
     INSERT INTO sensors (name, location, door_id, mqtt_topic, mqtt_broker, mqtt_port, status)
     VALUES ('Entrée Principale', 'Bâtiment A...', 1, 'doorguard/sensor/entree-principale/event',
             'fd286f0fca334917b338f6f5882a2763.s1.eu.hivemq.cloud', 8883, 'offline');
     ```

3. **Backend** retourne le capteur créé :
   ```json
   {
     "data": {
       "id": "1",
       "name": "Entrée Principale",
       "location": "Bâtiment A - Rez-de-chaussée",
       "doorId": "1",
       "mqttTopic": "doorguard/sensor/entree-principale/event",
       "status": "offline",
       "lastSeen": null
     }
   }
   ```

4. **Frontend** affiche le nouveau capteur dans la liste avec le statut **🔴 Hors ligne**

---

## 🔧 Ce que l'Équipe IoT Doit Faire

### Étape 1 : Récupérer les Informations du Capteur

L'équipe IoT doit noter les informations suivantes depuis l'interface ou la base de données :

| Information | Valeur | Exemple |
|------------|--------|---------|
| **Nom de la porte** | Nom saisi dans le formulaire | `Entrée Principale` |
| **MQTT Topic** | Topic assigné au capteur | `doorguard/sensor/entree-principale/event` |
| **MQTT Broker** | Adresse du broker (fixe) | `fd286f0fca334917b338f6f5882a2763.s1.eu.hivemq.cloud` |
| **MQTT Port** | Port du broker (fixe) | `8883` |
| **TLS/SSL** | Activé | `Oui` (port 8883) |
| **Username** | Identifiant MQTT (fixe) | `perseus911` |
| **Password** | Mot de passe MQTT (fixe) | `Wemtinga2026@` |

> **Important** : Toutes les informations sauf le topic sont **fixes** et configurées dans le backend. L'équipe IoT n'a qu'à récupérer le **topic MQTT** depuis l'interface.

---

### Étape 2 : Configurer le Capteur Physique (ESP32/Arduino/Raspberry Pi)

L'équipe IoT doit **programmer le capteur** pour qu'il publie des messages MQTT sur le topic assigné.

#### Configuration du Capteur (Exemple ESP32)

```cpp
// Configuration WiFi
const char* WIFI_SSID = "VotreReseau";
const char* WIFI_PASSWORD = "VotreMotDePasse";

// Configuration MQTT
const char* MQTT_BROKER = "fd286f0fca334917b338f6f5882a2763.s1.eu.hivemq.cloud";
const int MQTT_PORT = 8883;
const char* MQTT_USERNAME = "perseus911";
const char* MQTT_PASSWORD = "Wemtinga2026@";
const char* MQTT_TOPIC = "doorguard/sensor/entree-principale/event";  // ⚠️ Topic depuis l'interface

// Configuration du capteur
const String CARD_READER_ID = "RC522-01";
```

---

### Étape 3 : Format du Message MQTT

Le capteur doit envoyer un message JSON au format suivant :

#### Événement d'Ouverture de Porte

```json
{
  "card_id": "ABC123456",
  "action": "open",
  "timestamp": "2026-02-03T14:30:00Z"
}
```

#### Événement de Fermeture de Porte

```json
{
  "card_id": "ABC123456",
  "action": "closed",
  "timestamp": "2026-02-03T14:30:15Z"
}
```

#### Paramètres Obligatoires

| Champ | Type | Description | Exemple |
|-------|------|-------------|---------|
| `card_id` | string | Identifiant de la carte RFID | `"ABC123456"` |
| `action` | string | Action effectuée : `"open"` ou `"closed"` | `"open"` |
| `timestamp` | string | Horodatage ISO 8601 (UTC) | `"2026-02-03T14:30:00Z"` |

---

### Étape 4 : Code Exemple pour le Capteur (ESP32 + MQTT)

```cpp
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <time.h>

// Configuration (voir Étape 2)
const char* WIFI_SSID = "VotreReseau";
const char* WIFI_PASSWORD = "VotreMotDePasse";
const char* MQTT_BROKER = "fd286f0fca334917b338f6f5882a2763.s1.eu.hivemq.cloud";
const int MQTT_PORT = 8883;
const char* MQTT_USERNAME = "perseus911";
const char* MQTT_PASSWORD = "Wemtinga2026@";
const char* MQTT_TOPIC = "doorguard/sensor/5/event";

WiFiClientSecure espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);

  // Connexion WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connecté");

  // Configuration NTP pour le timestamp
  configTime(0, 0, "pool.ntp.org");

  // Configuration MQTT avec TLS
  espClient.setInsecure(); // Pour les tests uniquement !
  client.setServer(MQTT_BROKER, MQTT_PORT);

  connectMQTT();
}

void connectMQTT() {
  while (!client.connected()) {
    Serial.print("Connexion MQTT...");
    if (client.connect("ESP32-Sensor-5", MQTT_USERNAME, MQTT_PASSWORD)) {
      Serial.println("connecté !");
    } else {
      Serial.print("échec, rc=");
      Serial.println(client.state());
      delay(5000);
    }
  }
}

void publishEvent(String cardId, String action) {
  // Créer le timestamp ISO 8601
  time_t now = time(nullptr);
  struct tm timeinfo;
  gmtime_r(&now, &timeinfo);
  char timestamp[30];
  strftime(timestamp, sizeof(timestamp), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);

  // Créer le message JSON
  StaticJsonDocument<200> doc;
  doc["card_id"] = cardId;
  doc["action"] = action;
  doc["timestamp"] = timestamp;

  String payload;
  serializeJson(doc, payload);

  // Publier le message
  if (client.publish(MQTT_TOPIC, payload.c_str())) {
    Serial.println("✅ Message publié: " + payload);
  } else {
    Serial.println("❌ Échec de publication");
  }
}

void loop() {
  if (!client.connected()) {
    connectMQTT();
  }
  client.loop();

  // EXEMPLE : Détection d'une carte RFID
  String cardId = readRFIDCard(); // Fonction à implémenter
  if (cardId != "") {
    publishEvent(cardId, "open");
    delay(2000); // Anti-rebond
    publishEvent(cardId, "closed");
  }

  delay(100);
}

String readRFIDCard() {
  // ⚠️ À implémenter selon votre lecteur RFID (RC522, PN532, etc.)
  // Retourner l'ID de la carte lue, ou "" si aucune carte
  return "";
}
```

---

### Étape 5 : Tester le Capteur

#### Test 1 : Connexion MQTT

1. **Téléversez le code sur l'ESP32**
2. **Ouvrez le moniteur série** (115200 bauds)
3. Vérifiez les messages :
   ```
   WiFi connecté
   Connexion MQTT...connecté !
   ```

#### Test 2 : Publication d'un Message

Simulez une lecture de carte dans le code :

```cpp
void loop() {
  // Test manuel
  publishEvent("ABC123456", "open");
  delay(5000);
}
```

#### Test 3 : Vérifier la Réception Backend

**Terminal Backend (MQTT Listener)** :
```
Message reçu sur [doorguard/sensor/5/event]: {
  "card_id": "ABC123456",
  "action": "open",
  "timestamp": "2026-02-03T14:30:00Z"
}
Événement créé: porte #1 - open - carte: Jean Dupont
```

**Frontend (Dashboard)** :
- ✅ Badge "En direct" vert
- ✅ Nouvel événement apparaît dans le tableau
- 🔔 Toast de notification
- 🔊 Son de notification

---

## 🔍 Que Se Passe-t-il Côté Backend ?

### 1. Réception MQTT

Le **MQTT Listener** (`php artisan mqtt:listen`) :

1. **Écoute** tous les topics `doorguard/sensor/+/event`
2. **Reçoit** le message JSON du capteur
3. **Extrait** l'ID du capteur depuis le topic (`doorguard/sensor/5/event` → ID = 5)
4. **Récupère** le capteur depuis la BDD :
   ```sql
   SELECT * FROM sensors WHERE id = 5;
   ```
5. **Récupère** la porte associée :
   ```sql
   SELECT * FROM doors WHERE id = (SELECT door_id FROM sensors WHERE id = 5);
   ```
6. **Recherche** le détenteur de la carte :
   ```sql
   SELECT * FROM card_holders WHERE card_id = 'ABC123456';
   ```
7. **Crée** un événement dans la BDD :
   ```sql
   INSERT INTO door_events (door_id, status, card_holder_id, timestamp)
   VALUES (1, 'open', 42, '2026-02-03T14:30:00Z');
   ```
8. **Déclenche** l'événement Laravel : `DoorEventCreated`
9. **Broadcast** via Reverb → Frontend

### 2. Mise à Jour du Statut du Capteur

À chaque message reçu, le backend met à jour :

```sql
UPDATE sensors
SET status = 'online', last_seen = NOW()
WHERE id = 5;
```

**Résultat dans le frontend** :
- Le capteur passe de 🔴 **Hors ligne** à 🟢 **En ligne**
- Le champ "Dernière activité" est mis à jour

---

## 📋 Checklist pour l'Équipe IoT

Après la création d'un capteur via le frontend, suivez cette checklist :

### Configuration

- [ ] Récupérer l'ID du capteur depuis l'interface
- [ ] Noter le topic MQTT assigné (`doorguard/sensor/X/event`)
- [ ] Noter les identifiants MQTT (broker, port, username, password)
- [ ] Configurer le capteur physique avec ces informations

### Programmation

- [ ] Configurer la connexion WiFi
- [ ] Configurer la connexion MQTT avec TLS/SSL si port 8883
- [ ] Implémenter la lecture RFID/NFC
- [ ] Formater les messages au format JSON requis
- [ ] Ajouter le timestamp ISO 8601 (UTC)
- [ ] Publier sur le topic correct

### Tests

- [ ] Tester la connexion WiFi
- [ ] Tester la connexion MQTT
- [ ] Publier un message de test
- [ ] Vérifier la réception dans les logs backend (Terminal MQTT Listener)
- [ ] Vérifier l'affichage dans le frontend (Dashboard)
- [ ] Vérifier le changement de statut du capteur (Hors ligne → En ligne)
- [ ] Tester avec une vraie carte RFID
- [ ] Vérifier les notifications toast + son

### Déploiement

- [ ] Installer le capteur physiquement
- [ ] Vérifier l'alimentation électrique
- [ ] Tester la portée WiFi sur site
- [ ] Documenter l'emplacement exact
- [ ] Former l'équipe de maintenance

---

## 🚨 Résolution de Problèmes

### Le capteur reste "Hors ligne"

**Causes possibles :**

1. **Capteur non connecté au WiFi**
   - Vérifier les identifiants WiFi
   - Vérifier la portée du signal

2. **Capteur non connecté au broker MQTT**
   - Vérifier l'adresse du broker
   - Vérifier les identifiants MQTT
   - Vérifier le port (1883 ou 8883)
   - Vérifier le certificat SSL si port 8883

3. **Topic incorrect**
   - Le topic doit correspondre **exactement** à celui dans la BDD
   - Format : `doorguard/sensor/{ID}/event`

4. **MQTT Listener non démarré**
   - Vérifier que `php artisan mqtt:listen` est actif

### Les événements ne s'affichent pas

**Causes possibles :**

1. **Format JSON incorrect**
   - Vérifier que les champs `card_id`, `action`, `timestamp` sont présents
   - Vérifier le format du timestamp (ISO 8601 UTC)

2. **Carte inconnue**
   - La carte doit exister dans la table `card_holders`
   - Ajouter la carte via l'interface admin si nécessaire

3. **Queue Worker non démarré**
   - Vérifier que `php artisan queue:work` est actif

4. **Reverb non démarré**
   - Vérifier que `php artisan reverb:start` est actif

---

## 📞 Support

En cas de problème, contactez l'équipe backend avec :

- **ID du capteur** : `5`
- **Topic MQTT** : `doorguard/sensor/5/event`
- **Logs du moniteur série** : Copie des messages de connexion/erreur
- **Capture d'écran** : Interface des capteurs montrant le statut

---

**Dernière mise à jour :** 2026-02-03
