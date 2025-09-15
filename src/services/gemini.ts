import { GEMINI_API_URL, GEMINI_API_KEY, GEMINI_MODEL } from "../config";

export type GeminiRecommendation = {
  text: string;
  confidence?: number; // 0-1
}

const DEFAULT_TIMEOUT = 8000;

async function timeoutPromise<T>(p: Promise<T>, ms: number) {
  let id: NodeJS.Timeout
  const timeout = new Promise<never>((_, rej) => {
    id = setTimeout(() => rej(new Error('timeout')), ms)
  })
  const res = await Promise.race([p, timeout])
  clearTimeout(id!)
  return res as T
}

export async function fetchGeminiRecommendations(context: string, limit = 5): Promise<GeminiRecommendation[]> {
  // If not configured, return a small local fallback
  if (!GEMINI_API_URL || !GEMINI_API_KEY) {
    return [
      { text: "Avoid carrying valuables openly in crowded areas." },
      { text: "Stay with your group after dark." },
      { text: "Keep emergency contacts pinned." },
    ]
  }

  // Build chat-completions style payload compatible with Google Generative Language endpoint
  const messages = [
    { role: 'system', content: 'You are a concise safety assistant. Respond with a JSON array of recommendations when asked.' },
    { role: 'user', content: context },
  ]

  const payload = {
    model: GEMINI_MODEL || 'gemini-2.0-flash',
    messages,
    temperature: 0.2,
    max_tokens: 512,
  }

  const req = fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GEMINI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  })

  try {
    const resp = await timeoutPromise(req, DEFAULT_TIMEOUT)
    if (!resp.ok) {
      // Try to parse body for debug
      let text = ''
      try { text = await resp.text() } catch {}
      throw new Error(`Gemini API error: ${resp.status} ${resp.statusText} ${text}`)
    }
    const data = await (resp as Response).json()

    // Preferred: Google/OLM returns choices[0].message.content
    try {
      if (data.choices && Array.isArray(data.choices) && data.choices.length > 0) {
        const msg = data.choices[0].message || data.choices[0]
        const content = msg.content ?? msg.text ?? ''
        const text = typeof content === 'string' ? content : (content?.[0]?.text ?? '')
        // Try parse JSON from content
        try {
          const parsed = JSON.parse(text)
          if (Array.isArray(parsed)) return parsed.slice(0, limit)
        } catch {
          // fallback: try to extract JSON substring
          const jsonMatch = String(text).match(/\[\s*\{[\s\S]*\}\s*\]/)
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0])
              if (Array.isArray(parsed)) return parsed.slice(0, limit)
            } catch { /* ignore */ }
          }
          // fallback: split lines
          return String(text).split('\n').filter(Boolean).slice(0, limit).map((t: string) => ({ text: t.trim() }))
        }
      }
    } catch (e) {
      // fall through to static fallback below
    }

    // As a last resort, return a safe, static fallback
    return [
      { text: "Avoid carrying valuables openly in crowded areas." },
      { text: "Stay with your group after dark." },
      { text: "Keep emergency contacts pinned." },
    ]
  } catch (err) {
    console.warn('Gemini request failed:', err)
    return [
      { text: "Avoid carrying valuables openly in crowded areas." },
      { text: "Stay with your group after dark." },
    ]
  }
}

export default { fetchGeminiRecommendations }
