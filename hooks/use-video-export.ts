'use client'

import { useState, useRef, useCallback } from 'react'
import { toPng } from 'html-to-image'
import { Muxer, ArrayBufferTarget } from 'mp4-muxer'

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

const QUALITY_SETTINGS: Record<VideoQuality, { bitrate: number; pixelRatio: number; gifColors: number }> = {
  low: { bitrate: 2_000_000, pixelRatio: 1, gifColors: 64 },
  medium: { bitrate: 5_000_000, pixelRatio: 1.5, gifColors: 128 },
  high: { bitrate: 10_000_000, pixelRatio: 2, gifColors: 256 },
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
  
  const framesRef = useRef<string[]>([])
  const startTimeRef = useRef<number>(0)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const formatRef = useRef<VideoFormat>('mp4')
  const settingsRef = useRef<{ quality: VideoQuality; frameRate: number }>({ quality: 'medium', frameRate: 30 })
  const elementRef = useRef<HTMLElement | null>(null)
  const lastFrameTimeRef = useRef<number>(0)
  const isStoppedRef = useRef(false)
  const dimensionsRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 })

  // Capture element to data URL with quality-based pixelRatio
  const captureFrame = useCallback(async (element: HTMLElement, pixelRatio: number): Promise<string | null> => {
    try {
      const dataUrl = await toPng(element, {
        pixelRatio: pixelRatio,
        cacheBust: true,
        quality: 1,
      })
      return dataUrl
    } catch (err) {
      console.error('Frame capture error:', err)
      return null
    }
  }, [])

  // Load image from data URL
  const loadImage = useCallback((dataUrl: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = dataUrl
    })
  }, [])

  // Create MP4 using WebCodecs API and mp4-muxer
  const createMP4 = useCallback(async (
    frames: string[], 
    width: number, 
    height: number, 
    frameRate: number
  ): Promise<Blob> => {
    setProgressText('Initializing encoder...')
    setProgress(10)

    // Ensure dimensions are even (required for H.264)
    const evenWidth = width % 2 === 0 ? width : width + 1
    const evenHeight = height % 2 === 0 ? height : height + 1

    const quality = settingsRef.current.quality
    const bitrate = QUALITY_SETTINGS[quality].bitrate

    console.log('Creating MP4 with dimensions:', evenWidth, 'x', evenHeight, 'bitrate:', bitrate)

    // Check if WebCodecs is supported
    if (typeof VideoEncoder === 'undefined') {
      throw new Error('WebCodecs API is not supported in this browser. Please use Chrome 94+ or Edge 94+.')
    }

    // Create muxer
    const target = new ArrayBufferTarget()
    const muxer = new Muxer({
      target,
      video: {
        codec: 'avc',
        width: evenWidth,
        height: evenHeight,
      },
      fastStart: 'in-memory',
    })

    // Create canvas for frame processing
    const canvas = document.createElement('canvas')
    canvas.width = evenWidth
    canvas.height = evenHeight
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('Could not get canvas context')

    // Create video encoder
    let encodedFrames = 0
    const totalFrames = frames.length

    const encoder = new VideoEncoder({
      output: (chunk, meta) => {
        muxer.addVideoChunk(chunk, meta)
      },
      error: (err) => {
        console.error('Encoder error:', err)
      },
    })

    // Use higher profile for better quality
    const codecProfile = quality === 'high' ? 'avc1.640028' : 'avc1.4d0028' // High profile for high quality

    encoder.configure({
      codec: codecProfile,
      width: evenWidth,
      height: evenHeight,
      bitrate: bitrate,
      framerate: frameRate,
    })

    setProgressText('Encoding frames...')

    // Process each frame
    for (let i = 0; i < frames.length; i++) {
      const img = await loadImage(frames[i])
      
      // Draw image to canvas
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, evenWidth, evenHeight)
      ctx.drawImage(img, 0, 0, evenWidth, evenHeight)

      // Create video frame
      const videoFrame = new VideoFrame(canvas, {
        timestamp: (i * 1_000_000) / frameRate, // microseconds
        duration: 1_000_000 / frameRate,
      })

      // Encode frame (keyframe every 30 frames for better seeking)
      const keyFrame = i % 30 === 0
      encoder.encode(videoFrame, { keyFrame })
      videoFrame.close()

      encodedFrames++
      setProgress(10 + Math.round((encodedFrames / totalFrames) * 80))
    }

    setProgressText('Finalizing video...')
    
    // Flush encoder and finalize
    await encoder.flush()
    encoder.close()
    muxer.finalize()

    setProgress(100)

    // Get the final MP4 buffer
    const buffer = target.buffer
    return new Blob([buffer], { type: 'video/mp4' })
  }, [loadImage])

  // Create GIF from frames
  const createGIF = useCallback(async (
    frames: string[], 
    width: number, 
    height: number, 
    frameRate: number
  ): Promise<Blob> => {
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
      const frameDelay = Math.round(1000 / Math.min(frameRate, 15))
      
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

    const pixelRatio = QUALITY_SETTINGS[quality].pixelRatio

    console.log('Starting recording with format:', format, 'quality:', quality, 'pixelRatio:', pixelRatio)
    
    setError(null)
    setVideoBlob(null)
    setProgress(0)
    setProgressText('Preparing...')
    setIsRecording(true)
    setCurrentFormat(format)
    framesRef.current = []
    startTimeRef.current = Date.now()
    formatRef.current = format
    settingsRef.current = { quality, frameRate }
    elementRef.current = element
    lastFrameTimeRef.current = 0
    isStoppedRef.current = false

    try {
      const rect = element.getBoundingClientRect()
      
      // Apply pixelRatio to dimensions for higher resolution
      const scaledWidth = Math.round(rect.width * pixelRatio)
      const scaledHeight = Math.round(rect.height * pixelRatio)
      
      dimensionsRef.current = { width: scaledWidth, height: scaledHeight }
      
      // Create canvas for dimensions
      const canvas = document.createElement('canvas')
      canvas.width = scaledWidth
      canvas.height = scaledHeight
      canvasRef.current = canvas

      console.log('Recording dimensions:', scaledWidth, 'x', scaledHeight)

      setProgressText('Capturing frames...')
      
      const captureVideoFrame = async () => {
        if (isStoppedRef.current || !elementRef.current) return
        
        const now = Date.now()
        const frameInterval = 1000 / frameRate
        
        if (now - lastFrameTimeRef.current >= frameInterval) {
          const frame = await captureFrame(elementRef.current, pixelRatio)
          if (frame) {
            framesRef.current.push(frame)
            lastFrameTimeRef.current = now
          }
        }
        
        const elapsed = (now - startTimeRef.current) / 1000
        setProgress(Math.min(8, elapsed * 0.8))
        
        if (!isStoppedRef.current) {
          animationFrameRef.current = requestAnimationFrame(captureVideoFrame)
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(captureVideoFrame)
      
    } catch (err) {
      console.error('Start recording error:', err)
      setError(err instanceof Error ? err.message : 'Failed to start')
      setIsRecording(false)
    }
  }, [captureFrame])

  const stopRecording = useCallback(async () => {
    console.log('Stopping recording...')
    isStoppedRef.current = true
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    setIsProcessing(true)
    
    try {
      if (framesRef.current.length > 0 && dimensionsRef.current.width > 0) {
        console.log('Creating video from', framesRef.current.length, 'frames at', dimensionsRef.current.width, 'x', dimensionsRef.current.height)
        
        const blob = formatRef.current === 'gif'
          ? await createGIF(
              framesRef.current,
              dimensionsRef.current.width,
              dimensionsRef.current.height,
              settingsRef.current.frameRate
            )
          : await createMP4(
              framesRef.current,
              dimensionsRef.current.width,
              dimensionsRef.current.height,
              settingsRef.current.frameRate
            )
        
        setVideoBlob(blob)
        setVideoDuration((Date.now() - startTimeRef.current) / 1000)
        setProgress(100)
        setProgressText('Done!')
      } else {
        setError('No frames captured')
      }
    } catch (err) {
      console.error('Video creation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create video')
    }
    
    setIsProcessing(false)
    setIsRecording(false)
  }, [createMP4, createGIF])

  const downloadVideo = useCallback((filename?: string) => {
    if (!videoBlob) {
      console.error('No video blob to download')
      return
    }
    
    const extension = currentFormat === 'gif' ? 'gif' : 'mp4'
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
