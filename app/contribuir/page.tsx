'use client'

import Link from 'next/link'
import { AppLayout } from '@/components/layout/app-layout'
import { ChevronRight, Video } from 'lucide-react'
import { CATEGORIES } from '@/lib/sign-data'
import { cn } from '@/lib/utils'

const PALETTE_COLORS = [
  'bg-palette-1',
  'bg-palette-5',
  'bg-palette-6',
  'bg-palette-3',
]

export default function ContribuirPage() {
  return (
    <AppLayout title="Contribuir">
      <div className="px-4 md:px-6 py-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Contribuir
          </h2>
          <p className="text-muted-foreground">
            Ayuda a expandir el diccionario de LSM
          </p>
        </div>

        {/* Stats Card */}
        <div className="bg-palette-2 rounded-3xl p-6 mb-8 animate-fade-in-up">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-card/50 flex items-center justify-center">
              <Video className="w-7 h-7 text-foreground" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">142</p>
              <p className="text-sm text-foreground/70">grabaciones de la comunidad</p>
            </div>
          </div>
        </div>

        {/* Category Cards */}
        <div className="flex flex-col gap-3 mb-8 animate-fade-in-up">
          {CATEGORIES.map((category, index) => (
            <Link
              key={category.id}
              href={`/contribuir/${category.id}`}
              className={cn(
                'flex items-center justify-between p-5 rounded-3xl border border-border',
                'hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] transition-all duration-200',
                PALETTE_COLORS[index % PALETTE_COLORS.length]
              )}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{category.emoji}</span>
                <div>
                  <h3 className="font-semibold text-foreground">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.signs.length} señas</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>
          ))}
        </div>

        {/* CTA Button */}
        <Link
          href="/contribuir/alfabeto"
          className="block w-full h-14 bg-palette-2 text-foreground rounded-2xl font-medium
            hover:bg-palette-4 active:scale-[0.98] transition-all duration-200
            text-center leading-[3.5rem] animate-fade-in-up"
        >
          Grabar nueva seña
        </Link>
      </div>
    </AppLayout>
  )
}
