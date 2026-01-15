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

export interface VideoExportSettings {
  typingDuration: number
  messageDelay: number
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
}

const FORMAT_INFO: Record<VideoFormat, { label: string; desc: string; icon: string; ext: string }> = {
  mp4: { label: 'MP4 Video', desc: 'Universal format, works everywhere', icon: '🎬', ext: '.mp4' },
  gif: { label: 'Animated GIF', desc: 'Easy to share everywhere', icon: '🎞️', ext: '.gif' },
}

const QUALITY_INFO: Record<VideoQuality, { label: string; desc: string }> = {
  low: { label: 'Low', desc: 'Smaller file' },
  medium: { label: 'Medium', desc: 'Balanced' },
  high: { label: 'High', desc: 'Best quality' },
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
}: VideoExportPanelProps) {
  const [showSettings, setShowSettings] = useState(false)

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
          className="rounded-full shadow-lg h-10 md:h-14 px-4 md:px-6 gap-1.5 md:gap-2 bg-violet-500 hover:bg-violet-600 text-white border-0 text-sm md:text-base"
        >
          <Film className="w-4 h-4 md:w-5 md:h-5" />
          <span className="font-medium hidden sm:inline">Video</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Export Video
          </DialogTitle>
          <DialogDescription>
            Create an animated video of your chat conversation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Success Banner */}
          {hasVideo && !isWorking && (
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-xl border border-green-200 dark:border-green-800">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                  {FORMAT_INFO[currentFormat].icon} {FORMAT_INFO[currentFormat].label} ready!
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Duration: {formatDuration(videoDuration)} • {FORMAT_INFO[currentFormat].ext}
                </p>
              </div>
              <Button size="sm" onClick={onDownload} className="gap-1.5 flex-shrink-0">
                <Download className="w-4 h-4" />
                Download
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
                    {progressText || 'Creating video...'}
                  </p>
                  <p className="text-xs text-violet-600 dark:text-violet-400">
                    Please wait while we generate your video
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
                <p className="text-xs text-muted-foreground text-center font-medium">{Math.round(progress)}% complete</p>
              </div>
            </div>
          )}

          {/* Format Selection */}
          {!isWorking && !hasVideo && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Output Format</Label>
              <div className="grid grid-cols-2 gap-3">
                {(['mp4', 'gif'] as VideoFormat[]).map((format) => (
                  <button
                    key={format}
                    onClick={() => onSettingsChange({ format })}
                    className={cn(
                      'flex flex-col items-center p-4 rounded-xl border-2 transition-all',
                      settings.format === format
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-950 shadow-sm'
                        : 'border-muted hover:border-muted-foreground/30 hover:bg-muted/50'
                    )}
                  >
                    <span className="text-3xl mb-2">{FORMAT_INFO[format].icon}</span>
                    <span className="text-sm font-semibold">{FORMAT_INFO[format].label}</span>
                    <span className="text-[11px] text-muted-foreground text-center mt-1">
                      {FORMAT_INFO[format].desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quality Selection */}
          {!isWorking && !hasVideo && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Quality</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as VideoQuality[]).map((q) => (
                  <button
                    key={q}
                    onClick={() => onSettingsChange({ quality: q })}
                    className={cn(
                      'px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
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
                <span className="text-sm">Estimated Duration</span>
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
                Animation Settings
                <span className="ml-auto text-xs text-muted-foreground">
                  {messageCount} messages
                </span>
              </Button>

              {showSettings && (
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                  {/* Typing Duration */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Typing Duration</Label>
                      <span className="text-xs text-muted-foreground font-medium">
                        {settings.typingDuration}ms
                      </span>
                    </div>
                    <Slider
                      value={[settings.typingDuration]}
                      onValueChange={([value]) => onSettingsChange({ typingDuration: value })}
                      min={500}
                      max={3000}
                      step={100}
                    />
                  </div>

                  {/* Message Delay */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Message Delay</Label>
                      <span className="text-xs text-muted-foreground font-medium">
                        {settings.messageDelay}ms
                      </span>
                    </div>
                    <Slider
                      value={[settings.messageDelay]}
                      onValueChange={([value]) => onSettingsChange({ messageDelay: value })}
                      min={200}
                      max={2000}
                      step={100}
                    />
                  </div>

                  {/* End Pause */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">End Pause</Label>
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
                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground">Animation Speed</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={settings.typingDuration === 2000 ? "default" : "outline"}
                      size="sm"
                      onClick={() => onSettingsChange({ typingDuration: 2000, messageDelay: 1200 })}
                      className={settings.typingDuration === 2000 ? "bg-violet-500 hover:bg-violet-600" : ""}
                    >
                      🐢 Slow
                    </Button>
                    <Button
                      variant={settings.typingDuration === 1500 ? "default" : "outline"}
                      size="sm"
                      onClick={() => onSettingsChange({ typingDuration: 1500, messageDelay: 800 })}
                      className={settings.typingDuration === 1500 ? "bg-violet-500 hover:bg-violet-600" : ""}
                    >
                      ⚡ Normal
                    </Button>
                    <Button
                      variant={settings.typingDuration === 800 ? "default" : "outline"}
                      size="sm"
                      onClick={() => onSettingsChange({ typingDuration: 800, messageDelay: 400 })}
                      className={settings.typingDuration === 800 ? "bg-violet-500 hover:bg-violet-600" : ""}
                    >
                      🚀 Fast
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
              Cancel
            </Button>
          ) : hasVideo ? (
            <>
              <Button
                variant="outline"
                onClick={onResetAnimation}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Create Another
              </Button>
              <Button onClick={onDownload} className="gap-2 bg-violet-500 hover:bg-violet-600">
                <Download className="w-4 h-4" />
                Download {FORMAT_INFO[currentFormat].ext}
              </Button>
            </>
          ) : (
            <Button
              onClick={onStartAnimation}
              className="gap-2 w-full sm:w-auto bg-violet-500 hover:bg-violet-600"
            >
              <Sparkles className="w-4 h-4" />
              Create {FORMAT_INFO[settings.format].label}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
