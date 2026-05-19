'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, X, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSignEmoji, type Category } from '@/lib/sign-data'

export interface QuizSign {
  name: string
  slug: string
  video_url: string | null
  category: Category
}

export interface Question {
  sign: QuizSign
  correctAnswer: string
  options: string[]
}

type QuestionType = 'multiple-choice' | 'text-input'

interface QuizQuestionProps {
  question: Question
  type: QuestionType
  onAnswer: (answer: string) => void
}

function normalizeAnswer(s: string): string {
  return s.trim().toLowerCase()
}

export function QuizQuestion({ question, type, onAnswer }: QuizQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [textAnswer, setTextAnswer] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const answerTimerRef = useRef<number | null>(null)

  useEffect(() => {
    setSelectedOption(null)
    setTextAnswer('')
    setFeedback(null)
    if (answerTimerRef.current !== null) {
      window.clearTimeout(answerTimerRef.current)
      answerTimerRef.current = null
    }
  }, [question])

  useEffect(() => {
    if (type === 'text-input' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [type, question])

  useEffect(() => {
    return () => {
      if (answerTimerRef.current !== null) {
        window.clearTimeout(answerTimerRef.current)
      }
    }
  }, [])

  function handleOptionSelect(option: string) {
    if (feedback) return
    setSelectedOption(option)
    const isCorrect = normalizeAnswer(option) === normalizeAnswer(question.correctAnswer)
    setFeedback(isCorrect ? 'correct' : 'incorrect')
    if (answerTimerRef.current !== null) {
      window.clearTimeout(answerTimerRef.current)
    }
    answerTimerRef.current = window.setTimeout(() => onAnswer(option), 1200)
  }

  function handleTextSubmit() {
    if (feedback || !textAnswer.trim()) return
    const isCorrect = normalizeAnswer(textAnswer) === normalizeAnswer(question.correctAnswer)
    setFeedback(isCorrect ? 'correct' : 'incorrect')
    if (answerTimerRef.current !== null) {
      window.clearTimeout(answerTimerRef.current)
    }
    answerTimerRef.current = window.setTimeout(() => onAnswer(textAnswer.trim()), 1500)
  }

  const emoji = getSignEmoji(question.sign.name, question.sign.category)

  return (
    <div className="animate-fade-in-up">
      <p className="text-muted-foreground text-sm font-medium mb-5">¿Qué seña es esta?</p>

      <div
        key={question.sign.name}
        className="w-full max-w-[220px] aspect-[9/16] rounded-2xl bg-palette-1 border border-border flex items-center justify-center mx-auto mb-6 overflow-hidden"
      >
        {question.sign.video_url ? (
          <video
            key={question.sign.video_url}
            src={question.sign.video_url}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <span
            className={cn(
              'text-foreground',
              question.sign.category === 'alfabeto' ? 'text-8xl font-bold' : 'text-7xl',
            )}
          >
            {emoji}
          </span>
        )}
      </div>

      {feedback && (
        <div
          className={cn(
            'flex items-center gap-2 p-3 rounded-xl mb-4 animate-fade-in-up border border-border',
            feedback === 'correct'
              ? 'bg-palette-3 text-foreground'
              : 'bg-palette-7 text-foreground',
          )}
        >
          {feedback === 'correct' ? (
            <Check className="w-5 h-5 flex-shrink-0" />
          ) : (
            <X className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="font-medium text-sm">
            {feedback === 'correct' ? '¡Correcto!' : `La respuesta era: ${question.correctAnswer}`}
          </span>
        </div>
      )}

      {type === 'multiple-choice' && (
        <div className="grid grid-cols-2 gap-3">
          {question.options.map((option) => {
            const isSelected = selectedOption === option
            const isCorrect = option === question.correctAnswer
            const showResult = feedback !== null

            return (
              <button
                key={option}
                onClick={() => handleOptionSelect(option)}
                disabled={!!feedback}
                className={cn(
                  'p-4 rounded-2xl border text-sm font-medium text-left transition-all duration-200 min-h-[56px]',
                  'hover:shadow-sm active:scale-[0.98] leading-tight',
                  !showResult && 'bg-palette-1 border-border hover:bg-palette-6 text-foreground',
                  showResult && isCorrect && 'bg-palette-3 border-palette-4 text-foreground',
                  showResult && isSelected && !isCorrect && 'bg-palette-7 border-palette-4 text-foreground',
                  showResult && !isSelected && !isCorrect && 'bg-palette-1 border-border text-muted-foreground opacity-50',
                )}
              >
                {option}
              </button>
            )
          })}
        </div>
      )}

      {type === 'text-input' && (
        <div className="space-y-3">
          <input
            ref={inputRef}
            type="text"
            placeholder="Escribe la seña aquí..."
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
            disabled={!!feedback}
            className={cn(
              'w-full px-4 py-4 rounded-2xl border bg-palette-1 text-foreground',
              'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-palette-2',
              'transition-all duration-200 text-sm',
              feedback === 'correct' && 'border-palette-4',
              feedback === 'incorrect' && 'border-palette-7',
              !feedback && 'border-border',
            )}
          />
          {!feedback && (
            <button
              onClick={handleTextSubmit}
              disabled={!textAnswer.trim()}
              className={cn(
                'w-full h-12 rounded-2xl font-medium text-sm transition-all duration-200',
                'flex items-center justify-center gap-2',
                textAnswer.trim()
                  ? 'bg-palette-2 text-foreground hover:bg-palette-4 active:scale-[0.98]'
                  : 'bg-palette-1 text-muted-foreground cursor-not-allowed opacity-60',
              )}
            >
              Confirmar
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
