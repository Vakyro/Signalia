import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
)

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

/** Lowercase, strip accents, remove punctuation, collapse whitespace */
function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[¿?¡!,.()/]/g, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function POST(req: NextRequest) {
  const { text } = await req.json()
  if (!text?.trim()) {
    return NextResponse.json({ error: 'No hay texto' }, { status: 400 })
  }

  // 1. Fetch all signs from Supabase
  const { data: signs, error: dbError } = await supabase
    .from('signs')
    .select('id, name, slug, video_url, category')
    .eq('language', 'lsm')

  if (dbError || !signs) {
    return NextResponse.json({ error: 'Error al obtener señas' }, { status: 500 })
  }

  // Build lookup keyed by BOTH normalized-name and normalized-slug (hyphens→spaces)
  const signLookup = new Map<string, (typeof signs)[0]>()
  for (const sign of signs) {
    signLookup.set(normalize(sign.name), sign)
    signLookup.set(normalize(sign.slug), sign)
  }

  // Build the list shown to the LLM (normalized, no duplicates)
  const availableKeys = [...new Set([...signLookup.keys()])].sort()
  const signsList = availableKeys.join(', ')

  // 2. Call Groq — same approach as the notebook
  const systemPrompt = `Eres un experto en Lengua de Señas Mexicana (LSM).
Tu tarea es convertir texto en español a una secuencia de señas LSM.

SEÑAS DISPONIBLES (usa estos valores EXACTOS en la glosa):
${signsList}

REGLAS:
1. Convierte la frase al orden gramatical de LSM (Sujeto-Objeto-Verbo)
2. Usa SOLO valores de la lista de señas disponibles
3. Omite artículos (el, la, los, las, un, una)
4. Omite preposiciones sin seña (de, en, con, a)
5. Prefiere señas compuestas cuando existen (ej: "como estas" en lugar de "como" + "estar")
6. Si una palabra no está, usa el sinónimo más cercano de la lista
7. Responde ÚNICAMENTE con JSON exactamente así:
{"glosa": ["sena1", "sena2"], "traduccion_literal": "SENA1 SENA2"}`

  let glosa: string[] = []
  let traduccion = ''

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      temperature: 0.1,
      max_tokens: 300,
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? ''
    const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    glosa = parsed.glosa ?? []
    traduccion = parsed.traduccion_literal ?? ''
  } catch (err) {
    return NextResponse.json({ error: 'Error al procesar con LLM', detail: String(err) }, { status: 500 })
  }

  // 3. Match each gloss item to a sign
  const results = glosa.map((sena) => {
    const normSena = normalize(sena)

    // Exact match first
    let sign = signLookup.get(normSena)

    // Partial match: sena contains key OR key contains sena
    if (!sign) {
      for (const [key, val] of signLookup) {
        if (normSena === key || normSena.includes(key) || key.includes(normSena)) {
          sign = val
          break
        }
      }
    }

    return {
      sena,
      name: sign?.name ?? sena,
      slug: sign?.slug ?? null,
      category: sign?.category ?? null,
      video_url: sign?.video_url ?? null,
      found: !!sign,
    }
  })

  return NextResponse.json({ glosa, traduccion, results })
}
