'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/app-layout'
import { getSignEmoji, type Category } from '@/lib/sign-data'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'

type Tab = Category

interface Sign {
  id: string
  name: string
  slug: string
  category: Category
  video_url: string | null
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'alfabeto', label: 'Alfabeto' },
  { id: 'palabras', label: 'Palabras' },
  { id: 'frases', label: 'Frases' },
  { id: 'familia', label: 'Familia' },
  { id: 'acciones', label: 'Acciones' },
  { id: 'objetos', label: 'Objetos' },
]

const PALETTE_COLORS = ['bg-palette-1', 'bg-palette-3', 'bg-palette-5', 'bg-palette-6']

export default function BibliotecaPage() {
  const [activeTab, setActiveTab] = useState<Tab>('alfabeto')
  const [signsByCategory, setSignsByCategory] = useState<Record<string, Sign[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSigns() {
      const { data, error } = await supabase
        .from('signs')
        .select('id, name, slug, category, video_url')
        .eq('language', 'lsm')
        .order('name')

      if (error || !data) return

      const grouped: Record<string, Sign[]> = {}
      for (const sign of data as Sign[]) {
        if (!grouped[sign.category]) grouped[sign.category] = []
        grouped[sign.category].push(sign)
      }
      setSignsByCategory(grouped)
      setLoading(false)
    }
    fetchSigns()
  }, [])

  const signs = signsByCategory[activeTab] ?? []
  const isAlphabet = activeTab === 'alfabeto'

  return (
    <AppLayout title="Biblioteca">
      <div className="px-4 md:px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 mb-6 animate-fade-in-up">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-palette-2 text-foreground'
                  : 'bg-palette-1 text-muted-foreground hover:bg-palette-6',
              )}
            >
              {tab.label}
              {!loading && signsByCategory[tab.id] && (
                <span className="ml-1.5 text-xs opacity-60">
                  {signsByCategory[tab.id].length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className={cn('grid gap-3 mb-12', isAlphabet ? 'grid-cols-4 md:grid-cols-7' : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5')}>
            {Array.from({ length: isAlphabet ? 27 : 8 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-2xl border border-border bg-palette-1 animate-pulse',
                  isAlphabet ? 'aspect-square' : 'h-24',
                )}
              />
            ))}
          </div>
        )}

        {/* Sign Grid */}
        {!loading && (
          <div
            className={cn(
              'grid gap-3 mb-12 animate-fade-in-up',
              isAlphabet ? 'grid-cols-4 md:grid-cols-7' : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5',
            )}
          >
            {signs.map((sign, index) => (
              <Link
                key={sign.id}
                href={`/aprender/${sign.category}/${sign.slug}`}
                className={cn(
                  'flex flex-col items-center justify-center p-4 rounded-2xl border border-border',
                  'hover:-translate-y-0.5 hover:shadow-md active:scale-95 transition-all duration-200',
                  PALETTE_COLORS[index % PALETTE_COLORS.length],
                  isAlphabet ? 'aspect-square' : 'py-6',
                )}
              >
                <span className={cn('font-semibold text-foreground', isAlphabet ? 'text-2xl md:text-3xl' : 'text-3xl mb-2')}>
                  {getSignEmoji(sign.name, sign.category)}
                </span>
                {!isAlphabet && (
                  <span className="text-sm text-foreground text-center leading-tight">{sign.name}</span>
                )}
                {sign.video_url && (
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-palette-2 opacity-70" />
                )}
              </Link>
            ))}

            {signs.length === 0 && (
              <div className="col-span-full py-16 text-center text-muted-foreground text-sm">
                No hay señas en esta categoría todavía.
              </div>
            )}
          </div>
        )}

        {/* Contribute CTA */}
        <div className="bg-palette-1 rounded-3xl p-6 border border-border animate-fade-in-up">
          <h3 className="text-lg font-semibold text-foreground mb-2">¿Conoces más señas?</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Ayuda a mejorar nuestros modelos grabando señas
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {Object.values(signsByCategory).flat().length || 106} señas en la biblioteca
            </span>
            <Link
              href="/contribuir"
              className="flex items-center gap-2 px-4 py-2 bg-palette-2 text-foreground rounded-xl
                font-medium text-sm hover:bg-palette-4 active:scale-95 transition-all duration-200"
            >
              Contribuir una seña
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
