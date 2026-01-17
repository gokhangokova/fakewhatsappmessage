'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
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
  Video,
  Download,
  Loader2,
  Settings2,
  Clock,
  Film,
  RotateCcw,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { VideoFormat, VideoQuality } from '@/hooks/use-video-export'
import { Language } from '@/types'
import { useTranslations } from '@/lib/i18n/translations'

export interface VideoExportSettings {
  typingDuration: number
  messageDelay: number
  messageAppearDuration: number
  quality: VideoQuality
  format: VideoFormat
  endPauseDuration: number
}

interface VideoExportPanelProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
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
  onDownload: () => void
  settings: VideoExportSettings
  onSettingsChange: (settings: Partial<VideoExportSettings>) => void
  messageCount: number
  currentFormat: VideoFormat
  language: Language
}

export function VideoExportPanel({
  isOpen,
  onOpenChange,
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
  onDownload,
  settings,
  onSettingsChange,
  messageCount,
  currentFormat,
  language,
}: VideoExportPanelProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const t = useTranslations(language)

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const FORMAT_INFO: Record<VideoFormat, { label: string; desc: string; icon: string; ext: string }> = {
    mp4: { label: 'MP4', desc: t.video.mp4Desc, icon: '🎬', ext: '.mp4' },
    gif: { label: 'GIF', desc: t.video.gifDesc, icon: '🎞️', ext: '.gif' },
  }

  const QUALITY_INFO: Record<VideoQuality, { label: string; desc: string }> = {
    low: { label: t.video.lowQuality, desc: t.video.smallerFile },
    medium: { label: t.video.mediumQuality, desc: t.video.balanced },
    high: { label: t.video.highQuality, desc: t.video.bestQuality },
  }

  const estimatedDuration = (
    (messageCount * settings.messageDelay) + 
    (Math.ceil(messageCount / 2) * settings.typingDuration) +
    settings.endPauseDuration
  ) / 1000

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  const isWorking = isRecording || isProcessing

  // Trigger button - same for both mobile and desktop
  const TriggerButton = (
    <Button 
      size="default" 
      className="rounded-full shadow-lg h-12 sm:h-14 w-12 sm:w-36 sm:px-0 gap-2 bg-violet-500 hover:bg-violet-600 text-white border-0 justify-center"
    >
      <Film className="w-5 h-5" />
      <span className="font-medium hidden sm:inline">Video</span>
    </Button>
  )

  // Shared content for both Sheet and Dialog
  const PanelContent = (
    <div className="space-y-3">
      {/* Success Banner */}
      {hasVideo && !isWorking && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-800 dark:text-green-200">
              {FORMAT_INFO[currentFormat].icon} {t.video.videoReady}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              {formatDuration(videoDuration)} • {FORMAT_INFO[currentFormat].ext}
            </p>
          </div>
        </div>
      )}

      {/* Processing Status */}
      {isWorking && (
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

      {/* Format & Quality Selection - Compact inline */}
      {!isWorking && !hasVideo && (
        <>
          {/* Format Selection - Inline */}
          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium text-muted-foreground w-14 flex-shrink-0">{t.video.outputFormat}</Label>
            <div className="flex gap-1.5 flex-1">
              {(['mp4', 'gif'] as VideoFormat[]).map((format) => (
                <button
                  key={format}
                  onClick={() => onSettingsChange({ format })}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    settings.format === format
                      ? 'bg-violet-500 text-white'
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  <span>{FORMAT_INFO[format].icon}</span>
                  <span>{FORMAT_INFO[format].label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quality Selection - Inline */}
          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium text-muted-foreground w-14 flex-shrink-0">{t.export.quality}</Label>
            <div className="flex gap-1.5 flex-1">
              {(['low', 'medium', 'high'] as VideoQuality[]).map((q) => (
                <button
                  key={q}
                  onClick={() => onSettingsChange({ quality: q })}
                  className={cn(
                    'flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all',
                    settings.quality === q
                      ? 'bg-violet-500 text-white'
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  {QUALITY_INFO[q].label}
                </button>
              ))}
            </div>
          </div>

          {/* Speed Selection - Inline */}
          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium text-muted-foreground w-14 flex-shrink-0">{t.video.animationSpeed}</Label>
            <div className="flex gap-1.5 flex-1">
              <button
                onClick={() => onSettingsChange({ typingDuration: 3000, messageDelay: 2000, messageAppearDuration: 600 })}
                className={cn(
                  'flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all',
                  settings.typingDuration === 3000 && settings.messageDelay === 2000
                    ? 'bg-violet-500 text-white'
                    : 'bg-muted hover:bg-muted/80'
                )}
              >
                🐢 {t.video.slow}
              </button>
              <button
                onClick={() => onSettingsChange({ typingDuration: 2000, messageDelay: 1200, messageAppearDuration: 400 })}
                className={cn(
                  'flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all',
                  settings.typingDuration === 2000 && settings.messageDelay === 1200
                    ? 'bg-violet-500 text-white'
                    : 'bg-muted hover:bg-muted/80'
                )}
              >
                ⚡ {t.video.normal}
              </button>
              <button
                onClick={() => onSettingsChange({ typingDuration: 1000, messageDelay: 600, messageAppearDuration: 200 })}
                className={cn(
                  'flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all',
                  settings.typingDuration === 1000 && settings.messageDelay === 600
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
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all",
              showSettings ? "bg-muted" : "hover:bg-muted/50"
            )}
          >
            <div className="flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5" />
              <span>{t.video.animationSettings}</span>
            </div>
            <span className="text-muted-foreground">{showSettings ? '▲' : '▼'}</span>
          </button>

          {showSettings && (
            <div className="space-y-3 p-3 bg-muted/30 rounded-lg border text-xs">
              {/* Typing Duration */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{t.video.typingDuration}</Label>
                  <span className="text-muted-foreground">{(settings.typingDuration / 1000).toFixed(1)}s</span>
                </div>
                <Slider
                  value={[settings.typingDuration]}
                  onValueChange={([value]) => onSettingsChange({ typingDuration: value })}
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
                  <span className="text-muted-foreground">{(settings.messageDelay / 1000).toFixed(1)}s</span>
                </div>
                <Slider
                  value={[settings.messageDelay]}
                  onValueChange={([value]) => onSettingsChange({ messageDelay: value })}
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
                  <span className="text-muted-foreground">{settings.endPauseDuration / 1000}s</span>
                </div>
                <Slider
                  value={[settings.endPauseDuration]}
                  onValueChange={([value]) => onSettingsChange({ endPauseDuration: value })}
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

  // Footer actions
  const PanelFooter = (
    <div className="flex gap-2">
      {isWorking ? (
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
          <Button onClick={onDownload} className="flex-1 gap-1.5 bg-violet-500 hover:bg-violet-600">
            <Download className="w-4 h-4" />
            {t.export.download}
          </Button>
        </>
      ) : (
        <Button
          onClick={onStartAnimation}
          className="w-full gap-2 bg-violet-500 hover:bg-violet-600"
        >
          <Sparkles className="w-4 h-4" />
          {t.video.createVideo} {FORMAT_INFO[settings.format].label}
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
          
          <SheetHeader className="text-left mb-3">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Video className="w-4 h-4" />
              {t.video.videoExport}
            </SheetTitle>
            <SheetDescription className="text-xs">
              {t.video.videoExportDesc}
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

  // Desktop: Dialog
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {TriggerButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            {t.video.videoExport}
          </DialogTitle>
          <DialogDescription>
            {t.video.videoExportDesc}
          </DialogDescription>
        </DialogHeader>

        {PanelContent}

        <DialogFooter className="mt-2">
          {PanelFooter}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
