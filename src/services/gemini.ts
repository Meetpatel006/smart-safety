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
  console.log('Gemini: Starting recommendation fetch...')

  // If not configured, return a small local fallback
  if (!GEMINI_API_URL || !GEMINI_API_KEY) {
    console.warn('Gemini: API not configured, using fallback recommendations')
    return [
      { text: "Avoid carrying valuables openly in crowded areas." },
      { text: "Stay with your group after dark." },
      { text: "Keep emergency contacts pinned." },
    ]
  }

  console.log('Gemini: API configured, preparing request...')

  // Build chat-completions style payload compatible with Google Generative Language endpoint
  const messages = [
    { role: 'system', content: 'You are a concise safety assistant. Always respond with valid JSON only. Never use markdown formatting, code blocks, or additional text. Return only the JSON array.' },
    { role: 'user', content: context },
  ]

  const payload = {
    model: GEMINI_MODEL || 'gemini-2.0-flash',
    messages,
    temperature: 0.2,
    max_tokens: 512,
  }

  console.log('Gemini: Sending request to API...')

  const req = fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GEMINI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  })

  try {
    console.log('Gemini: Waiting for API response...')
    const resp = await timeoutPromise(req, DEFAULT_TIMEOUT)

    if (!resp.ok) {
      // Try to parse body for debug
      let text = ''
      try { text = await resp.text() } catch {}
      console.error('Gemini: API error response:', resp.status, resp.statusText, text)
      throw new Error(`Gemini API error: ${resp.status} ${resp.statusText} ${text}`)
    }

    console.log('Gemini: API response received, parsing...')
    const data = await (resp as Response).json()
    console.log('Gemini: Raw API response:', data)

    // Preferred: Google/OLM returns choices[0].message.content
    try {
      if (data.choices && Array.isArray(data.choices) && data.choices.length > 0) {
        const msg = data.choices[0].message || data.choices[0]
        const content = msg.content ?? msg.text ?? ''
        const text = typeof content === 'string' ? content : (content?.[0]?.text ?? '')
        console.log('Gemini: Extracted content:', text)

        // Try parse JSON from content
        try {
          let jsonText = text
          
          // Handle markdown code blocks
          if (text.includes('```json')) {
            console.log('Gemini: Detected markdown code block, extracting JSON...')
            const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
            if (jsonMatch) {
              jsonText = jsonMatch[1].trim()
              console.log('Gemini: Extracted JSON from code block:', jsonText)
            }
          } else if (text.includes('```')) {
            console.log('Gemini: Detected generic code block, extracting content...')
            const codeMatch = text.match(/```\s*([\s\S]*?)\s*```/)
            if (codeMatch) {
              jsonText = codeMatch[1].trim()
              console.log('Gemini: Extracted content from code block:', jsonText)
            }
          }
          
          const parsed = JSON.parse(jsonText)
          if (Array.isArray(parsed)) {
            console.log('Gemini: Successfully parsed recommendations:', parsed.slice(0, limit))
            return parsed.slice(0, limit)
          }
        } catch (parseError) {
          console.warn('Gemini: JSON parsing failed:', parseError)
          console.log('Gemini: Raw text that failed to parse:', text)
          
          // fallback: try to extract JSON substring
          const jsonMatch = String(text).match(/\[\s*\{[\s\S]*\}\s*\]/)
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0])
              if (Array.isArray(parsed)) {
                console.log('Gemini: Successfully parsed recommendations via regex:', parsed.slice(0, limit))
                return parsed.slice(0, limit)
              }
            } catch { /* ignore */ }
          }
          console.warn('Gemini: Regex extraction failed, falling back to line splitting...')
          // fallback: split lines
          const recommendations = String(text).split('\n').filter(Boolean).slice(0, limit).map((t: string) => ({ text: t.trim() }))
          console.log('Gemini: Fallback recommendations:', recommendations)
          return recommendations
        }
      }
    } catch (e) {
      console.error('Gemini: Error processing response:', e)
      // fall through to static fallback below
    }

    console.warn('Gemini: All parsing methods failed, using static fallback')
    // As a last resort, return a safe, static fallback
    return [
      { text: "Avoid carrying valuables openly in crowded areas." },
      { text: "Stay with your group after dark." },
      { text: "Keep emergency contacts pinned." },
    ]
  } catch (err) {
    console.error('Gemini: Request failed:', err)
    // Return contextual fallbacks based on the request context
    if (context.includes('weather') || context.includes('temperature')) {
      return [
        { text: "Stay hydrated and monitor weather conditions." },
        { text: "Be prepared for sudden weather changes." },
        { text: "Keep emergency supplies handy." },
      ]
    } else if (context.includes('location') || context.includes('area')) {
      return [
        { text: "Stay aware of your surroundings." },
        { text: "Keep valuables secure and out of sight." },
        { text: "Travel with companions when possible." },
      ]
    } else {
      return [
        { text: "Stay aware of your surroundings." },
        { text: "Keep emergency contacts accessible." },
        { text: "Trust your instincts and avoid risky situations." },
      ]
    }
  }
}

export default { fetchGeminiRecommendations }
