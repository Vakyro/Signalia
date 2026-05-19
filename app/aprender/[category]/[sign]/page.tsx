'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { ArrowLeft } from 'lucide-react'
import { getSignEmoji, type Category, CATEGORIES } from '@/lib/sign-data'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const PALETTE_COLORS = ['bg-palette-1', 'bg-palette-3', 'bg-palette-5', 'bg-palette-6']

interface Sign {
  id: string
  name: string
  slug: string
  category: Category
  video_url: string | null
  video_path: string | null
}

interface PageProps {
  params: Promise<{ category: string; sign: string }>
}

export default function SignDetailPage({ params }: PageProps) {
  const { category, sign: slug } = use(params)
  const router = useRouter()
  const [sign, setSign] = useState<Sign | null>(null)
  const [loading, setLoading] = useState(true)

  const categoryData = CATEGORIES.find((c) => c.id === category)
  const isAlphabet = category === 'alfabeto'

  useEffect(() => {
    async function fetchSign() {
      const { data } = await supabase
        .from('signs')
        .select('id, name, slug, category, video_url, video_path')
        .eq('slug', slug)
        .eq('category', category)
        .single()

      setSign(data as Sign | null)
      setLoading(false)
    }
    fetchSign()
  }, [slug, category])

  const displayName = sign?.name ?? decodeURIComponent(slug)
  const signIndex = categoryData?.signs.indexOf(displayName) ?? 0

  return (
    <AppLayout title={displayName}>
      <div className="px-4 md:px-6 py-6 max-w-lg mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground
            transition-colors mb-6 animate-fade-in-up"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Volver</span>
        </button>

        {loading ? (
          <div className="rounded-3xl border border-border bg-palette-1 animate-pulse h-96" />
        ) : (
          <div className="animate-fade-in-up">
            <div className={cn('rounded-3xl border border-border p-8 mb-6', PALETTE_COLORS[Math.abs(signIndex) % PALETTE_COLORS.length])}>
              {/* Video o emoji */}
              <div className="w-full max-w-[280px] md:max-w-[320px] aspect-[9/16] rounded-2xl bg-card/50 flex items-center justify-center mx-auto mb-6 overflow-hidden">
                {sign?.video_url ? (
                  <video
                    src={sign.video_url}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className={cn('text-foreground', isAlphabet ? 'text-8xl font-bold' : 'text-8xl')}>
                    {getSignEmoji(displayName, category as Category)}
                  </span>
                )}
              </div>

              {/* Nombre e info */}
              <h2 className="text-2xl font-bold text-foreground text-center mb-2">{displayName}</h2>
              <p className="text-muted-foreground text-center text-sm mb-2">
                {categoryData?.name} · Lengua de Señas Mexicana
              </p>
              {!sign?.video_url && (
                <p className="text-muted-foreground text-center text-xs">
                  Video no disponible aún
                </p>
              )}
            </div>

            {/* Botón Practicar */}
            <div className="relative mb-3">
              <button
                disabled
                className="w-full h-14 bg-muted text-muted-foreground rounded-2xl font-medium
                  cursor-not-allowed opacity-60"
              >
                Practicar
              </button>
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-palette-6
                rounded-full text-xs text-muted-foreground whitespace-nowrap">
                Modelo no disponible
              </span>
            </div>

            <Link
              href={`/contribuir/${category}/${slug}`}
              className="block w-full h-12 bg-transparent border border-border text-foreground rounded-2xl font-medium
                hover:bg-palette-1 active:scale-[0.98] transition-all duration-200 text-center leading-[3rem]"
            >
              Grabar esta seña
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
