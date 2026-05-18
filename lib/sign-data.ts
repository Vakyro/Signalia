export const ALPHABET = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
]

export const WORDS = [
  'Hola', 'Adiós', 'Buenos Días', 'Buenas Tardes', 'Buenas Noches', 'Bienvenido',
  'Gracias', 'De nada', 'Por favor', 'Disculpa', 'Perdón',
  'Sí', 'No', 'Bien', 'Mal', 'Verdad',
  '¿Cómo?', '¿Cuál?', '¿Cuándo?', '¿Cuántos?', '¿Dónde?', '¿Por qué?', '¿Quién?',
  'Duda', 'Yo', 'Tú', 'Él/Ella', 'Nosotros',
  'Ahora', 'Ayer', 'Hoy', 'Siempre', 'Nunca',
  'Escuela', 'Otro', 'Policía', 'Siempre (2)', 'Verdad (2)',
]

export const PHRASES = [
  '¿Cómo estás?', '¿Cómo te llamas?', '¿Tu nombre?',
  '¿Cuánto vale?', 'Que milagro', 'Gusto conocerte',
]

export const FAMILY = [
  'Familia', 'Mamá', 'Papá', 'Abuela', 'Abuelo', 'Hermano', 'Hijo',
]

export const ACTIONS = [
  'Estar', 'Amar', 'Correr', 'Entender', 'Enseñar', 'Explicar', 'Felicitar',
  'Firmar', 'Fracasar', 'Encontrar', 'Elegir', 'Enfermar', 'Odio',
]

export const OBJECTS = [
  'Audífonos', 'Bicicleta', 'Camión', 'Camisa', 'Cámara', 'Carro',
  'Computadora', 'Cuaderno', 'Gorra', 'Moto', 'Pantalones',
  'Teléfono', 'Traje', 'Vestido', 'Zapatos',
]

export type Category = 'alfabeto' | 'palabras' | 'frases' | 'familia' | 'acciones' | 'objetos'

export const CATEGORIES: { id: Category; name: string; emoji: string; signs: string[] }[] = [
  { id: 'alfabeto', name: 'Alfabeto', emoji: '🤟', signs: ALPHABET },
  { id: 'palabras', name: 'Palabras', emoji: '💬', signs: WORDS },
  { id: 'frases', name: 'Frases', emoji: '🗣️', signs: PHRASES },
  { id: 'familia', name: 'Familia', emoji: '👨‍👩‍👧‍👦', signs: FAMILY },
  { id: 'acciones', name: 'Acciones', emoji: '✨', signs: ACTIONS },
  { id: 'objetos', name: 'Objetos', emoji: '📦', signs: OBJECTS },
]

const EMOJI_MAP: Record<string, string> = {
  'Hola': '👋', 'Adiós': '👋', 'Buenos Días': '🌅', 'Buenas Tardes': '🌇',
  'Buenas Noches': '🌙', 'Bienvenido': '🙌', 'Gracias': '🙏', 'De nada': '😊',
  'Por favor': '🙏', 'Disculpa': '😅', 'Perdón': '😔',
  'Sí': '✅', 'No': '❌', 'Bien': '👍', 'Mal': '👎', 'Verdad': '💯',
  '¿Cómo?': '❓', '¿Cuál?': '❓', '¿Cuándo?': '🕐', '¿Cuántos?': '🔢',
  '¿Dónde?': '📍', '¿Por qué?': '🤔', '¿Quién?': '👤',
  'Duda': '🤷', 'Yo': '👆', 'Tú': '👉', 'Él/Ella': '👈', 'Nosotros': '🤝',
  'Ahora': '⚡', 'Ayer': '⏮️', 'Hoy': '📅', 'Siempre': '♾️', 'Nunca': '🚫',
  'Escuela': '🏫', 'Otro': '🔄', 'Policía': '👮', 'Siempre (2)': '♾️', 'Verdad (2)': '💯',
  '¿Cómo estás?': '😊', '¿Cómo te llamas?': '🏷️', '¿Tu nombre?': '📛',
  '¿Cuánto vale?': '💰', 'Que milagro': '✨', 'Gusto conocerte': '🤝',
  'Familia': '👨‍👩‍👧‍👦', 'Mamá': '👩', 'Papá': '👨', 'Abuela': '👵',
  'Abuelo': '👴', 'Hermano': '🧑', 'Hijo': '👦',
  'Estar': '🧍', 'Amar': '❤️', 'Correr': '🏃', 'Entender': '💡',
  'Enseñar': '📚', 'Explicar': '🗣️', 'Felicitar': '🎉', 'Firmar': '✍️',
  'Fracasar': '😞', 'Encontrar': '🔍', 'Elegir': '☝️', 'Enfermar': '🤒', 'Odio': '😤',
  'Audífonos': '🎧', 'Bicicleta': '🚲', 'Camión': '🚌', 'Camisa': '👕',
  'Cámara': '📷', 'Carro': '🚗', 'Computadora': '💻', 'Cuaderno': '📓',
  'Gorra': '🧢', 'Moto': '🏍️', 'Pantalones': '👖', 'Teléfono': '📱',
  'Traje': '👔', 'Vestido': '👗', 'Zapatos': '👟',
}

export function getSignDescription(sign: string): string {
  return `Seña para "${sign}" en Lengua de Señas Mexicana (LSM).`
}

export function getSignEmoji(sign: string, category: Category): string {
  if (category === 'alfabeto') return sign
  return EMOJI_MAP[sign] || '📝'
}

export function getCategoryBySign(sign: string): Category | null {
  if (ALPHABET.includes(sign)) return 'alfabeto'
  if (WORDS.includes(sign)) return 'palabras'
  if (PHRASES.includes(sign)) return 'frases'
  if (FAMILY.includes(sign)) return 'familia'
  if (ACTIONS.includes(sign)) return 'acciones'
  if (OBJECTS.includes(sign)) return 'objetos'
  return null
}
