'use client'

import { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useRef } from 'react'
import { Message, User, WhatsAppSettings, Language, FontFamily, SUPPORTED_FONTS, DeviceType } from '@/types'
import { cn } from '@/lib/utils'
import {
  ChevronLeft,
  Phone,
  Video,
  Camera,
  Mic,
  Plus,
  Lock,
  MoreVertical,
  Smile,
  Paperclip,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatTime } from '@/lib/utils'
import { useTranslations } from '@/lib/i18n/translations'

// Helper function to check if avatar is a color
const isColorAvatar = (avatar: string | null | undefined): boolean => {
  return avatar?.startsWith('color:') || false
}

// Helper function to get color from avatar string
const getAvatarColor = (avatar: string | null | undefined): string | null => {
  if (avatar?.startsWith('color:')) {
    return avatar.replace('color:', '')
  }
  return null
}

// Helper function to check if avatar is a valid image URL
const isImageAvatar = (avatar: string | null | undefined): boolean => {
  return !!avatar && !avatar.startsWith('color:')
}

interface AnimatedChatPreviewProps {
  sender: User
  receiver: User
  messages: Message[]
  darkMode: boolean
  timeFormat: '12h' | '24h'
  settings: WhatsAppSettings
  language?: Language
  fontFamily?: FontFamily
  deviceType?: DeviceType
  // Animation settings
  typingDuration?: number // ms - typing indicator süresi
  messageDelay?: number // ms - mesajlar arası bekleme
  messageAppearDuration?: number // ms - mesajın ekrana gelme animasyon süresi
  onAnimationComplete?: () => void
  onAnimationStart?: () => void
  // Video export mode - no phone frame, sharp corners
  forVideoExport?: boolean
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

// Doodle Pattern - Image based for both light and dark mode
const WhatsAppDoodle = ({ opacity = 1, darkMode }: { opacity?: number; color?: string; darkMode?: boolean }) => {
  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{
        backgroundImage: darkMode 
          ? 'url(/images/whatsapp-doodle-dark.png)' 
          : 'url(/images/whatsapp-doodle-light.png)',
        backgroundRepeat: 'repeat',
        backgroundSize: '400px auto',
        opacity: opacity,
      }}
    />
  )
}

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

// Android Status Bar
const AndroidStatusBar = ({ darkMode }: { darkMode: boolean }) => {
  return (
    <div 
      className="flex items-center justify-between px-[16px] py-[8px]"
      style={{ backgroundColor: '#075E54' }}
    >
      <span 
        className="text-[14px] font-normal"
        style={{ color: '#FFFFFF', fontFamily: 'Roboto, sans-serif' }}
      >
        9:41
      </span>
      <div className="flex items-center gap-[6px]">
        <span className="text-[12px] font-medium" style={{ color: '#FFFFFF' }}>4G</span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M0 14L14 0V14H0Z" fill="#FFFFFF" fillOpacity="0.3"/>
          <path d="M4 14L14 4V14H4Z" fill="#FFFFFF"/>
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <path d="M8 3C10.2 3 12.2 3.8 13.7 5.1L12.3 6.7C11.1 5.6 9.6 5 8 5C6.4 5 4.9 5.6 3.7 6.7L2.3 5.1C3.8 3.8 5.8 3 8 3Z" fill="#FFFFFF"/>
          <path d="M8 7C9.3 7 10.5 7.5 11.4 8.3L10 9.9C9.4 9.4 8.7 9 8 9C7.3 9 6.6 9.4 6 9.9L4.6 8.3C5.5 7.5 6.7 7 8 7Z" fill="#FFFFFF"/>
          <circle cx="8" cy="11" r="1" fill="#FFFFFF"/>
        </svg>
        <span className="text-[12px]" style={{ color: '#FFFFFF' }}>100%</span>
        <svg width="20" height="10" viewBox="0 0 20 10" fill="none">
          <rect x="0.5" y="0.5" width="16" height="9" rx="1" stroke="#FFFFFF" strokeOpacity="0.5"/>
          <rect x="2" y="2" width="14" height="6" rx="0.5" fill="#4CAF50"/>
          <rect x="17" y="3" width="2" height="4" rx="0.5" fill="#FFFFFF" fillOpacity="0.5"/>
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
  isGroupChat,
  groupName,
  groupIcon,
  participantCount,
  typingUserName,
  t,
}: {
  receiver: User
  darkMode: boolean
  showTyping: boolean
  lastSeenTime?: Date
  isGroupChat?: boolean
  groupName?: string
  groupIcon?: string
  participantCount?: number
  typingUserName?: string
  t: ReturnType<typeof useTranslations>
}) => {
  const theme = darkMode ? themes.dark : themes.light

  const getStatusText = () => {
    if (isGroupChat && participantCount) {
      if (showTyping && typingUserName) return `${typingUserName} ${t.preview.isTyping}`
      return `${participantCount} ${t.preview.participants}`
    }
    if (showTyping) return t.preview.typing
    // Always show 'online' to avoid hydration issues with date comparisons
    return t.preview.online
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
        {isGroupChat ? (
          // Group chat avatar
          <>
            {groupIcon && !groupIcon.startsWith('color:') && (
              <AvatarImage src={groupIcon} />
            )}
            <AvatarFallback
              className="text-[14px] font-medium text-white"
              style={{
                backgroundColor: groupIcon?.startsWith('color:') ? groupIcon.replace('color:', '') : '#128C7E',
                color: '#FFFFFF',
              }}
            >
              {groupName?.charAt(0).toUpperCase() || 'G'}
            </AvatarFallback>
          </>
        ) : (
          // 1-1 chat avatar
          <>
            {isImageAvatar(receiver.avatar) && (
              <AvatarImage src={receiver.avatar!} />
            )}
            <AvatarFallback
              className="text-[14px] font-medium text-white"
              style={{
                backgroundColor: getAvatarColor(receiver.avatar) || '#128C7E',
                color: '#FFFFFF',
              }}
            >
              {receiver.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </>
        )}
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[16px] truncate leading-[20px]" style={{ color: theme.headerText }}>
          {isGroupChat ? groupName : receiver.name}
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

// Android WhatsApp Header
const AndroidWhatsAppHeader = ({
  receiver,
  darkMode,
  showTyping,
  isGroupChat,
  groupName,
  groupIcon,
  participantCount,
  typingUserName,
  t,
}: {
  receiver: User
  darkMode: boolean
  showTyping: boolean
  isGroupChat?: boolean
  groupName?: string
  groupIcon?: string
  participantCount?: number
  typingUserName?: string
  t: ReturnType<typeof useTranslations>
}) => {
  const getStatusText = () => {
    if (isGroupChat && participantCount) {
      if (showTyping && typingUserName) return `${typingUserName} ${t.preview.isTyping}`
      return `${participantCount} ${t.preview.participants}`
    }
    if (showTyping) return t.preview.typing
    return t.preview.online
  }

  return (
    <div
      className="flex items-center gap-[6px] px-[4px] py-[8px]"
      style={{ backgroundColor: '#075E54' }}
    >
      <button className="p-[8px]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="#FFFFFF"/>
        </svg>
      </button>

      <Avatar className="w-[40px] h-[40px]">
        {isGroupChat ? (
          // Group chat avatar
          <>
            {groupIcon && !groupIcon.startsWith('color:') && (
              <AvatarImage src={groupIcon} />
            )}
            <AvatarFallback
              className="text-[16px] font-medium text-white"
              style={{
                backgroundColor: groupIcon?.startsWith('color:') ? groupIcon.replace('color:', '') : '#128C7E',
                color: '#FFFFFF',
              }}
            >
              {groupName?.charAt(0).toUpperCase() || 'G'}
            </AvatarFallback>
          </>
        ) : (
          // 1-1 chat avatar
          <>
            {isImageAvatar(receiver.avatar) && (
              <AvatarImage src={receiver.avatar!} />
            )}
            <AvatarFallback
              className="text-[16px] font-medium text-white"
              style={{
                backgroundColor: getAvatarColor(receiver.avatar) || '#128C7E',
                color: '#FFFFFF',
              }}
            >
              {receiver.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </>
        )}
      </Avatar>

      <div className="flex-1 min-w-0 ml-[4px]">
        <p
          className="font-medium text-[16px] truncate leading-[20px]"
          style={{ color: '#FFFFFF', fontFamily: 'Roboto, sans-serif' }}
        >
          {isGroupChat ? groupName : receiver.name}
        </p>
        <p
          className="text-[13px] truncate leading-[16px]"
          style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Roboto, sans-serif' }}
        >
          {getStatusText()}
        </p>
      </div>

      <div className="flex items-center">
        <button className="p-[8px]">
          <Video className="w-[22px] h-[22px]" style={{ color: '#FFFFFF' }} strokeWidth={1.5} />
        </button>
        <button className="p-[8px]">
          <Phone className="w-[20px] h-[20px]" style={{ color: '#FFFFFF' }} strokeWidth={1.5} />
        </button>
        <button className="p-[8px]">
          <MoreVertical className="w-[20px] h-[20px]" style={{ color: '#FFFFFF' }} strokeWidth={1.5} />
        </button>
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
const EncryptionNotice = ({ darkMode, t }: { darkMode: boolean; t: ReturnType<typeof useTranslations> }) => {
  const theme = darkMode ? themes.dark : themes.light
  return (
    <div className="flex justify-center my-[6px] px-[16px]">
      <div 
        className="flex items-center gap-[6px] px-[12px] py-[8px] rounded-[8px] max-w-[340px]"
        style={{ backgroundColor: theme.encryptionBg }}
      >
        <Lock className="w-[12px] h-[12px] flex-shrink-0" style={{ color: theme.encryptionIcon }} />
        <span className="text-[11px] text-center leading-[14px]" style={{ color: theme.encryptionText }}>
          {t.preview.encryptionNotice}
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

// Group Chat Sender Name
const GroupSenderName = ({ name, color }: { name: string; color?: string }) => (
  <p className="text-[12px] font-semibold" style={{ color: color || '#25D366' }}>
    {name}
  </p>
)

// Animated Message Bubble
const AnimatedMessageBubble = ({
  message,
  sender,
  receiver,
  timeFormat,
  isFirstInGroup,
  isLastInGroup,
  darkMode,
  isVisible,
  appearDuration = 400,
  isGroupChat,
  participants,
}: {
  message: Message
  sender: User
  receiver: User
  timeFormat: '12h' | '24h'
  isFirstInGroup: boolean
  isLastInGroup: boolean
  darkMode: boolean
  isVisible: boolean
  appearDuration?: number
  isGroupChat?: boolean
  participants?: User[]
}) => {
  const theme = darkMode ? themes.dark : themes.light
  // Check if message is from current user - supports sender.id, 'me', and 'sender-1' (group chat default)
  const isSent = message.userId === sender.id || message.userId === 'me' || message.userId === 'sender-1'
  const timestamp = message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp)
  const time = formatTime(timestamp, timeFormat)
  const status = message.status || 'read'

  // Get sender info for group chat
  // First check message's own sender info (senderName, senderColor), then fallback to participants lookup
  const participantData = participants?.find(p => p.id === message.userId)
  const messageSender = isGroupChat && !isSent
    ? (message.senderName
        ? { id: message.senderId || message.userId, name: message.senderName, color: message.senderColor, avatar: participantData?.avatar || null }
        : participantData || receiver)
    : null

  // Check if we should show avatar (group chat, received message, last in group - next to tail)
  const showGroupAvatar = isGroupChat && !isSent && isLastInGroup && messageSender

  const bubbleBg = isSent ? theme.sentBubble : theme.receivedBubble
  const textColor = isSent ? theme.sentText : theme.receivedText
  const timeColor = isSent ? theme.sentTimeText : theme.timeText

  const hasImage = message.type === 'image' && message.imageUrl
  const hasText = message.content && message.content.trim().length > 0

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "flex px-[12px]",
        isSent ? "justify-end" : "justify-start",
        isFirstInGroup ? "mt-[8px]" : "mt-[2px]",
      )}
      style={{
        animation: `slideUp ${appearDuration}ms ease-out`,
      }}
    >
      {/* Group chat avatar - shown on last message (next to tail) */}
      {showGroupAvatar && (
        <div className="flex-shrink-0 mr-[6px] self-end mb-[2px]">
          <Avatar className="w-[28px] h-[28px]">
            {isImageAvatar(messageSender.avatar) ? (
              <AvatarImage src={messageSender.avatar!} alt={messageSender.name} />
            ) : isColorAvatar(messageSender.avatar) ? (
              <AvatarFallback
                style={{ backgroundColor: getAvatarColor(messageSender.avatar) || '#128C7E' }}
                className="text-white text-[11px] font-medium"
              >
                {messageSender.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </AvatarFallback>
            ) : (
              <AvatarFallback
                style={{ backgroundColor: messageSender.color || '#128C7E' }}
                className="text-white text-[11px] font-medium"
              >
                {messageSender.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
      )}
      {/* Spacer for non-last messages in group to align with avatar */}
      {isGroupChat && !isSent && !isLastInGroup && (
        <div className="w-[34px] flex-shrink-0" />
      )}
      <div className="relative max-w-[75%]">
        <div
          className={cn(
            "relative",
            // Tail appears on last message of group, so bottom corner should be small on last message
            isLastInGroup
              ? isSent
                ? "rounded-[8px] rounded-br-[2px]"
                : "rounded-[8px] rounded-bl-[2px]"
              : "rounded-[8px]"
          )}
          style={{
            backgroundColor: bubbleBg,
            boxShadow: darkMode ? 'none' : '0 1px 0.5px rgba(0, 0, 0, 0.13)',
          }}
        >
          {/* Tail - shown on last message in a group from same sender */}
          {isLastInGroup && (
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

          {/* Group sender name */}
          {isGroupChat && !isSent && isFirstInGroup && messageSender && (
            <div className="px-[12px] pt-[6px]">
              <GroupSenderName name={messageSender.name} color={messageSender.color} />
            </div>
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
            <div className={cn(
              "relative px-[12px]",
              isGroupChat && !isSent && isFirstInGroup && messageSender ? "pt-[2px] pb-[8px]" : "py-[8px]"
            )}>
              {/* Text content with inline time spacer */}
              <span className="text-[17px] leading-[22px] whitespace-pre-wrap break-words" style={{ color: textColor }}>
                {message.content}
                {/* Invisible spacer to reserve space for time */}
                <span className="inline-block opacity-0 text-[11px] ml-[6px]" aria-hidden="true">
                  {time}{isSent ? ' ✓✓' : ''}
                </span>
              </span>

              {/* Visible time - absolute positioned over the spacer */}
              <span
                className="absolute bottom-[8px] right-[12px] inline-flex items-center gap-[3px] whitespace-nowrap text-[11px]"
                style={{ color: timeColor }}
              >
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
const IOSWhatsAppFooter = ({ darkMode, t }: { darkMode: boolean; t: ReturnType<typeof useTranslations> }) => {
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
            placeholder={t.preview.message}
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

// Android WhatsApp Footer
const AndroidWhatsAppFooter = ({ darkMode, t }: { darkMode: boolean; t: ReturnType<typeof useTranslations> }) => {
  return (
    <div 
      className="flex items-center gap-[8px] px-[8px] py-[8px]"
      style={{ backgroundColor: darkMode ? '#1F2C34' : '#F0F0F0' }}
    >
      <button className="w-[40px] h-[40px] flex items-center justify-center">
        <Smile className="w-[24px] h-[24px]" style={{ color: darkMode ? '#8696A0' : '#54656F' }} strokeWidth={1.5} />
      </button>
      
      <div 
        className="flex-1 flex items-center rounded-[24px] px-[4px] py-[4px]"
        style={{ backgroundColor: darkMode ? '#2A3942' : '#FFFFFF' }}
      >
        <input
          type="text"
          placeholder={t.preview.message}
          className="flex-1 text-[16px] bg-transparent outline-none px-[12px]"
          style={{ 
            color: darkMode ? '#FFFFFF' : '#000000',
            fontFamily: 'Roboto, sans-serif',
          }}
          disabled
        />
        
        <button className="w-[36px] h-[36px] flex items-center justify-center">
          <Paperclip 
            className="w-[22px] h-[22px] rotate-45" 
            style={{ color: darkMode ? '#8696A0' : '#54656F' }} 
            strokeWidth={1.5} 
          />
        </button>
        
        <button className="w-[36px] h-[36px] flex items-center justify-center">
          <Camera className="w-[22px] h-[22px]" style={{ color: darkMode ? '#8696A0' : '#54656F' }} strokeWidth={1.5} />
        </button>
      </div>
      
      <button 
        className="w-[48px] h-[48px] rounded-full flex items-center justify-center"
        style={{ backgroundColor: '#00A884' }}
      >
        <Mic className="w-[24px] h-[24px] text-white" strokeWidth={2} />
      </button>
    </div>
  )
}

// Animation state machine
type AnimationPhase =
  | 'idle'
  | 'waiting_before_typing'  // Mesajdan önce bekleme
  | 'typing'                  // Typing gösteriliyor
  | 'waiting_after_typing'    // Typing'den sonra kısa bekleme
  | 'showing_message'         // Mesaj gösteriliyor (animasyon)
  | 'waiting_after_message'   // Mesaj animasyonu bittikten sonra bekleme
  | 'complete'

// Global animation session ID - prevents duplicate animations across React StrictMode remounts
let globalAnimationSessionId: string | null = null

// Main Animated Chat Preview Component
export const AnimatedChatPreview = forwardRef<AnimatedChatPreviewRef, AnimatedChatPreviewProps>(({
  sender,
  receiver,
  messages,
  darkMode,
  timeFormat,
  settings,
  language = 'en',
  fontFamily = 'sf-pro',
  deviceType = 'ios',
  typingDuration = 2000,
  messageDelay = 1200,
  messageAppearDuration = 400,
  onAnimationComplete,
  onAnimationStart,
  forVideoExport = false,
}, ref) => {
  const theme = darkMode ? themes.dark : themes.light
  const t = useTranslations(language)
  const isAndroid = deviceType === 'android'

  // Check if group chat mode is enabled
  const isGroupChat = settings.groupParticipants && settings.groupParticipants.length > 0

  // Get font style from SUPPORTED_FONTS
  const fontStyle = SUPPORTED_FONTS.find(f => f.code === fontFamily)?.style || SUPPORTED_FONTS[0].style
  const [visibleMessageCount, setVisibleMessageCount] = useState(0)
  const [showTyping, setShowTyping] = useState(false)
  const [typingUserName, setTypingUserName] = useState<string | undefined>(undefined)
  const [isAnimating, setIsAnimating] = useState(false)
  const [phase, setPhase] = useState<AnimationPhase>('idle')
  const animationStoppedRef = useRef(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentOffset, setContentOffset] = useState(0)
  const [isReady, setIsReady] = useState(true)

  // Mark component as ready after props change
  // Only reset when critical props change (isGroupChat), not on every render
  useEffect(() => {
    // Component is immediately ready - no artificial delay needed
    setIsReady(true)
  }, [isGroupChat])

  // Auto-scroll to bottom when new messages appear or typing indicator shows
  useEffect(() => {
    if (chatContainerRef.current && contentRef.current) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (chatContainerRef.current && contentRef.current) {
            const containerHeight = chatContainerRef.current.clientHeight
            const contentHeight = contentRef.current.scrollHeight
            
            if (forVideoExport) {
              // For video export: use transform instead of scroll
              // This ensures html-to-image captures the correct position
              const offset = Math.max(0, contentHeight - containerHeight)
              setContentOffset(offset)
            } else {
              // For preview: use normal scroll
              chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
            }
          }
        })
      })
    }
  }, [visibleMessageCount, showTyping, forVideoExport])

  // Ref for animation session tracking
  const animationSessionIdRef = useRef<string | null>(null)

  const startAnimation = useCallback(() => {
    // Generate unique session ID for this animation
    const newSessionId = `animation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Guard: If there's already an active global session, skip this call (React StrictMode duplicate)
    if (globalAnimationSessionId !== null) {
      console.log('Animation already in progress (session:', globalAnimationSessionId, '), skipping duplicate call')
      return
    }

    // Claim this session globally
    globalAnimationSessionId = newSessionId
    animationSessionIdRef.current = newSessionId

    console.log('Starting animation with session:', newSessionId)

    // Start animation immediately - component is always ready
    setVisibleMessageCount(0)
    setShowTyping(false)
    setContentOffset(0)
    setIsAnimating(true)
    setPhase('waiting_before_typing')
    animationStoppedRef.current = false
    onAnimationStart?.()
  }, [onAnimationStart])

  const stopAnimation = useCallback(() => {
    console.log('Stopping animation, session:', animationSessionIdRef.current)
    animationStoppedRef.current = true
    // Clear global session
    globalAnimationSessionId = null
    animationSessionIdRef.current = null
    setIsAnimating(false)
    setShowTyping(false)
    setTypingUserName(undefined)
    setPhase('idle')
  }, [])

  const resetAnimation = useCallback(() => {
    console.log('Resetting animation')
    setShowTyping(false)
    setTypingUserName(undefined)
    setIsAnimating(false)
    setPhase('idle')
    animationStoppedRef.current = false
    // Clear sessions
    globalAnimationSessionId = null
    animationSessionIdRef.current = null
    setVisibleMessageCount(0)
    setContentOffset(0)
  }, [])

  useImperativeHandle(ref, () => ({
    startAnimation,
    stopAnimation,
    resetAnimation,
    isAnimating,
  }))

  // Animation state machine
  useEffect(() => {
    if (!isAnimating || animationStoppedRef.current || phase === 'idle') return

    // Animation tamamlandı
    if (visibleMessageCount >= messages.length && phase !== 'complete') {
      setPhase('complete')
      // Final scroll and complete
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
        setTimeout(() => {
          setIsAnimating(false)
          // Clear sessions on complete
          globalAnimationSessionId = null
          animationSessionIdRef.current = null
          onAnimationComplete?.()
        }, 500)
      }, 500)
      return
    }

    if (phase === 'complete') return

    const currentMessage = messages[visibleMessageCount]
    if (!currentMessage) return

    // Check if message is from receiver (not from current user)
    // Supports both sender.id and legacy 'me' value
    const isSenderMessage = currentMessage.userId === sender.id || currentMessage.userId === 'me'
    const isReceiverMessage = !isSenderMessage

    // State machine transitions
    switch (phase) {
      case 'waiting_before_typing': {
        // Mesajdan önce kısa bir bekleme (önceki mesajın oturması için)
        const waitTime = visibleMessageCount === 0 ? 300 : messageDelay
        const timer = setTimeout(() => {
          if (animationStoppedRef.current) return

          if (isReceiverMessage) {
            // Receiver mesajı: typing göster
            // Grup chat için kimin yazdığını bul
            if (isGroupChat) {
              const senderName = currentMessage.senderName ||
                settings.groupParticipants?.find(p => p.id === currentMessage.userId)?.name ||
                receiver.name
              setTypingUserName(senderName)
            }
            setShowTyping(true)
            setPhase('typing')
          } else {
            // Sender mesajı: direkt mesajı göster
            setPhase('showing_message')
          }
        }, waitTime)
        return () => clearTimeout(timer)
      }

      case 'typing': {
        // Typing süresi
        const timer = setTimeout(() => {
          if (animationStoppedRef.current) return
          setShowTyping(false)
          setTypingUserName(undefined)
          setPhase('waiting_after_typing')
        }, typingDuration)
        return () => clearTimeout(timer)
      }

      case 'waiting_after_typing': {
        // Typing bittikten sonra çok kısa bekleme (görsel geçiş için)
        const timer = setTimeout(() => {
          if (animationStoppedRef.current) return
          setPhase('showing_message')
        }, 100)
        return () => clearTimeout(timer)
      }

      case 'showing_message': {
        // Mesajı göster
        setVisibleMessageCount(prev => prev + 1)
        setPhase('waiting_after_message')
        break
      }

      case 'waiting_after_message': {
        // Mesaj animasyonu + ekstra bekleme süresi
        // Bu süre mesajın tam görünmesi ve bir sonraki adıma geçmeden önce beklemesi için
        const timer = setTimeout(() => {
          if (animationStoppedRef.current) return
          setPhase('waiting_before_typing')
        }, messageAppearDuration + 200) // Animasyon süresi + ekstra 200ms bekleme
        return () => clearTimeout(timer)
      }
    }
  }, [isAnimating, phase, visibleMessageCount, messages, sender.id, typingDuration, messageDelay, messageAppearDuration, onAnimationComplete, isGroupChat, settings.groupParticipants, receiver.name])

  return (
    <div
      className="transition-all duration-300 w-[375px]"
      style={{
        borderRadius: forVideoExport ? 0 : (isAndroid ? '24px' : '44px'),
        boxShadow: forVideoExport ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.1)',
        background: forVideoExport ? 'transparent' : '#000',
        padding: forVideoExport ? 0 : '2px',
        overflow: 'hidden',
        fontFamily: fontStyle,
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
        className="flex flex-col antialiased"
        style={{ 
          height: '812px',
          borderRadius: forVideoExport ? 0 : (isAndroid ? '22px' : '42px'),
          backgroundColor: darkMode ? '#000000' : '#FFFFFF',
          overflow: 'hidden',
        }}
      >
        {/* Status Bar - Conditional */}
        {isAndroid ? (
          <AndroidStatusBar darkMode={darkMode} />
        ) : (
          <IOSStatusBar darkMode={darkMode} />
        )}

        {/* Header - Conditional */}
        {isAndroid ? (
          <AndroidWhatsAppHeader
            receiver={receiver}
            darkMode={darkMode}
            showTyping={showTyping}
            isGroupChat={isGroupChat}
            groupName={settings.groupName}
            groupIcon={settings.groupIcon}
            participantCount={settings.groupParticipants?.length}
            typingUserName={typingUserName}
            t={t}
          />
        ) : (
          <IOSWhatsAppHeader
            receiver={receiver}
            darkMode={darkMode}
            showTyping={showTyping}
            lastSeenTime={settings.lastSeenTime}
            isGroupChat={isGroupChat}
            groupName={settings.groupName}
            groupIcon={settings.groupIcon}
            participantCount={settings.groupParticipants?.length}
            typingUserName={typingUserName}
            t={t}
          />
        )}

        {/* Chat Area Container */}
        <div className="flex-1 relative overflow-hidden">
          {/* Fixed Background Layer */}
          <div 
            className="absolute inset-0 w-full h-full"
            style={{ 
              backgroundColor: darkMode 
                ? theme.chatBg 
                : (settings.backgroundType === 'solid' || settings.backgroundType === 'doodle')
                  ? (settings.backgroundColor || theme.chatBg)
                  : theme.chatBg
            }}
          >
            {/* Image Background - Fixed */}
            {settings.backgroundType === 'image' && settings.backgroundImage && (
              <div 
                className="absolute inset-0 w-full h-full"
                style={{
                  backgroundImage: `url(${settings.backgroundImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              />
            )}
            
            {/* Doodle Background - Fixed */}
            {settings.backgroundType === 'doodle' && (settings.showDoodle !== false) && (
              <WhatsAppDoodle 
                opacity={settings.doodleOpacity || 0.06} 
                color={theme.doodleColor}
                darkMode={darkMode}
              />
            )}
          </div>

          {/* Scrollable Content Layer */}
          <div 
            ref={chatContainerRef}
            data-scroll-container="true"
            className={cn(
              "absolute inset-0 overflow-y-auto overflow-x-hidden",
              forVideoExport 
                ? "scrollbar-hide" 
                : (darkMode ? "chat-scrollbar-dark" : "chat-scrollbar")
            )}
          >
          
          <div 
            ref={contentRef}
            className="relative z-10 py-[4px] pb-[40px]"
            style={forVideoExport ? { transform: `translateY(-${contentOffset}px)` } : undefined}
          >
            {settings.showEncryptionNotice && <EncryptionNotice darkMode={darkMode} t={t} />}
            
            <DateSeparator date={t.preview.today} darkMode={darkMode} />
            
            {messages.slice(0, visibleMessageCount).map((message, index, visibleMessages) => {
              const prevMessage = index > 0 ? visibleMessages[index - 1] : null
              const nextMessage = index < visibleMessages.length - 1 ? visibleMessages[index + 1] : null
              const isFirstInGroup = !prevMessage || prevMessage.userId !== message.userId
              const isLastInGroup = !nextMessage || nextMessage.userId !== message.userId

              return (
                <AnimatedMessageBubble
                  key={message.id}
                  message={message}
                  sender={sender}
                  receiver={receiver}
                  timeFormat={timeFormat}
                  isFirstInGroup={isFirstInGroup}
                  isLastInGroup={isLastInGroup}
                  darkMode={darkMode}
                  isVisible={true}
                  appearDuration={messageAppearDuration}
                  isGroupChat={isGroupChat}
                  participants={settings.groupParticipants}
                />
              )
            })}
            
            {/* Typing Indicator - only for receiver */}
            {showTyping && <TypingIndicator darkMode={darkMode} />}
          </div>
          </div>
        </div>

        {/* Footer - Conditional */}
        {isAndroid ? (
          <AndroidWhatsAppFooter darkMode={darkMode} t={t} />
        ) : (
          <IOSWhatsAppFooter darkMode={darkMode} t={t} />
        )}
      </div>
    </div>
  )
})

AnimatedChatPreview.displayName = 'AnimatedChatPreview'
