'use client'

import { useCallback, useState, useRef } from 'react'

// Dynamic import for html-to-image to reduce initial bundle size (~50KB)
const loadHtmlToImage = () => import('html-to-image')

export type ExportFormat = 'png' | 'jpg' | 'webp'

interface ExportOptions {
  quality?: number
  pixelRatio?: number
  backgroundColor?: string
  addWatermark?: boolean
  watermarkText?: string
  format?: ExportFormat
  jpgQuality?: number // 0.1 - 1.0
}

interface UseExportReturn {
  exportRef: React.RefObject<HTMLDivElement>
  isExporting: boolean
  exportToPng: (filename?: string, options?: ExportOptions) => Promise<void>
  exportToFormat: (filename?: string, options?: ExportOptions) => Promise<void>
  exportToClipboard: (options?: ExportOptions) => Promise<boolean>
  error: string | null
}

const DEFAULT_OPTIONS: ExportOptions = {
  quality: 1,
  pixelRatio: 2,
  backgroundColor: '#ffffff',
  addWatermark: false,
  watermarkText: 'FakeSocialMessage',
  format: 'png',
  jpgQuality: 0.92,
}

export function useExport(): UseExportReturn {
  const exportRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addWatermarkToCanvas = useCallback(
    (dataUrl: string, watermarkText: string, format: ExportFormat = 'png', jpgQuality: number = 0.92): Promise<string> => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')

          if (!ctx) {
            reject(new Error('Could not get canvas context'))
            return
          }

          // Draw original image
          ctx.drawImage(img, 0, 0)

          // Configure watermark style
          const fontSize = Math.max(14, img.width * 0.025)
          ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
          ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'

          // Draw watermark in center-bottom
          const watermarkY = img.height - fontSize * 2
          ctx.fillText(watermarkText, img.width / 2, watermarkY)

          // Add subtle diagonal watermark pattern
          ctx.font = `${fontSize * 0.8}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
          ctx.fillStyle = 'rgba(0, 0, 0, 0.03)'
          ctx.save()
          ctx.translate(img.width / 2, img.height / 2)
          ctx.rotate(-Math.PI / 6) // -30 degrees

          const spacing = fontSize * 8
          for (let y = -img.height; y < img.height * 2; y += spacing) {
            for (let x = -img.width; x < img.width * 2; x += spacing * 2) {
              ctx.fillText(watermarkText, x, y)
            }
          }
          ctx.restore()

          // Export based on format
          const mimeType = format === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png'
          const quality = format === 'png' ? undefined : jpgQuality
          resolve(canvas.toDataURL(mimeType, quality))
        }
        img.onerror = () => reject(new Error('Failed to load image for watermark'))
        img.src = dataUrl
      })
    },
    []
  )

  const exportToFormat = useCallback(
    async (filename = 'chat-screenshot', options: ExportOptions = {}) => {
      if (!exportRef.current) {
        setError('Export element not found')
        return
      }

      const mergedOptions = { ...DEFAULT_OPTIONS, ...options }
      const format = mergedOptions.format || 'png'
      setIsExporting(true)
      setError(null)

      // React'in yeniden render etmesini bekle (forExport prop'unun uygulanması için)
      // setTimeout + multiple requestAnimationFrame ile DOM'un tamamen güncellenmesini garanti et
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              // Ek bekleme - CSS'in tamamen uygulanması için
              setTimeout(resolve, 50)
            })
          })
        }, 150)
      })

      try {
        const element = exportRef.current

        if (!element) {
          throw new Error('Export element not found after render')
        }

        // Lazy load html-to-image
        const { toPng, toJpeg } = await loadHtmlToImage()

        // Generate image based on format
        let dataUrl: string

        if (format === 'jpg') {
          dataUrl = await toJpeg(element, {
            quality: mergedOptions.jpgQuality,
            pixelRatio: mergedOptions.pixelRatio,
            backgroundColor: mergedOptions.backgroundColor || '#ffffff', // JPG needs solid bg
            cacheBust: true,
            skipFonts: true,
            filter: (node) => {
              if (node instanceof HTMLElement && node.dataset.exportIgnore) {
                return false
              }
              return true
            },
          })
        } else {
          dataUrl = await toPng(element, {
            quality: mergedOptions.quality,
            pixelRatio: mergedOptions.pixelRatio,
            backgroundColor: mergedOptions.backgroundColor,
            cacheBust: true,
            skipFonts: true,
            filter: (node) => {
              if (node instanceof HTMLElement && node.dataset.exportIgnore) {
                return false
              }
              return true
            },
          })

          // Convert to WebP if needed
          if (format === 'webp') {
            const img = new Image()
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve()
              img.onerror = reject
              img.src = dataUrl
            })
            
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.drawImage(img, 0, 0)
              dataUrl = canvas.toDataURL('image/webp', mergedOptions.jpgQuality)
            }
          }
        }

        // Add watermark if enabled
        if (mergedOptions.addWatermark && mergedOptions.watermarkText) {
          dataUrl = await addWatermarkToCanvas(
            dataUrl, 
            mergedOptions.watermarkText,
            format,
            mergedOptions.jpgQuality
          )
        }

        // Create download link
        const link = document.createElement('a')
        const ext = format === 'jpg' ? 'jpg' : format
        link.download = `${filename}-${Date.now()}.${ext}`
        link.href = dataUrl
        link.click()
      } catch (err) {
        console.error('Export failed:', err)
        setError(err instanceof Error ? err.message : 'Export failed')
      } finally {
        setIsExporting(false)
      }
    },
    [addWatermarkToCanvas]
  )

  // Legacy function for backward compatibility
  const exportToPng = useCallback(
    async (filename = 'chat-screenshot', options: ExportOptions = {}) => {
      await exportToFormat(filename, { ...options, format: 'png' })
    },
    [exportToFormat]
  )

  const exportToClipboard = useCallback(
    async (options: ExportOptions = {}): Promise<boolean> => {
      if (!exportRef.current) {
        setError('Export element not found')
        return false
      }

      const mergedOptions = { ...DEFAULT_OPTIONS, ...options }
      setIsExporting(true)
      setError(null)

      // React'in yeniden render etmesini bekle (forExport prop'unun uygulanması için)
      // setTimeout + multiple requestAnimationFrame ile DOM'un tamamen güncellenmesini garanti et
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              // Ek bekleme - CSS'in tamamen uygulanması için
              setTimeout(resolve, 50)
            })
          })
        }, 150)
      })

      try {
        const element = exportRef.current

        if (!element) {
          throw new Error('Export element not found after render')
        }

        // Lazy load html-to-image
        const { toBlob } = await loadHtmlToImage()

        // Generate PNG blob (clipboard only supports PNG)
        const blob = await toBlob(element, {
          quality: mergedOptions.quality,
          pixelRatio: mergedOptions.pixelRatio,
          backgroundColor: mergedOptions.backgroundColor,
          cacheBust: true,
          skipFonts: true,
        })

        if (!blob) {
          throw new Error('Failed to create image blob')
        }

        // Copy to clipboard
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ])

        return true
      } catch (err) {
        console.error('Clipboard export failed:', err)
        setError(err instanceof Error ? err.message : 'Clipboard export failed')
        return false
      } finally {
        setIsExporting(false)
      }
    },
    []
  )

  return {
    exportRef,
    isExporting,
    exportToPng,
    exportToFormat,
    exportToClipboard,
    error,
  }
}
