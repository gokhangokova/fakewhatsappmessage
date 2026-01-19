'use client'

import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { TabbedSidebar } from '@/components/editor/tabbed-sidebar'
import { PhonePreview } from '@/components/preview/phone-preview'
import { ExportMenu } from '@/components/export'
import { useChatState } from '@/contexts/chat-context'
import { useExport, ExportFormat } from '@/hooks/use-export'
import { useVideoExport } from '@/hooks/use-video-export'
import { useToast } from '@/hooks/use-toast'
import { Play, Square, Edit3, FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/lib/i18n/translations'
// AnimatedChatPreview uses forwardRef, so we import it directly (dynamic breaks ref forwarding)
import { AnimatedChatPreview } from '@/components/video/animated-chat-preview'
import type { AnimatedChatPreviewRef } from '@/components/video'
import type { VideoExportSettings } from '@/components/export'

// Global session ID for video recording workflow (survives React StrictMode remounts)
let globalWorkflowSessionId: string | null = null


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
    mobilePreviewScale,
    setMobilePreviewScale,
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
  const [sidebarTab, setSidebarTab] = useState<'editor' | 'settings'>('editor')
  
  // Export options
  const [showWatermark, setShowWatermark] = useState(false)
  const [exportScale, setExportScale] = useState<1 | 2 | 3>(2)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png')
  const [jpgQuality, setJpgQuality] = useState(0.92)
  const [copied, setCopied] = useState(false)

  // Export Menu State
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
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

  const handleDownload = useCallback(async () => {
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
  }, [exportToFormat, platform, exportScale, showWatermark, transparentBg, exportFormat, jpgQuality, error, toast])

  const handleCopyToClipboard = useCallback(async () => {
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
  }, [exportToClipboard, exportScale, transparentBg, toast])

  // Preview Animation Handlers
  const handleStartPreview = useCallback(async () => {
    setIsPreviewMode(true)
    setIsVideoMode(true)

    // Wait for component to mount
    await new Promise(resolve => setTimeout(resolve, 100))

    // Wait for ref to be available (component mounted)
    let attempts = 0
    const maxAttempts = 20
    while (!animatedPreviewRef.current && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 50))
      attempts++
    }

    if (animatedPreviewRef.current) {
      // Additional wait to ensure DOM is fully rendered
      await new Promise(resolve => setTimeout(resolve, 100))
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
    // Preview always uses normal end pause (2 seconds)
    setTimeout(() => {
      setIsPreviewMode(false)
      setIsVideoMode(false)
    }, 2000)
  }, [])

  // Video Export Handlers
  const handleStartVideoRecording = useCallback(async () => {
    // Generate unique session ID for this workflow
    const newSessionId = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Guard: If there's already an active global session, skip this call (React StrictMode duplicate)
    if (globalWorkflowSessionId !== null) {
      console.log('Video workflow already in progress (session:', globalWorkflowSessionId, '), skipping duplicate call')
      return
    }

    // Claim this session globally
    globalWorkflowSessionId = newSessionId
    console.log('Starting video workflow with session:', newSessionId)

    setIsRecordingMode(true)
    setIsVideoMode(true)
    setIsPreviewMode(false)

    // Wait for React to complete the render cycle (single frame)
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))

    // Wait for ref to be available (component mounted)
    let attempts = 0
    const maxAttempts = 10
    while (!animatedPreviewRef.current && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 20))
      attempts++
    }

    if (videoPreviewContainerRef.current && animatedPreviewRef.current) {
      // Start recording
      await startRecording(videoPreviewContainerRef.current, {
        format: videoSettings.format,
        quality: videoSettings.quality,
        frameRate: 30,
      })

      // Start animation immediately after recording starts
      animatedPreviewRef.current.startAnimation()
    }
  }, [startRecording, videoSettings.format, videoSettings.quality])

  const handleStopVideoRecording = useCallback(() => {
    console.log('Cancelling video workflow')
    animatedPreviewRef.current?.stopAnimation()
    animatedPreviewRef.current?.resetAnimation()
    // Use resetVideo instead of stopRecording to discard any captured frames
    resetVideo()
    setIsVideoMode(false)
    setIsRecordingMode(false)
    globalWorkflowSessionId = null  // Clear global session
  }, [resetVideo])

  const handleResetVideoAnimation = useCallback(() => {
    console.log('Resetting video workflow')
    animatedPreviewRef.current?.resetAnimation()
    resetVideo()
    setIsVideoMode(false)
    globalWorkflowSessionId = null  // Clear global session
    setIsRecordingMode(false)
  }, [resetVideo])

  const handleAnimationComplete = useCallback(() => {
    if (isPreviewMode) {
      handlePreviewComplete()
      return
    }

    setTimeout(() => {
      console.log('Animation complete, stopping recording')
      stopRecording()
      setIsVideoMode(false)
      setIsRecordingMode(false)
      globalWorkflowSessionId = null  // Clear global session
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

  // Handle export menu open/close - reset video state when opening
  const handleExportMenuOpenChange = useCallback((open: boolean) => {
    if (open && videoBlob) {
      // Reset video state when opening menu if there's an existing video
      resetVideo()
    }
    setExportMenuOpen(open)
  }, [videoBlob, resetVideo])

  // Reset video and animation state when chat type changes (1-1 <-> Group)
  useEffect(() => {
    // Stop any ongoing recording/animation
    if (isRecording || isVideoMode) {
      animatedPreviewRef.current?.stopAnimation()
      animatedPreviewRef.current?.resetAnimation()
      stopRecording()
      setIsVideoMode(false)
      setIsRecordingMode(false)
      setIsPreviewMode(false)
    }
    // Reset video export state
    if (videoBlob) {
      resetVideo()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupSettings?.isGroupChat])

  // Merge groupSettings into whatsappSettings for preview
  // Computed on every render to ensure correct values when switching chat types
  const mergedWhatsappSettings = groupSettings?.isGroupChat
    ? {
        ...whatsappSettings,
        groupName: groupSettings.groupName,
        groupIcon: groupSettings.groupIcon,
        groupParticipants: groupSettings.participants?.map(p => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar || null,
          color: p.color,
        })) || [],
      }
    : whatsappSettings

  // Memoize sidebar close handler
  const handleSidebarClose = useCallback(() => setSidebarOpen(false), [])

  // Memoize TabbedSidebar props to prevent unnecessary re-renders
  const sidebarProps = useMemo(() => ({
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
    mobilePreviewScale,
    setMobilePreviewScale,
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
    onClose: handleSidebarClose,
    initialTab: sidebarTab,
  }), [
    platform, sender, setSender, receiver, setReceiver, messages, setMessages,
    darkMode, setDarkMode, mobileView, setMobileView, timeFormat, setTimeFormat,
    transparentBg, setTransparentBg, whatsappSettings, setWhatsAppSettings,
    language, setLanguage, fontFamily, setFontFamily, batteryLevel, setBatteryLevel,
    mobilePreviewScale, setMobilePreviewScale,
    deviceType, setDeviceType, groupSettings, setGroupSettings, toggleGroupChat,
    addParticipant, removeParticipant, updateParticipant, resetToDefaults,
    sidebarOpen, handleSidebarClose, sidebarTab
  ])

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

      {/* Preview Panel - Full width on mobile, buttons at bottom */}
      <div className="w-full h-full flex items-center justify-center sm:px-4 md:p-8 overflow-hidden max-sm:pb-20">
        {/* Phone Preview - Responsive scaling with dynamic fit */}
        <div
          className={cn(
            "transition-transform flex items-center justify-center",
            // Desktop scaling
            "sm:scale-[0.8] md:scale-[0.85] lg:scale-[0.9] xl:scale-100",
            "sm:origin-center",
            // Mobile: dynamic scaling via CSS class (media query handles responsive)
            "mobile-phone-preview"
          )}
          style={{ '--mobile-preview-scale': mobilePreviewScale / 100 } as React.CSSProperties}
        >
          {isVideoMode ? (
            <div ref={videoPreviewContainerRef} style={{ overflow: 'hidden', borderRadius: isRecordingMode ? 0 : (deviceType === 'android' ? '24px' : '44px') }}>
              <AnimatedChatPreview
                key={`animated-${groupSettings?.isGroupChat ? 'group' : 'single'}`}
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
                // Preview always uses normal speed, video export uses custom settings
                typingDuration={isPreviewMode ? 2000 : videoSettings.typingDuration}
                messageDelay={isPreviewMode ? 1200 : videoSettings.messageDelay}
                messageAppearDuration={isPreviewMode ? 400 : videoSettings.messageAppearDuration}
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
                forExport={isExporting}
              />
            </div>
          )}
        </div>

        {/* Floating Export Panel - Mobile: horizontal at bottom center, Desktop: bottom right */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:bottom-6 md:bottom-8 sm:right-4 md:right-8 flex flex-row sm:flex-col items-center sm:items-end gap-2.5 sm:gap-3">
          {/* Editor Button - Mobile only */}
          <Button
            size="default"
            className="rounded-full shadow-lg h-12 w-12 sm:hidden bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-300"
            onClick={() => {
              setSidebarTab('editor')
              setSidebarOpen(true)
            }}
          >
            <Edit3 className="w-5 h-5" strokeWidth={2.5} />
          </Button>

          {/* Settings Button - Mobile only */}
          <Button
            size="default"
            className="rounded-full shadow-lg h-12 w-12 sm:hidden bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-300"
            onClick={() => {
              setSidebarTab('settings')
              setSidebarOpen(true)
            }}
          >
            <FlaskConical className="w-5 h-5" strokeWidth={2.5} />
          </Button>

          {/* Preview Animation Button */}
          {isPreviewMode ? (
            <Button
              size="default"
              className="rounded-full shadow-lg h-12 w-12 sm:h-14 sm:w-36 sm:px-0 gap-2 bg-orange-500 hover:bg-orange-600 text-white border-0 justify-center"
              onClick={handleStopPreview}
            >
              <Square className="w-5 h-5 sm:w-5 sm:h-5" strokeWidth={2.5} />
              <span className="font-medium hidden sm:inline">{t.export.stop}</span>
            </Button>
          ) : (
            <Button
              size="default"
              className="rounded-full shadow-lg h-12 w-12 sm:h-14 sm:w-36 sm:px-0 gap-2 bg-orange-500 hover:bg-orange-600 text-white border-0 justify-center"
              onClick={handleStartPreview}
              disabled={isVideoMode || isExporting || messages.length === 0}
            >
              <Play className="w-5 h-5 sm:w-5 sm:h-5" strokeWidth={2.5} />
              <span className="font-medium hidden sm:inline">{t.export.preview}</span>
            </Button>
          )}

          {/* Unified Export Menu */}
          <ExportMenu
            isOpen={exportMenuOpen}
            onOpenChange={handleExportMenuOpenChange}
            language={language}
            disabled={isVideoMode && !isRecording && !isProcessing && !videoBlob}
            // Image export props
            isExporting={isExporting}
            exportFormat={exportFormat}
            setExportFormat={setExportFormat}
            exportScale={exportScale}
            setExportScale={setExportScale}
            jpgQuality={jpgQuality}
            setJpgQuality={setJpgQuality}
            showWatermark={showWatermark}
            setShowWatermark={setShowWatermark}
            onImageDownload={handleDownload}
            onCopyToClipboard={handleCopyToClipboard}
            copied={copied}
            // Video export props
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
            onVideoDownload={handleDownloadVideo}
            videoSettings={videoSettings}
            onVideoSettingsChange={handleVideoSettingsChange}
            messageCount={messages.length}
            currentFormat={currentFormat}
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
