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

### Backend
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

