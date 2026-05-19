'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, CameraOff, Volume2, RotateCcw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useModels } from '@/lib/models/model-context'
import { useToast } from '@/components/ui/toast-provider'

function speak(text: string) {
  if (!text || typeof window === 'undefined') return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'es-MX'
  window.speechSynthesis.speak(utterance)
}

export function AbecedarioMode() {
  const { alphabetModel, alphabetStatus } = useModels()
  const { showToast } = useToast()

  const [isCameraOn, setIsCameraOn] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)
  const [currentLetter, setCurrentLetter] = useState('')
  const [sequence, setSequence] = useState('')

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const isActiveRef = useRef(true)

  useEffect(() => {
    isActiveRef.current = true
    return () => {
      isActiveRef.current = false
      stopCamera()
    }
  }, [])

  // Start inference loop when camera turns on and model is ready
  useEffect(() => {
    if (!isCameraOn || alphabetStatus !== 'ready' || !alphabetModel) return
    const cancel = startInferenceLoop()
    return cancel
  }, [isCameraOn, alphabetStatus, alphabetModel])

  function stopCamera() {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  async function toggleCamera() {
    if (isCameraOn) {
      stopCamera()
      setIsCameraOn(false)
      setCurrentLetter('')
      return
    }

    setIsRequesting(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      if (isActiveRef.current) setIsCameraOn(true)
    } catch {
      showToast('No se pudo acceder a la cámara')
      stopCamera()
    } finally {
      if (isActiveRef.current) setIsRequesting(false)
    }
  }

  function startInferenceLoop() {
    let lastGesture = ''

    const detect = () => {
      const video = videoRef.current
      if (!video || !alphabetModel) return

      if (video.readyState >= 2) {
        const results = alphabetModel.recognizeForVideo(video, Date.now())
        const gestures = results.gestures[0]

        if (gestures?.[0]) {
          const name = gestures[0].categoryName
          if (name !== lastGesture && isActiveRef.current) {
            setCurrentLetter(name)
            if (name === 'espacio') {
              setSequence((s) => s + ' ')
            } else if (name === 'del') {
              setSequence((s) => s.slice(0, -1))
            } else {
              setSequence((s) => s + name)
            }
            lastGesture = name
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(detect)
    }

    animFrameRef.current = requestAnimationFrame(detect)
    return () => {
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current)
    }
  }

  const canStart = alphabetStatus === 'ready' && !isRequesting

  return (
    <div className="animate-fade-in-up">
      {/* Camera area */}
      <div
        className={cn(
          'relative bg-palette-1 rounded-3xl border border-border overflow-hidden mb-4',
          isCameraOn ? 'h-[62vh] md:h-auto md:aspect-video' : 'aspect-video',
        )}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          className={cn('w-full h-full object-cover scale-x-[-1]', isCameraOn ? 'block' : 'hidden')}
        />

        {/* Idle / loading placeholder */}
        {!isCameraOn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-20 h-20 rounded-full bg-palette-3 flex items-center justify-center">
              <Camera className="w-10 h-10 text-muted-foreground" />
            </div>
            {alphabetStatus === 'loading' && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando modelo de abecedario...
              </div>
            )}
            {alphabetStatus === 'error' && (
              <p className="text-sm text-muted-foreground text-center px-6">
                No se pudo cargar el modelo. Verifica tu conexión.
              </p>
            )}
            {alphabetStatus === 'ready' && (
              <p className="text-sm text-muted-foreground">La cámara se abrirá al iniciar</p>
            )}
          </div>
        )}

        {isRequesting && (
          <div className="absolute inset-0 flex items-center justify-center bg-palette-1/90">
            <p className="text-muted-foreground text-sm">Solicitando acceso a la cámara...</p>
          </div>
        )}

        {/* Detected letter overlay */}
        {isCameraOn && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {currentLetter ? (
              <>
                <div className="px-5 py-2 bg-palette-2/90 backdrop-blur-sm rounded-2xl shadow-sm">
                  <span className="text-4xl font-bold text-foreground uppercase leading-none">
                    {currentLetter}
                  </span>
                </div>
                <button
                  onClick={() => speak(currentLetter)}
                  aria-label="Reproducir letra"
                  className="p-2 bg-card/80 backdrop-blur-sm rounded-xl hover:bg-palette-3 transition-colors"
                >
                  <Volume2 className="w-5 h-5 text-foreground" />
                </button>
              </>
            ) : (
              <div className="px-3 py-1.5 bg-palette-1/80 backdrop-blur-sm rounded-full">
                <span className="text-sm text-muted-foreground">Detectando...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Accumulated text bar */}
      {isCameraOn && (
        <div className="mb-4 p-4 bg-palette-1 rounded-2xl border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Texto acumulado
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => speak(sequence)}
                disabled={!sequence.trim()}
                aria-label="Reproducir texto acumulado"
                className="p-1.5 rounded-lg hover:bg-palette-3 transition-colors disabled:opacity-40"
              >
                <Volume2 className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => { setSequence(''); setCurrentLetter('') }}
                aria-label="Reiniciar texto"
                className="p-1.5 rounded-lg hover:bg-palette-3 transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
          <p className="text-lg font-medium text-foreground min-h-7 break-all uppercase tracking-widest">
            {sequence || (
              <span className="text-sm font-normal text-muted-foreground normal-case tracking-normal">
                Realiza una seña para empezar...
              </span>
            )}
          </p>
        </div>
      )}

      {/* Camera toggle button */}
      <button
        onClick={toggleCamera}
        disabled={!canStart}
        className={cn(
          'w-full h-14 rounded-2xl font-medium transition-all duration-200',
          'flex items-center justify-center gap-2 active:scale-[0.98]',
          isCameraOn
            ? 'bg-palette-7 text-foreground hover:bg-palette-4'
            : 'bg-palette-2 text-foreground hover:bg-palette-4',
          !canStart && 'opacity-50 cursor-not-allowed',
        )}
      >
        {isRequesting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Solicitando cámara...
          </>
        ) : isCameraOn ? (
          <>
            <CameraOff className="w-5 h-5" />
            Apagar cámara
          </>
        ) : (
          <>
            <Camera className="w-5 h-5" />
            Encender cámara
          </>
        )}
      </button>
    </div>
  )
}
