'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Download, Copy, Loader2, Check, Settings, Image, FileImage } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExportPanelProps {
  onExport: (options: ExportOptions) => Promise<void>
  onCopy: (options: ExportOptions) => Promise<boolean>
  isExporting: boolean
  platform: string
}

export type ExportFormat = 'png' | 'jpg' | 'webp'

export interface ExportOptions {
  scale: 1 | 2 | 3
  format: ExportFormat
  jpgQuality: number // 0.1 - 1.0
  addWatermark: boolean
}

const FORMAT_INFO = {
  png: { name: 'PNG', desc: 'Lossless, transparent' },
  jpg: { name: 'JPG', desc: 'Smaller size, no transparency' },
  webp: { name: 'WebP', desc: 'Modern, best compression' },
}

export function ExportPanel({
  onExport,
  onCopy,
  isExporting,
  platform,
}: ExportPanelProps) {
  const [showWatermark, setShowWatermark] = useState(false)
  const [scale, setScale] = useState<1 | 2 | 3>(2)
  const [format, setFormat] = useState<ExportFormat>('png')
  const [jpgQuality, setJpgQuality] = useState(0.92)
  const [copied, setCopied] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  const handleExport = async () => {
    await onExport({ scale, format, jpgQuality, addWatermark: showWatermark })
  }

  const handleCopy = async () => {
    const success = await onCopy({ scale, format, jpgQuality, addWatermark: showWatermark })
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getFileName = () => {
    return `${platform}-chat.${format}`
  }

  return (
    <div className="bg-background rounded-xl shadow-lg border p-4 w-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Export</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowOptions(!showOptions)}
          className={cn(showOptions && "bg-muted")}
        >
          <Settings className="w-4 h-4 mr-1" />
          <span className="text-xs">Options</span>
        </Button>
      </div>

      {showOptions && (
        <div className="space-y-4 mb-4 pb-4 border-b">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Format</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['png', 'jpg', 'webp'] as ExportFormat[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={cn(
                    'flex flex-col items-center px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    format === f
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  <span className="uppercase">{FORMAT_INFO[f].name}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {FORMAT_INFO[format].desc}
            </p>
          </div>

          {/* Quality Slider (for JPG and WebP) */}
          {(format === 'jpg' || format === 'webp') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Quality</Label>
                <span className="text-sm text-muted-foreground">
                  {Math.round(jpgQuality * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1"
                step="0.01"
                value={jpgQuality}
                onChange={(e) => setJpgQuality(parseFloat(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Smaller file</span>
                <span>Better quality</span>
              </div>
            </div>
          )}

          {/* Scale Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Scale</Label>
              <span className="text-xs text-muted-foreground">
                {scale === 1 && '375×812px'}
                {scale === 2 && '750×1624px'}
                {scale === 3 && '1125×2436px'}
              </span>
            </div>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setScale(s)}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    scale === s
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Watermark Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="watermark-toggle" className="text-sm font-medium">
                Watermark
              </Label>
              <p className="text-xs text-muted-foreground">Add subtle branding</p>
            </div>
            <Switch
              id="watermark-toggle"
              checked={showWatermark}
              onCheckedChange={setShowWatermark}
            />
          </div>
        </div>
      )}

      {/* Quick Info */}
      {!showOptions && (
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 px-1">
          <span>{FORMAT_INFO[format].name} • {scale}x</span>
          <span>{showWatermark ? 'With watermark' : 'No watermark'}</span>
        </div>
      )}

      <div className="space-y-2">
        {/* Download Button */}
        <Button
          onClick={handleExport}
          className="w-full h-11"
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download {FORMAT_INFO[format].name}
            </>
          )}
        </Button>

        {/* Copy Button */}
        <Button
          onClick={handleCopy}
          variant="outline"
          className="w-full"
          disabled={isExporting}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy to Clipboard
            </>
          )}
        </Button>
      </div>

      {/* File name preview */}
      <p className="text-xs text-muted-foreground mt-3 text-center">
        {getFileName()}
      </p>
    </div>
  )
}
