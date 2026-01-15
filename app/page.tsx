'use client'

import { useState, useRef, useCallback } from 'react'
import { Message, User, WhatsAppSettings } from '@/types'
import { PhonePreview } from '@/components/preview/phone-preview'
import { AnimatedChatPreview, AnimatedChatPreviewRef } from '@/components/video'
import { useVideoExport, VideoFormat, VideoQuality } from '@/hooks/use-video-export'
import { useChatState } from '@/hooks/use-chat-state'
import { useExport, ExportFormat } from '@/hooks/use-export'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Download,
  Send,
  Image as ImageIcon,
  Moon,
  Sun,
  Settings,
  User as UserIcon,
  Trash2,
  Film,
  Camera,
  Check,
  Plus,
  X,
  RotateCcw,
  Loader2,
  ChevronDown,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Home() {
  const {
    sender,
    setSender,
    receiver,
    setReceiver,
    messages,
    setMessages,
    darkMode,
    setDarkMode,
    timeFormat,
    setTimeFormat,
    whatsappSettings,
    setWhatsAppSettings,
    resetToDefaults,
    isHydrated,
  } = useChatState()

  const { exportRef, isExporting, exportToFormat, exportToClipboard } = useExport()
  const { toast } = useToast()

  // Message input state
  const [newMessage, setNewMessage] = useState('')
  const [isReceiverMessage, setIsReceiverMessage] = useState(false)
  const [messageTime, setMessageTime] = useState(() => {
    const now = new Date()
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  })

  // UI state
  const [showPeopleDialog, setShowPeopleDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showVideoDialog, setShowVideoDialog] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png')

  // Video export state
  const [isVideoMode, setIsVideoMode] = useState(false)
  const [videoFormat, setVideoFormat] = useState<VideoFormat>('mp4')
  const [videoQuality, setVideoQuality] = useState<VideoQuality>('medium')
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

  // Add message
  const handleAddMessage = useCallback(() => {
    if (!newMessage.trim()) return

    const [hours, minutes] = messageTime.split(':').map(Number)
    const timestamp = new Date()
    timestamp.setHours(hours, minutes, 0, 0)

    const message: Message = {
      id: `msg-${Date.now()}`,
      content: newMessage.trim(),
      timestamp,
      userId: isReceiverMessage ? receiver.id : sender.id,
      status: 'read',
      type: 'text',
    }

    setMessages([...messages, message])
    setNewMessage('')
    
    // Auto increment time by 1-3 minutes
    const newMinutes = minutes + Math.floor(Math.random() * 3) + 1
    const newHours = hours + Math.floor(newMinutes / 60)
    setMessageTime(
      `${(newHours % 24).toString().padStart(2, '0')}:${(newMinutes % 60).toString().padStart(2, '0')}`
    )
  }, [newMessage, messageTime, isReceiverMessage, sender.id, receiver.id, messages, setMessages])

  // Delete message
  const handleDeleteMessage = useCallback((id: string) => {
    setMessages(messages.filter(m => m.id !== id))
  }, [messages, setMessages])

  // Add image message
  const handleAddImage = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        const [hours, minutes] = messageTime.split(':').map(Number)
        const timestamp = new Date()
        timestamp.setHours(hours, minutes, 0, 0)

        const message: Message = {
          id: `msg-${Date.now()}`,
          content: '',
          timestamp,
          userId: isReceiverMessage ? receiver.id : sender.id,
          status: 'read',
          type: 'image',
          imageUrl: e.target?.result as string,
        }

        setMessages([...messages, message])
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }, [messageTime, isReceiverMessage, sender.id, receiver.id, messages, setMessages])

  // Export handlers
  const handleExport = async (format: ExportFormat) => {
    await exportToFormat('whatsapp-chat', {
      pixelRatio: 2,
      format,
    })
    toast({
      title: '✅ Downloaded!',
      description: `Your ${format.toUpperCase()} screenshot has been saved.`,
    })
    setShowExportMenu(false)
  }

  // Video export handlers
  const handleStartVideo = useCallback(async () => {
    setIsVideoMode(true)
    await new Promise(resolve => setTimeout(resolve, 100))
    
    if (videoPreviewContainerRef.current && animatedPreviewRef.current) {
      await startRecording(videoPreviewContainerRef.current, {
        format: videoFormat,
        quality: videoQuality,
        frameRate: 30,
      })
      animatedPreviewRef.current.startAnimation()
    }
  }, [startRecording, videoFormat, videoQuality])

  const handleAnimationComplete = useCallback(() => {
    setTimeout(() => {
      stopRecording()
      setIsVideoMode(false)
    }, 2000)
  }, [stopRecording])

  const handleDownloadVideo = useCallback(() => {
    downloadVideo()
    toast({
      title: '🎬 Downloaded!',
      description: `Your video has been saved.`,
    })
  }, [downloadVideo, toast])

  // Avatar upload handler
  const handleAvatarUpload = (isReceiver: boolean) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        const avatar = e.target?.result as string
        if (isReceiver) {
          setReceiver({ ...receiver, avatar })
        } else {
          setSender({ ...sender, avatar })
        }
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <span className="text-white text-xl">💬</span>
          </div>
          <div>
            <h1 className="font-bold text-lg">Fake Chat Generator</h1>
            <p className="text-xs text-muted-foreground">Create realistic WhatsApp screenshots</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* People Button */}
          <Dialog open={showPeopleDialog} onOpenChange={setShowPeopleDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <UserIcon className="w-4 h-4" />
                <span className="hidden sm:inline">People</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Chat Participants</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Sender */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-muted-foreground">You (Sender)</Label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleAvatarUpload(false)}
                      className="relative group"
                    >
                      <Avatar className="w-14 h-14 border-2 border-dashed border-muted-foreground/30 group-hover:border-primary transition-colors">
                        <AvatarImage src={sender.avatar} />
                        <AvatarFallback className="bg-green-100 text-green-700">
                          {sender.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                    </button>
                    <Input
                      value={sender.name}
                      onChange={(e) => setSender({ ...sender, name: e.target.value })}
                      placeholder="Your name"
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Receiver */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-muted-foreground">Contact</Label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleAvatarUpload(true)}
                      className="relative group"
                    >
                      <Avatar className="w-14 h-14 border-2 border-dashed border-muted-foreground/30 group-hover:border-primary transition-colors">
                        <AvatarImage src={receiver.avatar} />
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {receiver.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                    </button>
                    <Input
                      value={receiver.name}
                      onChange={(e) => setReceiver({ ...receiver, name: e.target.value })}
                      placeholder="Contact name"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Settings Button */}
          <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    <Label>Dark Mode</Label>
                  </div>
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>24-hour Time</Label>
                  <Switch 
                    checked={timeFormat === '24h'} 
                    onCheckedChange={(v) => setTimeFormat(v ? '24h' : '12h')} 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Encryption Notice</Label>
                  <Switch 
                    checked={whatsappSettings.showEncryptionNotice} 
                    onCheckedChange={(v) => setWhatsAppSettings({ ...whatsappSettings, showEncryptionNotice: v })} 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Background Pattern</Label>
                  <Switch 
                    checked={whatsappSettings.showDoodle} 
                    onCheckedChange={(v) => setWhatsAppSettings({ ...whatsappSettings, showDoodle: v })} 
                  />
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={() => {
                      resetToDefaults()
                      setShowSettingsDialog(false)
                    }}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset All
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Export Dropdown */}
          <Popover open={showExportMenu} onOpenChange={setShowExportMenu}>
            <PopoverTrigger asChild>
              <Button className="gap-2">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="end">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Image</p>
                {['png', 'jpg', 'webp'].map((format) => (
                  <Button
                    key={format}
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    onClick={() => handleExport(format as ExportFormat)}
                    disabled={isExporting}
                  >
                    <Camera className="w-4 h-4" />
                    {format.toUpperCase()}
                  </Button>
                ))}
                <div className="border-t my-2" />
                <p className="text-xs font-semibold text-muted-foreground mb-2">Video</p>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setShowExportMenu(false)
                    setShowVideoDialog(true)
                  }}
                >
                  <Film className="w-4 h-4" />
                  Create Video
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages List (Left Side) */}
        <div className="w-80 bg-white border-r flex flex-col hidden lg:flex">
          <div className="p-4 border-b">
            <h2 className="font-semibold flex items-center gap-2">
              Messages
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {messages.length}
              </span>
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">No messages yet</p>
                <p className="text-xs mt-1">Start typing below to add messages</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isSender = msg.userId === sender.id
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "group flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors",
                      isSender ? "flex-row-reverse" : ""
                    )}
                  >
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={isSender ? sender.avatar : receiver.avatar} />
                      <AvatarFallback className={cn(
                        "text-xs",
                        isSender ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {(isSender ? sender.name : receiver.name).charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={cn("flex-1 min-w-0", isSender ? "text-right" : "")}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium truncate">
                          {isSender ? sender.name : receiver.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(msg.timestamp).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: timeFormat === '12h'
                          })}
                        </span>
                      </div>
                      {msg.type === 'image' ? (
                        <div className="w-16 h-16 rounded bg-gray-100 overflow-hidden">
                          <img src={msg.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground truncate">{msg.content}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Preview (Center) */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
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
                typingDuration={1500}
                messageDelay={800}
                onAnimationComplete={handleAnimationComplete}
              />
            </div>
          ) : (
            <div ref={exportRef}>
              <PhonePreview
                platform="whatsapp"
                sender={sender}
                receiver={receiver}
                messages={messages}
                darkMode={darkMode}
                mobileView={true}
                timeFormat={timeFormat}
                transparentBg={false}
                whatsappSettings={whatsappSettings}
              />
            </div>
          )}
        </div>
      </div>

      {/* Message Input (Bottom) */}
      <div className="bg-white border-t p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            {/* Sender Toggle */}
            <button
              onClick={() => setIsReceiverMessage(!isReceiverMessage)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all",
                isReceiverMessage 
                  ? "bg-blue-100 text-blue-700" 
                  : "bg-green-100 text-green-700"
              )}
            >
              <Avatar className="w-5 h-5">
                <AvatarImage src={isReceiverMessage ? receiver.avatar : sender.avatar} />
                <AvatarFallback className="text-[10px]">
                  {(isReceiverMessage ? receiver.name : sender.name).charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline">
                {isReceiverMessage ? receiver.name : sender.name}
              </span>
            </button>

            {/* Time Input */}
            <Input
              type="time"
              value={messageTime}
              onChange={(e) => setMessageTime(e.target.value)}
              className="w-24"
            />

            {/* Message Input */}
            <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddMessage()}
                placeholder="Type a message..."
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 px-0"
              />
              <button
                onClick={handleAddImage}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Send Button */}
            <Button
              onClick={handleAddMessage}
              disabled={!newMessage.trim()}
              size="icon"
              className="rounded-full"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Quick Tip */}
          <p className="text-center text-xs text-muted-foreground mt-3">
            💡 Click the avatar to switch between sender and receiver
          </p>
        </div>
      </div>

      {/* Video Export Dialog */}
      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Film className="w-5 h-5" />
              Create Video
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {videoBlob ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                  <Check className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">Video Ready!</p>
                    <p className="text-sm text-green-600">Duration: {Math.round(videoDuration)}s</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleDownloadVideo} className="flex-1 gap-2">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                  <Button variant="outline" onClick={() => { resetVideo(); setIsVideoMode(false); }}>
                    Create Another
                  </Button>
                </div>
              </div>
            ) : isRecording || isProcessing ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  <div>
                    <p className="font-semibold text-blue-800">{progressText || 'Creating video...'}</p>
                    <p className="text-sm text-blue-600">Please wait</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-center text-sm text-muted-foreground">{Math.round(progress)}%</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setVideoFormat('mp4')}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all text-center",
                      videoFormat === 'mp4' 
                        ? "border-primary bg-primary/5" 
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <span className="text-2xl mb-1 block">🎬</span>
                    <span className="font-medium">WebM Video</span>
                  </button>
                  <button
                    onClick={() => setVideoFormat('gif')}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all text-center",
                      videoFormat === 'gif' 
                        ? "border-primary bg-primary/5" 
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <span className="text-2xl mb-1 block">🎞️</span>
                    <span className="font-medium">Animated GIF</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as VideoQuality[]).map((q) => (
                    <button
                      key={q}
                      onClick={() => setVideoQuality(q)}
                      className={cn(
                        "py-2 px-3 rounded-lg text-sm font-medium transition-all capitalize",
                        videoQuality === q
                          ? "bg-primary text-white"
                          : "bg-gray-100 hover:bg-gray-200"
                      )}
                    >
                      {q}
                    </button>
                  ))}
                </div>

                <Button onClick={handleStartVideo} className="w-full gap-2">
                  <Sparkles className="w-4 h-4" />
                  Create Video
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
