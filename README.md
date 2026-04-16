# Pandora — Kućni Sigurnosni Sustav

Pandora projekt: mobilna aplikacija, web dashboard i backend API.

## Struktura projekta

```
pandora/
├── mobile/      → React Native (Expo) + TypeScript
├── web/         → React + Vite + TypeScript
├── backend/     → Node.js + Express + TypeScript
├── shared/      → Zajednički tipovi i konstante
```

## Brzi start

### Kloniraj
```bash
git clone https://github.com/TVOJ-USERNAME/pandora.git
```

### Backend

Pokretanje:
```bash
cd backend
npm install
npm run dev
```
Server se pokreće na `http://localhost:3001`

### Web
```bash
cd web
npm install
npm run dev
```
Web app se pokreće na `http://localhost:5173`

### Mobile
Za pregled mobilne verzije instaliraj aplikaciju "Expo Go" 
```bash
cd mobile
npm install
npx expo start
```
Skeniraj QR kod s Expo Go aplikacijom na mobitelu.

## Git workflow

1. Nikad ne pushaj direktno na `main`
2. Napravi feature branch: `git checkout -b feature/ime-featurea`
3. Commitaj i pushaj svoj branch
4. Otvori Pull Request na GitHubu
5. Barem 1 osoba mora odobriti prije mergea

## Setup baze podataka

### 1) Instaliraj PostgreSQL 18
EnterpriseDB installer: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

Bitno tijekom instalacije:
- Port **5432** (default)
- Zapamti lozinku za `postgres` superusera (trebat će samo jednom, za init)
- pgAdmin 4 ostavi uključen (koristan za gledanje baze)

### 2) Pull najnoviji kod
```bash
git pull
cd backend
npm install
```

### 3) Kreiraj app usera i bazu (jednom)
Put do `psql.exe` ovisi o tome gdje je instaliran — default je `C:\Program Files\PostgreSQL\18\bin\psql.exe`:
```bash
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -f db/init.sql
```
Tražit će lozinku `postgres` superusera. Očekivani output: `CREATE ROLE`, `CREATE DATABASE`.

### 4) Kreiraj tablice
```bash
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U pandora_app -d pandora -f db/schema.sql
```
Lozinka: `pandora_dev`. Output: `CREATE TABLE`, `CREATE INDEX`.

### 5) Kopiraj env file
```bash
cp .env.example .env
```
Ništa ne mijenjati — defaulti već matchaju `init.sql`.

### 6) Provjera
```bash
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U pandora_app -d pandora -c "\dt"
```
Mora pokazati `users` tablicu.

### 7) Pokreni backend
```bash
npm run dev
```
Mora ispisati `Backend pokrenut: http://localhost:3001 (DB OK)`.

---

### Česti problemi

- **`password authentication failed for user "pandora_app"`** → nije pokrenut `init.sql`, ili je pokrenut dvaput (user već postoji s drugom lozinkom). Fix: spoji se kao `postgres` i pokreni `DROP USER pandora_app;`, pa opet korak 3.
- **`psql: command not found`** → koristi se krivi put. Nije potrebno dodavati u PATH, samo puni put do `psql.exe`.
- **`ECONNREFUSED 127.0.0.1:5432`** → Postgres servis ne vrti. Windows Services → `postgresql-x64-18` → Start.
- **`DB konekcija ne radi` pri pokretanju backenda** → nema `.env` ili je prazan. `cp .env.example .env`.

