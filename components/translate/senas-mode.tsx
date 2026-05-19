'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Camera,
  CameraOff,
  Volume2,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useModels } from '@/lib/models/model-context'
import { useToast } from '@/components/ui/toast-provider'
import type { Results } from '@mediapipe/holistic'

// Order must match the model's training order (from signai/lib/data.ts → allPhrases)
const ALL_ACTIONS = [
  'abrazar', 'agarrar', 'aplastar', 'bailar', 'caminar',
  'cerrar', 'golpear', 'guardar', 'invitar', 'jugar',
  'libro', 'fabrica', 'luna', 'tijuana', 'frio', 'sin_accion',
]

interface SignEntry {
  name: string
  label: string
  category: string
}

const SIGN_CATALOG: SignEntry[] = [
  { name: 'abrazar',  label: 'Abrazar',  category: 'Acciones' },
  { name: 'agarrar',  label: 'Agarrar',  category: 'Acciones' },
  { name: 'aplastar', label: 'Aplastar', category: 'Acciones' },
  { name: 'bailar',   label: 'Bailar',   category: 'Acciones' },
  { name: 'caminar',  label: 'Caminar',  category: 'Acciones' },
  { name: 'cerrar',   label: 'Cerrar',   category: 'Acciones' },
  { name: 'golpear',  label: 'Golpear',  category: 'Acciones' },
  { name: 'guardar',  label: 'Guardar',  category: 'Acciones' },
  { name: 'invitar',  label: 'Invitar',  category: 'Acciones' },
  { name: 'jugar',    label: 'Jugar',    category: 'Acciones' },
  { name: 'libro',    label: 'Libro',    category: 'Objetos' },
  { name: 'fabrica',  label: 'Fábrica',  category: 'Objetos' },
  { name: 'luna',     label: 'Luna',     category: 'Objetos' },
  { name: 'tijuana',  label: 'Tijuana',  category: 'Lugares' },
  { name: 'frio',     label: 'Frío',     category: 'Otros' },
]

const CATEGORIES = ['Acciones', 'Objetos', 'Lugares', 'Otros']

const SEQUENCE_LENGTH = 30

function extractKeyPoints(results: Results): number[] {
  const pose = results.poseLandmarks
    ? results.poseLandmarks.flatMap((r) => [r.x, r.y, r.z, r.visibility ?? 0])
    : Array<number>(33 * 4).fill(0)

  const face = results.faceLandmarks
    ? results.faceLandmarks.flatMap((r) => [r.x, r.y, r.z])
    : Array<number>(468 * 3).fill(0)

  const lh = results.leftHandLandmarks
    ? results.leftHandLandmarks.flatMap((r) => [r.x, r.y, r.z])
    : Array<number>(21 * 3).fill(0)

  const rh = results.rightHandLandmarks
    ? results.rightHandLandmarks.flatMap((r) => [r.x, r.y, r.z])
    : Array<number>(21 * 3).fill(0)

  return [...pose, ...face, ...lh, ...rh]
}

function speak(text: string) {
  if (!text || typeof window === 'undefined') return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'es-MX'
  window.speechSynthesis.speak(utterance)
}

export function SenasMode() {
  const { actionModel, actionStatus } = useModels()
  const { showToast } = useToast()

  const [isCameraOn, setIsCameraOn] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)
  const [isHolisticLoading, setIsHolisticLoading] = useState(false)
  const [currentAction, setCurrentAction] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const holisticRef = useRef<{ send: (input: { image: HTMLVideoElement }) => Promise<void> } | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const sequenceRef = useRef<number[][]>([])
  const isProcessingRef = useRef(false)
  const isActiveRef = useRef(true)

  useEffect(() => {
    isActiveRef.current = true
    return () => {
      isActiveRef.current = false
      stopCamera()
    }
  }, [])

  function stopCamera() {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    sequenceRef.current = []
    isProcessingRef.current = false
  }

  async function toggleCamera() {
    if (isCameraOn) {
      stopCamera()
      setIsCameraOn(false)
      setCurrentAction('')
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
      if (!isActiveRef.current) return

      setIsRequesting(false)
      setIsHolisticLoading(true)

      await setupHolistic()

      if (!isActiveRef.current) return
      setIsHolisticLoading(false)
      setIsCameraOn(true)
      startFrameLoop()
    } catch {
      showToast('No se pudo acceder a la cámara')
      stopCamera()
      if (isActiveRef.current) {
        setIsRequesting(false)
        setIsHolisticLoading(false)
      }
    }
  }

  async function setupHolistic() {
    const { Holistic } = await import('@mediapipe/holistic')

    const holistic = new Holistic({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
    })

    holistic.setOptions({
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    })

    holistic.onResults(async (results: Results) => {
      if (!actionModel || !isActiveRef.current) return

      const keypoints = extractKeyPoints(results)
      sequenceRef.current.push(keypoints)

      if (sequenceRef.current.length === SEQUENCE_LENGTH) {
        try {
          const tf = await import('@tensorflow/tfjs')
          const inputData = tf.tensor([sequenceRef.current])
          const prediction = await actionModel.predictAsync(inputData)
          const predArray = await (prediction as { data: () => Promise<Float32Array> }).data()
          inputData.dispose()
          ;(prediction as { dispose: () => void }).dispose()

          const values = Array.from(predArray)
          const idx = values.indexOf(Math.max(...values))
          const action = ALL_ACTIONS[idx] ?? ''

          if (action && action !== 'sin_accion' && isActiveRef.current) {
            setCurrentAction(action)
          }
        } catch (err) {
          console.error('Inference error:', err)
        }
        sequenceRef.current = []
      }
    })

    holisticRef.current = holistic
  }

  function startFrameLoop() {
    const detect = async () => {
      const video = videoRef.current
      const holistic = holisticRef.current

      if (!video || !holistic || !isActiveRef.current) return

      if (!isProcessingRef.current && video.readyState >= 2) {
        isProcessingRef.current = true
        try {
          await holistic.send({ image: video })
        } catch {
          // ignore mid-stop errors
        }
        isProcessingRef.current = false
      }

      animFrameRef.current = requestAnimationFrame(detect)
    }

    animFrameRef.current = requestAnimationFrame(detect)
  }

  const currentEntry = SIGN_CATALOG.find((entry) => entry.name === currentAction)
  const isModelReady = actionStatus === 'ready'
  const isLoading = isRequesting || isHolisticLoading

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

        {/* Idle / status placeholder */}
        {!isCameraOn && !isRequesting && !isHolisticLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-20 h-20 rounded-full bg-palette-3 flex items-center justify-center">
              <Camera className="w-10 h-10 text-muted-foreground" />
            </div>
            {actionStatus === 'loading' && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando modelo de señas...
              </div>
            )}
            {actionStatus === 'error' && (
              <p className="text-sm text-muted-foreground text-center px-6">
                No se pudo cargar el modelo. Verifica tu conexión.
              </p>
            )}
            {actionStatus === 'ready' && (
              <p className="text-sm text-muted-foreground">La cámara se abrirá al iniciar</p>
            )}
          </div>
        )}

        {isRequesting && (
          <div className="absolute inset-0 flex items-center justify-center bg-palette-1/90">
            <p className="text-sm text-muted-foreground">Solicitando acceso a la cámara...</p>
          </div>
        )}

        {isHolisticLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-palette-1/80 backdrop-blur-sm">
            <Loader2 className="w-8 h-8 text-palette-2 animate-spin" />
            <p className="text-sm text-muted-foreground">Iniciando detector de cuerpo...</p>
            <p className="text-xs text-muted-foreground opacity-60">Puede tardar unos segundos</p>
          </div>
        )}

        {/* Prediction overlay */}
        {isCameraOn && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {currentEntry ? (
              <>
                <div className="flex items-center gap-2 px-4 py-2 bg-palette-2/90 backdrop-blur-sm rounded-2xl shadow-sm">
                  <img
                    src={`/Accion/${currentEntry.name}.svg`}
                    alt={currentEntry.label}
                    className="w-8 h-8 object-contain"
                  />
                  <span className="text-lg font-bold text-foreground">{currentEntry.label}</span>
                </div>
                <button
                  onClick={() => speak(currentEntry.label)}
                  aria-label="Reproducir seña detectada"
                  className="p-2 bg-card/80 backdrop-blur-sm rounded-xl hover:bg-palette-3 transition-colors"
                >
                  <Volume2 className="w-5 h-5 text-foreground" />
                </button>
              </>
            ) : (
              <div className="px-3 py-1.5 bg-palette-1/80 backdrop-blur-sm rounded-full">
                <span className="text-sm text-muted-foreground">Detectando seña...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Camera toggle button */}
      <button
        onClick={toggleCamera}
        disabled={!isModelReady || isLoading}
        className={cn(
          'w-full h-14 rounded-2xl font-medium transition-all duration-200 mb-4',
          'flex items-center justify-center gap-2 active:scale-[0.98]',
          isCameraOn
            ? 'bg-palette-7 text-foreground hover:bg-palette-4'
            : 'bg-palette-2 text-foreground hover:bg-palette-4',
          (!isModelReady || isLoading) && 'opacity-50 cursor-not-allowed',
        )}
      >
        {isRequesting ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Solicitando cámara...</>
        ) : isHolisticLoading ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Iniciando detector...</>
        ) : isCameraOn ? (
          <><CameraOff className="w-5 h-5" /> Apagar cámara</>
        ) : (
          <><Camera className="w-5 h-5" /> Encender cámara</>
        )}
      </button>

      {/* Expandable signs panel */}
      <div className="rounded-2xl border border-border overflow-hidden">
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="w-full flex items-center justify-between px-4 py-3 bg-palette-1 hover:bg-palette-3 transition-colors"
        >
          <span className="text-sm font-medium text-foreground">
            Señas disponibles
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              ({SIGN_CATALOG.length})
            </span>
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {isExpanded && (
          <div className="p-4 bg-card border-t border-border space-y-5">
            {CATEGORIES.map((cat) => {
              const signs = SIGN_CATALOG.filter((sign) => sign.category === cat)
              if (signs.length === 0) return null
              return (
                <div key={cat}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    {cat}
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {signs.map((sign) => (
                      <button
                        key={sign.name}
                        onClick={() => speak(sign.label)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-200',
                          'hover:bg-palette-3 active:scale-95',
                          currentAction === sign.name
                            ? 'border-palette-2 bg-palette-6 shadow-sm'
                            : 'border-border bg-background',
                        )}
                      >
                        <img
                          src={`/Accion/${sign.name}.svg`}
                          alt={sign.label}
                          className="w-12 h-12 object-contain"
                          loading="lazy"
                        />
                        <span className="text-xs font-medium text-foreground text-center leading-tight">
                          {sign.label}
                        </span>
                        {currentAction === sign.name && (
                          <Volume2 className="w-3 h-3 text-palette-2" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
