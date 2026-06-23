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
