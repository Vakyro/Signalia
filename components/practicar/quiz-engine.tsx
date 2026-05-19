'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { CATEGORIES, type Category } from '@/lib/sign-data'
import { supabase } from '@/lib/supabase'
import { QuizQuestion, type QuizSign, type Question } from './quiz-question'
import { QuizResult } from './quiz-result'

interface Answer {
  question: Question
  userAnswer: string
  isCorrect: boolean
}

type Difficulty = 'facil' | 'intermedio' | 'dificil'

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { questions: number; type: 'multiple-choice' | 'text-input'; label: string }
> = {
  facil: { questions: 5, type: 'multiple-choice', label: 'Fácil' },
  intermedio: { questions: 10, type: 'multiple-choice', label: 'Intermedio' },
  dificil: { questions: 15, type: 'text-input', label: 'Difícil' },
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateOptions(correctName: string, categorySigns: QuizSign[], allSigns: QuizSign[]): string[] {
  const pool = categorySigns.filter((s) => s.name !== correctName)
  const fallback = allSigns.filter((s) => s.name !== correctName)
  const wrongPool = shuffle(pool.length >= 3 ? pool : fallback)
  const wrong = wrongPool.slice(0, 3).map((s) => s.name)
  return shuffle([correctName, ...wrong])
}

interface QuizEngineProps {
  category: Category
  difficulty: Difficulty
}

const VALID_DIFFICULTIES: Difficulty[] = ['facil', 'intermedio', 'dificil']

export function QuizEngine({ category, difficulty }: QuizEngineProps) {
  const router = useRouter()
  const config = DIFFICULTY_CONFIG[difficulty]
  const categoryData = CATEGORIES.find((c) => c.id === category)

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const buildQuestions = useCallback(
    (videoMap: Map<string, string | null>, slugMap: Map<string, string>) => {
      if (!categoryData) return []

      const allSigns: QuizSign[] = CATEGORIES.flatMap((cat) =>
        cat.signs.map((name) => ({
          name,
          slug: slugMap.get(name) ?? name.toLowerCase().replace(/[^a-z0-9áéíóúüñ]+/gi, '-'),
          video_url: videoMap.get(name) ?? null,
          category: cat.id,
        })),
      )

      const categorySigns: QuizSign[] = categoryData.signs.map((name) => ({
        name,
        slug: slugMap.get(name) ?? name.toLowerCase().replace(/[^a-z0-9áéíóúüñ]+/gi, '-'),
        video_url: videoMap.get(name) ?? null,
        category: categoryData.id,
      }))

      const numQuestions = Math.min(config.questions, categorySigns.length)
      const selected = shuffle(categorySigns).slice(0, numQuestions)

      return selected.map((sign) => ({
        sign,
        correctAnswer: sign.name,
        options:
          config.type === 'multiple-choice' ? generateOptions(sign.name, categorySigns, allSigns) : [],
      }))
    },
    [categoryData, config],
  )

  useEffect(() => {
    if (!VALID_DIFFICULTIES.includes(difficulty) || !categoryData) {
      router.replace('/practicar')
      return
    }

    async function loadSigns() {
      setLoading(true)
      setError(false)

      const { data: supabaseSigns } = await supabase
        .from('signs')
        .select('name, slug, video_url')
        .eq('language', 'lsm')

      type SupabaseSign = { name: string; slug: string; video_url: string | null }
      const rows = (supabaseSigns ?? []) as SupabaseSign[]
      const videoMap = new Map(rows.map((s) => [s.name, s.video_url]))
      const slugMap = new Map(rows.map((s) => [s.name, s.slug]))

      const generated = buildQuestions(videoMap, slugMap)

      if (generated.length === 0) {
        setError(true)
        setLoading(false)
        return
      }

      setQuestions(generated)
      setCurrentIndex(0)
      setAnswers([])
      setLoading(false)
    }

    loadSigns()
  }, [category, difficulty, categoryData, buildQuestions, router])

  function handleAnswer(userAnswer: string) {
    const question = questions[currentIndex]
    const isCorrect =
      userAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()
    setAnswers((prev) => [...prev, { question, userAnswer, isCorrect }])
    setCurrentIndex((prev) => prev + 1)
  }

  function handleRetry() {
    setAnswers([])
    setCurrentIndex(0)
    setQuestions((prev) => shuffle([...prev]))
  }

  if (loading) {
    return (
      <div className="px-4 md:px-6 py-6 max-w-lg mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-palette-1 rounded-xl w-1/4" />
          <div className="h-2 bg-palette-1 rounded-full" />
          <div className="h-4 bg-palette-1 rounded-xl w-1/3 mx-auto" />
          <div className="w-[220px] aspect-[9/16] bg-palette-1 rounded-2xl mx-auto" />
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-palette-1 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 md:px-6 py-6 max-w-lg mx-auto text-center">
        <p className="text-muted-foreground mb-4">No se encontraron señas para esta categoría.</p>
        <button
          onClick={() => router.push('/practicar')}
          className="px-6 py-3 bg-palette-2 text-foreground rounded-2xl font-medium
            hover:bg-palette-4 active:scale-[0.98] transition-all duration-200"
        >
          Volver a categorías
        </button>
      </div>
    )
  }

  if (currentIndex >= questions.length && questions.length > 0) {
    return (
      <QuizResult
        answers={answers}
        category={category}
        difficulty={difficulty}
        onRetry={handleRetry}
        onBack={() => router.push('/practicar')}
      />
    )
  }

  const currentQuestion = questions[currentIndex]
  const progress = (currentIndex / questions.length) * 100

  return (
    <div className="px-4 md:px-6 py-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4 animate-fade-in-up">
        <button
          onClick={() => router.push('/practicar')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Salir</span>
        </button>
        <span className="text-sm text-muted-foreground font-medium">
          {currentIndex + 1} de {questions.length}
        </span>
      </div>

      <div className="w-full h-2 bg-palette-1 rounded-full mb-6 overflow-hidden animate-fade-in-up">
        <div
          className="h-full bg-palette-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-center mb-4 animate-fade-in-up">
        <span className="px-3 py-1 bg-palette-1 rounded-full text-xs text-muted-foreground border border-border">
          {categoryData?.name} · {config.label}
        </span>
      </div>

      <QuizQuestion
        key={currentIndex}
        question={currentQuestion}
        type={config.type}
        onAnswer={handleAnswer}
      />
    </div>
  )
}
