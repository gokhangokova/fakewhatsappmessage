'use client'

import { useState, useRef, useCallback } from 'react'
import { EditorSidebar } from '@/components/editor/sidebar'
import { PhonePreview } from '@/components/preview/phone-preview'
import { AnimatedChatPreview, AnimatedChatPreviewRef, VideoExportPanel, VideoExportSettings } from '@/components/video'
import { useChatState } from '@/hooks/use-chat-state'
import { useExport, ExportFormat } from '@/hooks/use-export'
import { useVideoExport } from '@/hooks/use-video-export'
import { useToast } from '@/hooks/use-toast'
import { Download, Copy, Loader2, Check, Play, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const FORMAT_INFO = {
  png: { name: 'PNG', desc: 'Lossless, transparent' },
  jpg: { name: 'JPG', desc: 'Smaller size' },
  webp: { name: 'WebP', desc: 'Best compression' },
}

export default function Home() {
  const {
    platform,
    setPlatform,
    sender,
    setSender,
    receiver,
    setReceiver,
    messages,
    setMessages,
    darkMode,
    setDarkMode,
    mobileView,
    setMobileView,
    timeFormat,
    setTimeFormat,
    transparentBg,
    setTransparentBg,
    whatsappSettings,
    setWhatsAppSettings,
    resetToDefaults,
    isHydrated,
  } = useChatState()

  const { exportRef, isExporting, exportToFormat, exportToClipboard, error } = useExport()
  const { toast } = useToast()
  
  // Export options
  const [showWatermark, setShowWatermark] = useState(false)
  const [exportScale, setExportScale] = useState<1 | 2 | 3>(2)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png')
  const [jpgQuality, setJpgQuality] = useState(0.92)
  const [copied, setCopied] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  // Video Export State
  const [videoExportOpen, setVideoExportOpen] = useState(false)
  const [isVideoMode, setIsVideoMode] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [videoSettings, setVideoSettings] = useState<VideoExportSettings>({
    typingDuration: 1500,
    messageDelay: 800,
    quality: 'medium',
    format: 'mp4',
    endPauseDuration: 2000,
  })
  
  const animatedPreviewRef = useRef<AnimatedChatPreviewRef>(null)
  const videoPreviewContainerRef = useRef<HTMLDivElement>(null)
  
  const {
    isRecording,
    isProcessing,
    progress,
    progressText,
    videoBlob,
    videoDuration,
    startRecording,
    stopRecording,
    downloadVideo,
    reset: resetVideo,
    currentFormat,
  } = useVideoExport()

  const handleDownload = async () => {
    await exportToFormat(`${platform}-chat`, {
      pixelRatio: exportScale,
      addWatermark: showWatermark,
      backgroundColor: transparentBg ? 'transparent' : undefined,
      format: exportFormat,
      jpgQuality: jpgQuality,
    })
    
    if (!error) {
      toast({
        title: '✅ Screenshot downloaded!',
        description: `Your ${FORMAT_INFO[exportFormat].name} screenshot has been saved.`,
      })
    } else {
      toast({
        variant: 'destructive',
        title: 'Export failed',
        description: error,
      })
    }
  }

  const handleCopyToClipboard = async () => {
    const success = await exportToClipboard({
      pixelRatio: exportScale,
      backgroundColor: transparentBg ? 'transparent' : '#ffffff',
    })
    
    if (success) {
      setCopied(true)
      toast({
        title: '📋 Copied to clipboard!',
        description: 'You can now paste the screenshot anywhere.',
      })
      setTimeout(() => setCopied(false), 2000)
    } else {
      toast({
        variant: 'destructive',
        title: 'Copy failed',
        description: 'Could not copy to clipboard. Try downloading instead.',
      })
    }
  }

  // Preview Animation Handlers
  const handleStartPreview = useCallback(async () => {
    setIsPreviewMode(true)
    setIsVideoMode(true)
    
    // Wait for the animated preview to render
    await new Promise(resolve => setTimeout(resolve, 100))
    
    if (animatedPreviewRef.current) {
      animatedPreviewRef.current.startAnimation()
    }
  }, [])

  const handleStopPreview = useCallback(() => {
    animatedPreviewRef.current?.stopAnimation()
    animatedPreviewRef.current?.resetAnimation()
    setIsPreviewMode(false)
    setIsVideoMode(false)
  }, [])

  const handlePreviewComplete = useCallback(() => {
    // Wait for end pause then reset
    setTimeout(() => {
      setIsPreviewMode(false)
      setIsVideoMode(false)
    }, videoSettings.endPauseDuration)
  }, [videoSettings.endPauseDuration])

  // Video Export Handlers
  const handleStartVideoRecording = useCallback(async () => {
    setIsVideoMode(true)
    setIsPreviewMode(false)
    
    // Wait for the animated preview to render
    await new Promise(resolve => setTimeout(resolve, 100))
    
    if (videoPreviewContainerRef.current && animatedPreviewRef.current) {
      // Start recording the container
      await startRecording(videoPreviewContainerRef.current, {
        format: videoSettings.format,
        quality: videoSettings.quality,
        frameRate: 30,
      })
      
      // Start the animation
      animatedPreviewRef.current.startAnimation()
    }
  }, [startRecording, videoSettings.format, videoSettings.quality])

  const handleStopVideoRecording = useCallback(() => {
    animatedPreviewRef.current?.stopAnimation()
    stopRecording()
    setIsVideoMode(false)
  }, [stopRecording])

  const handleResetVideoAnimation = useCallback(() => {
    animatedPreviewRef.current?.resetAnimation()
    resetVideo()
    setIsVideoMode(false)
  }, [resetVideo])

  const handleAnimationComplete = useCallback(() => {
    // If in preview mode, use preview complete handler
    if (isPreviewMode) {
      handlePreviewComplete()
      return
    }
    
    // Wait for end pause then stop recording
    setTimeout(() => {
      stopRecording()
      setIsVideoMode(false)
    }, videoSettings.endPauseDuration)
  }, [stopRecording, videoSettings.endPauseDuration, isPreviewMode, handlePreviewComplete])

  const handleDownloadVideo = useCallback(() => {
    downloadVideo()
    toast({
      title: '🎬 Video downloaded!',
      description: `Your ${currentFormat.toUpperCase()} file has been saved.`,
    })
  }, [downloadVideo, toast, currentFormat])

  const handleVideoSettingsChange = useCallback((newSettings: Partial<VideoExportSettings>) => {
    setVideoSettings(prev => ({ ...prev, ...newSettings }))
  }, [])

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Editor Sidebar */}
      <EditorSidebar
        platform={platform}
        setPlatform={setPlatform}
        sender={sender}
        setSender={setSender}
        receiver={receiver}
        setReceiver={setReceiver}
        messages={messages}
        setMessages={setMessages}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        mobileView={mobileView}
        setMobileView={setMobileView}
        timeFormat={timeFormat}
        setTimeFormat={setTimeFormat}
        transparentBg={transparentBg}
        setTransparentBg={setTransparentBg}
        whatsappSettings={whatsappSettings}
        setWhatsAppSettings={setWhatsAppSettings}
        onReset={resetToDefaults}
      />

      {/* Preview Panel */}
      <div className="flex-1 bg-gray-100 flex items-center justify-center p-8 overflow-auto relative">
        {/* Loading State */}
        {!isHydrated && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        )}

        {/* Phone Preview */}
        {isVideoMode ? (
          // Animated Preview for Video Recording or Preview
          <div ref={videoPreviewContainerRef}>
            <AnimatedChatPreview
              ref={animatedPreviewRef}
              sender={sender}
              receiver={receiver}
              messages={messages}
              darkMode={darkMode}
              timeFormat={timeFormat}
              settings={whatsappSettings}
              typingDuration={videoSettings.typingDuration}
              messageDelay={videoSettings.messageDelay}
              onAnimationComplete={handleAnimationComplete}
            />
          </div>
        ) : (
          // Static Preview with Export Ref
          <div ref={exportRef}>
            <PhonePreview
              platform={platform}
              sender={sender}
              receiver={receiver}
              messages={messages}
              darkMode={darkMode}
              mobileView={mobileView}
              timeFormat={timeFormat}
              transparentBg={transparentBg}
              whatsappSettings={whatsappSettings}
            />
          </div>
        )}

        {/* Floating Export Panel */}
        <div className="absolute bottom-8 right-8 flex flex-col items-end gap-3">
          {/* Preview Animation Button */}
          {isPreviewMode ? (
            <Button
              size="lg"
              className="rounded-full shadow-lg h-14 px-6 gap-2 bg-orange-400 hover:bg-orange-500 text-white border-0"
              onClick={handleStopPreview}
            >
              <Square className="w-5 h-5" />
              <span className="font-medium">Stop Preview</span>
            </Button>
          ) : (
            <Button
              size="lg"
              className="rounded-full shadow-lg h-14 px-6 gap-2 bg-orange-400 hover:bg-orange-500 text-white border-0"
              onClick={handleStartPreview}
              disabled={isVideoMode || isExporting || messages.length === 0}
            >
              <Play className="w-5 h-5" />
              <span className="font-medium">Preview Animation</span>
            </Button>
          )}

          {/* Export Buttons Row */}
          <div className="flex items-center gap-3">
            {/* Video Export Button */}
            <VideoExportPanel
              isOpen={videoExportOpen}
              onOpenChange={setVideoExportOpen}
              isAnimating={isVideoMode && isRecording}
              isRecording={isRecording}
              isProcessing={isProcessing}
              progress={progress}
              progressText={progressText}
              hasVideo={!!videoBlob}
              videoDuration={videoDuration}
              onStartAnimation={handleStartVideoRecording}
              onStopAnimation={handleStopVideoRecording}
              onResetAnimation={handleResetVideoAnimation}
              onDownload={handleDownloadVideo}
              settings={videoSettings}
              onSettingsChange={handleVideoSettingsChange}
              messageCount={messages.length}
              currentFormat={currentFormat}
            />

            {/* Image Export Button */}
            <Popover open={showOptions} onOpenChange={setShowOptions}>
              <PopoverTrigger asChild>
                <Button
                  size="lg"
                  className="rounded-full shadow-lg h-14 px-6 gap-2"
                  disabled={isExporting || isVideoMode}
                >
                  {isExporting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  <span className="font-medium">Export</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end" sideOffset={12}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Export Options</h3>
                    <span className="text-xs text-muted-foreground">
                      {FORMAT_INFO[exportFormat].name} • {exportScale}x
                    </span>
                  </div>

                  {/* Format Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Format</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['png', 'jpg', 'webp'] as ExportFormat[]).map((f) => (
                        <button
                          key={f}
                          onClick={() => setExportFormat(f)}
                          className={cn(
                            'flex flex-col items-center px-3 py-2 rounded-lg text-sm font-medium transition-all',
                            exportFormat === f
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted hover:bg-muted/80'
                          )}
                        >
                          <span className="uppercase">{FORMAT_INFO[f].name}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {FORMAT_INFO[exportFormat].desc}
                    </p>
                  </div>

                  {/* Quality Slider (for JPG and WebP) */}
                  {(exportFormat === 'jpg' || exportFormat === 'webp') && (
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
                    </div>
                  )}

                  {/* Scale Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Scale</Label>
                      <span className="text-xs text-muted-foreground">
                        {exportScale === 1 && '375×812px'}
                        {exportScale === 2 && '750×1624px'}
                        {exportScale === 3 && '1125×2436px'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {([1, 2, 3] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setExportScale(s)}
                          className={cn(
                            'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all',
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

                  {/* Watermark Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Watermark</Label>
                      <p className="text-xs text-muted-foreground">Add subtle branding</p>
                    </div>
                    <Switch
                      checked={showWatermark}
                      onCheckedChange={setShowWatermark}
                    />
                  </div>

                  <div className="space-y-2 pt-2 border-t">
                    {/* Download Button */}
                    <Button
                      onClick={handleDownload}
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
                          Download {FORMAT_INFO[exportFormat].name}
                        </>
                      )}
                    </Button>

                    {/* Copy Button */}
                    <Button
                      onClick={handleCopyToClipboard}
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
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Quick Info */}
        <div className="absolute bottom-8 left-8">
          <p className="text-xs text-muted-foreground">
            {darkMode ? '🌙 Dark Mode' : '☀️ Light Mode'} • {mobileView ? '📱 Mobile' : '🖥️ Desktop'}
            {isPreviewMode && ' • 👁️ Previewing'}
            {isVideoMode && !isPreviewMode && ' • 🎬 Recording'}
          </p>
        </div>
      </div>
    </div>
  )
}
