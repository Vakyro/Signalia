'use client'

import { RotateCcw, Home } from 'lucide-react'
import { CATEGORIES, type Category } from '@/lib/sign-data'
import { type Question } from './quiz-question'

interface Answer {
  question: Question
  userAnswer: string
  isCorrect: boolean
}

type Difficulty = 'facil' | 'intermedio' | 'dificil'

interface QuizResultProps {
  answers: Answer[]
  category: Category
  difficulty: Difficulty
  onRetry: () => void
  onBack: () => void
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  facil: 'Fácil',
  intermedio: 'Intermedio',
  dificil: 'Difícil',
}

export function QuizResult({ answers, category, difficulty, onRetry, onBack }: QuizResultProps) {
  const correct = answers.filter((a) => a.isCorrect).length
  const total = answers.length
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0
  const categoryData = CATEGORIES.find((c) => c.id === category)!

  const scoreEmoji = percentage >= 80 ? '🎉' : percentage >= 50 ? '⭐' : '💪'
  const scoreMessage =
    percentage >= 80 ? '¡Excelente trabajo!' : percentage >= 50 ? '¡Buen progreso!' : '¡Sigue practicando!'

  const wrongAnswers = answers.filter((a) => !a.isCorrect)

  return (
    <div className="px-4 md:px-6 py-6 max-w-lg mx-auto animate-fade-in-up">
      <div className="bg-palette-2 rounded-3xl p-8 mb-6 text-center border border-border">
        <span className="text-6xl block mb-4">{scoreEmoji}</span>
        <h2 className="text-2xl font-bold text-foreground mb-1">{scoreMessage}</h2>
        <p className="text-muted-foreground text-sm mb-6">
          {categoryData.name} · {DIFFICULTY_LABELS[difficulty]}
        </p>

        <div className="text-6xl font-bold text-foreground mb-1">{percentage}%</div>
        <p className="text-muted-foreground text-sm">de aciertos</p>

        <div className="w-full h-2 bg-background/30 rounded-full mt-4 overflow-hidden">
          <div
            className="h-full bg-foreground/80 rounded-full transition-all duration-700"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-palette-1 rounded-2xl p-4 text-center border border-border">
          <p className="text-2xl font-bold text-foreground">{total}</p>
          <p className="text-xs text-muted-foreground mt-1">Preguntas</p>
        </div>
        <div className="bg-palette-3 rounded-2xl p-4 text-center border border-border">
          <p className="text-2xl font-bold text-foreground">{correct}</p>
          <p className="text-xs text-muted-foreground mt-1">Correctas</p>
        </div>
        <div className="bg-palette-7 rounded-2xl p-4 text-center border border-border">
          <p className="text-2xl font-bold text-foreground">{total - correct}</p>
          <p className="text-xs text-muted-foreground mt-1">Incorrectas</p>
        </div>
      </div>

      {wrongAnswers.length > 0 && (
        <div className="bg-palette-1 rounded-2xl p-4 mb-6 border border-border">
          <h3 className="font-semibold text-foreground text-sm mb-3">Para repasar:</h3>
          <div className="space-y-2">
            {wrongAnswers.map((answer, i) => (
              <div key={i} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-foreground font-medium truncate">{answer.question.correctAnswer}</span>
                <span className="text-palette-7 text-xs flex-shrink-0">
                  {answer.userAnswer ? `"${answer.userAnswer}"` : 'sin respuesta'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button
          onClick={onRetry}
          className="w-full h-14 bg-palette-2 text-foreground rounded-2xl font-medium
            hover:bg-palette-4 active:scale-[0.98] transition-all duration-200
            flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          Intentar de nuevo
        </button>
        <button
          onClick={onBack}
          className="w-full h-14 bg-palette-1 text-foreground rounded-2xl font-medium border border-border
            hover:bg-palette-6 active:scale-[0.98] transition-all duration-200
            flex items-center justify-center gap-2"
        >
          <Home className="w-5 h-5" />
          Volver a categorías
        </button>
      </div>
    </div>
  )
}
