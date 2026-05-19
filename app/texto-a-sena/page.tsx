'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/app-layout'
import { Loader2, Trash2, Play, ChevronRight, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SignResult {
  sena: string
  name: string
  slug: string | null
  category: string | null
  video_url: string | null
  found: boolean
}

interface ApiResponse {
  glosa: string[]
  traduccion: string
  results: SignResult[]
}

const PALETTE_COLORS = ['bg-palette-1', 'bg-palette-6', 'bg-palette-5', 'bg-palette-3']

export default function TextoASenaPage() {
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [isPlayingAll, setIsPlayingAll] = useState(false)

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

  const handleTranslate = async () => {
    if (!inputText.trim()) return
    setIsLoading(true)
    setResponse(null)
    setError(null)
    setPlayingIndex(null)
    setIsPlayingAll(false)

    try {
      const res = await fetch('/api/text-to-signs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error desconocido')
      setResponse(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al traducir')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleTranslate()
  }

  const handleClear = () => {
    setInputText('')
    setResponse(null)
    setError(null)
    setPlayingIndex(null)
    setIsPlayingAll(false)
  }

  // Play signs in sequence
  const playAll = useCallback(() => {
    const withVideo = response?.results
      .map((r, i) => ({ ...r, index: i }))
      .filter((r) => r.video_url) ?? []

    if (!withVideo.length) return

    setIsPlayingAll(true)
    let current = 0

    const playNext = () => {
      if (current >= withVideo.length) {
        setPlayingIndex(null)
        setIsPlayingAll(false)
        return
      }
      const { index } = withVideo[current]
      setPlayingIndex(index)
      const video = videoRefs.current[index]
      if (video) {
        video.currentTime = 0
        video.play()
        video.onended = () => {
          current++
          playNext()
        }
      } else {
        current++
        playNext()
      }
    }

    playNext()
  }, [response])

  const results = response?.results ?? []
  const foundCount = results.filter((r) => r.found).length

  return (
    <AppLayout title="Texto a Seña">
      <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto">
        {/* Input */}
        <div className="mb-4 animate-fade-in-up">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe una frase en español..."
            className="w-full h-36 p-4 bg-palette-1 rounded-3xl border border-border text-foreground
              placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-palette-2 text-lg"
          />
          <p className="text-xs text-muted-foreground mt-2 ml-1">Ctrl+Enter para traducir</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mb-8 animate-fade-in-up">
          <button
            onClick={handleTranslate}
            disabled={!inputText.trim() || isLoading}
            className={cn(
              'flex-1 h-14 bg-palette-2 text-foreground rounded-2xl font-medium',
              'hover:bg-palette-4 active:scale-[0.98] transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
              'flex items-center justify-center gap-2',
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Traduciendo...
              </>
            ) : (
              'Traducir a señas'
            )}
          </button>

          {(inputText || response) && (
            <button
              onClick={handleClear}
              className="h-14 px-5 bg-transparent border border-border text-foreground rounded-2xl
                hover:bg-palette-1 active:scale-[0.98] transition-all duration-200"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-palette-7 rounded-2xl border border-border text-foreground text-sm animate-fade-in-up">
            {error}
          </div>
        )}

        {/* Results */}
        {response && (
          <div className="animate-fade-in-up">
            {/* Glosa + play all */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Glosa LSM</p>
                <p className="text-sm text-foreground font-medium">{response.traduccion}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {foundCount}/{results.length} señas encontradas
                </p>
              </div>
              {results.some((r) => r.video_url) && (
                <button
                  onClick={playAll}
                  disabled={isPlayingAll}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                    isPlayingAll
                      ? 'bg-palette-3 text-muted-foreground cursor-not-allowed'
                      : 'bg-palette-2 text-foreground hover:bg-palette-4 active:scale-95',
                  )}
                >
                  <Play className="w-4 h-4" />
                  {isPlayingAll ? 'Reproduciendo...' : 'Reproducir todo'}
                </button>
              )}
            </div>

            {/* Sign cards */}
            <div className="overflow-x-auto pb-4 -mx-4 px-4">
              <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
                {results.map((sign, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className={cn(
                        'flex flex-col rounded-3xl border overflow-hidden transition-all duration-200',
                        'min-w-[160px] max-w-[180px]',
                        sign.found ? PALETTE_COLORS[index % PALETTE_COLORS.length] : 'bg-palette-1 opacity-50',
                        playingIndex === index ? 'ring-2 ring-palette-2 scale-105 shadow-lg' : 'border-border',
                      )}
                    >
                      {/* Video or placeholder */}
                      <div className="aspect-[9/16] bg-card/30 flex items-center justify-center overflow-hidden">
                        {sign.video_url ? (
                          <video
                            ref={(el) => { videoRefs.current[index] = el }}
                            src={sign.video_url}
                            playsInline
                            muted={false}
                            loop={playingIndex !== index}
                            className="w-full h-full object-cover"
                            onClick={(e) => {
                              const v = e.currentTarget
                              v.paused ? v.play() : v.pause()
                            }}
                          />
                        ) : (
                          <span className="text-4xl">🤟</span>
                        )}
                      </div>

                      {/* Name */}
                      <div className="px-3 py-2.5 text-center">
                        <p className="text-sm font-semibold text-foreground leading-tight">{sign.name}</p>
                        {!sign.found && (
                          <p className="text-xs text-muted-foreground mt-0.5">Sin seña</p>
                        )}
                      </div>
                    </div>

                    {/* Arrow between cards */}
                    {index < results.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {results.some((r) => r.video_url) && (
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Toca un video para reproducirlo · Usa &quot;Reproducir todo&quot; para la secuencia completa
              </p>
            )}
          </div>
        )}

        {/* Empty state */}
        {!response && !isLoading && !error && (
          <div className="text-center py-16 animate-fade-in-up">
            <div className="w-20 h-20 rounded-full bg-palette-1 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🤟</span>
            </div>
            <p className="text-muted-foreground">Escribe una frase para ver las señas en LSM</p>
          </div>
        )}

        {/* Contribute CTA */}
        <div className="mt-4 bg-palette-1 rounded-3xl p-6 border border-border animate-fade-in-up">
          <h3 className="text-base font-semibold text-foreground mb-1">¿Nos ayudas a mejorar?</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Graba una seña y contribuye a entrenar nuestros modelos de traducción
          </p>
          <Link
            href="/contribuir"
            className="flex items-center gap-2 px-4 py-2.5 bg-palette-2 text-foreground rounded-xl
              font-medium text-sm w-fit hover:bg-palette-4 active:scale-95 transition-all duration-200"
          >
            Colaborar grabando una seña
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </AppLayout>
  )
}
