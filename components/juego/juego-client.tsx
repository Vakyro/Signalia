'use client'

import { useEffect, useRef, useState } from 'react'
import { Unity, useUnityContext } from 'react-unity-webgl'
import { Gamepad2, Maximize2, Loader2 } from 'lucide-react'

export default function JuegoClient() {
  const [started, setStarted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { unityProvider, isLoaded, loadingProgression, requestFullscreen } = useUnityContext({
    loaderUrl: '/build/SL.loader.js',
    dataUrl: '/build/webgl.data',
    frameworkUrl: '/build/build.framework.js',
    codeUrl: '/build/build.wasm',
  })

  const loadingPct = Math.round(loadingProgression * 100)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (isMobile && isLoaded && started) {
      requestFullscreen(true)
    }
  }, [isLoaded, isMobile, started, requestFullscreen])

  // ── Mobile: landing card ────────────────────────────────────────────────────
  if (isMobile && !started) {
    return (
      <div className="px-4 py-8 flex flex-col items-center justify-center min-h-[60vh] animate-fade-in-up">
        <div className="w-full max-w-sm bg-palette-1 border border-border rounded-3xl p-8 flex flex-col items-center gap-6 shadow-sm">
          <div className="w-24 h-24 rounded-full bg-palette-3 flex items-center justify-center">
            <Gamepad2 className="w-12 h-12 text-palette-2" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Juego LSM</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Practica el abecedario de Lengua de Señas Mexicana de forma interactiva y divertida.
            </p>
          </div>
          <InfoCards />
          <button
            onClick={() => setStarted(true)}
            className="w-full h-14 bg-palette-2 text-foreground rounded-2xl font-medium
              hover:bg-palette-4 active:scale-[0.98] transition-all duration-200
              flex items-center justify-center gap-2"
          >
            <Gamepad2 className="w-5 h-5" />
            Jugar
          </button>
        </div>
      </div>
    )
  }

  // ── Desktop ─────────────────────────────────────────────────────────────────
  if (!isMobile) {
    return (
      <div className="flex h-[calc(100vh-64px)]">
        {/* Info sidebar */}
        <aside className="hidden md:flex md:flex-col md:w-72 md:flex-shrink-0 border-r border-border bg-palette-1 overflow-y-auto">
          <div className="p-6 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-palette-3 flex items-center justify-center flex-shrink-0">
                <Gamepad2 className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">Juego LSM</p>
                <p className="text-xs text-muted-foreground">Lengua de Señas Mexicana</p>
              </div>
            </div>

            {isLoaded && (
              <button
                onClick={() => requestFullscreen(true)}
                className="flex items-center justify-center gap-2 h-10 px-4 rounded-2xl border border-border
                  bg-card text-sm font-medium text-foreground hover:bg-palette-3 transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
                Pantalla completa
              </button>
            )}

            <InfoCards />
          </div>
        </aside>

        {/* Game canvas */}
        <main className="flex-1 relative bg-palette-1 overflow-hidden" ref={containerRef}>
          {!isLoaded && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-palette-1">
              <div className="w-20 h-20 rounded-full bg-palette-3 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-palette-2 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground mb-1">Cargando juego...</p>
                <p className="text-3xl font-bold text-palette-2">{loadingPct}%</p>
              </div>
              <LoadingBar pct={loadingPct} />
            </div>
          )}
          <Unity
            unityProvider={unityProvider}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </main>
      </div>
    )
  }

  // ── Mobile: game running ────────────────────────────────────────────────────
  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 64px)' }}>
      {!isLoaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-palette-1 px-6">
          <div className="w-16 h-16 rounded-full bg-palette-3 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-palette-2 animate-spin" />
          </div>
          <p className="text-lg font-semibold text-foreground">Cargando juego...</p>
          <p className="text-2xl font-bold text-palette-2">{loadingPct}%</p>
          <LoadingBar pct={loadingPct} />
        </div>
      )}
      <Unity
        unityProvider={unityProvider}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function LoadingBar({ pct }: { pct: number }) {
  return (
    <div className="w-full max-w-xs">
      <div className="w-full bg-palette-3 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-palette-2 h-2.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function InfoCards() {
  const cards = [
    {
      emoji: '🎮',
      title: 'Objetivo',
      desc: 'Practica el abecedario LSM de forma interactiva y divertida.',
    },
    {
      emoji: '🖐️',
      title: 'Cómo jugar',
      desc: 'El juego te muestra las señas del abecedario LSM de manera visual.',
    },
    {
      emoji: '🏆',
      title: 'Aprende',
      desc: 'Mejora tu conocimiento del Lenguaje de Señas Mexicano mientras te diviertes.',
    },
  ]

  return (
    <div className="flex flex-col gap-3 w-full">
      {cards.map((c) => (
        <div key={c.title} className="p-4 bg-card border border-border rounded-2xl">
          <p className="text-sm font-semibold text-foreground mb-1">
            {c.emoji} {c.title}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
        </div>
      ))}
    </div>
  )
}
