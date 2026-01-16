'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetDescription,
} from '@/components/ui/sheet'
import { Download, Copy, Loader2, Check, Image } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ExportFormat } from '@/hooks/use-export'
import { Language } from '@/types'
import { useTranslations } from '@/lib/i18n/translations'

const FORMAT_INFO = {
  png: { name: 'PNG', desc: 'Lossless, transparent' },
  jpg: { name: 'JPG', desc: 'Smaller size' },
  webp: { name: 'WebP', desc: 'Best compression' },
}

interface ImageExportPanelProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isExporting: boolean
  exportFormat: ExportFormat
  setExportFormat: (format: ExportFormat) => void
  exportScale: 1 | 2 | 3
  setExportScale: (scale: 1 | 2 | 3) => void
  jpgQuality: number
  setJpgQuality: (quality: number) => void
  showWatermark: boolean
  setShowWatermark: (show: boolean) => void
  onDownload: () => void
  onCopyToClipboard: () => void
  copied: boolean
  disabled: boolean
  language: Language
}

export function ImageExportPanel({
  isOpen,
  onOpenChange,
  isExporting,
  exportFormat,
  setExportFormat,
  exportScale,
  setExportScale,
  jpgQuality,
  setJpgQuality,
  showWatermark,
  setShowWatermark,
  onDownload,
  onCopyToClipboard,
  copied,
  disabled,
  language,
}: ImageExportPanelProps) {
  const [isMobile, setIsMobile] = useState(false)
  const t = useTranslations(language)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Trigger button
  const TriggerButton = (
    <Button
      size="default"
      className="rounded-full shadow-lg h-12 sm:h-14 w-12 sm:w-auto sm:px-6 gap-2"
      disabled={disabled}
    >
      {isExporting ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Download className="w-5 h-5" />
      )}
      <span className="font-medium hidden sm:inline">{t.export.export}</span>
    </Button>
  )

  // Shared content
  const PanelContent = (
    <div className="space-y-3">
      {/* Format Selection - Inline */}
      <div className="flex items-center gap-2">
        <Label className="text-xs font-medium text-muted-foreground w-14 flex-shrink-0">{t.export.format}</Label>
        <div className="flex gap-1.5 flex-1">
          {(['png', 'jpg', 'webp'] as ExportFormat[]).map((f) => (
            <button
              key={f}
              onClick={() => setExportFormat(f)}
              className={cn(
                'flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all uppercase',
                exportFormat === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              {FORMAT_INFO[f].name}
            </button>
          ))}
        </div>
      </div>

      {/* Quality Slider (for JPG and WebP) */}
      {(exportFormat === 'jpg' || exportFormat === 'webp') && (
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium text-muted-foreground w-14 flex-shrink-0">{t.export.quality}</Label>
          <div className="flex-1 flex items-center gap-2">
            <input
              type="range"
              min="0.5"
              max="1"
              step="0.01"
              value={jpgQuality}
              onChange={(e) => setJpgQuality(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs text-muted-foreground w-10 text-right">
              {Math.round(jpgQuality * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Scale Selection - Inline */}
      <div className="flex items-center gap-2">
        <Label className="text-xs font-medium text-muted-foreground w-14 flex-shrink-0">{t.export.scale}</Label>
        <div className="flex gap-1.5 flex-1">
          {([1, 2, 3] as const).map((s) => (
            <button
              key={s}
              onClick={() => setExportScale(s)}
              className={cn(
                'flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all',
                exportScale === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Resolution info */}
      <div className="text-[10px] text-muted-foreground text-center">
        {exportScale === 1 && '375×812px'}
        {exportScale === 2 && '750×1624px'}
        {exportScale === 3 && '1125×2436px'}
        {' • '}{FORMAT_INFO[exportFormat].desc}
      </div>

      {/* Watermark Toggle */}
      <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
        <div>
          <Label className="text-xs font-medium">{t.export.watermark}</Label>
          <p className="text-[10px] text-muted-foreground">{t.export.watermarkDesc}</p>
        </div>
        <Switch
          checked={showWatermark}
          onCheckedChange={setShowWatermark}
        />
      </div>
    </div>
  )

  // Footer actions
  const PanelFooter = (
    <div className="flex gap-2">
      <Button
        onClick={onCopyToClipboard}
        variant="outline"
        className="flex-1 h-10 text-xs"
        disabled={isExporting}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 mr-1.5 text-green-500" />
            {t.export.copied}
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 mr-1.5" />
            {t.export.copyToClipboard}
          </>
        )}
      </Button>
      <Button
        onClick={onDownload}
        className="flex-1 h-10 text-xs"
        disabled={isExporting}
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            {t.export.downloading}
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-1.5" />
            {t.export.download}
          </>
        )}
      </Button>
    </div>
  )

  // Mobile: Bottom Sheet
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>
          {TriggerButton}
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8 pt-4">
          {/* Drag handle */}
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-3" />
          
          <SheetHeader className="text-left mb-3">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Image className="w-4 h-4" />
              {t.export.exportOptions}
            </SheetTitle>
            <SheetDescription className="text-xs">
              {t.export.format} • {t.export.scale} • {t.export.quality}
            </SheetDescription>
          </SheetHeader>

          {PanelContent}

          <SheetFooter className="mt-4">
            {PanelFooter}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  // Desktop: Popover
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {TriggerButton}
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end" sideOffset={12}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">{t.export.exportOptions}</h3>
          <span className="text-xs text-muted-foreground">
            {FORMAT_INFO[exportFormat].name} • {exportScale}x
          </span>
        </div>

        {PanelContent}

        <div className="mt-4">
          {PanelFooter}
        </div>
      </PopoverContent>
    </Popover>
  )
}
