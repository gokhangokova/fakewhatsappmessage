'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import { TabbedSidebar } from '@/components/editor/tabbed-sidebar'
import { PhonePreview } from '@/components/preview/phone-preview'
import { AnimatedChatPreview, AnimatedChatPreviewRef, VideoExportPanel, VideoExportSettings } from '@/components/video'
import { ImageExportPanel } from '@/components/export'
import { useChatState } from '@/hooks/use-chat-state'
import { useExport, ExportFormat } from '@/hooks/use-export'
import { useVideoExport } from '@/hooks/use-video-export'
import { useToast } from '@/hooks/use-toast'
import { Play, Square, Menu, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/lib/i18n/translations'

const FORMAT_INFO = {
  png: { name: 'PNG' },
  jpg: { name: 'JPG' },
  webp: { name: 'WebP' },
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
    groupSettings,
    setGroupSettings,
    toggleGroupChat,
    addParticipant,
    removeParticipant,
    updateParticipant,
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

  // Merge groupSettings into whatsappSettings for preview
  const mergedWhatsappSettings = useMemo(() => {
    if (!groupSettings?.isGroupChat) return whatsappSettings
    
    return {
      ...whatsappSettings,
      groupName: groupSettings.groupName,
      groupParticipants: groupSettings.participants?.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar || null,
        color: p.color,
      })) || [],
    }
  }, [whatsappSettings, groupSettings])

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
    groupSettings,
    setGroupSettings,
    toggleGroupChat,
    addParticipant,
    removeParticipant,
    updateParticipant,
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
          // Responsive scaling: maximize on mobile
          "scale-[0.8] sm:scale-[0.8] md:scale-[0.85] lg:scale-[0.9] xl:scale-100"
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
                settings={mergedWhatsappSettings}
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
                whatsappSettings={mergedWhatsappSettings}
                language={language}
                fontFamily={fontFamily}
                batteryLevel={batteryLevel}
                deviceType={deviceType}
              />
            </div>
          )}
        </div>

        {/* Floating Export Panel - Mobile: single row centered at bottom */}
        <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:right-4 md:right-8 flex flex-row sm:flex-col items-center sm:items-end gap-3">
          {/* Settings Button - Mobile only */}
          <Button
            size="default"
            className="rounded-full shadow-lg h-12 w-12 sm:hidden bg-white hover:bg-gray-100 text-gray-700 border border-gray-200"
            onClick={() => setSidebarOpen(true)}
          >
            <Settings className="w-5 h-5" />
          </Button>

          {/* Preview Animation Button */}
          {isPreviewMode ? (
            <Button
              size="default"
              className="rounded-full shadow-lg h-12 sm:h-14 w-12 sm:w-36 sm:px-0 gap-2 bg-orange-400 hover:bg-orange-500 text-white border-0 justify-center"
              onClick={handleStopPreview}
            >
              <Square className="w-5 h-5" />
              <span className="font-medium hidden sm:inline">{t.export.stop}</span>
            </Button>
          ) : (
            <Button
              size="default"
              className="rounded-full shadow-lg h-12 sm:h-14 w-12 sm:w-36 sm:px-0 gap-2 bg-orange-400 hover:bg-orange-500 text-white border-0 justify-center"
              onClick={handleStartPreview}
              disabled={isVideoMode || isExporting || messages.length === 0}
            >
              <Play className="w-5 h-5" />
              <span className="font-medium hidden sm:inline">{t.export.preview}</span>
            </Button>
          )}

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
          <ImageExportPanel
            isOpen={showOptions}
            onOpenChange={setShowOptions}
            isExporting={isExporting}
            exportFormat={exportFormat}
            setExportFormat={setExportFormat}
            exportScale={exportScale}
            setExportScale={setExportScale}
            jpgQuality={jpgQuality}
            setJpgQuality={setJpgQuality}
            showWatermark={showWatermark}
            setShowWatermark={setShowWatermark}
            onDownload={handleDownload}
            onCopyToClipboard={handleCopyToClipboard}
            copied={copied}
            disabled={isExporting || isVideoMode}
            language={language}
          />
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
