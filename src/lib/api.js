/**
 * Extract the first balanced JSON object from text that may be wrapped in
 * markdown fences, surrounded by prose, or otherwise messy — as LLM output
 * often is despite instructions.
 */
function extractJsonObject(text) {
  // 1. Strip markdown code fences (```json … ``` or ``` … ```).
  let cleaned = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()

  // 2. Find the first '{' and extract the balanced object.
  const start = cleaned.indexOf('{')
  if (start === -1) throw new Error('No JSON object found in AI response')

  let depth = 0
  let end = -1
  for (let i = start; i < cleaned.length; i++) {
    if (cleaned[i] === '{') depth++
    else if (cleaned[i] === '}') depth--
    if (depth === 0) { end = i; break }
  }
  if (end === -1) throw new Error('Incomplete JSON object in AI response')

  return cleaned.slice(start, end + 1)
}

/**
 * Validate the shape returned by Gemini and fill in safe defaults for any
 * missing or malformed section so downstream components never crash.
 */
function sanitizeGuide(data) {
  const isArr = (v) => Array.isArray(v)
  return {
    concepts: isArr(data.concepts) ? data.concepts : [],
    flashcards: isArr(data.flashcards) ? data.flashcards : [],
    quiz: isArr(data.quiz) ? data.quiz : [],
  }
}

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

  try {
    const raw = extractJsonObject(jsonText)
    return sanitizeGuide(JSON.parse(raw))
  } catch (e) {
    throw new Error(
      `AI returned an invalid response: ${e.message}. Please try again.`
    )
  }
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
