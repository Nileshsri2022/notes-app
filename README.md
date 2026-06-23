# AI Study Tutor

Vite + React client with an Express proxy (holds the Gemini key) and Firebase
(anonymous auth + Firestore) for history/session.

## Setup
1. `npm install`
2. Copy `.env.example` → `.env`, fill `VITE_FIREBASE_*` and `VITE_APP_ID`.
3. Copy `server/.env.example` → `server/.env`, set `GEMINI_API_KEY`.

## Run (two terminals)
- `npm run server`  → Express proxy on :3001
- `npm run dev`     → Vite client on :5173 (proxies /api → :3001)

## Test
- `npm test`

## Build
- `npm run build` → `dist/`
