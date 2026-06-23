import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '.env') })

import express from 'express'
import rateLimit from 'express-rate-limit'

const MODEL = 'gemini-2.5-flash:generateContent'
const REQUEST_TIMEOUT_MS = 20000
const MAX_INPUT_CHARS = 20000

// API key travels in the header (not the URL query string, which leaks
// into request logs on proxies/serverless platforms).
const endpoint = () =>
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'x-goog-api-key': process.env.GEMINI_API_KEY,
})

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

// Retry only on transient errors (429 rate-limit, 5xx server). A 400/401/403/404
// is a configuration/request problem — retrying just burns the backoff.
const isRetryable = (status) => status === 429 || status >= 500

export async function callGemini(prompt) {
  let attempt = 0
  let response
  while (attempt < 3) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    try {
      response = await fetch(endpoint(), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timer)
    }
    if (response.ok || !isRetryable(response.status)) break
    attempt++
    // Exponential backoff with jitter: 1s, 2s base, +/- up to 500ms.
    const base = 1000 * attempt
    await delay(base + Math.floor(Math.random() * 500))
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

// Basic per-IP rate limit to cap billable Gemini abuse on the public endpoint.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
})

export function createApp() {
  const app = express()
  app.use(express.json({ limit: '1mb' }))

  app.post('/api/generate', apiLimiter, async (req, res) => {
    const text = req.body?.text
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text is required.' })
    }
    if (text.length > MAX_INPUT_CHARS) {
      return res.status(400).json({ error: `Text exceeds ${MAX_INPUT_CHARS} characters.` })
    }
    try {
      const result = await callGemini(generatePrompt(text))
      res.json({ text: result })
    } catch (e) {
      console.error('generate error:', e.message)
      res.status(500).json({ error: 'Failed to generate study guide.' })
    }
  })

  app.post('/api/chat', apiLimiter, async (req, res) => {
    const { sourceText, concepts, question } = req.body || {}
    if (typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'Question is required.' })
    }
    try {
      const result = await callGemini(chatPrompt(sourceText || '', concepts || [], question))
      res.json({ text: result })
    } catch (e) {
      console.error('chat error:', e.message)
      res.status(500).json({ error: 'Failed to get a response.' })
    }
  })

  return app
}

const isMain = process.argv[1] && process.argv[1].endsWith('server/index.js')
if (isMain) {
  createApp().listen(3001, () => console.log('Proxy on http://localhost:3001'))
}
