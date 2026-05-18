'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { ArrowLeft, Camera } from 'lucide-react'
import { CATEGORIES, getSignEmoji, type Category } from '@/lib/sign-data'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const PALETTE_COLORS = ['bg-palette-1', 'bg-palette-3', 'bg-palette-5', 'bg-palette-6']

interface Sign {
  id: string
  name: string
  slug: string
  category: Category
}

interface PageProps {
  params: Promise<{ category: string }>
}

export default function CategoryContributePage({ params }: PageProps) {
  const { category } = use(params)
  const router = useRouter()
  const [signs, setSigns] = useState<Sign[]>([])
  const [loading, setLoading] = useState(true)

  const categoryData = CATEGORIES.find((c) => c.id === category)
  const isAlphabet = category === 'alfabeto'

  useEffect(() => {
    async function fetchSigns() {
      const { data } = await supabase
        .from('signs')
        .select('id, name, slug, category')
        .eq('category', category)
        .eq('language', 'lsm')
        .order('name')
      setSigns((data as Sign[]) ?? [])
      setLoading(false)
    }
    fetchSigns()
  }, [category])

  if (!categoryData) return null

  return (
    <AppLayout title={categoryData.name}>
      <div className="px-4 md:px-6 py-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground
            transition-colors mb-6 animate-fade-in-up"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Volver</span>
        </button>

        {loading ? (
          <div className={cn('grid gap-3', isAlphabet ? 'grid-cols-4 md:grid-cols-7' : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5')}>
            {Array.from({ length: isAlphabet ? 27 : 8 }).map((_, i) => (
              <div key={i} className={cn('rounded-2xl border border-border bg-palette-1 animate-pulse', isAlphabet ? 'aspect-square' : 'h-24')} />
            ))}
          </div>
        ) : (
          <div className={cn(
            'grid gap-3 animate-fade-in-up',
            isAlphabet ? 'grid-cols-4 md:grid-cols-7' : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5',
          )}>
            {signs.map((sign, index) => (
              <Link
                key={sign.id}
                href={`/contribuir/${category}/${sign.slug}`}
                className={cn(
                  'flex flex-col items-center justify-center p-4 rounded-2xl border border-border relative group',
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
                <div className="absolute inset-0 bg-foreground/5 rounded-2xl opacity-0 group-hover:opacity-100
                  transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-palette-2 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-foreground" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
