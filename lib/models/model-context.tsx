'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { GestureRecognizer } from '@mediapipe/tasks-vision'
import type { GraphModel } from '@tensorflow/tfjs'

type Status = 'loading' | 'ready' | 'error'

interface ModelContextType {
  alphabetModel: GestureRecognizer | null
  actionModel: GraphModel | null
  alphabetStatus: Status
  actionStatus: Status
}

const ModelContext = createContext<ModelContextType>({
  alphabetModel: null,
  actionModel: null,
  alphabetStatus: 'loading',
  actionStatus: 'loading',
})

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [alphabetModel, setAlphabetModel] = useState<GestureRecognizer | null>(null)
  const [actionModel, setActionModel] = useState<GraphModel | null>(null)
  const [alphabetStatus, setAlphabetStatus] = useState<Status>('loading')
  const [actionStatus, setActionStatus] = useState<Status>('loading')

  useEffect(() => {
    loadAlphabetModel()
    loadActionModel()
  }, [])

  async function loadAlphabetModel() {
    try {
      const { FilesetResolver, GestureRecognizer } = await import('@mediapipe/tasks-vision')
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      )
      const recognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: { modelAssetPath: '/gesture_recognizer.task' },
        runningMode: 'VIDEO',
        numHands: 1,
      })
      setAlphabetModel(recognizer)
      setAlphabetStatus('ready')
    } catch (err) {
      console.error('Failed to load alphabet model:', err)
      setAlphabetStatus('error')
    }
  }

  async function loadActionModel() {
    try {
      const tf = await import('@tensorflow/tfjs')
      const model = await tf.loadGraphModel('/model.json')
      setActionModel(model as GraphModel)
      setActionStatus('ready')
    } catch (err) {
      console.error('Failed to load action model:', err)
      setActionStatus('error')
    }
  }

  return (
    <ModelContext.Provider value={{ alphabetModel, actionModel, alphabetStatus, actionStatus }}>
      {children}
    </ModelContext.Provider>
  )
}

export function useModels() {
  return useContext(ModelContext)
}
