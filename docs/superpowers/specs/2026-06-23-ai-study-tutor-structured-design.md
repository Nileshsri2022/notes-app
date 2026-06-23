# AI Study Tutor — Structured App Conversion (Design)

Date: 2026-06-23
Status: Approved

## Problem

The app currently exists as a single `index.html` prototype built for the
Canvas environment. It uses Babel-in-browser, CDN `<script>` tags for React /
Firebase / Tailwind, calls the Gemini API directly from the browser, and depends
on Canvas-injected globals (`__firebase_config`, `__app_id`,
`__initial_auth_token`, and an auto-provided `API_KEY`). None of those globals
exist outside Canvas, and the Gemini key would be exposed if called client-side.

Goal: convert it into a structured, runnable, maintainable project without
changing observable behavior.

## Stack Decisions

- **Build tooling:** Vite + React (plain JavaScript, no TypeScript).
- **Gemini API key:** held server-side. A small Express proxy in the same repo
  exposes `POST /api/generate` and `POST /api/chat`; the browser never sees the
  key.
- **Persistence:** keep Firebase (anonymous auth + Firestore) for study-guide
  history and session restore. Config via `VITE_FIREBASE_*` env. The Canvas
  `__initial_auth_token` custom-token path is dropped — anonymous auth only.
- **Styling:** Tailwind via the Vite plugin / PostCSS (replacing the CDN script).
  FontAwesome via npm package or a single CSS import.

## Project Structure

```
ai-study-tutor/
├── server/
│   ├── index.js            Express app: POST /api/generate, POST /api/chat
│   └── .env                GEMINI_API_KEY (server-only, gitignored)
├── src/
│   ├── main.jsx            ReactDOM root
│   ├── App.jsx             state machine (input/loading/ready) + tab shell
│   ├── firebase.js         init from VITE_FIREBASE_* env; export auth, db
│   ├── lib/
│   │   ├── api.js          generateGuide(text), chat(...) → fetch /api/*
│   │   └── store.js        session + history Firestore helpers
│   ├── hooks/
│   │   ├── useAuth.js      anonymous auth; returns { user, ready }
│   │   └── useSession.js   load/save session + history subscription
│   ├── components/
│   │   ├── ChatBot.jsx
│   │   ├── ConceptsView.jsx
│   │   ├── FlashcardsView.jsx
│   │   ├── QuizView.jsx
│   │   ├── HistoryView.jsx
│   │   └── Markdown.jsx    extracted renderFormattedText logic
│   └── index.css           Tailwind directives + the custom styles from <style>
├── index.html              <div id="root"> + module script only (no CDNs)
├── vite.config.js          dev proxy /api → http://localhost:3001
├── .env                    VITE_FIREBASE_* + VITE_APP_ID (public by design)
├── .env.example            documented placeholders for both env files
├── .gitignore
└── package.json            scripts: dev (vite), server, build, preview, test
```

## Components & Responsibilities

- **App.jsx** — owns `sourceText`, `status`, `learningData`, `activeTab`,
  `errorMsg`. Renders the input screen, loading screen, and the ready screen with
  tabs. Delegates all Firebase/session concerns to hooks and all network calls to
  `lib/api.js`. No direct `fetch` or Firestore calls inline.
- **useAuth** — waits for Firebase, signs in anonymously, exposes `{ user, ready }`.
  Replaces the `window.FB` polling + custom-token logic.
- **useSession** — given `user`, subscribes to the history collection and provides
  `loadSession()` and `saveSession(...)`. Wraps `store.js`.
- **lib/api.js** — `generateGuide(text)` and `chat(sourceText, concepts, question)`.
  Each does `fetch('/api/...')`, handles the retry/backoff (moved here from the
  component), parses/cleans JSON, and throws on failure.
- **lib/store.js** — pure Firestore helpers: `subscribeHistory`, `getSession`,
  `setSession`, `addHistory`. Keeps the existing Firestore paths
  (`artifacts/{appId}/users/{uid}/...`) so existing data layout is preserved.
- **Markdown.jsx** — the `renderFormattedText` markdown-to-JSX renderer, extracted
  and reused by `ConceptsView`.
- **ChatBot / ConceptsView / FlashcardsView / QuizView / HistoryView** — moved
  verbatim in behavior; only imports and prop wiring change.

## Server (Express proxy)

- `POST /api/generate` — body `{ text }`. Builds the study-guide prompt (moved from
  the client), calls Gemini with the server-held `GEMINI_API_KEY`, performs the
  retry/backoff, returns the model's raw text (or parsed JSON). Client strips the
  markdown fences as today.
- `POST /api/chat` — body `{ sourceText, concepts, question }`. Builds the tutor
  prompt, calls Gemini, returns the answer text.
- Reads `GEMINI_API_KEY` from `server/.env`. Listens on `:3001`. CORS not needed in
  dev (Vite proxies `/api`); document a note for production.

## Data Flow

1. User pastes text → `App` sets `status = "loading"`.
2. `api.generateGuide(text)` → `POST /api/generate` → server → Gemini → JSON.
3. `App` parses, sets `learningData`, `status = "ready"`.
4. `useSession.saveSession(...)` writes the session doc and `addHistory(...)`
   appends to history; the history subscription updates the History tab.
5. Tabs render `learningData`. ChatBot uses `api.chat(...)`.
6. On load, `useAuth` → anonymous user → `useSession.loadSession()` restores the
   last session; history subscription populates Recent Guides.

## Removed / Changed

- Deleted: CDN `<script>` tags, Babel-standalone, `window.FB` shim, `API_KEY` /
  `API_URL` constants in the client, `__initial_auth_token` handling.
- Changed: `__firebase_config` → `VITE_FIREBASE_*`; `__app_id` → `VITE_APP_ID`;
  inline `fetch`/retry → `lib/api.js`; inline Firestore → `lib/store.js`.

## Testing

Light, goal-driven layer (Vitest):
- `lib/api.js` — mocked `fetch`: success path, retry-then-success, failure throws,
  JSON-fence stripping.
- `Markdown.jsx` — headings, lists, bold, blockquote render to expected elements.
- UI components and Firebase are not exhaustively tested.

## Out of Scope

- Production deployment config / hosting choice.
- Non-anonymous auth (accounts, login UI).
- Any new features beyond the existing prototype's behavior.
