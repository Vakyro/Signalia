'use client'

import { useState, useRef, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Camera, Upload, Video, RotateCcw, Copy, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast-provider'

type Tab = 'grabar' | 'subir'
type RecordingState = 'idle' | 'requesting' | 'countdown' | 'recording' | 'preview'
type ProcessingState = 'idle' | 'analyzing' | 'detecting' | 'interpreting' | 'done'

const MOCK_RESULT = {
  text: 'Hola, ¿cómo estás? Me llamo Ana.',
  confidence: 87,
  signs: [
    { word: 'Hola', time: '0:01' },
    { word: '¿Cómo?', time: '0:02' },
    { word: 'Estás', time: '0:03' },
    { word: 'Nombre', time: '0:05' },
    { word: 'Ana', time: '0:06' },
  ],
}

export default function TraducirPage() {
  const [activeTab, setActiveTab] = useState<Tab>('grabar')
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [countdown, setCountdown] = useState(3)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [processingState, setProcessingState] = useState<ProcessingState>('idle')
  const [copied, setCopied] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const previewRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  useEffect(() => {
    return () => {
      stopStream()
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
        videoRef.current.play()
      }

      setRecordingState('countdown')
      let count = 3
      setCountdown(count)
      await new Promise<void>((resolve) => {
        const iv = setInterval(() => {
          count--
          setCountdown(count)
          if (count === 0) { clearInterval(iv); resolve() }
        }, 1000)
      })

      chunksRef.current = []
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm'
      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setRecordedBlob(blob)
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
        if (previewRef.current) previewRef.current.src = url
        stopStream()
        setRecordingState('preview')
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
    mediaRecorderRef.current?.stop()
  }

  function startProcessing() {
    setProcessingState('analyzing')
    setTimeout(() => setProcessingState('detecting'), 1200)
    setTimeout(() => setProcessingState('interpreting'), 2400)
    setTimeout(() => setProcessingState('done'), 3600)
  }

  function resetAll() {
    stopStream()
    mediaRecorderRef.current?.stop()
    setRecordingState('idle')
    setCountdown(3)
    setRecordedBlob(null)
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
    setUploadedFile(null)
    setProcessingState('idle')
    setCopied(false)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadedFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file || !file.type.startsWith('video/')) {
      showToast('Por favor sube un archivo de video')
      return
    }
    setUploadedFile(file)
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(MOCK_RESULT.text)
    setCopied(true)
    showToast('Texto copiado al portapapeles')
    setTimeout(() => setCopied(false), 2000)
  }

  const getProcessingText = () => {
    switch (processingState) {
      case 'analyzing': return 'Analizando video...'
      case 'detecting': return 'Detectando señas...'
      case 'interpreting': return 'Interpretando frases...'
      default: return ''
    }
  }

  const switchTab = (tab: Tab) => { resetAll(); setActiveTab(tab) }

  // ── Shared: processing / result views ──────────────────────────────────────
  if (processingState !== 'idle' && processingState !== 'done') {
    return (
      <AppLayout title="Traducir">
        <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto flex flex-col items-center justify-center py-24 animate-fade-in-up">
          <Loader2 className="w-12 h-12 text-palette-2 animate-spin mb-4" />
          <p className="text-lg font-medium text-foreground">{getProcessingText()}</p>
          <div className="flex gap-1 mt-3">
            <span className="w-2 h-2 rounded-full bg-palette-2 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-palette-2 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-palette-2 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </AppLayout>
    )
  }

  if (processingState === 'done') {
    return (
      <AppLayout title="Traducir">
        <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto animate-fade-in-up">
          <div className="bg-palette-1 rounded-3xl p-6 md:p-8 border border-border shadow-sm mb-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Traducción</h3>
              <button onClick={copyToClipboard} className="p-2 rounded-xl hover:bg-palette-3 transition-colors">
                {copied
                  ? <Check className="w-5 h-5 text-foreground" />
                  : <Copy className="w-5 h-5 text-muted-foreground" />}
              </button>
            </div>
            <p className="text-xl md:text-2xl text-foreground mb-4">{MOCK_RESULT.text}</p>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-sm text-muted-foreground">Confianza:</span>
              <span className="px-3 py-1 bg-palette-3 rounded-xl text-sm font-medium text-foreground">
                {MOCK_RESULT.confidence}%
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-3">Señas detectadas:</p>
              <div className="flex flex-wrap gap-2">
                {MOCK_RESULT.signs.map((sign, i) => (
                  <span key={i} className="px-3 py-2 bg-palette-6 rounded-xl text-sm text-foreground">
                    {sign.word} <span className="text-muted-foreground">{sign.time}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={resetAll}
            className="w-full h-12 bg-palette-2 text-foreground rounded-2xl font-medium
              hover:bg-palette-4 active:scale-[0.98] transition-all duration-200
              flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Traducir otro video
          </button>
        </div>
      </AppLayout>
    )
  }

  // ── Main view ───────────────────────────────────────────────────────────────
  return (
    <AppLayout title="Traducir">
      <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto">
        {/* Tab Toggle */}
        <div className="flex gap-2 p-1 bg-palette-1 rounded-2xl w-fit mb-8">
          {(['grabar', 'subir'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => switchTab(tab)}
              className={cn(
                'px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                activeTab === tab
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span className="flex items-center gap-2">
                {tab === 'grabar' ? <Video className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                {tab === 'grabar' ? 'Grabar video' : 'Subir video'}
              </span>
            </button>
          ))}
        </div>

        {/* ── GRABAR ── */}
        {activeTab === 'grabar' && (
          <div className="animate-fade-in-up">
            <div className="relative aspect-video bg-palette-1 rounded-3xl border border-border overflow-hidden mb-6">
              {/* Live stream – mirrored */}
              <video
                ref={videoRef}
                muted
                playsInline
                className={cn(
                  'w-full h-full object-cover scale-x-[-1]',
                  recordingState === 'countdown' || recordingState === 'recording' ? 'block' : 'hidden',
                )}
              />

              {/* Recorded preview */}
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
                  <span className="text-8xl font-bold text-palette-2 drop-shadow animate-pulse">{countdown}</span>
                </div>
              )}

              {recordingState === 'recording' && (
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-palette-7 rounded-full">
                  <span className="w-2.5 h-2.5 rounded-full bg-palette-2 animate-pulse" />
                  <span className="text-foreground text-sm font-medium">Grabando</span>
                </div>
              )}
            </div>

            {recordingState === 'idle' && (
              <button
                onClick={startRecording}
                className="w-full h-14 bg-palette-2 text-foreground rounded-2xl font-medium
                  hover:bg-palette-4 active:scale-[0.98] transition-all duration-200
                  flex items-center justify-center gap-2"
              >
                <Video className="w-5 h-5" />
                Iniciar grabación
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
              <div className="flex flex-col gap-3">
                <button
                  onClick={startProcessing}
                  className="w-full h-14 bg-palette-2 text-foreground rounded-2xl font-medium
                    hover:bg-palette-4 active:scale-[0.98] transition-all duration-200"
                >
                  Traducir
                </button>
                <button
                  onClick={resetAll}
                  className="w-full h-12 bg-transparent border border-border text-foreground rounded-2xl font-medium
                    hover:bg-palette-1 active:scale-[0.98] transition-all duration-200
                    flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Grabar de nuevo
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── SUBIR ── */}
        {activeTab === 'subir' && (
          <div className="animate-fade-in-up">
            {!uploadedFile ? (
              <>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-video bg-palette-1 rounded-3xl border-2 border-dashed border-palette-3
                    flex flex-col items-center justify-center cursor-pointer
                    hover:border-palette-2 hover:bg-palette-5 transition-all duration-200 mb-6"
                >
                  <div className="w-20 h-20 rounded-full bg-palette-3 flex items-center justify-center mb-4">
                    <Upload className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <p className="text-foreground font-medium mb-2">Arrastra tu video aquí</p>
                  <p className="text-muted-foreground text-sm">.mp4, .webm, .mov — máx 100 MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-14 bg-palette-2 text-foreground rounded-2xl font-medium
                    hover:bg-palette-4 active:scale-[0.98] transition-all duration-200"
                >
                  Seleccionar video
                </button>
              </>
            ) : (
              <>
                <div className="aspect-video bg-palette-1 rounded-3xl border border-border overflow-hidden mb-6">
                  <video
                    src={URL.createObjectURL(uploadedFile)}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={startProcessing}
                    className="w-full h-14 bg-palette-2 text-foreground rounded-2xl font-medium
                      hover:bg-palette-4 active:scale-[0.98] transition-all duration-200"
                  >
                    Traducir
                  </button>
                  <button
                    onClick={resetAll}
                    className="w-full h-12 bg-transparent border border-border text-foreground rounded-2xl font-medium
                      hover:bg-palette-1 active:scale-[0.98] transition-all duration-200
                      flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Seleccionar otro video
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
