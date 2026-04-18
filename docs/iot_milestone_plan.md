# IoT milestone plan

Ovaj dokument dopunjuje postojece WBS/PERT PDF-ove i uvodi ono sto se trenutno vidi kao praznina u repou:

- UI vec spominje senzore i IoT
- backend jos nema pravi `device + sensor event` model
- baza jos nema tablice za uredaje, heartbeate i event history
- README jos ne opisuje kako izgleda stvarna integracija senzora s backendom

## Kratka procjena postojece strukture

Struktura repoa ima smisla i dobra je baza za IoT prosirenje:

- `backend/` je dobro mjesto za ingest API, device auth i alert logiku
- `web/` i `mobile/` trebaju ostati klijenti backenda, ne senzora
- `shared/` treba preuzeti tipove za uredaje, evente i heartbeat poruke
- `docs/` je pravo mjesto za plan integracije dok god su glavni WBS/PERT artefakti u PDF-u

Ono sto trenutno nedostaje nije novi veliki modul, nego jedna jasna vertikala:

`ESP32 + barem jedan senzor + autorizirani POST + spremanje u backend + prikaz u dashboardu`

## Sto minimalno treba dodati u milestoneove

Ako zelite dodati samo jedan novi milestone, neka to bude ovaj:

### Predlozeni milestone: IoT proof of concept

Cilj:

- spojiti barem jedan senzor na ESP32
- poslati event na backend preko autoriziranog `POST` zahtjeva
- spremiti event u bazu
- prikazati uredaj ili dogadaj u web dashboardu

Definition of done:

- jedan stvarni ESP32 uredaj konfiguriran za Wi-Fi
- jedan stvarni senzor, preporuka `reed switch` ili `PIR`
- backend endpoint `POST /api/device-events`
- `Authorization: Bearer DEVICE_API_KEY` na zahtjevu
- baza sprema barem `deviceId`, `sensorType`, `eventType`, `timestamp`
- web prikazuje barem listu zadnjih dogadaja ili status uredaja

## Ako mozete dodati 3 manja milestonea, ovo je bolja struktura

### 1. Device ingest foundation

Dodati pod backend / shared / db:

- tablicu `devices`
- tablicu `sensor_events`
- device API key hash
- shared tipove `Device`, `SensorEvent`, `DeviceHeartbeat`
- validaciju payloada za device zahtjeve

### 2. ESP32 sensor proof of concept

Dodati pod hardware / integration:

- jedan ESP32
- jedan fizicki senzor
- firmware koji salje event na backend
- testni payload i mapiranje `sensorType -> alarm`

### 3. Device heartbeat and dashboard visibility

Dodati pod backend / web / mobile:

- `POST /api/device-heartbeat`
- `lastSeen`, `battery`, `rssi`, `firmwareVersion`
- online/offline status uredaja
- osnovni prikaz senzora ili uredaja na dashboardu

## Gdje to dodati u postojece WBS/PERT dokumente

Zato sto su trenutni artefakti u PDF-u i nisu pogodni za precizan tekstualni patch, preporuka za rucnu dopunu je ova:

### U WBS

Pod `Backend` dodati:

- Device authentication
- Sensor event ingest API
- Device heartbeat API
- Event persistence and history

Pod `Baza` ili `Database` dodati:

- `devices` schema
- `sensor_events` schema
- indeksi za `lastSeen` i `timestamp`

Pod `Web` dodati:

- Sensors/devices overview
- Event history list
- Device online/offline badge

Pod `Mobile`, samo ako stane u scope:

- osnovni pregled statusa uredaja i alarma

Pod `Integracija` ili `Hardware` dodati:

- ESP32 setup
- povezivanje jednog senzora
- autorizirani POST prema backendu
- end-to-end test senzora

Pod `Dokumentacija` dodati:

- opis device auth flowa
- primjer event payloada
- setup koraci za ESP32 demo uredaj

### U PERT

Najmanji smisleni lanac ovisnosti izgleda ovako:

1. DB schema for devices and events
2. Backend device auth
3. Backend event ingest endpoint
4. ESP32 firmware for one sensor
5. End-to-end event test
6. Dashboard event/status display

Ako vec imate milestone za auth i milestone za dashboard, ovaj novi IoT milestone najbolje sjeda izmedu:

- nakon osnovnog user auth + backend foundation
- prije naprednih alarma, realtime funkcija ili camera expansion faze

## Konkretna preporuka za Pandora

Za ovaj repo najprirodniji prvi hardware demo je:

- `ESP32 + reed switch` za vrata

Alternativa:

- `ESP32 + PIR` za pokret

Za prvu iteraciju preporuka je koristiti HTTP/HTTPS `POST`, ne MQTT, jer:

- lakse se uklapa u postojeci Express backend
- lakse se debugira
- brze zatvara studentski proof of concept

## Sto nakon toga

Nakon sto prvi ESP32 event prodje end-to-end, sljedeci koraci su:

- heartbeat endpoint
- online/offline status uredaja
- alert pravila
- websocket ili polling za live prikaz
- vise senzora po uredaju
