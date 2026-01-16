'use client'

import { useState, useRef, useCallback } from 'react'
import { TabbedSidebar } from '@/components/editor/tabbed-sidebar'
import { PhonePreview } from '@/components/preview/phone-preview'
import { AnimatedChatPreview, AnimatedChatPreviewRef, VideoExportPanel, VideoExportSettings } from '@/components/video'
import { useChatState } from '@/hooks/use-chat-state'
import { useExport, ExportFormat } from '@/hooks/use-export'
import { useVideoExport } from '@/hooks/use-video-export'
import { useToast } from '@/hooks/use-toast'
import { Download, Copy, Loader2, Check, Play, Square, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/lib/i18n/translations'

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
    language,
    setLanguage,
    fontFamily,
    setFontFamily,
    batteryLevel,
    setBatteryLevel,
    deviceType,
    setDeviceType,
    resetToDefaults,
    isHydrated,
  } = useChatState()

  const { exportRef, isExporting, exportToFormat, exportToClipboard, error } = useExport()
  const { toast } = useToast()
  const t = useTranslations(language)
  
  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
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
  const [isRecordingMode, setIsRecordingMode] = useState(false)
  const [videoSettings, setVideoSettings] = useState<VideoExportSettings>({
    typingDuration: 2000,
    messageDelay: 1200,
    messageAppearDuration: 400,
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
    setTimeout(() => {
      setIsPreviewMode(false)
      setIsVideoMode(false)
    }, videoSettings.endPauseDuration)
  }, [videoSettings.endPauseDuration])

  // Video Export Handlers
  const handleStartVideoRecording = useCallback(async () => {
    setIsRecordingMode(true)
    setIsVideoMode(true)
    setIsPreviewMode(false)
    
    await new Promise(resolve => setTimeout(resolve, 300))
    
    if (videoPreviewContainerRef.current && animatedPreviewRef.current) {
      await startRecording(videoPreviewContainerRef.current, {
        format: videoSettings.format,
        quality: videoSettings.quality,
        frameRate: 30,
      })
      
      animatedPreviewRef.current.startAnimation()
    }
  }, [startRecording, videoSettings.format, videoSettings.quality])

  const handleStopVideoRecording = useCallback(() => {
    animatedPreviewRef.current?.stopAnimation()
    stopRecording()
    setIsVideoMode(false)
    setIsRecordingMode(false)
  }, [stopRecording])

  const handleResetVideoAnimation = useCallback(() => {
    animatedPreviewRef.current?.resetAnimation()
    resetVideo()
    setIsVideoMode(false)
    setIsRecordingMode(false)
  }, [resetVideo])

  const handleAnimationComplete = useCallback(() => {
    if (isPreviewMode) {
      handlePreviewComplete()
      return
    }
    
    setTimeout(() => {
      stopRecording()
      setIsVideoMode(false)
      setIsRecordingMode(false)
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

  // TabbedSidebar props
  const sidebarProps = {
    platform,
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
    language,
    setLanguage,
    fontFamily,
    setFontFamily,
    batteryLevel,
    setBatteryLevel,
    deviceType,
    setDeviceType,
    onReset: resetToDefaults,
    // Mobile props
    isOpen: sidebarOpen,
    onClose: () => setSidebarOpen(false),
  }

  return (
    <div className="h-[calc(100vh-56px)] md:h-[calc(100vh-64px)] bg-gray-100 relative overflow-hidden">
      {/* Loading State */}
      {!isHydrated && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="animate-pulse text-muted-foreground">{t.common.loading}</div>
        </div>
      )}

      {/* Mobile Menu Button - Fixed top left */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-[72px] left-4 z-40 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-200 active:scale-95 transition-transform"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </button>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Tabbed Sidebar - Responsive */}
      <TabbedSidebar {...sidebarProps} />

      {/* Preview Panel - Full width on mobile */}
      <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 md:p-8 overflow-auto">
        {/* Phone Preview - Responsive scaling */}
        <div className={cn(
          "transform origin-center transition-transform",
          // Responsive scaling: mobile -> tablet -> desktop
          "scale-[0.45] sm:scale-[0.55] md:scale-[0.7] lg:scale-[0.85] xl:scale-100"
        )}>
          {isVideoMode ? (
            <div ref={videoPreviewContainerRef} style={{ overflow: 'hidden', borderRadius: isRecordingMode ? 0 : (deviceType === 'android' ? '24px' : '44px') }}>
              <AnimatedChatPreview
                ref={animatedPreviewRef}
                sender={sender}
                receiver={receiver}
                messages={messages}
                darkMode={darkMode}
                timeFormat={timeFormat}
                settings={whatsappSettings}
                language={language}
                fontFamily={fontFamily}
                deviceType={deviceType}
                typingDuration={videoSettings.typingDuration}
                messageDelay={videoSettings.messageDelay}
                messageAppearDuration={videoSettings.messageAppearDuration}
                onAnimationComplete={handleAnimationComplete}
                forVideoExport={isRecordingMode}
              />
            </div>
          ) : (
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
                language={language}
                fontFamily={fontFamily}
                batteryLevel={batteryLevel}
                deviceType={deviceType}
              />
            </div>
          )}
        </div>

        {/* Floating Export Panel - Mobile optimized */}
        <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 right-4 sm:right-6 md:right-8 flex flex-col items-end gap-2 sm:gap-3">
          {/* Preview Animation Button */}
          {isPreviewMode ? (
            <Button
              size="default"
              className="rounded-full shadow-lg h-12 sm:h-14 w-12 sm:w-auto sm:px-6 gap-2 bg-orange-400 hover:bg-orange-500 text-white border-0"
              onClick={handleStopPreview}
            >
              <Square className="w-5 h-5" />
              <span className="font-medium hidden sm:inline">{t.export.stop}</span>
            </Button>
          ) : (
            <Button
              size="default"
              className="rounded-full shadow-lg h-12 sm:h-14 w-12 sm:w-auto sm:px-6 gap-2 bg-orange-400 hover:bg-orange-500 text-white border-0"
              onClick={handleStartPreview}
              disabled={isVideoMode || isExporting || messages.length === 0}
            >
              <Play className="w-5 h-5" />
              <span className="font-medium hidden sm:inline">{t.export.preview}</span>
            </Button>
          )}

          {/* Export Buttons Row */}
          <div className="flex items-center gap-2 sm:gap-3">
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
              language={language}
            />

            {/* Image Export Button */}
            <Popover open={showOptions} onOpenChange={setShowOptions}>
              <PopoverTrigger asChild>
                <Button
                  size="default"
                  className="rounded-full shadow-lg h-12 sm:h-14 w-12 sm:w-auto sm:px-6 gap-2"
                  disabled={isExporting || isVideoMode}
                >
                  {isExporting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  <span className="font-medium hidden sm:inline">{t.export.export}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 sm:w-80" align="end" sideOffset={12}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{t.export.exportOptions}</h3>
                    <span className="text-xs text-muted-foreground">
                      {FORMAT_INFO[exportFormat].name} • {exportScale}x
                    </span>
                  </div>

                  {/* Format Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t.export.format}</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['png', 'jpg', 'webp'] as ExportFormat[]).map((f) => (
                        <button
                          key={f}
                          onClick={() => setExportFormat(f)}
                          className={cn(
                            'flex flex-col items-center px-3 py-3 rounded-lg text-sm font-medium transition-all min-h-[48px]',
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
                        <Label className="text-sm font-medium">{t.export.quality}</Label>
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
                        className="w-full h-3 bg-muted rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Scale Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">{t.export.scale}</Label>
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
                            'flex-1 px-3 py-3 rounded-lg text-sm font-medium transition-all min-h-[48px]',
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
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label className="text-sm font-medium">{t.export.watermark}</Label>
                      <p className="text-xs text-muted-foreground">{t.export.watermarkDesc}</p>
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
                      className="w-full h-12"
                      disabled={isExporting}
                    >
                      {isExporting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t.export.downloading}
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          {t.export.download} {FORMAT_INFO[exportFormat].name}
                        </>
                      )}
                    </Button>

                    {/* Copy Button */}
                    <Button
                      onClick={handleCopyToClipboard}
                      variant="outline"
                      className="w-full h-12"
                      disabled={isExporting}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2 text-green-500" />
                          {t.export.copied}
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          {t.export.copyToClipboard}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Quick Info - Hidden on mobile */}
        <div className="absolute bottom-4 md:bottom-8 left-4 md:left-8 hidden lg:block">
          <p className="text-xs text-muted-foreground">
            {darkMode ? t.info.darkModeOn : t.info.lightModeOn} • {mobileView ? t.info.mobileView : t.info.desktopView}
            {isPreviewMode && ` • ${t.info.previewing}`}
            {isVideoMode && !isPreviewMode && ` • ${t.info.recordingVideo}`}
          </p>
        </div>
      </div>
    </div>
  )
}
