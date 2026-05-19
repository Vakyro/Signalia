'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trophy, Zap, Flame, ArrowRight } from 'lucide-react'
import { CATEGORIES, type Category } from '@/lib/sign-data'
import { cn } from '@/lib/utils'

type Phase = 'category' | 'difficulty'

const PALETTE_COLORS = ['bg-palette-1', 'bg-palette-3', 'bg-palette-5', 'bg-palette-6']

const DIFFICULTIES = [
  {
    id: 'facil',
    label: 'Fácil',
    description: '5 preguntas · Opción múltiple',
    detail: 'Perfecto para empezar',
    icon: Trophy,
    color: 'bg-palette-3',
  },
  {
    id: 'intermedio',
    label: 'Intermedio',
    description: '10 preguntas · Opción múltiple',
    detail: 'Pon a prueba tu memoria',
    icon: Zap,
    color: 'bg-palette-5',
  },
  {
    id: 'dificil',
    label: 'Difícil',
    description: '15 preguntas · Escribe la respuesta',
    detail: 'El desafío definitivo',
    icon: Flame,
    color: 'bg-palette-6',
  },
]

export function PracticarPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('category')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  function handleCategorySelect(category: Category) {
    setSelectedCategory(category)
    setPhase('difficulty')
  }

  function handleDifficultySelect(difficulty: string) {
    router.push(`/practicar/${selectedCategory}/${difficulty}`)
  }

  if (phase === 'difficulty' && selectedCategory) {
    const cat = CATEGORIES.find((c) => c.id === selectedCategory)!

    return (
      <div className="px-4 md:px-6 py-6 max-w-lg mx-auto">
        <button
          onClick={() => setPhase('category')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 animate-fade-in-up"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Categorías</span>
        </button>

        <div className="flex items-center gap-4 mb-8 animate-fade-in-up">
          <div
            className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center text-3xl',
              PALETTE_COLORS[CATEGORIES.indexOf(cat) % PALETTE_COLORS.length],
            )}
          >
            {cat.emoji}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{cat.name}</h2>
            <p className="text-muted-foreground text-sm">{cat.signs.length} señas disponibles</p>
          </div>
        </div>

        <h3 className="text-base font-semibold text-foreground mb-4 animate-fade-in-up">
          Elige el nivel de dificultad
        </h3>

        <div className="flex flex-col gap-3 animate-fade-in-up">
          {DIFFICULTIES.map((diff) => {
            const Icon = diff.icon
            return (
              <button
                key={diff.id}
                onClick={() => handleDifficultySelect(diff.id)}
                className={cn(
                  'flex items-center gap-4 p-5 rounded-2xl border border-border text-left',
                  'hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] transition-all duration-200',
                  diff.color,
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-background/30 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-lg leading-tight">{diff.label}</p>
                  <p className="text-foreground/70 text-sm">{diff.description}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{diff.detail}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 md:px-6 py-6">
      <div className="mb-8 animate-fade-in-up">
        <h2 className="text-2xl font-bold text-foreground mb-2">Practica señas</h2>
        <p className="text-muted-foreground text-sm">Elige una categoría para empezar</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 animate-fade-in-up">
        {CATEGORIES.map((category, index) => (
          <button
            key={category.id}
            onClick={() => handleCategorySelect(category.id)}
            className={cn(
              'flex flex-col items-center justify-center p-6 rounded-2xl border border-border',
              'hover:-translate-y-0.5 hover:shadow-md active:scale-95 transition-all duration-200',
              PALETTE_COLORS[index % PALETTE_COLORS.length],
            )}
          >
            <span className="text-4xl mb-3">{category.emoji}</span>
            <span className="font-semibold text-foreground">{category.name}</span>
            <span className="text-xs text-muted-foreground mt-1">{category.signs.length} señas</span>
          </button>
        ))}
      </div>

      <div className="mt-8 bg-palette-1 rounded-3xl p-6 border border-border animate-fade-in-up">
        <h3 className="text-base font-semibold text-foreground mb-1">¿Nos ayudas a mejorar?</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Graba una seña y contribuye a entrenar nuestros modelos de traducción
        </p>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <span className="text-sm text-muted-foreground">
            {CATEGORIES.reduce((acc, c) => acc + c.signs.length, 0)} señas en el vocabulario LSM
          </span>
          <Link
            href="/contribuir"
            className="flex items-center gap-2 px-4 py-2 bg-palette-2 text-foreground rounded-xl
              font-medium text-sm hover:bg-palette-4 active:scale-95 transition-all duration-200"
          >
            Colaborar grabando una seña
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
