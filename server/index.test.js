import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

// Mock global fetch (native) instead of node-fetch.
const originalFetch = globalThis.fetch
beforeEach(() => {
  vi.resetModules()
  globalThis.fetch = vi.fn()
  process.env.GEMINI_API_KEY = 'test-key'
})
afterEach(() => {
  globalThis.fetch = originalFetch
})

let createApp
beforeEach(async () => {
  createApp = (await import('./index.js')).createApp
})

function geminiOk(text) {
  return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }) }
}

describe('POST /api/generate', () => {
  it('returns model text on success', async () => {
    globalThis.fetch.mockResolvedValueOnce(geminiOk('{"concepts":[]}'))
    const res = await request(createApp()).post('/api/generate').send({ text: 'hello' })
    expect(res.status).toBe(200)
    expect(res.body.text).toBe('{"concepts":[]}')
  })

  it('400s when text is missing', async () => {
    const res = await request(createApp()).post('/api/generate').send({})
    expect(res.status).toBe(400)
  })

  it('400s when text exceeds max length', async () => {
    const res = await request(createApp())
      .post('/api/generate')
      .send({ text: 'x'.repeat(20001) })
    expect(res.status).toBe(400)
  })

  it('500s when Gemini keeps failing', async () => {
    globalThis.fetch.mockResolvedValue({ ok: false, status: 500 })
    const res = await request(createApp()).post('/api/generate').send({ text: 'hello' })
    expect(res.status).toBe(500)
  }, 15000) // all-fail path waits out intentional 3-retry backoff (~6s)
})

describe('POST /api/chat', () => {
  it('returns answer text', async () => {
    globalThis.fetch.mockResolvedValueOnce(geminiOk('the answer'))
    const res = await request(createApp())
      .post('/api/chat')
      .send({ sourceText: 's', concepts: [], question: 'q' })
    expect(res.body.text).toBe('the answer')
  })

  it('400s when question is missing', async () => {
    const res = await request(createApp())
      .post('/api/chat')
      .send({ sourceText: 's', concepts: [] })
    expect(res.status).toBe(400)
  })
})
