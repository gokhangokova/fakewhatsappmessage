'use client'

import { useState, useRef, useCallback } from 'react'
import { EditorSidebar } from '@/components/editor/sidebar'
import { PhonePreview } from '@/components/preview/phone-preview'
import { AnimatedChatPreview, AnimatedChatPreviewRef, VideoExportPanel, VideoExportSettings } from '@/components/video'
import { useChatState } from '@/hooks/use-chat-state'
import { useExport, ExportFormat } from '@/hooks/use-export'
import { useVideoExport } from '@/hooks/use-video-export'
import { useToast } from '@/hooks/use-toast'
import { Download, Copy, Loader2, Check, Play, Square, Menu, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
} from '@/components/ui/sheet'
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
    setIsVideoMode(true)
    setIsPreviewMode(false)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
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
  }, [stopRecording])

  const handleResetVideoAnimation = useCallback(() => {
    animatedPreviewRef.current?.resetAnimation()
    resetVideo()
    setIsVideoMode(false)
  }, [resetVideo])

  const handleAnimationComplete = useCallback(() => {
    if (isPreviewMode) {
      handlePreviewComplete()
      return
    }
    
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

  // Sidebar content component (reusable for desktop and mobile)
  const SidebarContent = () => (
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
  )

  return (
    <div className="flex h-[calc(100vh-56px)] md:h-[calc(100vh-64px)]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <SidebarContent />
      </div>

      {/* Preview Panel */}
      <div className="flex-1 bg-gray-100 flex items-center justify-center p-4 md:p-8 overflow-auto relative">
        {/* Loading State */}
        {!isHydrated && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        )}

        {/* Mobile Menu Button */}
        <div className="absolute top-4 left-4 lg:hidden z-20">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 bg-white shadow-md">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[340px] p-0 overflow-y-auto">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>

        {/* Phone Preview - Scaled for mobile */}
        <div className="transform scale-[0.55] sm:scale-[0.65] md:scale-[0.8] lg:scale-100 origin-center">
          {isVideoMode ? (
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
        </div>

        {/* Floating Export Panel - Responsive */}
        <div className="absolute bottom-4 md:bottom-8 right-4 md:right-8 flex flex-col items-end gap-2 md:gap-3">
          {/* Preview Animation Button */}
          {isPreviewMode ? (
            <Button
              size="default"
              className="rounded-full shadow-lg h-10 md:h-14 px-4 md:px-6 gap-1.5 md:gap-2 bg-orange-400 hover:bg-orange-500 text-white border-0 text-sm md:text-base"
              onClick={handleStopPreview}
            >
              <Square className="w-4 h-4 md:w-5 md:h-5" />
              <span className="font-medium hidden sm:inline">Stop</span>
            </Button>
          ) : (
            <Button
              size="default"
              className="rounded-full shadow-lg h-10 md:h-14 px-4 md:px-6 gap-1.5 md:gap-2 bg-orange-400 hover:bg-orange-500 text-white border-0 text-sm md:text-base"
              onClick={handleStartPreview}
              disabled={isVideoMode || isExporting || messages.length === 0}
            >
              <Play className="w-4 h-4 md:w-5 md:h-5" />
              <span className="font-medium hidden sm:inline">Preview</span>
            </Button>
          )}

          {/* Export Buttons Row */}
          <div className="flex items-center gap-2 md:gap-3">
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
                  size="default"
                  className="rounded-full shadow-lg h-10 md:h-14 px-4 md:px-6 gap-1.5 md:gap-2 text-sm md:text-base"
                  disabled={isExporting || isVideoMode}
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 md:w-5 md:h-5" />
                  )}
                  <span className="font-medium hidden sm:inline">Export</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 md:w-80" align="end" sideOffset={12}>
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

        {/* Quick Info - Hidden on mobile */}
        <div className="absolute bottom-4 md:bottom-8 left-4 md:left-8 hidden md:block">
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
