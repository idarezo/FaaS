# FaaS Events — Brezstrežniški sistem za upravljanje dogodkov

Sistem za upravljanje in registracijo na dogodke, implementiran z **Serverless Framework** in **AWS Lambda**. Projekt demonstrira vse ključne koncepte brezstrežniškega računalništva (FaaS) z uporabo različnih vrst sprožilcev (eventov).

---

## Arhitektura — 6 glavnih funkcionalnosti

| # | Funkcionalnost | Sprožilci (eventi) | Opis |
|---|---------------|-------------------|------|
| 1 | **Avtentikacija** | HTTP | Registracija, prijava, JWT zavarovanje |
| 2 | **Upravljanje dogodkov** | HTTP + DynamoDB Streams | CRUD operacije + sprožilec ob novem dogodku |
| 3 | **Registracije** | HTTP + DynamoDB Streams | Prijava/odpoved + sprožilec ob spremembi |
| 4 | **Obvestila** | SQS + Cron + DynamoDB Streams | E-poštna obvestila, opomniki |
| 5 | **Upravljanje datotek** | HTTP + S3 | Nalaganje slik, sprožilec ob nalaganju |
| 6 | **Analitika** | HTTP + Cron + CloudWatch Logs | Sledenje ogledov, dnevno poročilo, nadzor napak |

### Vrste dogodkov (vsaj 4 zahtevane):
- ✅ **Podatkovne spremembe** — DynamoDB Streams (`onEventCreated`, `onRegistrationChanged`, `sendWelcomeEmail`)
- ✅ **Shramba in datoteke** — S3 (`onFileUploaded`)
- ✅ **Sporočila in obveščanje** — SQS (`processNotification`)
- ✅ **Časovni dogodki** — Cron (`sendReminder`, `generateReport`)
- ✅ **Logi in nadzorni dogodki** — CloudWatch Logs (`processLogs`)
- ✅ **Uporabniški dogodki** — HTTP (`register`, `login`, `createEvent`, ...)

---

## Struktura projekta

```
faas-events/
├── serverless.yml              # Konfiguracija Serverless Framework
├── package.json
├── src/
│   ├── utils/
│   │   ├── response.js         # HTTP odgovori
│   │   ├── auth.js             # JWT generiranje/preverjanje
│   │   └── db.js               # DynamoDB/SQS/S3 klienti
│   ├── auth/
│   │   ├── register.js         # POST /auth/register
│   │   ├── login.js            # POST /auth/login
│   │   └── authorizer.js       # Lambda JWT authorizer
│   ├── events/
│   │   ├── createEvent.js      # POST /events
│   │   ├── listEvents.js       # GET /events
│   │   ├── getEvent.js         # GET /events/{id}
│   │   ├── updateEvent.js      # PUT /events/{id}
│   │   ├── deleteEvent.js      # DELETE /events/{id}
│   │   └── onEventCreated.js   # DynamoDB Stream → SQS
│   ├── registrations/
│   │   ├── registerForEvent.js     # POST /events/{id}/register
│   │   ├── cancelRegistration.js   # DELETE /events/{id}/register/{regId}
│   │   ├── getRegistrations.js     # GET /events/{id}/registrations
│   │   ├── getMyRegistrations.js   # GET /my/registrations
│   │   └── onRegistrationChanged.js # DynamoDB Stream → SQS
│   ├── notifications/
│   │   ├── sendWelcomeEmail.js     # DynamoDB Stream (user INSERT)
│   │   ├── processNotification.js  # SQS trigger
│   │   └── sendReminder.js         # Cron: vsak dan ob 8:00 UTC
│   ├── files/
│   │   ├── getPresignedUrl.js      # GET /files/presigned-url
│   │   ├── getFileUrl.js           # GET /files/{key}
│   │   └── onFileUploaded.js       # S3 trigger
│   └── analytics/
│       ├── trackView.js            # POST /events/{id}/view
│       ├── getEventStats.js        # GET /events/{id}/stats
│       ├── generateReport.js       # Cron: vsak dan ob polnoči
│       └── processLogs.js          # CloudWatch Logs trigger
├── seeds/
│   ├── users.json
│   └── events.json
└── tests/
    └── faas-events.postman_collection.json
```

---

## Namestitev in zagon

### Predpogoji
- Node.js 18+
- npm
- Java 8+ (za DynamoDB Local)
- AWS CLI (za deploy na AWS)

### 1. Namestitev odvisnosti

```bash
npm install
```

### 2. Prenos DynamoDB Local

```bash
mkdir -p .dynamodb
curl -L "https://d1ni2b6xgvw0s0.cloudfront.net/v2.x/dynamodb_local_latest.tar.gz" \
     -o .dynamodb/dynamodb_local_latest.tar.gz
cd .dynamodb && tar -xzf dynamodb_local_latest.tar.gz && cd ..
```

### 3. Zagon lokalnega razvoja (3 koraki)

**Terminal 1 — DynamoDB Local:**
```bash
npm run db:start
```

**Terminal 2 — Ustvari tabele (samo prvič):**
```bash
npm run db:setup
```

**Terminal 2 — Serverless Offline:**
```bash
npm run offline
```

Strežnik bo dostopen na: `http://localhost:3000/local`

**ALI — vse v enem koraku (macOS/Linux):**
```bash
npm start
```

### 4. Deploy na AWS

```bash
# Konfiguracija AWS poverilnic
aws configure

# Deploy na razvojno okolje
npm run deploy
```

---

## API Endpointi

### Avtentikacija
| Metoda | Pot | Opis | Auth |
|--------|-----|------|------|
| POST | `/auth/register` | Registracija | Ne |
| POST | `/auth/login` | Prijava | Ne |

### Dogodki
| Metoda | Pot | Opis | Auth |
|--------|-----|------|------|
| GET | `/events` | Seznam aktivnih dogodkov | Ne |
| POST | `/events` | Ustvari nov dogodek | Da |
| GET | `/events/{id}` | Podrobnosti dogodka | Ne |
| PUT | `/events/{id}` | Posodobi dogodek | Da (organizator) |
| DELETE | `/events/{id}` | Zbriši dogodek | Da (organizator) |

### Registracije
| Metoda | Pot | Opis | Auth |
|--------|-----|------|------|
| POST | `/events/{id}/register` | Prijava na dogodek | Da |
| DELETE | `/events/{id}/register/{regId}` | Odpoved prijave | Da |
| GET | `/events/{id}/registrations` | Seznam prijavljenih | Da (organizator) |
| GET | `/my/registrations` | Moje prijave | Da |

### Datoteke
| Metoda | Pot | Opis | Auth |
|--------|-----|------|------|
| GET | `/files/presigned-url` | URL za nalaganje slike | Da |
| GET | `/files/{key}` | URL za ogled slike | Ne |

### Analitika
| Metoda | Pot | Opis | Auth |
|--------|-----|------|------|
| POST | `/events/{id}/view` | Beleži ogled | Ne |
| GET | `/events/{id}/stats` | Statistika dogodka | Da (organizator) |

---

## Testiranje s Postmanom

1. Odpri Postman
2. Uvozi kolekcijo: `tests/faas-events.postman_collection.json`
3. Nastavi spremenljivko `baseUrl` na `http://localhost:3000/local`
4. Zaženi teste v zaporedju (1 → 7)

Kolekcija vsebuje:
- Avtomatsko shranjevanje JWT tokena po prijavi
- Avtomatsko shranjevanje `eventId` in `registrationId`
- Teste za uspešne in napačne zahteve
- Varnostne teste (401, 403, 404, 409)

---

## Avtentikacija

Zaščiteni endpointi zahtevajo JWT token v glavi:
```
Authorization: Bearer <token>
```

Token pridobite z `/auth/login`. Velja 24 ur.