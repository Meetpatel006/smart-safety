import { GEMINI_API_URL, GEMINI_API_KEY } from "../config";

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

  const payload = {
    // This is a lightweight, generic payload. Adapt to your LLM provider's required shape.
    prompt: `You are a safety assistant. Given the context:\n${context}\nProvide ${limit} concise, prioritized safety recommendations as a JSON array of objects with 'text' and optional 'confidence' fields.`,
    max_tokens: 512,
    temperature: 0.2,
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

    // Attempt to normalize various possible shapes
    if (Array.isArray(data)) {
      return data.slice(0, limit).map((d: any) => ({ text: String(d.text ?? d) }))
    }

    // Some APIs return { choices: [{ text }] }
    if (data.choices && Array.isArray(data.choices)) {
      const combined = data.choices.map((c: any) => c.text).join('\n')
      // Try parse JSON out of combined
      try {
        const parsed = JSON.parse(combined)
        if (Array.isArray(parsed)) return parsed.slice(0, limit)
      } catch {
        // fallback - split by lines
        return combined.split('\n').filter(Boolean).slice(0, limit).map((t: string) => ({ text: t.trim() }))
      }
    }

    // If model returned a text field
    if (typeof data.text === 'string') {
      try {
        const parsed = JSON.parse(data.text)
        if (Array.isArray(parsed)) return parsed.slice(0, limit)
      } catch {
        return data.text.split('\n').filter(Boolean).slice(0, limit).map((t: string) => ({ text: t.trim() }))
      }
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
