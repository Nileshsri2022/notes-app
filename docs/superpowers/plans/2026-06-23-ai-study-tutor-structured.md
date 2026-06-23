# AI Study Tutor Structured Conversion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the single-file Canvas `index.html` AI Study Tutor prototype into a structured Vite + React (JS) app with an Express proxy holding the Gemini key and Firebase for auth/persistence.

**Architecture:** Two processes in one repo — a Vite React client (`src/`) and a small Express proxy (`server/`). The client calls `/api/generate` and `/api/chat`; the server injects the Gemini key and forwards to Gemini. Firebase (anonymous auth + Firestore) handles history and session restore. Components are split one-per-file; Firebase and network logic move into hooks (`useAuth`, `useSession`) and libs (`lib/api.js`, `lib/store.js`).

**Tech Stack:** Vite, React 18 (plain JS), Firebase 11 (auth + firestore), Express, Tailwind (PostCSS), Vitest.

## Global Constraints

- Plain JavaScript only — no TypeScript.
- React 18.2 (`react`, `react-dom`); Firebase 11.6.x.
- Gemini key lives ONLY in `server/.env` as `GEMINI_API_KEY`; never referenced in `src/`.
- Client Firebase config from `VITE_FIREBASE_*` env vars; app id from `VITE_APP_ID` (default `"default-app-id"`).
- Preserve Firestore paths exactly: `artifacts/{appId}/users/{uid}/history` and `artifacts/{appId}/users/{uid}/session/current`.
- Gemini model/endpoint: `gemini-2.5-flash-preview-09-2025:generateContent`.
- Anonymous auth only — drop the Canvas `__initial_auth_token` custom-token path.
- Dev: Vite on `:5173`, Express on `:3001`, Vite proxies `/api` → `:3001`.

---

### Task 1: Project scaffold, tooling, env

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `postcss.config.js`, `tailwind.config.js`, `src/index.css`, `src/main.jsx`, `.env.example`, `.gitignore`
- Create: `src/App.jsx` (temporary placeholder)

**Interfaces:**
- Produces: a runnable Vite app rendering `<App />` into `#root`; npm scripts `dev`, `server`, `build`, `preview`, `test`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "ai-study-tutor",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "server": "node server/index.js",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "firebase": "^11.6.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "express": "^4.19.2"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.0",
    "vitest": "^2.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

- [ ] **Step 2: Create `vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:3001' },
  },
})
```

- [ ] **Step 3: Create `index.html`** (no CDNs; FontAwesome stays as a single CDN link for icons)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Study Tutor</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

- [ ] **Step 4: Create Tailwind config files**

`tailwind.config.js`:
```js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

`postcss.config.js`:
```js
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}
```

- [ ] **Step 5: Create `src/index.css`** (Tailwind directives + custom styles lifted from the prototype `<style>`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

.perspective-1000 { perspective: 1000px; }
.transform-style-preserve-3d { transform-style: preserve-3d; }
.rotate-y-180 { transform: rotateY(180deg); }
.backface-hidden { backface-visibility: hidden; }
.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.custom-scrollbar::-webkit-scrollbar { width: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
```

- [ ] **Step 6: Create `src/main.jsx` and placeholder `src/App.jsx`**

`src/main.jsx`:
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

`src/App.jsx` (placeholder, replaced in Task 7):
```jsx
export default function App() {
  return <div className="p-8 text-slate-800">AI Study Tutor — scaffold OK</div>
}
```

- [ ] **Step 7: Create `.env.example` and `.gitignore`**

`.env.example`:
```
# Client (public — shipped to browser)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_APP_ID=default-app-id

# Server (secret — server/.env)
# GEMINI_API_KEY=
```

`.gitignore`:
```
node_modules/
.env
server/.env
dist/
```

- [ ] **Step 8: Install and verify build**

Run: `npm install && npm run build`
Expected: build succeeds, `dist/` produced with no errors.

- [ ] **Step 9: Commit**

```bash
git add package.json vite.config.js index.html postcss.config.js tailwind.config.js src/ .env.example .gitignore
git commit -m "chore: scaffold Vite + React + Tailwind project"
```

---

### Task 2: Express proxy server

**Files:**
- Create: `server/index.js`, `server/.env.example`
- Test: `server/index.test.js`

**Interfaces:**
- Produces: `POST /api/generate` body `{ text }` → `{ text: <raw model string> }`; `POST /api/chat` body `{ sourceText, concepts, question }` → `{ text: <answer string> }`. Both 500 on failure with `{ error }`. Server reads `GEMINI_API_KEY` from `server/.env`.
- Exports a `createApp()` function returning the Express app (so tests can mount it without binding a port). A `callGemini(prompt)` helper is injectable/mehrmockable via module export.

- [ ] **Step 1: Write the failing test**

`server/index.test.js`:
```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

vi.mock('node-fetch', () => ({ default: vi.fn() }))

let createApp, fetch
beforeEach(async () => {
  vi.resetModules()
  process.env.GEMINI_API_KEY = 'test-key'
  fetch = (await import('node-fetch')).default
  createApp = (await import('./index.js')).createApp
})

function geminiOk(text) {
  return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }) }
}

describe('POST /api/generate', () => {
  it('returns model text on success', async () => {
    fetch.mockResolvedValueOnce(geminiOk('{"concepts":[]}'))
    const res = await request(createApp()).post('/api/generate').send({ text: 'hello' })
    expect(res.status).toBe(200)
    expect(res.body.text).toBe('{"concepts":[]}')
  })

  it('500s when Gemini keeps failing', async () => {
    fetch.mockResolvedValue({ ok: false, status: 500 })
    const res = await request(createApp()).post('/api/generate').send({ text: 'hello' })
    expect(res.status).toBe(500)
  })
})

describe('POST /api/chat', () => {
  it('returns answer text', async () => {
    fetch.mockResolvedValueOnce(geminiOk('the answer'))
    const res = await request(createApp())
      .post('/api/chat')
      .send({ sourceText: 's', concepts: [], question: 'q' })
    expect(res.body.text).toBe('the answer')
  })
})
```

Add `supertest` and `node-fetch` to devDependencies/dependencies in this step:
Run: `npm install node-fetch && npm install -D supertest`

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run server/index.test.js`
Expected: FAIL — `createApp` is not exported / module not found.

- [ ] **Step 3: Write `server/index.js`**

```js
import 'dotenv/config'
import express from 'express'
import fetch from 'node-fetch'

const MODEL = 'gemini-2.5-flash-preview-09-2025:generateContent'
const url = () =>
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}?key=${process.env.GEMINI_API_KEY}`

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

export async function callGemini(prompt) {
  let attempt = 0
  let response
  while (attempt < 3) {
    response = await fetch(url(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    })
    if (response.ok) break
    attempt++
    await delay(1000 * attempt)
  }
  if (!response || !response.ok) throw new Error('Gemini call failed')
  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('No content generated')
  return text
}

function generatePrompt(text) {
  return `You are an expert AI tutor. Analyze the following educational text and create a comprehensive study guide.
Output ONLY a valid JSON object matching this schema exactly, with NO markdown formatting, NO backticks, and NO code blocks around it:
{
  "concepts": [ { "title": "Concept Name", "explanation": "Simple, plain language explanation" } ],
  "flashcards": [ { "term": "Key Term", "definition": "Clear definition" } ],
  "quiz": [ { "question": "Clear multiple choice question", "options": ["Option 1","Option 2","Option 3","Option 4"], "correctAnswerIndex": 0 } ]
}
Make sure there are 3-5 concepts, 5-8 flashcards, and a 3-5 question quiz.

Text to analyze:
${text}`
}

function chatPrompt(sourceText, concepts, question) {
  return `You are a helpful AI tutor. Base your answers ONLY on the following source material and concepts. If the answer is not in the material, say you don't know based on the provided text. Keep answers concise.
Source Material: ${sourceText}
Concepts: ${JSON.stringify(concepts)}
User Question: ${question}`
}

export function createApp() {
  const app = express()
  app.use(express.json({ limit: '1mb' }))

  app.post('/api/generate', async (req, res) => {
    try {
      const text = await callGemini(generatePrompt(req.body.text || ''))
      res.json({ text })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  })

  app.post('/api/chat', async (req, res) => {
    try {
      const { sourceText, concepts, question } = req.body
      const text = await callGemini(chatPrompt(sourceText || '', concepts || [], question || ''))
      res.json({ text })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  })

  return app
}

const isMain = process.argv[1] && process.argv[1].endsWith('server/index.js')
if (isMain) {
  createApp().listen(3001, () => console.log('Proxy on http://localhost:3001'))
}
```

Add `dotenv`: Run `npm install dotenv`

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run server/index.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Create `server/.env.example`**

```
GEMINI_API_KEY=
```

- [ ] **Step 6: Commit**

```bash
git add server/ package.json package-lock.json
git commit -m "feat: add Express proxy for Gemini generate and chat"
```

---

### Task 3: Firebase init + store helpers

**Files:**
- Create: `src/firebase.js`, `src/lib/store.js`

**Interfaces:**
- Consumes: `VITE_FIREBASE_*`, `VITE_APP_ID` env.
- Produces:
  - `src/firebase.js` exports `auth`, `db`, `appId`.
  - `src/lib/store.js` exports:
    - `historyRef(user)` → Firestore collection ref
    - `sessionRef(user)` → Firestore doc ref at `.../session/current`
    - `subscribeHistory(user, cb)` → unsubscribe fn; `cb` receives sorted array `[{ id, timestamp, createdAt, sourceText, learningData }]`
    - `getSession(user)` → `Promise<sessionData|null>`
    - `setSession(user, payload)` → `Promise<void>`
    - `addHistory(user, item)` → `Promise<void>` where `item = { timestamp, createdAt, sourceText, learningData }`

- [ ] **Step 1: Create `src/firebase.js`**

```js
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const appId = import.meta.env.VITE_APP_ID || 'default-app-id'
```

- [ ] **Step 2: Create `src/lib/store.js`**

```js
import {
  collection, doc, setDoc, getDoc, onSnapshot,
} from 'firebase/firestore'
import { db, appId } from '../firebase.js'

export function historyRef(user) {
  return collection(db, 'artifacts', appId, 'users', user.uid, 'history')
}

export function sessionRef(user) {
  return doc(db, 'artifacts', appId, 'users', user.uid, 'session', 'current')
}

export function subscribeHistory(user, cb) {
  return onSnapshot(historyRef(user), (snapshot) => {
    const items = []
    snapshot.forEach((d) => items.push({ id: d.id, ...d.data() }))
    items.sort((a, b) => b.createdAt - a.createdAt)
    cb(items)
  }, (err) => console.error('History fetch error:', err))
}

export async function getSession(user) {
  const snap = await getDoc(sessionRef(user))
  return snap.exists() ? snap.data() : null
}

export async function setSession(user, payload) {
  await setDoc(sessionRef(user), payload)
}

export async function addHistory(user, item) {
  const ref = doc(historyRef(user))
  await setDoc(ref, item)
}
```

- [ ] **Step 3: Verify it imports/builds**

Run: `npm run build`
Expected: build succeeds (no missing-import errors).

- [ ] **Step 4: Commit**

```bash
git add src/firebase.js src/lib/store.js
git commit -m "feat: add Firebase init and Firestore store helpers"
```

---

### Task 4: Client API lib

**Files:**
- Create: `src/lib/api.js`
- Test: `src/lib/api.test.js`

**Interfaces:**
- Consumes: proxy endpoints from Task 2.
- Produces:
  - `generateGuide(text)` → `Promise<parsedObject>` — POSTs `/api/generate`, strips markdown fences, `JSON.parse`s, throws on failure.
  - `chat(sourceText, concepts, question)` → `Promise<string>` — POSTs `/api/chat`, returns answer text (or a fallback string).

- [ ] **Step 1: Write the failing test**

`src/lib/api.test.js`:
```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateGuide, chat } from './api.js'

beforeEach(() => { global.fetch = vi.fn() })
afterEach(() => { vi.restoreAllMocks() })

const ok = (body) => ({ ok: true, json: async () => body })

describe('generateGuide', () => {
  it('parses returned JSON text', async () => {
    fetch.mockResolvedValueOnce(ok({ text: '{"concepts":[{"title":"A","explanation":"b"}]}' }))
    const data = await generateGuide('src')
    expect(data.concepts[0].title).toBe('A')
  })

  it('strips ```json fences before parsing', async () => {
    fetch.mockResolvedValueOnce(ok({ text: '```json\n{"quiz":[]}\n```' }))
    const data = await generateGuide('src')
    expect(data.quiz).toEqual([])
  })

  it('throws when response not ok', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
    await expect(generateGuide('src')).rejects.toThrow()
  })
})

describe('chat', () => {
  it('returns answer text', async () => {
    fetch.mockResolvedValueOnce(ok({ text: 'hi there' }))
    const answer = await chat('s', [], 'q')
    expect(answer).toBe('hi there')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/api.test.js`
Expected: FAIL — `./api.js` not found.

- [ ] **Step 3: Write `src/lib/api.js`**

```js
export async function generateGuide(text) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error('Failed to generate study guide')
  const data = await res.json()
  let jsonText = data.text
  if (!jsonText) throw new Error('No content generated')
  jsonText = jsonText.replace(/^```json\s*/, '').replace(/```$/, '').trim()
  return JSON.parse(jsonText)
}

export async function chat(sourceText, concepts, question) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceText, concepts, question }),
  })
  if (!res.ok) return "Oops, something went wrong connecting to the AI."
  const data = await res.json()
  return data.text || "Sorry, I couldn't understand that."
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/api.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/api.js src/lib/api.test.js
git commit -m "feat: add client API lib for generate and chat"
```

---

### Task 5: Markdown renderer component

**Files:**
- Create: `src/components/Markdown.jsx`
- Test: `src/components/Markdown.test.jsx`

**Interfaces:**
- Produces: `default function Markdown({ text })` → renders headings (`#`/`##`/`###`), `-`/`*` bullet lists, `>` blockquotes, `**bold**`, and paragraphs, matching the prototype `renderFormattedText`.

- [ ] **Step 1: Write the failing test**

`src/components/Markdown.test.jsx`:
```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Markdown from './Markdown.jsx'

describe('Markdown', () => {
  it('renders an h1 for # lines', () => {
    render(<Markdown text="# Title" />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Title')
  })

  it('renders list items for - lines', () => {
    render(<Markdown text={'- one\n- two'} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('renders bold text', () => {
    const { container } = render(<Markdown text="hello **world**" />)
    expect(container.querySelector('strong')).toHaveTextContent('world')
  })
})
```

Install test deps in this step:
Run: `npm install -D @testing-library/react @testing-library/jest-dom jsdom`

Add a Vitest config so jsdom + jest-dom are active — create `vitest.config.js`:
```js
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', globals: true, setupFiles: './vitest.setup.js' },
})
```
And `vitest.setup.js`:
```js
import '@testing-library/jest-dom'
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Markdown.test.jsx`
Expected: FAIL — `./Markdown.jsx` not found.

- [ ] **Step 3: Write `src/components/Markdown.jsx`** (logic lifted verbatim from prototype `renderFormattedText`)

```jsx
export default function Markdown({ text }) {
  if (!text) return null
  const lines = text.split('\n')
  let inList = false
  let listItems = []
  const result = []

  const flushList = () => {
    if (inList && listItems.length > 0) {
      result.push(
        <ul key={`ul-${result.length}`} className="list-disc pl-6 mb-4 space-y-1 text-slate-700">{listItems}</ul>
      )
      listItems = []
      inList = false
    }
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true
      const formatted = trimmed.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      listItems.push(<li key={index} dangerouslySetInnerHTML={{ __html: formatted }} />)
    } else {
      flushList()
      if (trimmed.startsWith('# ')) {
        result.push(<h1 key={index} className="text-2xl sm:text-3xl font-extrabold mt-8 mb-4 text-slate-900 border-b pb-2">{trimmed.substring(2)}</h1>)
      } else if (trimmed.startsWith('## ')) {
        result.push(<h2 key={index} className="text-xl sm:text-2xl font-bold mt-6 mb-3 text-slate-800 tracking-tight">{trimmed.substring(3)}</h2>)
      } else if (trimmed.startsWith('### ')) {
        result.push(<h3 key={index} className="text-lg sm:text-xl font-bold mt-5 mb-2 text-slate-800">{trimmed.substring(4)}</h3>)
      } else if (trimmed.startsWith('> ')) {
        result.push(<blockquote key={index} className="border-l-4 border-indigo-400 pl-5 py-3 my-5 bg-indigo-50/50 text-indigo-900 italic rounded-r-xl text-[15px] shadow-sm">{trimmed.substring(2)}</blockquote>)
      } else if (trimmed === '') {
        result.push(<div key={index} className="h-3"></div>)
      } else {
        const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
        result.push(<p key={index} className="mb-2 leading-relaxed text-slate-700 text-[15px] sm:text-base" dangerouslySetInnerHTML={{ __html: formatted }} />)
      }
    }
  })
  flushList()
  return <>{result}</>
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/Markdown.test.jsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/Markdown.jsx src/components/Markdown.test.jsx vitest.config.js vitest.setup.js package.json package-lock.json
git commit -m "feat: extract Markdown renderer with tests"
```

---

### Task 6: View components (Concepts, Flashcards, Quiz, History, ChatBot)

**Files:**
- Create: `src/components/ConceptsView.jsx`, `src/components/FlashcardsView.jsx`, `src/components/QuizView.jsx`, `src/components/HistoryView.jsx`, `src/components/ChatBot.jsx`

**Interfaces:**
- Consumes: `Markdown` (Task 5), `chat` (Task 4).
- Produces:
  - `ConceptsView({ data, sourceText })`
  - `FlashcardsView({ data })`
  - `QuizView({ data })`
  - `HistoryView({ history, onRestore })`
  - `ChatBot({ sourceText, concepts })`

- [ ] **Step 1: Create `src/components/ConceptsView.jsx`**

Port the prototype `ConceptsView` verbatim, replacing the inline `renderFormattedText` with the `Markdown` component:
```jsx
import { useState } from 'react'
import Markdown from './Markdown.jsx'

export default function ConceptsView({ data, sourceText }) {
  const [isSourceOpen, setIsSourceOpen] = useState(false)
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group">
        <button onClick={() => setIsSourceOpen(!isSourceOpen)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isSourceOpen ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>
              <i className="fas fa-file-alt"></i>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-800 text-lg">Source Text</h3>
              <p className="text-sm text-slate-500">Expand to read the original formatted text</p>
            </div>
          </div>
          <i className={`fas fa-chevron-down text-slate-400 transition-transform duration-300 ${isSourceOpen ? 'rotate-180' : ''}`}></i>
        </button>
        <div className={`transition-all duration-500 ease-in-out origin-top ${isSourceOpen ? 'max-h-[1200px] opacity-100 border-t border-slate-100' : 'max-h-0 opacity-0 border-transparent'} overflow-hidden bg-slate-50/80`}>
          <div className="p-4 sm:p-6 overflow-y-auto max-h-[800px] custom-scrollbar">
            <div className="max-w-4xl mx-auto bg-white p-6 sm:p-10 rounded-xl border border-slate-200 shadow-sm font-sans">
              <Markdown text={sourceText} />
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xl">
            <i className="fas fa-book-open"></i>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Core Concepts</h2>
        </div>
        <div className="space-y-6">
          {data?.concepts?.map((concept, index) => (
            <div key={index} className="p-5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-indigo-50/30 transition-colors">
              <h3 className="font-bold text-lg text-slate-800 mb-2">{concept.title}</h3>
              <p className="text-slate-600 leading-relaxed">{concept.explanation}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/FlashcardsView.jsx`**

Port the prototype `FlashcardsView` verbatim with `import { useState } from 'react'` and `export default`. (Same JSX body as prototype.)

- [ ] **Step 3: Create `src/components/QuizView.jsx`**

Port the prototype `QuizView` verbatim with `import { useState } from 'react'` and `export default`. (Same JSX body as prototype.)

- [ ] **Step 4: Create `src/components/HistoryView.jsx`**

Port the prototype `HistoryView` verbatim with `export default`. No hooks needed. (Same JSX body as prototype.)

- [ ] **Step 5: Create `src/components/ChatBot.jsx`**

Port the prototype `ChatBot`, but replace the inline `fetch`/prompt block in `handleSend` with the `chat` lib:
```jsx
import { useState, useEffect, useRef } from 'react'
import { chat } from '../lib/api.js'

export default function ChatBot({ sourceText, concepts }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([{ role: 'ai', text: "Hi! I'm your tutor for this material. Ask me any follow-up questions!" }])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }
  useEffect(() => { scrollToBottom() }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return
    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }])
    setIsTyping(true)
    try {
      const aiText = await chat(sourceText, concepts, userMsg)
      setMessages((prev) => [...prev, { role: 'ai', text: aiText }])
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', text: 'Oops, something went wrong connecting to the AI.' }])
    } finally {
      setIsTyping(false)
    }
  }

  // ...remainder of JSX identical to prototype ChatBot return(...)
}
```
Copy the full `return (...)` JSX from the prototype `ChatBot` unchanged below `handleSend`.

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: build succeeds, all component imports resolve.

- [ ] **Step 7: Commit**

```bash
git add src/components/
git commit -m "feat: port view components and ChatBot to separate files"
```

---

### Task 7: Hooks + App assembly

**Files:**
- Create: `src/hooks/useAuth.js`, `src/hooks/useSession.js`
- Modify: `src/App.jsx` (replace placeholder)

**Interfaces:**
- Consumes: `auth` (firebase.js), `store.js` helpers, `api.generateGuide`, all view components.
- Produces:
  - `useAuth()` → `{ user, ready }` — signs in anonymously on mount.
  - `useSession(user)` → `{ history, loadSession, saveSession }` where `saveSession(status, sourceText, learningData, activeTab)` writes the session doc, and `loadSession()` returns the stored session or null.
  - `App` — full UI state machine identical in behavior to the prototype.

- [ ] **Step 1: Create `src/hooks/useAuth.js`**

```js
import { useEffect, useState } from 'react'
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase.js'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setReady(true)
    })
    signInAnonymously(auth).catch((e) => {
      console.error('Anonymous auth failed', e)
      setReady(true)
    })
    return () => unsub()
  }, [])

  return { user, ready }
}
```

- [ ] **Step 2: Create `src/hooks/useSession.js`**

```js
import { useEffect, useState } from 'react'
import { subscribeHistory, getSession, setSession } from '../lib/store.js'

export function useSession(user) {
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (!user) return
    const unsub = subscribeHistory(user, setHistory)
    return () => unsub()
  }, [user])

  const saveSession = async (status, sourceText, learningData, activeTab) => {
    if (!user) return
    try {
      await setSession(user, {
        status,
        sourceText: sourceText || '',
        activeTab,
        learningData: learningData || null,
        updatedAt: Date.now(),
      })
    } catch (e) {
      console.error('Failed to save session', e)
    }
  }

  const loadSession = async () => {
    if (!user) return null
    try {
      return await getSession(user)
    } catch (e) {
      console.error('Session load error', e)
      return null
    }
  }

  return { history, loadSession, saveSession }
}
```

- [ ] **Step 3: Replace `src/App.jsx`**

Assemble the prototype `App` behavior using the hooks. Key differences from prototype: drop `window.FB` polling, drop `__firebase_config`/`__initial_auth_token`, use `useAuth`/`useSession`, call `addHistory` + `generateGuide`:

```jsx
import { useEffect, useState } from 'react'
import { useAuth } from './hooks/useAuth.js'
import { useSession } from './hooks/useSession.js'
import { addHistory } from './lib/store.js'
import { generateGuide } from './lib/api.js'
import ConceptsView from './components/ConceptsView.jsx'
import FlashcardsView from './components/FlashcardsView.jsx'
import QuizView from './components/QuizView.jsx'
import HistoryView from './components/HistoryView.jsx'
import ChatBot from './components/ChatBot.jsx'

export default function App() {
  const { user, ready } = useAuth()
  const { history, loadSession, saveSession } = useSession(user)
  const [sourceText, setSourceText] = useState('')
  const [status, setStatus] = useState('input')
  const [learningData, setLearningData] = useState(null)
  const [activeTab, setActiveTab] = useState('concepts')
  const [errorMsg, setErrorMsg] = useState('')
  const [restored, setRestored] = useState(false)

  useEffect(() => {
    if (!user || restored) return
    loadSession().then((data) => {
      if (data) {
        if (data.status) setStatus(data.status)
        if (data.sourceText !== undefined) setSourceText(data.sourceText)
        if (data.learningData !== undefined) setLearningData(data.learningData)
        if (data.activeTab) setActiveTab(data.activeTab)
      }
      setRestored(true)
    })
  }, [user, restored, loadSession])

  const handleTabClick = (tab) => { setActiveTab(tab); saveSession(status, sourceText, learningData, tab) }
  const handleNewTextClick = () => {
    setSourceText(''); setLearningData(null); setStatus('input'); setActiveTab('concepts')
    saveSession('input', '', null, 'concepts')
  }
  const handleRestoreClick = (item) => {
    setSourceText(item.sourceText); setLearningData(item.learningData); setStatus('ready'); setActiveTab('concepts')
    saveSession('ready', item.sourceText, item.learningData, 'concepts')
  }
  const handleTextChange = (e) => {
    const text = e.target.value; setSourceText(text); saveSession(status, text, learningData, activeTab)
  }

  const handleAnalyze = async () => {
    if (!sourceText.trim()) return
    setStatus('loading'); setErrorMsg(''); saveSession('loading', sourceText, learningData, activeTab)
    try {
      const parsedData = await generateGuide(sourceText)
      if (user) {
        await addHistory(user, {
          timestamp: new Date().toLocaleString(),
          createdAt: Date.now(),
          sourceText,
          learningData: parsedData,
        })
      }
      setLearningData(parsedData); setActiveTab('concepts'); setStatus('ready')
      await saveSession('ready', sourceText, parsedData, 'concepts')
    } catch (error) {
      console.error('Error generating content:', error)
      setErrorMsg('Failed to process the text. Please try a shorter text or check the server.')
      setStatus('input')
      await saveSession('input', sourceText, learningData, activeTab)
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium animate-pulse">Loading your workspace...</p>
      </div>
    )
  }

  // Paste the prototype App's full return(...) JSX here unchanged, EXCEPT:
  //  - it already uses status/sourceText/learningData/activeTab/errorMsg/history
  //  - handlers are the ones defined above (same names)
  //  - <ChatBot sourceText={sourceText} concepts={learningData.concepts} /> stays
  return null // replaced by ported JSX
}
```

Then paste the prototype `App`'s `return (...)` markup (header + `main` with input/loading/ready branches, tabs, and `ChatBot`) in place of `return null`, keeping the same handler names. The class names and structure are unchanged from the prototype.

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Manual smoke test (documented, requires real keys)**

Run (two terminals): `npm run server` and `npm run dev`.
With valid `server/.env` (GEMINI_API_KEY) and `.env` (Firebase) set: paste text → Generate → guide renders; tabs switch; ChatBot answers; reload restores session; History lists the guide.
Expected: all behaviors match the prototype.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/ src/App.jsx
git commit -m "feat: add auth/session hooks and assemble App"
```

---

### Task 8: README + final verification

**Files:**
- Create: `README.md`

**Interfaces:**
- Produces: run instructions; documents the two-process dev setup and required env.

- [ ] **Step 1: Write `README.md`**

```markdown
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
```

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: all Vitest suites pass (server, api, Markdown).

- [ ] **Step 3: Final build check**

Run: `npm run build`
Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup and run instructions"
```
