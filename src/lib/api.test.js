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
