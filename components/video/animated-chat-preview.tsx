'use client'

import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Message, User, WhatsAppSettings } from '@/types'
import { cn } from '@/lib/utils'
import {
  ChevronLeft,
  Phone,
  Video,
  Camera,
  Mic,
  Plus,
  Lock,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatTime } from '@/lib/utils'

interface AnimatedChatPreviewProps {
  sender: User
  receiver: User
  messages: Message[]
  darkMode: boolean
  timeFormat: '12h' | '24h'
  settings: WhatsAppSettings
  // Animation settings
  typingDuration?: number // ms - typing indicator süresi
  messageDelay?: number // ms - mesajlar arası bekleme
  onAnimationComplete?: () => void
  onAnimationStart?: () => void
}

export interface AnimatedChatPreviewRef {
  startAnimation: () => void
  stopAnimation: () => void
  resetAnimation: () => void
  isAnimating: boolean
}

// Theme colors (aynı WhatsApp preview'dan)
const themes = {
  light: {
    statusBar: '#F6F6F6',
    statusBarText: '#000000',
    header: '#F6F6F6',
    headerBorder: '#E5E5E5',
    headerText: '#000000',
    headerSubtext: '#8E8E93',
    headerIcon: '#007AFF',
    chatBg: '#EFEFE4',
    sentBubble: '#E7FFDB',
    receivedBubble: '#FFFFFF',
    sentText: '#000000',
    receivedText: '#000000',
    timeText: '#667781',
    sentTimeText: '#53BDEB',
    dateSeparator: '#8E8E93',
    encryptionBg: '#FCF4CB',
    encryptionText: '#54656F',
    encryptionIcon: '#B49A54',
    footer: '#F6F6F6',
    footerBorder: '#E5E5E5',
    inputBg: '#FFFFFF',
    inputBorder: '#E5E5E5',
    doodleColor: '#C8C4BA',
    homeIndicator: '#000000',
  },
  dark: {
    statusBar: '#1F2C34',
    statusBarText: '#FFFFFF',
    header: '#1F2C34',
    headerBorder: '#2A3942',
    headerText: '#FFFFFF',
    headerSubtext: '#8696A0',
    headerIcon: '#00A884',
    chatBg: '#0B141A',
    sentBubble: '#005C4B',
    receivedBubble: '#1F2C34',
    sentText: '#FFFFFF',
    receivedText: '#FFFFFF',
    timeText: '#8696A0',
    sentTimeText: '#7FCBAB',
    dateSeparator: '#8696A0',
    encryptionBg: '#1D282F',
    encryptionText: '#8696A0',
    encryptionIcon: '#8696A0',
    footer: '#1F2C34',
    footerBorder: '#2A3942',
    inputBg: '#2A3942',
    inputBorder: '#2A3942',
    doodleColor: '#182229',
    homeIndicator: '#FFFFFF',
  },
}

// Doodle Pattern
const WhatsAppDoodle = ({ opacity, color }: { opacity: number; color: string }) => (
  <svg
    className="absolute inset-0 w-full h-full pointer-events-none"
    style={{ opacity }}
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <pattern id="wa-doodle-anim" x="0" y="0" width="240" height="240" patternUnits="userSpaceOnUse">
        <g fill={color}>
          <rect x="20" y="15" width="14" height="22" rx="2" />
          <path d="M60 20 Q60 14 66 14 L82 14 Q88 14 88 20 L88 28 Q88 34 82 34 L70 34 L66 40 L66 34 Q60 34 60 28 Z" />
          <path d="M120 22 Q120 15 126 15 Q132 15 132 22 Q132 15 138 15 Q144 15 144 22 Q144 30 132 38 Q120 30 120 22 Z" />
          <rect x="170" y="18" width="24" height="18" rx="3" />
          <circle cx="182" cy="27" r="6" fill="currentColor" fillOpacity="0" stroke={color} strokeWidth="2"/>
          <rect x="25" y="80" width="18" height="14" rx="2" />
          <ellipse cx="80" cy="98" rx="6" ry="5" />
          <path d="M145 70 L148 82 L162 82 L151 90 L154 104 L145 96 L136 104 L139 90 L128 82 L142 82 Z" />
          <path d="M200 102 Q188 85 200 72 Q212 85 200 102 Z" />
          <rect x="230" y="70" width="20" height="28" rx="2" />
          <circle cx="40" cy="150" r="14" fill="none" stroke={color} strokeWidth="2.5"/>
          <rect x="155" y="140" width="28" height="22" rx="2" />
          <rect x="20" y="200" width="22" height="16" rx="2" />
          <path d="M42 204 L54 198 L54 220 L42 214 Z" />
          <rect x="180" y="205" width="22" height="20" rx="2" />
          <rect x="225" y="200" width="20" height="24" rx="3" />
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#wa-doodle-anim)" />
  </svg>
)

// iOS Status Bar
const IOSStatusBar = ({ darkMode }: { darkMode: boolean }) => {
  const theme = darkMode ? themes.dark : themes.light
  const iconColor = theme.statusBarText
  
  return (
    <div 
      className="flex items-center justify-between px-[21px] pt-[12px] pb-[10px]"
      style={{ backgroundColor: theme.statusBar }}
    >
      <span className="text-[15px] font-semibold tracking-[-0.3px]" style={{ color: theme.statusBarText }}>
        9:41
      </span>
      <div className="flex items-center gap-[5px]">
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
          <rect x="0" y="7" width="3" height="5" rx="0.5" fill={iconColor}/>
          <rect x="4" y="5" width="3" height="7" rx="0.5" fill={iconColor}/>
          <rect x="8" y="3" width="3" height="9" rx="0.5" fill={iconColor}/>
          <rect x="12" y="0" width="3" height="12" rx="0.5" fill={iconColor}/>
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <path d="M8 2.4C10.9 2.4 13.5 3.5 15.4 5.3L14.1 6.6C12.5 5.1 10.4 4.2 8 4.2C5.6 4.2 3.5 5.1 1.9 6.6L0.6 5.3C2.5 3.5 5.1 2.4 8 2.4Z" fill={iconColor}/>
          <path d="M8 5.8C9.9 5.8 11.6 6.5 12.9 7.7L11.6 9C10.6 8.1 9.4 7.6 8 7.6C6.6 7.6 5.4 8.1 4.4 9L3.1 7.7C4.4 6.5 6.1 5.8 8 5.8Z" fill={iconColor}/>
          <circle cx="8" cy="10.5" r="1.5" fill={iconColor}/>
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect x="0.5" y="0.5" width="21" height="11" rx="2.5" stroke={iconColor} strokeOpacity="0.35"/>
          <rect x="2" y="2" width="18" height="8" rx="1.5" fill={iconColor}/>
          <path d="M23 4V8C24.1 7.5 24.1 4.5 23 4Z" fill={iconColor} fillOpacity="0.4"/>
        </svg>
      </div>
    </div>
  )
}

// Header with typing status
const IOSWhatsAppHeader = ({
  receiver,
  darkMode,
  showTyping,
  lastSeenTime,
}: {
  receiver: User
  darkMode: boolean
  showTyping: boolean
  lastSeenTime?: Date
}) => {
  const theme = darkMode ? themes.dark : themes.light
  
  const getStatusText = () => {
    if (showTyping) return 'typing...'
    if (lastSeenTime) {
      const lastSeenDate = lastSeenTime instanceof Date ? lastSeenTime : new Date(lastSeenTime)
      const today = new Date()
      const isToday = lastSeenDate.toDateString() === today.toDateString()
      const time = lastSeenDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false,
      })
      return isToday ? `last seen today at ${time}` : `last seen ${lastSeenDate.toLocaleDateString()}`
    }
    return 'online'
  }

  return (
    <div 
      className="flex items-center gap-[10px] px-[8px] py-[6px] border-b"
      style={{ 
        backgroundColor: theme.header,
        borderColor: theme.headerBorder,
      }}
    >
      <ChevronLeft className="w-[28px] h-[28px]" style={{ color: theme.headerIcon }} strokeWidth={2.5} />
      
      <Avatar className="w-[36px] h-[36px]">
        {receiver.avatar ? (
          <AvatarImage src={receiver.avatar} />
        ) : (
          <AvatarFallback 
            className="text-[14px] font-medium"
            style={{ 
              backgroundColor: darkMode ? '#2A3942' : '#DFE5E7',
              color: darkMode ? '#8696A0' : '#54656F',
            }}
          >
            {receiver.name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        )}
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[16px] truncate leading-[20px]" style={{ color: theme.headerText }}>
          {receiver.name}
        </p>
        <p className="text-[12px] truncate leading-[16px]" style={{ color: theme.headerSubtext }}>
          {getStatusText()}
        </p>
      </div>
      
      <div className="flex items-center gap-[20px] pr-[4px]">
        <Video className="w-[24px] h-[24px]" style={{ color: theme.headerIcon }} strokeWidth={1.5} />
        <Phone className="w-[22px] h-[22px]" style={{ color: theme.headerIcon }} strokeWidth={1.5} />
      </div>
    </div>
  )
}

// Date Separator
const DateSeparator = ({ date, darkMode }: { date: string; darkMode: boolean }) => {
  const theme = darkMode ? themes.dark : themes.light
  return (
    <div className="flex justify-center my-[8px]">
      <span 
        className="text-[12px] font-medium px-[12px] py-[4px] rounded-[8px]"
        style={{ 
          color: theme.dateSeparator,
          backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        }}
      >
        {date}
      </span>
    </div>
  )
}

// Encryption Notice
const EncryptionNotice = ({ darkMode }: { darkMode: boolean }) => {
  const theme = darkMode ? themes.dark : themes.light
  return (
    <div className="flex justify-center my-[6px] px-[16px]">
      <div 
        className="flex items-center gap-[6px] px-[12px] py-[8px] rounded-[8px] max-w-[340px]"
        style={{ backgroundColor: theme.encryptionBg }}
      >
        <Lock className="w-[12px] h-[12px] flex-shrink-0" style={{ color: theme.encryptionIcon }} />
        <span className="text-[11px] text-center leading-[14px]" style={{ color: theme.encryptionText }}>
          Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
        </span>
      </div>
    </div>
  )
}

// Typing Indicator
const TypingIndicator = ({ darkMode }: { darkMode: boolean }) => {
  const theme = darkMode ? themes.dark : themes.light
  
  return (
    <div className="flex px-[12px] justify-start mt-[8px]">
      <div 
        className="relative rounded-[18px] rounded-bl-[4px] px-[16px] py-[12px]"
        style={{ backgroundColor: theme.receivedBubble }}
      >
        {/* Tail */}
        <svg className="absolute bottom-0 -left-[8px]" width="12" height="19" viewBox="0 0 12 19">
          <path fill={theme.receivedBubble} d="M12 0 L12 19 L0 19 Q10 15 12 0 Z" />
        </svg>
        
        {/* Typing dots */}
        <div className="flex items-center gap-[4px]">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-[8px] h-[8px] rounded-full animate-bounce"
              style={{
                backgroundColor: darkMode ? '#8696A0' : '#667781',
                animationDelay: `${i * 0.15}s`,
                animationDuration: '0.6s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Animated Message Bubble
const AnimatedMessageBubble = ({
  message,
  sender,
  receiver,
  timeFormat,
  isFirstInGroup,
  darkMode,
  isVisible,
}: {
  message: Message
  sender: User
  receiver: User
  timeFormat: '12h' | '24h'
  isFirstInGroup: boolean
  darkMode: boolean
  isVisible: boolean
}) => {
  const theme = darkMode ? themes.dark : themes.light
  const isSent = message.userId === sender.id
  const timestamp = message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp)
  const time = formatTime(timestamp, timeFormat)
  const status = message.status || 'read'

  const bubbleBg = isSent ? theme.sentBubble : theme.receivedBubble
  const textColor = isSent ? theme.sentText : theme.receivedText
  const timeColor = isSent ? theme.sentTimeText : theme.timeText

  const hasImage = message.type === 'image' && message.imageUrl
  const hasText = message.content && message.content.trim().length > 0

  if (!isVisible) return null

  return (
    <div 
      className={cn(
        "flex px-[12px] transition-all duration-300",
        isSent ? "justify-end" : "justify-start",
        isFirstInGroup ? "mt-[8px]" : "mt-[2px]",
      )}
      style={{
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      <div className="relative max-w-[75%]">
        <div
          className={cn(
            "relative overflow-hidden",
            isFirstInGroup
              ? isSent
                ? "rounded-[18px] rounded-br-[4px]"
                : "rounded-[18px] rounded-bl-[4px]"
              : "rounded-[18px]"
          )}
          style={{
            backgroundColor: bubbleBg,
            boxShadow: darkMode ? 'none' : '0 1px 0.5px rgba(0, 0, 0, 0.13)',
          }}
        >
          {/* Tail */}
          {isFirstInGroup && (
            <svg
              className={cn("absolute bottom-0 z-10", isSent ? "-right-[8px]" : "-left-[8px]")}
              width="12" height="19" viewBox="0 0 12 19"
            >
              <path
                fill={bubbleBg}
                d={isSent ? "M0 0 L0 19 L12 19 Q2 15 0 0 Z" : "M12 0 L12 19 L0 19 Q10 15 12 0 Z"}
              />
            </svg>
          )}
          
          {/* Image Content */}
          {hasImage && (
            <div className="relative">
              <img 
                src={message.imageUrl} 
                alt="" 
                className="w-full max-w-[260px] object-cover"
                style={{ display: 'block' }}
                crossOrigin="anonymous"
              />
              {/* Image overlay for time/status when no text */}
              {!hasText && (
                <div 
                  className="absolute bottom-[6px] right-[8px] flex items-center gap-[3px] px-[6px] py-[2px] rounded-[10px]"
                  style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                >
                  <span className="text-[11px] text-white italic">{time}</span>
                  {isSent && (
                    <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
                      <path 
                        d="M11.071 0.653a.457.457 0 0 0-.304.117l-6.428 5.714-2.5-2.5a.464.464 0 0 0-.643 0 .464.464 0 0 0 0 .643l2.857 2.857a.464.464 0 0 0 .643 0l6.786-6.071a.464.464 0 0 0 0-.643.457.457 0 0 0-.41-.117Z" 
                        fill={status === 'read' ? '#53BDEB' : '#FFFFFF'}
                      />
                      <path 
                        d="M15.071 0.653a.457.457 0 0 0-.304.117l-6.428 5.714-.964-.964a.464.464 0 0 0-.643.643l1.286 1.286a.464.464 0 0 0 .643 0l6.786-6.071a.464.464 0 0 0 0-.643.457.457 0 0 0-.376-.082Z" 
                        fill={status === 'read' ? '#53BDEB' : '#FFFFFF'}
                      />
                    </svg>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Text Content */}
          {hasText && (
            <div className="flex flex-wrap items-end px-[12px] py-[8px]">
              <span className="text-[17px] leading-[22px] whitespace-pre-wrap break-words" style={{ color: textColor }}>
                {message.content}
              </span>
              
              {/* Time and Status */}
              <span className="flex items-center gap-[3px] ml-[8px] whitespace-nowrap text-[11px] italic" style={{ color: timeColor }}>
                {time}
                {isSent && (
                  <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
                    <path 
                      d="M11.071 0.653a.457.457 0 0 0-.304.117l-6.428 5.714-2.5-2.5a.464.464 0 0 0-.643 0 .464.464 0 0 0 0 .643l2.857 2.857a.464.464 0 0 0 .643 0l6.786-6.071a.464.464 0 0 0 0-.643.457.457 0 0 0-.41-.117Z" 
                      fill={status === 'read' ? '#53BDEB' : (darkMode ? '#8696A0' : '#667781')}
                    />
                    <path 
                      d="M15.071 0.653a.457.457 0 0 0-.304.117l-6.428 5.714-.964-.964a.464.464 0 0 0-.643.643l1.286 1.286a.464.464 0 0 0 .643 0l6.786-6.071a.464.464 0 0 0 0-.643.457.457 0 0 0-.376-.082Z" 
                      fill={status === 'read' ? '#53BDEB' : (darkMode ? '#8696A0' : '#667781')}
                    />
                  </svg>
                )}
              </span>
            </div>
          )}

          {/* Only time for image without text - already handled in image overlay */}
        </div>
      </div>
    </div>
  )
}

// Footer
const IOSWhatsAppFooter = ({ darkMode }: { darkMode: boolean }) => {
  const theme = darkMode ? themes.dark : themes.light
  
  return (
    <div className="border-t" style={{ backgroundColor: theme.footer, borderColor: theme.footerBorder }}>
      <div className="flex items-center gap-[8px] px-[8px] py-[6px]">
        <button className="w-[32px] h-[32px] flex items-center justify-center">
          <Plus className="w-[24px] h-[24px]" style={{ color: theme.headerIcon }} strokeWidth={1.5} />
        </button>
        
        <div 
          className="flex-1 flex items-center rounded-full border px-[12px] py-[6px]"
          style={{ backgroundColor: theme.inputBg, borderColor: theme.inputBorder }}
        >
          <input
            type="text"
            placeholder="Message"
            className="flex-1 text-[16px] bg-transparent outline-none"
            style={{ color: darkMode ? '#FFFFFF' : '#000000' }}
            disabled
          />
        </div>
        
        <button className="w-[32px] h-[32px] flex items-center justify-center">
          <Camera className="w-[24px] h-[24px]" style={{ color: theme.headerIcon }} strokeWidth={1.5} />
        </button>
        
        <button className="w-[32px] h-[32px] flex items-center justify-center">
          <Mic className="w-[24px] h-[24px]" style={{ color: theme.headerIcon }} strokeWidth={1.5} />
        </button>
      </div>
      
      <div className="flex justify-center pb-[8px] pt-[4px]">
        <div className="w-[134px] h-[5px] rounded-full" style={{ backgroundColor: theme.homeIndicator }} />
      </div>
    </div>
  )
}

// Main Animated Chat Preview Component
export const AnimatedChatPreview = forwardRef<AnimatedChatPreviewRef, AnimatedChatPreviewProps>(({
  sender,
  receiver,
  messages,
  darkMode,
  timeFormat,
  settings,
  typingDuration = 1500,
  messageDelay = 800,
  onAnimationComplete,
  onAnimationStart,
}, ref) => {
  const theme = darkMode ? themes.dark : themes.light
  const [visibleMessageCount, setVisibleMessageCount] = useState(0)
  const [showTyping, setShowTyping] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationStopped, setAnimationStopped] = useState(false)

  const startAnimation = useCallback(() => {
    setVisibleMessageCount(0)
    setShowTyping(false)
    setIsAnimating(true)
    setAnimationStopped(false)
    onAnimationStart?.()
  }, [onAnimationStart])

  const stopAnimation = useCallback(() => {
    setAnimationStopped(true)
    setIsAnimating(false)
    setShowTyping(false)
  }, [])

  const resetAnimation = useCallback(() => {
    setVisibleMessageCount(0)
    setShowTyping(false)
    setIsAnimating(false)
    setAnimationStopped(false)
  }, [])

  useImperativeHandle(ref, () => ({
    startAnimation,
    stopAnimation,
    resetAnimation,
    isAnimating,
  }))

  // Animation logic
  useEffect(() => {
    if (!isAnimating || animationStopped) return

    if (visibleMessageCount >= messages.length) {
      // Animation complete
      setTimeout(() => {
        setIsAnimating(false)
        onAnimationComplete?.()
      }, 1000) // Wait 1 second at the end
      return
    }

    const currentMessage = messages[visibleMessageCount]
    const isReceiverMessage = currentMessage?.userId !== sender.id

    if (isReceiverMessage) {
      // Receiver message: show typing first
      setShowTyping(true)
      
      const typingTimer = setTimeout(() => {
        if (animationStopped) return
        setShowTyping(false)
        setVisibleMessageCount(prev => prev + 1)
      }, typingDuration)

      return () => clearTimeout(typingTimer)
    } else {
      // Sender message: show directly after delay
      const messageTimer = setTimeout(() => {
        if (animationStopped) return
        setVisibleMessageCount(prev => prev + 1)
      }, messageDelay)

      return () => clearTimeout(messageTimer)
    }
  }, [isAnimating, visibleMessageCount, messages, sender.id, typingDuration, messageDelay, animationStopped, onAnimationComplete])

  // Group messages by date
  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div
      className="font-sf-pro transition-all duration-300 overflow-hidden w-[375px]"
      style={{
        borderRadius: '44px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.1)',
        background: '#000',
        padding: '2px',
      }}
    >
      <style jsx global>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      
      <div
        className="flex flex-col overflow-hidden antialiased"
        style={{ 
          height: '812px',
          borderRadius: '42px',
          backgroundColor: darkMode ? '#000000' : '#FFFFFF',
        }}
      >
        <IOSStatusBar darkMode={darkMode} />

        <IOSWhatsAppHeader
          receiver={receiver}
          darkMode={darkMode}
          showTyping={showTyping}
          lastSeenTime={settings.lastSeenTime}
        />

        <div 
          className="flex-1 overflow-y-auto relative" 
          style={{ 
            backgroundColor: darkMode 
              ? theme.chatBg 
              : (settings.backgroundColor || theme.chatBg) 
          }}
        >
          {/* Doodle Background */}
          {settings.backgroundType === 'doodle' && (settings.showDoodle !== false) && (
            <WhatsAppDoodle 
              opacity={settings.doodleOpacity || 0.06} 
              color={theme.doodleColor}
            />
          )}
          
          <div className="relative z-10 py-[4px]">
            {settings.showEncryptionNotice && <EncryptionNotice darkMode={darkMode} />}
            
            <DateSeparator date="Today" darkMode={darkMode} />
            
            {messages.slice(0, visibleMessageCount).map((message, index) => {
              const prevMessage = index > 0 ? messages[index - 1] : null
              const isFirstInGroup = !prevMessage || prevMessage.userId !== message.userId

              return (
                <AnimatedMessageBubble
                  key={message.id}
                  message={message}
                  sender={sender}
                  receiver={receiver}
                  timeFormat={timeFormat}
                  isFirstInGroup={isFirstInGroup}
                  darkMode={darkMode}
                  isVisible={true}
                />
              )
            })}
            
            {/* Typing Indicator - only for receiver */}
            {showTyping && <TypingIndicator darkMode={darkMode} />}
          </div>
        </div>

        <IOSWhatsAppFooter darkMode={darkMode} />
      </div>
    </div>
  )
})

AnimatedChatPreview.displayName = 'AnimatedChatPreview'
