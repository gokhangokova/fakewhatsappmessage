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
import { Play, Square, Edit3, FlaskConical, Save, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/lib/i18n/translations'
import { useAuth } from '@/contexts/auth-context'
import { useSavedChats } from '@/hooks/use-saved-chats'
import { AuthModal } from '@/components/auth/auth-modal'
import { WhatsAppChatList } from '@/components/chats/whatsapp-chat-list'
import { ChatData } from '@/lib/supabase/chats'
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
  const { user } = useAuth()
  const { saveChat, currentChatId, isSaving, remainingChats, setCurrentChatId, latestChatData, clearLatestChatData } = useSavedChats()

  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarTab, setSidebarTab] = useState<'editor' | 'settings'>('editor')

  // Auth and Save modals
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [chatListOpen, setChatListOpen] = useState(false)
  
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

  // Get current chat data for saving
  const getChatData = useCallback((): ChatData => {
    return {
      platform,
      name: groupSettings?.isGroupChat ? groupSettings.groupName : receiver.name,
      sender,
      receiver,
      messages,
      darkMode,
      timeFormat,
      fontFamily,
      deviceType,
      language,
      batteryLevel,
      whatsappSettings: whatsappSettings!,
      groupSettings: groupSettings!,
    }
  }, [platform, sender, receiver, messages, darkMode, timeFormat, fontFamily, deviceType, language, batteryLevel, whatsappSettings, groupSettings])

  // Handle saving chat
  const handleSaveChat = useCallback(async () => {
    if (!user) {
      setAuthModalOpen(true)
      return
    }

    try {
      const chatData = getChatData()
      await saveChat(chatData)
      toast({
        title: 'Chat saved',
        description: currentChatId ? 'Your changes have been saved.' : 'New chat created successfully.',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save chat'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    }
  }, [user, getChatData, saveChat, currentChatId, toast])

  // Apply chat data to current state (without toast)
  const applyChatData = useCallback((chatData: ChatData) => {
    setPlatform(chatData.platform)
    setSender(chatData.sender)
    setReceiver(chatData.receiver)
    setMessages(chatData.messages)
    setDarkMode(chatData.darkMode)
    setTimeFormat(chatData.timeFormat)
    setFontFamily(chatData.fontFamily)
    setDeviceType(chatData.deviceType)
    setLanguage(chatData.language)
    setBatteryLevel(chatData.batteryLevel)
    if (chatData.whatsappSettings) {
      setWhatsAppSettings(chatData.whatsappSettings)
    }
    if (chatData.groupSettings) {
      setGroupSettings(chatData.groupSettings)
    }
  }, [setPlatform, setSender, setReceiver, setMessages, setDarkMode, setTimeFormat, setFontFamily, setDeviceType, setLanguage, setBatteryLevel, setWhatsAppSettings, setGroupSettings])

  // Handle loading a chat from saved chats (with toast notification)
  const handleLoadChat = useCallback((chatData: ChatData) => {
    applyChatData(chatData)
    toast({
      title: 'Chat loaded',
      description: `"${chatData.name}" has been loaded.`,
    })
  }, [applyChatData, toast])

  // Auto-load latest chat when user logs in
  useEffect(() => {
    if (latestChatData) {
      applyChatData(latestChatData)
      clearLatestChatData()
    }
  }, [latestChatData, applyChatData, clearLatestChatData])

  // Handle creating a new chat
  const handleNewChat = useCallback(() => {
    setCurrentChatId(null)
    resetToDefaults()
    // Open editor tab on mobile
    setSidebarTab('editor')
    setSidebarOpen(true)
    toast({
      title: 'New chat',
      description: 'Started a new chat. Your previous work is saved.',
    })
  }, [setCurrentChatId, resetToDefaults, toast])

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
      // Start recording - MP4 uses 60fps for smoother animations, GIF uses 30fps for smaller file size
      await startRecording(videoPreviewContainerRef.current, {
        format: videoSettings.format,
        quality: videoSettings.quality,
        frameRate: videoSettings.format === 'gif' ? 30 : 60,
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
  // Memoized to prevent unnecessary re-renders and useEffect re-runs
  const mergedWhatsappSettings = useMemo(() => {
    if (groupSettings?.isGroupChat) {
      return {
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
    }
    return whatsappSettings
  }, [
    groupSettings?.isGroupChat,
    groupSettings?.groupName,
    groupSettings?.groupIcon,
    groupSettings?.participants,
    whatsappSettings
  ])

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
      <div className="w-full h-full flex items-center justify-center sm:px-4 md:p-8 overflow-hidden max-sm:pb-24">
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
          {chatListOpen ? (
            // WhatsApp-style Chat List (replaces preview when open)
            <WhatsAppChatList
              open={chatListOpen}
              onOpenChange={setChatListOpen}
              onLoadChat={handleLoadChat}
              onNewChat={handleNewChat}
              language={language}
              darkMode={darkMode}
              deviceType={deviceType}
            />
          ) : isVideoMode ? (
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
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:bottom-6 md:bottom-8 sm:right-4 md:right-8 flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-3 safe-area-bottom">
          {/* Editor Button - Mobile only */}
          <Button
            size="default"
            className="rounded-full shadow-lg h-14 w-14 sm:hidden bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-300 active:scale-95 transition-transform"
            onClick={() => {
              setSidebarTab('editor')
              setSidebarOpen(true)
            }}
          >
            <Edit3 className="w-6 h-6" strokeWidth={2.5} />
          </Button>

          {/* Settings Button - Mobile only */}
          <Button
            size="default"
            className="rounded-full shadow-lg h-14 w-14 sm:hidden bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-300 active:scale-95 transition-transform"
            onClick={() => {
              setSidebarTab('settings')
              setSidebarOpen(true)
            }}
          >
            <FlaskConical className="w-6 h-6" strokeWidth={2.5} />
          </Button>

          {/* WhatsApp-style Chat List Button - Only for logged in users */}
          {user && (
            <Button
              size="default"
              className="rounded-full shadow-lg h-14 w-14 sm:h-14 sm:w-36 sm:px-0 gap-2 bg-[#00A884] hover:bg-[#008f6f] text-white border-0 justify-center active:scale-95 transition-transform"
              onClick={() => setChatListOpen(true)}
            >
              <MessageCircle className="w-6 h-6 sm:w-5 sm:h-5" strokeWidth={2.5} />
              <span className="font-medium hidden sm:inline">{t.common.chats}</span>
            </Button>
          )}

          {/* Save Button - Only for logged in users */}
          {user && (
            <Button
              size="default"
              className={cn(
                "rounded-full shadow-lg h-14 w-14 sm:h-14 sm:w-36 sm:px-0 gap-2 justify-center active:scale-95 transition-transform text-white border-0",
                currentChatId
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-500 hover:bg-blue-600"
              )}
              onClick={handleSaveChat}
              disabled={isSaving || (remainingChats !== null && remainingChats <= 0 && !currentChatId)}
            >
              <Save className="w-6 h-6 sm:w-5 sm:h-5" strokeWidth={2.5} />
              <span className="font-medium hidden sm:inline">{t.common.save}</span>
            </Button>
          )}

          {/* Preview Animation Button */}
          {isPreviewMode ? (
            <Button
              size="default"
              className="rounded-full shadow-lg h-14 w-14 sm:h-14 sm:w-36 sm:px-0 gap-2 bg-orange-500 hover:bg-orange-600 text-white border-0 justify-center active:scale-95 transition-transform"
              onClick={handleStopPreview}
            >
              <Square className="w-6 h-6 sm:w-5 sm:h-5" strokeWidth={2.5} />
              <span className="font-medium hidden sm:inline">{t.export.stop}</span>
            </Button>
          ) : (
            <Button
              size="default"
              className="rounded-full shadow-lg h-14 w-14 sm:h-14 sm:w-36 sm:px-0 gap-2 bg-orange-500 hover:bg-orange-600 text-white border-0 justify-center active:scale-95 transition-transform"
              onClick={handleStartPreview}
              disabled={isVideoMode || isExporting || messages.length === 0}
            >
              <Play className="w-6 h-6 sm:w-5 sm:h-5" strokeWidth={2.5} />
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

        {/* Legal Links - Bottom Left */}
        <div className="absolute bottom-4 md:bottom-8 left-4 md:left-8 hidden lg:flex items-center gap-3 text-xs text-muted-foreground">
          <Link href="/terms-of-service" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>
          <span className="text-muted-foreground/50">•</span>
          <Link href="/privacy-policy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />

    </div>
  )
}
