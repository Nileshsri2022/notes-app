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
