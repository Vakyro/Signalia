'use client'

import { use, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { ArrowLeft, Camera, RotateCcw, Send, Loader2 } from 'lucide-react'
import { CATEGORIES, getSignEmoji, type Category } from '@/lib/sign-data'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast-provider'

type RecordingState = 'idle' | 'requesting' | 'countdown' | 'recording' | 'preview'

const PALETTE_COLORS = ['bg-palette-1', 'bg-palette-3', 'bg-palette-5', 'bg-palette-6']

interface Sign {
  id: string
  name: string
  slug: string
  category: Category
}

interface PageProps {
  params: Promise<{ category: string; sign: string }>
}

export default function RecordSignPage({ params }: PageProps) {
  const { category, sign: slug } = use(params)
  const router = useRouter()
  const { showToast } = useToast()

  const [sign, setSign] = useState<Sign | null>(null)
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [countdown, setCountdown] = useState(3)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const previewRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const countdownIntervalRef = useRef<number | null>(null)

  const categoryData = CATEGORIES.find((c) => c.id === category)
  const signIndex = sign ? 0 : 0

  useEffect(() => {
    async function fetchSign() {
      const { data } = await supabase
        .from('signs')
        .select('id, name, slug, category')
        .eq('slug', slug)
        .eq('category', category)
        .single()
      setSign(data as Sign | null)
    }
    fetchSign()
  }, [slug, category])

  useEffect(() => {
    return () => {
      stopStream()
      if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  async function startRecording() {
    setRecordingState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => undefined)
      }

      setRecordingState('countdown')
      let count = 3
      setCountdown(count)
      await new Promise<void>((resolve) => {
        countdownIntervalRef.current = window.setInterval(() => {
          count -= 1
          setCountdown(count)
          if (count === 0) {
            window.clearInterval(countdownIntervalRef.current!)
            countdownIntervalRef.current = null
            resolve()
          }
        }, 1000)
      })

      chunksRef.current = []
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm'
      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setRecordedBlob(blob)
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
        if (previewRef.current) previewRef.current.src = url
        stopStream()
        setRecordingState('preview')
        mediaRecorderRef.current = null
      }

      recorder.start(250)
      setRecordingState('recording')
    } catch {
      showToast('No se pudo acceder a la cámara')
      setRecordingState('idle')
      stopStream()
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
  }

  async function handleSubmit() {
    if (!recordedBlob || !sign) return
    setIsSubmitting(true)

    try {
      // 1. Subir video al bucket
      const videoPath = `${category}/${sign.slug}_${Date.now()}.webm`
      const { error: uploadError } = await supabase.storage
        .from('contribuciones')
        .upload(videoPath, recordedBlob, { contentType: 'video/webm', upsert: false })

      if (uploadError) throw uploadError

      // 2. Obtener URL pública
      const { data: urlData } = supabase.storage.from('contribuciones').getPublicUrl(videoPath)
      const videoUrl = urlData.publicUrl

      // 3. Insertar en tabla contribuciones
      const { error: insertError } = await supabase.from('contributions').insert({
        sign_id: sign.id,
        sign_name: sign.name,
        video_url: videoUrl,
        video_path: videoPath,
        language: 'lsm',
        status: 'pending',
      })

      if (insertError) throw insertError

      showToast('¡Contribución enviada! Gracias')
      router.push('/contribuir')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      showToast(`Error al enviar: ${msg}`)
      setIsSubmitting(false)
    }
  }

  function resetRecording() {
    stopStream()
    if (countdownIntervalRef.current) {
      window.clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
    else mediaRecorderRef.current = null
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
    setRecordedBlob(null)
    setRecordingState('idle')
    setCountdown(3)
    setIsSubmitting(false)
  }

  if (!categoryData) return null

  const displayName = sign?.name ?? decodeURIComponent(slug)

  // Botones compartidos mobile/desktop
  const ActionButtons = () => (
    <>
      {recordingState === 'idle' && (
        <button
          onClick={startRecording}
          className="w-full h-14 bg-palette-2 text-foreground rounded-2xl font-medium
            hover:bg-palette-4 active:scale-[0.98] transition-all duration-200
            flex items-center justify-center gap-2"
        >
          <Camera className="w-5 h-5" />
          Grabar
        </button>
      )}

      {recordingState === 'recording' && (
        <button
          onClick={stopRecording}
          className="w-full h-14 bg-palette-7 text-foreground rounded-2xl font-medium
            hover:bg-palette-5 active:scale-[0.98] transition-all duration-200
            flex items-center justify-center gap-2"
        >
          <span className="w-4 h-4 rounded-sm bg-foreground" />
          Detener grabación
        </button>
      )}

      {recordingState === 'preview' && (
        <>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-14 bg-palette-2 text-foreground rounded-2xl font-medium
              hover:bg-palette-4 active:scale-[0.98] transition-all duration-200
              flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {isSubmitting ? 'Enviando...' : 'Enviar contribución'}
          </button>
          <button
            onClick={resetRecording}
            disabled={isSubmitting}
            className="w-full h-12 bg-transparent border border-border text-foreground rounded-2xl font-medium
              hover:bg-palette-1 active:scale-[0.98] transition-all duration-200
              flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <RotateCcw className="w-4 h-4" />
            Grabar de nuevo
          </button>
        </>
      )}
    </>
  )

  return (
    <AppLayout title={`Grabar: ${displayName}`}>
      <div className="px-4 md:px-6 py-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground
            transition-colors mb-6 animate-fade-in-up"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Volver</span>
        </button>

        <div className="md:flex md:gap-8 max-w-4xl mx-auto">
          {/* Cámara */}
          <div className="flex-1 mb-6 md:mb-0 animate-fade-in-up">
            <div className="relative aspect-[4/3] bg-palette-1 rounded-3xl border border-border overflow-hidden">
              <video
                ref={videoRef}
                muted
                autoPlay
                playsInline
                className={cn(
                  'w-full h-full object-cover scale-x-[-1]',
                  recordingState === 'idle' || recordingState === 'preview' ? 'hidden' : 'block',
                )}
              />
              <video
                ref={previewRef}
                controls
                playsInline
                className={cn('w-full h-full object-cover', recordingState === 'preview' ? 'block' : 'hidden')}
              />

              {recordingState === 'idle' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-palette-3 flex items-center justify-center mb-4">
                    <Camera className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">La cámara se abrirá al iniciar</p>
                </div>
              )}
              {recordingState === 'requesting' && (
                <div className="absolute inset-0 flex items-center justify-center bg-palette-1">
                  <p className="text-muted-foreground">Solicitando acceso a la cámara...</p>
                </div>
              )}
              {recordingState === 'countdown' && (
                <div className="absolute inset-0 flex items-center justify-center bg-foreground/10">
                  <span className="text-8xl font-bold text-palette-2 animate-pulse">{countdown}</span>
                </div>
              )}
              {recordingState === 'recording' && (
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-palette-7 rounded-full">
                  <span className="w-2.5 h-2.5 rounded-full bg-palette-2 animate-pulse" />
                  <span className="text-foreground text-sm font-medium">Grabando</span>
                </div>
              )}
            </div>

            {/* Botones mobile */}
            <div className="mt-4 flex flex-col gap-3 md:hidden">
              <ActionButtons />
            </div>
          </div>

          {/* Panel lateral */}
          <div className="md:w-[320px] animate-fade-in-up">
            {/* Seña a grabar */}
            <div className={cn('rounded-3xl border border-border p-6 mb-6', PALETTE_COLORS[signIndex % PALETTE_COLORS.length])}>
              <p className="text-sm text-muted-foreground mb-3">Seña a grabar:</p>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-card/50 flex items-center justify-center">
                  <span className="text-4xl">{getSignEmoji(displayName, category as Category)}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{displayName}</h3>
                  <p className="text-sm text-muted-foreground">{categoryData.name}</p>
                </div>
              </div>
            </div>

            {/* Instrucciones */}
            <div className="bg-palette-1 rounded-3xl border border-border p-6 mb-6">
              <h4 className="font-semibold text-foreground mb-4">Instrucciones</h4>
              <ol className="space-y-3 text-sm text-muted-foreground">
                {[
                  'Asegúrate de tener buena iluminación',
                  'Centra tus manos en el cuadro',
                  'Realiza la seña de forma clara y lenta',
                  'Detén la grabación cuando termines',
                ].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-palette-3 flex items-center justify-center flex-shrink-0 text-foreground text-xs font-medium">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Botones desktop */}
            <div className="hidden md:flex flex-col gap-3">
              <ActionButtons />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
