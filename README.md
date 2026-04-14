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

Prvi setup (jednom):

1. Instaliraj PostgreSQL 18 (EnterpriseDB installer). Servis mora biti pokrenut na portu `5432`.
2. Kreiraj app usera i bazu — pokreni kao `postgres` superuser (unijet ćeš lozinku koju si zadao tijekom instalacije):
   ```bash
   "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -f backend/db/init.sql
   ```
   (Ako si instalirao na drugi disk, prilagodi put — npr. `Z:\postgresql\bin\psql.exe`.)
3. Kreiraj tablice u bazi `pandora`:
   ```bash
   "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U pandora_app -d pandora -f backend/db/schema.sql
   ```
   Lozinka: `pandora_dev` (dev default iz `init.sql`).
4. Kopiraj env file:
   ```bash
   cd backend
   cp .env.example .env
   ```

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

