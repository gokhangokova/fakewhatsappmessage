'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
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
import {
  Download,
  Copy,
  Loader2,
  Check,
  Image,
  Video,
  Clock,
  Settings2,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Share2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ExportFormat } from '@/hooks/use-export'
import { VideoFormat, VideoQuality } from '@/hooks/use-video-export'
import { Language } from '@/types'
import { useTranslations } from '@/lib/i18n/translations'

const FORMAT_INFO = {
  png: { name: 'PNG', desc: 'Lossless, transparent' },
  jpg: { name: 'JPG', desc: 'Smaller size' },
  webp: { name: 'WebP', desc: 'Best compression' },
}

export interface VideoExportSettings {
  typingDuration: number
  messageDelay: number
  messageAppearDuration: number
  quality: VideoQuality
  format: VideoFormat
  endPauseDuration: number
}

interface ExportMenuProps {
  // Common
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  language: Language
  disabled?: boolean

  // Image export props
  isExporting: boolean
  exportFormat: ExportFormat
  setExportFormat: (format: ExportFormat) => void
  exportScale: 1 | 2 | 3
  setExportScale: (scale: 1 | 2 | 3) => void
  jpgQuality: number
  setJpgQuality: (quality: number) => void
  showWatermark: boolean
  setShowWatermark: (show: boolean) => void
  onImageDownload: () => void
  onCopyToClipboard: () => void
  copied: boolean

  // Video export props
  isAnimating: boolean
  isRecording: boolean
  isProcessing: boolean
  progress: number
  progressText: string
  hasVideo: boolean
  videoDuration: number
  onStartAnimation: () => void
  onStopAnimation: () => void
  onResetAnimation: () => void
  onVideoDownload: () => void
  videoSettings: VideoExportSettings
  onVideoSettingsChange: (settings: Partial<VideoExportSettings>) => void
  messageCount: number
  currentFormat: VideoFormat
}

type ExportTab = 'image' | 'video'

export function ExportMenu({
  isOpen,
  onOpenChange,
  language,
  disabled = false,
  // Image
  isExporting,
  exportFormat,
  setExportFormat,
  exportScale,
  setExportScale,
  jpgQuality,
  setJpgQuality,
  showWatermark,
  setShowWatermark,
  onImageDownload,
  onCopyToClipboard,
  copied,
  // Video
  isAnimating,
  isRecording,
  isProcessing,
  progress,
  progressText,
  hasVideo,
  videoDuration,
  onStartAnimation,
  onStopAnimation,
  onResetAnimation,
  onVideoDownload,
  videoSettings,
  onVideoSettingsChange,
  messageCount,
  currentFormat,
}: ExportMenuProps) {
  const [activeTab, setActiveTab] = useState<ExportTab>('image')
  const [showVideoSettings, setShowVideoSettings] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const t = useTranslations(language)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const VIDEO_FORMAT_INFO: Record<VideoFormat, { label: string; desc: string; icon: string; ext: string }> = {
    mp4: { label: 'MP4', desc: t.video.mp4Desc, icon: '🎬', ext: '.mp4' },
    gif: { label: 'GIF', desc: t.video.gifDesc, icon: '🎞️', ext: '.gif' },
  }

  const QUALITY_INFO: Record<VideoQuality, { label: string; desc: string }> = {
    low: { label: t.video.lowQuality, desc: t.video.smallerFile },
    medium: { label: t.video.mediumQuality, desc: t.video.balanced },
    high: { label: t.video.highQuality, desc: t.video.bestQuality },
  }

  const estimatedDuration = (
    (messageCount * videoSettings.messageDelay) +
    (Math.ceil(messageCount / 2) * videoSettings.typingDuration) +
    videoSettings.endPauseDuration
  ) / 1000

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  const isVideoWorking = isRecording || isProcessing

  // Trigger button
  const TriggerButton = (
    <Button
      size="default"
      className="rounded-full shadow-lg h-14 sm:h-14 w-14 sm:w-36 sm:px-0 gap-2 justify-center active:scale-95 transition-transform"
      disabled={disabled || isExporting || isVideoWorking}
    >
      {isExporting || isVideoWorking ? (
        <Loader2 className="w-6 h-6 sm:w-5 sm:h-5 animate-spin" />
      ) : (
        <Share2 className="w-6 h-6 sm:w-5 sm:h-5" />
      )}
      <span className="font-medium hidden sm:inline">{t.export.export}</span>
    </Button>
  )

  // Tab Header
  const TabHeader = (
    <div className="flex bg-muted rounded-lg p-1 mb-4">
      <button
        onClick={() => setActiveTab('image')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-md text-sm font-medium transition-all active:scale-[0.98]',
          activeTab === 'image'
            ? 'bg-background shadow-sm text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Image className="w-4 h-4" />
        <span>{t.export.imageExport}</span>
      </button>
      <button
        onClick={() => setActiveTab('video')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-md text-sm font-medium transition-all active:scale-[0.98]',
          activeTab === 'video'
            ? 'bg-background shadow-sm text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Video className="w-4 h-4" />
        <span>{t.export.videoExport}</span>
      </button>
    </div>
  )

  // Image Export Content
  const ImageContent = (
    <div className="space-y-3">
      {/* Format Selection */}
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

      {/* Scale Selection */}
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

  // Image Footer
  const ImageFooter = (
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
        onClick={onImageDownload}
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

  // Video Export Content
  const VideoContent = (
    <div className="space-y-3">
      {/* Success Banner */}
      {hasVideo && !isVideoWorking && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-800 dark:text-green-200">
              {VIDEO_FORMAT_INFO[currentFormat].icon} {t.video.videoReady}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              {formatDuration(videoDuration)} • {VIDEO_FORMAT_INFO[currentFormat].ext}
            </p>
          </div>
        </div>
      )}

      {/* Processing Status */}
      {isVideoWorking && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-3 bg-violet-50 dark:bg-violet-950 rounded-lg border border-violet-200 dark:border-violet-800">
            <Loader2 className="w-4 h-4 animate-spin text-violet-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-violet-800 dark:text-violet-200">
                {progressText || t.video.creatingVideo}
              </p>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-violet-500 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Settings - only when not working and no video ready */}
      {!isVideoWorking && !hasVideo && (
        <>
          {/* Format Selection */}
          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium text-muted-foreground w-14 flex-shrink-0">{t.video.outputFormat}</Label>
            <div className="flex gap-1.5 flex-1">
              {(['mp4', 'gif'] as VideoFormat[]).map((format) => (
                <button
                  key={format}
                  onClick={() => onVideoSettingsChange({ format })}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    videoSettings.format === format
                      ? 'bg-violet-500 text-white'
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  <span>{VIDEO_FORMAT_INFO[format].icon}</span>
                  <span>{VIDEO_FORMAT_INFO[format].label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quality Selection */}
          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium text-muted-foreground w-14 flex-shrink-0">{t.export.quality}</Label>
            <div className="flex gap-1.5 flex-1">
              {(['low', 'medium', 'high'] as VideoQuality[]).map((q) => (
                <button
                  key={q}
                  onClick={() => onVideoSettingsChange({ quality: q })}
                  className={cn(
                    'flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all',
                    videoSettings.quality === q
                      ? 'bg-violet-500 text-white'
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  {QUALITY_INFO[q].label}
                </button>
              ))}
            </div>
          </div>

          {/* Speed Selection */}
          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium text-muted-foreground w-14 flex-shrink-0">{t.video.animationSpeed}</Label>
            <div className="flex gap-1.5 flex-1">
              <button
                onClick={() => onVideoSettingsChange({ typingDuration: 3000, messageDelay: 2000, messageAppearDuration: 600 })}
                className={cn(
                  'flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all',
                  videoSettings.typingDuration === 3000 && videoSettings.messageDelay === 2000
                    ? 'bg-violet-500 text-white'
                    : 'bg-muted hover:bg-muted/80'
                )}
              >
                🐢 {t.video.slow}
              </button>
              <button
                onClick={() => onVideoSettingsChange({ typingDuration: 2000, messageDelay: 1200, messageAppearDuration: 400 })}
                className={cn(
                  'flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all',
                  videoSettings.typingDuration === 2000 && videoSettings.messageDelay === 1200
                    ? 'bg-violet-500 text-white'
                    : 'bg-muted hover:bg-muted/80'
                )}
              >
                ⚡ {t.video.normal}
              </button>
              <button
                onClick={() => onVideoSettingsChange({ typingDuration: 1000, messageDelay: 600, messageAppearDuration: 200 })}
                className={cn(
                  'flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all',
                  videoSettings.typingDuration === 1000 && videoSettings.messageDelay === 600
                    ? 'bg-violet-500 text-white'
                    : 'bg-muted hover:bg-muted/80'
                )}
              >
                🚀 {t.video.fast}
              </button>
            </div>
          </div>

          {/* Duration & Messages Info */}
          <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg text-xs">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span>~{formatDuration(estimatedDuration)}</span>
            </div>
            <span className="text-muted-foreground">{messageCount} {t.editor.messages.toLowerCase()}</span>
          </div>

          {/* Advanced Settings Toggle */}
          <button
            onClick={() => setShowVideoSettings(!showVideoSettings)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all",
              showVideoSettings ? "bg-muted" : "hover:bg-muted/50"
            )}
          >
            <div className="flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5" />
              <span>{t.video.animationSettings}</span>
            </div>
            <span className="text-muted-foreground">{showVideoSettings ? '▲' : '▼'}</span>
          </button>

          {showVideoSettings && (
            <div className="space-y-3 p-3 bg-muted/30 rounded-lg border text-xs">
              {/* Typing Duration */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{t.video.typingDuration}</Label>
                  <span className="text-muted-foreground">{(videoSettings.typingDuration / 1000).toFixed(1)}s</span>
                </div>
                <Slider
                  value={[videoSettings.typingDuration]}
                  onValueChange={([value]) => onVideoSettingsChange({ typingDuration: value })}
                  min={500}
                  max={5000}
                  step={100}
                  className="h-4"
                />
              </div>

              {/* Message Delay */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{t.video.messageDelay}</Label>
                  <span className="text-muted-foreground">{(videoSettings.messageDelay / 1000).toFixed(1)}s</span>
                </div>
                <Slider
                  value={[videoSettings.messageDelay]}
                  onValueChange={([value]) => onVideoSettingsChange({ messageDelay: value })}
                  min={200}
                  max={4000}
                  step={100}
                  className="h-4"
                />
              </div>

              {/* End Pause */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{t.video.endPause}</Label>
                  <span className="text-muted-foreground">{videoSettings.endPauseDuration / 1000}s</span>
                </div>
                <Slider
                  value={[videoSettings.endPauseDuration]}
                  onValueChange={([value]) => onVideoSettingsChange({ endPauseDuration: value })}
                  min={500}
                  max={5000}
                  step={500}
                  className="h-4"
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )

  // Video Footer
  const VideoFooter = (
    <div className="flex gap-2">
      {isVideoWorking ? (
        <Button
          variant="outline"
          onClick={onStopAnimation}
          disabled={isProcessing}
          className="flex-1"
        >
          {t.common.cancel}
        </Button>
      ) : hasVideo ? (
        <>
          <Button
            variant="outline"
            onClick={onResetAnimation}
            className="flex-1 gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            {t.video.createAnother}
          </Button>
          <Button onClick={onVideoDownload} className="flex-1 gap-1.5 bg-violet-500 hover:bg-violet-600">
            <Download className="w-4 h-4" />
            {t.export.download}
          </Button>
        </>
      ) : (
        <Button
          onClick={onStartAnimation}
          disabled={messageCount === 0}
          className="w-full gap-2 bg-violet-500 hover:bg-violet-600"
        >
          <Sparkles className="w-4 h-4" />
          {t.video.createVideo} {VIDEO_FORMAT_INFO[videoSettings.format].label}
        </Button>
      )}
    </div>
  )

  // Mobile: Bottom Sheet
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>
          {TriggerButton}
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8 pt-4 max-h-[85vh] overflow-y-auto">
          {/* Drag handle */}
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-3" />

          <SheetHeader className="text-left mb-2 sr-only">
            <SheetTitle>{t.export.export}</SheetTitle>
            <SheetDescription>{t.export.exportOptions}</SheetDescription>
          </SheetHeader>

          {TabHeader}

          {activeTab === 'image' ? ImageContent : VideoContent}

          <SheetFooter className="mt-4">
            {activeTab === 'image' ? ImageFooter : VideoFooter}
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
      <PopoverContent className="w-96" align="end" sideOffset={12}>
        {TabHeader}

        {activeTab === 'image' ? ImageContent : VideoContent}

        <div className="mt-4">
          {activeTab === 'image' ? ImageFooter : VideoFooter}
        </div>
      </PopoverContent>
    </Popover>
  )
}
