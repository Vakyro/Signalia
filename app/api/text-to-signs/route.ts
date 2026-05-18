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
  Convierte texto español a glosa LSM primitiva, como hablaría Yoda.

  SEÑAS DISPONIBLES (usa EXACTAMENTE estos valores):
  ${signsList}

  REGLAS ESTRICTAS:
  1. ORDEN LSM: Tiempo → Sujeto → Objeto → Verbo (como Yoda)
    - "Yo me llamo Leonardo" → yo + [deletreo] + nombre
    - "¿Cómo estás?" → como estas (es una sola seña compuesta, úsala)

  2. VERBOS: siempre en infinitivo, nunca conjugados
    - "me llamo" → yo + nombre (o deletreo)
    - "estás" → estar
    - "tengo" → yo + tener (si existe)

  3. ARTÍCULOS Y PREPOSICIONES: omitir completamente
    - "el perro de mi casa" → perro casa yo

  4. NOMBRES PROPIOS: deletrear letra por letra usando solo las letras del alfabeto disponibles
    - "Leonardo" → l + e + o + n + a + r + d + o
    - "María" → m + a + r + i + a
    - IMPORTANTE: cada letra es una seña separada en la glosa

  5. SEÑAS COMPUESTAS: prioriza frases completas sobre palabras sueltas
    - Usa "como estas" en vez de "como" + "estar"
    - Usa "como te llamas" en vez de "como" + "nombre"
    - Usa "buenas noches" en vez de "buenas" + "noches"
    - Usa "tu nombre" en vez de "tu" + "nombre"

  6. PALABRAS SIN SEÑA: usa el sinónimo más cercano disponible
    - Si no existe, omítela

  7. RESPONDE SOLO con este JSON, sin explicaciones:
  {"glosa": ["sena1", "sena2"], "traduccion_literal": "SENA1 SENA2"}

  EJEMPLOS:
  Input: "Hola me llamo Leonardo"
  Output: {"glosa": ["hola", "yo", "l", "e", "o", "n", "a", "r", "d", "o"], "traduccion_literal": "HOLA YO L-E-O-N-A-R-D-O"}

  Input: "¿Cómo estás tú?"
  Output: {"glosa": ["como estas", "tu"], "traduccion_literal": "COMO-ESTAR TU"}

  Input: "Buenas noches, ¿cómo te llamas?"
  Output: {"glosa": ["buenas noches", "como te llamas"], "traduccion_literal": "BUENAS-NOCHES COMO-TE-LLAMAS"}`

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

  // 3. Match cada glosa a una seña
  const results = glosa.map((sena) => {
    const normSena = normalize(sena)

    // Exacto
    let sign = signLookup.get(normSena)

    // Parcial solo si es frase compuesta (más de 1 palabra)
    // Evita que "tu" matchee "cuanto" o "tu nombre"
    if (!sign) {
      const words = normSena.split(' ')
      if (words.length > 1) {
        // Buscar la seña compuesta más larga que coincida
        let bestMatch: (typeof signs)[0] | undefined
        let bestLength = 0
        for (const [key, val] of signLookup) {
          if (key.includes(normSena) || normSena.includes(key)) {
            if (key.length > bestLength) {
              bestMatch = val
              bestLength = key.length
            }
          }
        }
        sign = bestMatch
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
