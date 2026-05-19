'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const JuegoClient = dynamic(() => import('./juego-client'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 text-palette-2 animate-spin" />
    </div>
  ),
})

export function JuegoWrapper() {
  return <JuegoClient />
}
