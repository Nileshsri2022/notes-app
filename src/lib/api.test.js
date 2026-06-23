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

  it('strips bare ``` fences (no language tag)', async () => {
    fetch.mockResolvedValueOnce(ok({ text: '```\n{"concepts":[{"title":"X","explanation":"y"}],"flashcards":[],"quiz":[]}\n```' }))
    const data = await generateGuide('src')
    expect(data.concepts[0].title).toBe('X')
  })

  it('extracts JSON when prose surrounds it', async () => {
    fetch.mockResolvedValueOnce(ok({ text: 'Here is your study guide:\n{"concepts":[],"flashcards":[],"quiz":[]}\nHope this helps!' }))
    const data = await generateGuide('src')
    expect(data.concepts).toEqual([])
  })

  it('throws when response not ok', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
    await expect(generateGuide('src')).rejects.toThrow('Failed to generate study guide')
  })

  it('throws a clear error for malformed JSON', async () => {
    fetch.mockResolvedValueOnce(ok({ text: '{"concepts":[' }))
    await expect(generateGuide('src')).rejects.toThrow('invalid response')
  })

  it('throws a clear error when no JSON object found', async () => {
    fetch.mockResolvedValueOnce(ok({ text: 'Sorry, I cannot help with that.' }))
    await expect(generateGuide('src')).rejects.toThrow('No JSON object found')
  })

  it('fills empty arrays for missing sections', async () => {
    fetch.mockResolvedValueOnce(ok({ text: '{"concepts":[{"title":"A","explanation":"b"}]}' }))
    const data = await generateGuide('src')
    expect(data.concepts).toHaveLength(1)
    expect(data.flashcards).toEqual([])
    expect(data.quiz).toEqual([])
  })
})

describe('chat', () => {
  it('returns answer text', async () => {
    fetch.mockResolvedValueOnce(ok({ text: 'hi there' }))
    const answer = await chat('s', [], 'q')
    expect(answer).toBe('hi there')
  })
})
