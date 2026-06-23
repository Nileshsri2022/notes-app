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
  }, 15000) // all-fail path waits out intentional 3-retry backoff (~6s)
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
