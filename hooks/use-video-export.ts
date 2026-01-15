'use client'

import { useState, useRef, useCallback } from 'react'
import { toPng } from 'html-to-image'

export type VideoFormat = 'mp4' | 'gif'
export type VideoQuality = 'low' | 'medium' | 'high'

export interface VideoExportOptions {
  format: VideoFormat
  quality: VideoQuality
  frameRate: number
}

interface UseVideoExportReturn {
  isRecording: boolean
  isProcessing: boolean
  progress: number
  progressText: string
  error: string | null
  startRecording: (element: HTMLElement, options?: Partial<VideoExportOptions>) => Promise<void>
  stopRecording: () => void
  downloadVideo: (filename?: string) => void
  reset: () => void
  videoBlob: Blob | null
  videoDuration: number
  currentFormat: VideoFormat
}

const QUALITY_SETTINGS: Record<VideoQuality, { bitrate: number; gifColors: number }> = {
  low: { bitrate: 1_000_000, gifColors: 64 },
  medium: { bitrate: 2_500_000, gifColors: 128 },
  high: { bitrate: 5_000_000, gifColors: 256 },
}

export function useVideoExport(): UseVideoExportReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [videoDuration, setVideoDuration] = useState(0)
  const [currentFormat, setCurrentFormat] = useState<VideoFormat>('mp4')
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const framesRef = useRef<string[]>([])
  const startTimeRef = useRef<number>(0)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const formatRef = useRef<VideoFormat>('mp4')
  const settingsRef = useRef<{ quality: VideoQuality; frameRate: number }>({ quality: 'medium', frameRate: 30 })
  const elementRef = useRef<HTMLElement | null>(null)
  const lastFrameTimeRef = useRef<number>(0)
  const isStoppedRef = useRef(false)

  // Capture element to data URL
  const captureFrame = useCallback(async (element: HTMLElement): Promise<string | null> => {
    try {
      const dataUrl = await toPng(element, {
        pixelRatio: 1,
        cacheBust: true,
      })
      return dataUrl
    } catch (err) {
      console.error('Frame capture error:', err)
      return null
    }
  }, [])

  // Draw frame to canvas
  const drawToCanvas = useCallback((dataUrl: string, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): Promise<void> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve()
      }
      img.onerror = () => resolve()
      img.src = dataUrl
    })
  }, [])

  // Create GIF from frames using worker
  const createGif = useCallback(async (frames: string[], width: number, height: number, frameDelay: number): Promise<Blob> => {
    setProgressText('Creating GIF...')
    setProgress(50)
    
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      const worker = new Worker('/gif.worker.js')
      
      worker.postMessage({
        type: 'start',
        width,
        height,
        delay: frameDelay,
        quality: QUALITY_SETTINGS[settingsRef.current.quality].gifColors,
        repeat: 0,
      })

      let frameIndex = 0
      
      const processNextFrame = async () => {
        if (frameIndex >= frames.length) {
          worker.postMessage({ type: 'finish' })
          return
        }

        const img = new Image()
        img.onload = () => {
          ctx.clearRect(0, 0, width, height)
          ctx.drawImage(img, 0, 0, width, height)
          const imageData = ctx.getImageData(0, 0, width, height)
          
          worker.postMessage({
            type: 'frame',
            data: imageData.data,
            index: frameIndex,
            total: frames.length,
          })
          
          frameIndex++
          setProgress(50 + Math.round((frameIndex / frames.length) * 45))
          
          setTimeout(processNextFrame, 0)
        }
        img.onerror = () => {
          frameIndex++
          setTimeout(processNextFrame, 0)
        }
        img.src = frames[frameIndex]
      }

      worker.onmessage = (e) => {
        if (e.data.type === 'finished') {
          const blob = new Blob([e.data.data], { type: 'image/gif' })
          worker.terminate()
          setProgress(100)
          resolve(blob)
        } else if (e.data.type === 'error') {
          worker.terminate()
          reject(new Error('GIF creation failed'))
        }
      }

      worker.onerror = (err) => {
        console.error('GIF worker error:', err)
        worker.terminate()
        reject(new Error('GIF worker error'))
      }

      processNextFrame()
    })
  }, [])

  const startRecording = useCallback(async (
    element: HTMLElement,
    options: Partial<VideoExportOptions> = {}
  ) => {
    const {
      format = 'mp4',
      quality = 'medium',
      frameRate = 30,
    } = options

    console.log('Starting recording with format:', format, 'quality:', quality)
    
    setError(null)
    setVideoBlob(null)
    setProgress(0)
    setProgressText('Preparing...')
    setIsRecording(true)
    setCurrentFormat(format)
    chunksRef.current = []
    framesRef.current = []
    startTimeRef.current = Date.now()
    formatRef.current = format
    settingsRef.current = { quality, frameRate }
    elementRef.current = element
    lastFrameTimeRef.current = 0
    isStoppedRef.current = false

    try {
      const settings = QUALITY_SETTINGS[quality]
      const rect = element.getBoundingClientRect()
      
      // Create canvas
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(rect.width)
      canvas.height = Math.round(rect.height)
      canvasRef.current = canvas
      
      const ctx = canvas.getContext('2d', { alpha: false })
      if (!ctx) throw new Error('Could not get canvas context')

      if (format === 'gif') {
        // For GIF: capture frames as data URLs
        setProgressText('Capturing frames...')
        
        const captureGifFrame = async () => {
          if (isStoppedRef.current || !elementRef.current) return
          
          const now = Date.now()
          const frameInterval = 1000 / frameRate
          
          if (now - lastFrameTimeRef.current >= frameInterval) {
            const frame = await captureFrame(elementRef.current)
            if (frame) {
              framesRef.current.push(frame)
              lastFrameTimeRef.current = now
            }
          }
          
          const elapsed = (now - startTimeRef.current) / 1000
          setProgress(Math.min(45, elapsed * 3))
          
          if (!isStoppedRef.current) {
            animationFrameRef.current = requestAnimationFrame(captureGifFrame)
          }
        }
        
        animationFrameRef.current = requestAnimationFrame(captureGifFrame)
        
      } else {
        // For MP4: use MediaRecorder with WebM (compatible with VLC and most players)
        setProgressText('Creating video...')
        
        const stream = canvas.captureStream(frameRate)
        streamRef.current = stream
        
        // Try different codecs
        let mimeType = 'video/webm;codecs=vp9'
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm;codecs=vp8'
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm'
        }
        
        console.log('Using mimeType:', mimeType)
        
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: settings.bitrate,
        })
        
        mediaRecorderRef.current = mediaRecorder
        
        mediaRecorder.ondataavailable = (event) => {
          console.log('Data available:', event.data.size)
          if (event.data.size > 0) {
            chunksRef.current.push(event.data)
          }
        }
        
        mediaRecorder.onstop = async () => {
          console.log('MediaRecorder stopped, chunks:', chunksRef.current.length)
          setIsProcessing(true)
          setProgressText('Finalizing video...')
          setProgress(90)
          
          try {
            if (chunksRef.current.length > 0) {
              const blob = new Blob(chunksRef.current, { type: 'video/webm' })
              console.log('Video blob created:', blob.size)
              setVideoBlob(blob)
              setVideoDuration((Date.now() - startTimeRef.current) / 1000)
              setProgress(100)
              setProgressText('Done!')
            } else {
              setError('No video data captured')
            }
          } catch (err) {
            console.error('Video processing error:', err)
            setError('Failed to process video')
          }
          
          setIsProcessing(false)
          setIsRecording(false)
          
          streamRef.current?.getTracks().forEach(track => track.stop())
        }
        
        mediaRecorder.onerror = (event) => {
          console.error('MediaRecorder error:', event)
          setError('Video creation failed')
          setIsRecording(false)
        }
        
        mediaRecorder.start(100)
        console.log('MediaRecorder started')
        
        // Capture frames to canvas continuously
        const captureVideoFrame = async () => {
          if (isStoppedRef.current) return
          if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
            return
          }
          
          const frame = await captureFrame(element)
          if (frame && canvasRef.current && ctx) {
            await drawToCanvas(frame, canvasRef.current, ctx)
          }
          
          const elapsed = (Date.now() - startTimeRef.current) / 1000
          setProgress(Math.min(80, elapsed * 5))
          
          if (!isStoppedRef.current) {
            animationFrameRef.current = requestAnimationFrame(captureVideoFrame)
          }
        }
        
        // Capture initial frame
        const initialFrame = await captureFrame(element)
        if (initialFrame) {
          await drawToCanvas(initialFrame, canvas, ctx)
        }
        animationFrameRef.current = requestAnimationFrame(captureVideoFrame)
      }
      
    } catch (err) {
      console.error('Start recording error:', err)
      setError(err instanceof Error ? err.message : 'Failed to start')
      setIsRecording(false)
    }
  }, [captureFrame, drawToCanvas])

  const stopRecording = useCallback(async () => {
    console.log('Stopping recording...')
    isStoppedRef.current = true
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    if (formatRef.current === 'gif') {
      // Process GIF
      setIsProcessing(true)
      setProgressText('Creating GIF...')
      
      try {
        if (framesRef.current.length > 0 && canvasRef.current) {
          console.log('Creating GIF from', framesRef.current.length, 'frames')
          const frameDelay = Math.round(1000 / settingsRef.current.frameRate)
          const blob = await createGif(
            framesRef.current,
            canvasRef.current.width,
            canvasRef.current.height,
            frameDelay
          )
          setVideoBlob(blob)
          setVideoDuration((Date.now() - startTimeRef.current) / 1000)
          setProgress(100)
          setProgressText('Done!')
        } else {
          setError('No frames captured')
        }
      } catch (err) {
        console.error('GIF error:', err)
        setError('Failed to create GIF')
      }
      
      setIsProcessing(false)
      setIsRecording(false)
    } else {
      // Stop MediaRecorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        console.log('Stopping MediaRecorder...')
        mediaRecorderRef.current.stop()
      } else {
        console.log('MediaRecorder not recording:', mediaRecorderRef.current?.state)
        setIsRecording(false)
      }
    }
  }, [createGif])

  const downloadVideo = useCallback((filename?: string) => {
    if (!videoBlob) {
      console.error('No video blob to download')
      return
    }
    
    // MP4 format uses WebM internally but with .mp4 extension for compatibility
    const extension = currentFormat === 'gif' ? 'gif' : 'webm'
    const defaultName = `whatsapp-chat-${Date.now()}.${extension}`
    
    console.log('Downloading video:', defaultName, videoBlob.size)
    
    const url = URL.createObjectURL(videoBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || defaultName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [videoBlob, currentFormat])

  const reset = useCallback(() => {
    console.log('Resetting video export state')
    setVideoBlob(null)
    setVideoDuration(0)
    setProgress(0)
    setProgressText('')
    setError(null)
    setIsRecording(false)
    setIsProcessing(false)
    chunksRef.current = []
    framesRef.current = []
  }, [])

  return {
    isRecording,
    isProcessing,
    progress,
    progressText,
    error,
    startRecording,
    stopRecording,
    downloadVideo,
    reset,
    videoBlob,
    videoDuration,
    currentFormat,
  }
}
