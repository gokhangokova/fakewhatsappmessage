'use client'

import { useState } from 'react'
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
  const t = useTranslations(language)

  const FORMAT_INFO: Record<VideoFormat, { label: string; desc: string; icon: string; ext: string }> = {
    mp4: { label: 'MP4 Video', desc: t.video.mp4Desc, icon: '🎬', ext: '.mp4' },
    gif: { label: 'Animated GIF', desc: t.video.gifDesc, icon: '🎞️', ext: '.gif' },
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button 
          size="default" 
          className="rounded-full shadow-lg h-12 sm:h-14 w-12 sm:w-auto sm:px-6 gap-2 bg-violet-500 hover:bg-violet-600 text-white border-0"
        >
          <Film className="w-5 h-5" />
          <span className="font-medium hidden sm:inline">Video</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            {t.video.videoExport}
          </DialogTitle>
          <DialogDescription>
            {t.video.videoExportDesc}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3 sm:py-4">
          {/* Success Banner */}
          {hasVideo && !isWorking && (
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-xl border border-green-200 dark:border-green-800">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                  {FORMAT_INFO[currentFormat].icon} {FORMAT_INFO[currentFormat].label} {t.video.videoReady}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {t.video.duration}: {formatDuration(videoDuration)} • {FORMAT_INFO[currentFormat].ext}
                </p>
              </div>
              <Button size="sm" onClick={onDownload} className="gap-1.5 flex-shrink-0">
                <Download className="w-4 h-4" />
                {t.export.download}
              </Button>
            </div>
          )}

          {/* Processing Status */}
          {isWorking && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-violet-50 dark:bg-violet-950 rounded-xl border border-violet-200 dark:border-violet-800">
                <Loader2 className="w-5 h-5 animate-spin text-violet-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-violet-800 dark:text-violet-200">
                    {progressText || t.video.creatingVideo}
                  </p>
                  <p className="text-xs text-violet-600 dark:text-violet-400">
                    {t.video.pleaseWait}
                  </p>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-violet-500 h-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center font-medium">
                  {Math.round(progress)}% {t.video.complete}
                </p>
              </div>
            </div>
          )}

          {/* Format Selection */}
          {!isWorking && !hasVideo && (
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm font-semibold">{t.video.outputFormat}</Label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {(['mp4', 'gif'] as VideoFormat[]).map((format) => (
                  <button
                    key={format}
                    onClick={() => onSettingsChange({ format })}
                    className={cn(
                      'flex flex-col items-center p-3 sm:p-4 rounded-xl border-2 transition-all',
                      settings.format === format
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-950 shadow-sm'
                        : 'border-muted hover:border-muted-foreground/30 hover:bg-muted/50'
                    )}
                  >
                    <span className="text-2xl sm:text-3xl mb-1 sm:mb-2">{FORMAT_INFO[format].icon}</span>
                    <span className="text-xs sm:text-sm font-semibold">{FORMAT_INFO[format].label}</span>
                    <span className="text-[10px] sm:text-[11px] text-muted-foreground text-center mt-0.5 sm:mt-1">
                      {FORMAT_INFO[format].desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quality Selection */}
          {!isWorking && !hasVideo && (
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm font-semibold">{t.export.quality}</Label>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {(['low', 'medium', 'high'] as VideoQuality[]).map((q) => (
                  <button
                    key={q}
                    onClick={() => onSettingsChange({ quality: q })}
                    className={cn(
                      'px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all',
                      settings.quality === q
                        ? 'bg-violet-500 text-white shadow-sm'
                        : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    {QUALITY_INFO[q].label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Estimated Duration */}
          {!hasVideo && !isWorking && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{t.video.estimatedDuration}</span>
              </div>
              <span className="text-sm font-semibold">~{formatDuration(estimatedDuration)}</span>
            </div>
          )}

          {/* Advanced Settings Toggle */}
          {!isWorking && !hasVideo && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className={cn("w-full justify-start", showSettings && "bg-muted")}
              >
                <Settings2 className="w-4 h-4 mr-2" />
                {t.video.animationSettings}
                <span className="ml-auto text-xs text-muted-foreground">
                  {messageCount} {t.editor.messages.toLowerCase()}
                </span>
              </Button>

              {showSettings && (
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                  {/* Typing Duration */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">{t.video.typingDuration}</Label>
                      <span className="text-xs text-muted-foreground font-medium">
                        {(settings.typingDuration / 1000).toFixed(1)}s
                      </span>
                    </div>
                    <Slider
                      value={[settings.typingDuration]}
                      onValueChange={([value]) => onSettingsChange({ typingDuration: value })}
                      min={500}
                      max={5000}
                      step={100}
                    />
                  </div>

                  {/* Message Delay */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">{t.video.messageDelay}</Label>
                      <span className="text-xs text-muted-foreground font-medium">
                        {(settings.messageDelay / 1000).toFixed(1)}s
                      </span>
                    </div>
                    <Slider
                      value={[settings.messageDelay]}
                      onValueChange={([value]) => onSettingsChange({ messageDelay: value })}
                      min={200}
                      max={4000}
                      step={100}
                    />
                  </div>

                  {/* Message Appear Duration */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">{t.video.messageAppearDuration}</Label>
                      <span className="text-xs text-muted-foreground font-medium">
                        {settings.messageAppearDuration}ms
                      </span>
                    </div>
                    <Slider
                      value={[settings.messageAppearDuration]}
                      onValueChange={([value]) => onSettingsChange({ messageAppearDuration: value })}
                      min={100}
                      max={1500}
                      step={50}
                    />
                  </div>

                  {/* End Pause */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">{t.video.endPause}</Label>
                      <span className="text-xs text-muted-foreground font-medium">
                        {settings.endPauseDuration / 1000}s
                      </span>
                    </div>
                    <Slider
                      value={[settings.endPauseDuration]}
                      onValueChange={([value]) => onSettingsChange({ endPauseDuration: value })}
                      min={500}
                      max={5000}
                      step={500}
                    />
                  </div>
                </div>
              )}

              {/* Speed Presets */}
              {!showSettings && (
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-xs sm:text-sm text-muted-foreground">{t.video.animationSpeed}</Label>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    <Button
                      variant={settings.typingDuration === 3000 && settings.messageDelay === 2000 ? "default" : "outline"}
                      size="sm"
                      onClick={() => onSettingsChange({ typingDuration: 3000, messageDelay: 2000, messageAppearDuration: 600 })}
                      className={cn(
                        "text-xs sm:text-sm px-2 sm:px-3",
                        settings.typingDuration === 3000 && settings.messageDelay === 2000 ? "bg-violet-500 hover:bg-violet-600" : ""
                      )}
                    >
                      {t.video.slow}
                    </Button>
                    <Button
                      variant={settings.typingDuration === 2000 && settings.messageDelay === 1200 ? "default" : "outline"}
                      size="sm"
                      onClick={() => onSettingsChange({ typingDuration: 2000, messageDelay: 1200, messageAppearDuration: 400 })}
                      className={cn(
                        "text-xs sm:text-sm px-2 sm:px-3",
                        settings.typingDuration === 2000 && settings.messageDelay === 1200 ? "bg-violet-500 hover:bg-violet-600" : ""
                      )}
                    >
                      {t.video.normal}
                    </Button>
                    <Button
                      variant={settings.typingDuration === 1000 && settings.messageDelay === 600 ? "default" : "outline"}
                      size="sm"
                      onClick={() => onSettingsChange({ typingDuration: 1000, messageDelay: 600, messageAppearDuration: 200 })}
                      className={cn(
                        "text-xs sm:text-sm px-2 sm:px-3",
                        settings.typingDuration === 1000 && settings.messageDelay === 600 ? "bg-violet-500 hover:bg-violet-600" : ""
                      )}
                    >
                      {t.video.fast}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {isWorking ? (
            <Button
              variant="outline"
              onClick={onStopAnimation}
              disabled={isProcessing}
              className="gap-2"
            >
              {t.common.cancel}
            </Button>
          ) : hasVideo ? (
            <>
              <Button
                variant="outline"
                onClick={onResetAnimation}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                {t.video.createAnother}
              </Button>
              <Button onClick={onDownload} className="gap-2 bg-violet-500 hover:bg-violet-600">
                <Download className="w-4 h-4" />
                {t.export.download} {FORMAT_INFO[currentFormat].ext}
              </Button>
            </>
          ) : (
            <Button
              onClick={onStartAnimation}
              className="gap-2 w-full sm:w-auto bg-violet-500 hover:bg-violet-600"
            >
              <Sparkles className="w-4 h-4" />
              {t.video.createVideo} {FORMAT_INFO[settings.format].label}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
