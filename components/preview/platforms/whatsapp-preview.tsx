'use client'

import { useMemo, memo } from 'react'
import { Message, User, MessageStatus, WhatsAppSettings, ReplyTo, MessageReaction, VoiceMessageData, DocumentData, VideoData, LocationData, ContactData, FontFamily, SUPPORTED_FONTS, DeviceType } from '@/types'
import { formatTime, cn } from '@/lib/utils'
import {
  ChevronLeft,
  Phone,
  Video,
  Camera,
  Mic,
  Plus,
  Check,
  CheckCheck,
  Clock,
  Lock,
  Forward,
  FileText,
  Play,
  Pause,
  MapPin,
  User as UserIcon,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Smile,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useTranslations } from '@/lib/i18n/translations'
import { Language } from '@/types'

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

interface WhatsAppPreviewProps {
  sender: User
  receiver: User
  messages: Message[]
  darkMode: boolean
  mobileView: boolean
  timeFormat: '12h' | '24h'
  transparentBg: boolean
  settings: WhatsAppSettings
  language?: Language
  fontFamily?: FontFamily
  batteryLevel?: number
  deviceType?: DeviceType
  // Animation props for video export
  visibleMessageCount?: number // If set, only shows this many messages
  showTypingIndicator?: boolean // If true, shows typing indicator at the end
  // Export mode - removes phone frame and uses sharp corners
  forExport?: boolean
}

// Theme colors
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
    inputPlaceholder: '#8E8E93',
    doodleColor: '#C8C4BA',
    homeIndicator: '#000000',
    voiceBg: '#E7FFDB',
    voiceWave: '#50C878',
    documentIcon: '#007AFF',
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
    inputPlaceholder: '#8696A0',
    doodleColor: '#182229',
    homeIndicator: '#FFFFFF',
    voiceBg: '#005C4B',
    voiceWave: '#7FCBAB',
    documentIcon: '#00A884',
  },
}

const defaultSettings: WhatsAppSettings = {
  backgroundType: 'doodle',
  backgroundColor: '#EFEFE4',
  backgroundImage: undefined,
  showDoodle: true,
  doodleOpacity: 0.06,
  wallpaperColor: '#EFEFE4',
  showEncryptionNotice: true,
  lastSeen: 'online',
}

// iOS WhatsApp Doodle Pattern - Image based for both light and dark mode
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
const IOSStatusBar = ({ darkMode, batteryLevel = 100 }: { darkMode: boolean; batteryLevel?: number }) => {
  const theme = darkMode ? themes.dark : themes.light
  const iconColor = theme.statusBarText
  const isLowBattery = batteryLevel <= 20
  const batteryFillColor = isLowBattery ? '#FF3B30' : iconColor
  const batteryWidth = Math.max(0, Math.min(100, batteryLevel)) / 100 * 18 // 18 is max fill width
  
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
          <rect x="2" y="2" width={batteryWidth} height="8" rx="1.5" fill={batteryFillColor}/>
          <path d="M23 4V8C24.1 7.5 24.1 4.5 23 4Z" fill={iconColor} fillOpacity="0.4"/>
        </svg>
      </div>
    </div>
  )
}

// Android Status Bar
const AndroidStatusBar = ({ darkMode, batteryLevel = 100 }: { darkMode: boolean; batteryLevel?: number }) => {
  const theme = darkMode ? themes.dark : themes.light
  const iconColor = theme.statusBarText
  const isLowBattery = batteryLevel <= 20
  const batteryFillColor = isLowBattery ? '#F44336' : '#4CAF50'
  const batteryWidth = Math.max(0, Math.min(100, batteryLevel)) / 100 * 14 // 14 is max fill width for Android
  
  return (
    <div 
      className="flex items-center justify-between px-[16px] py-[8px]"
      style={{ backgroundColor: darkMode ? '#075E54' : '#075E54' }}
    >
      {/* Left side - Time */}
      <span 
        className="text-[14px] font-normal"
        style={{ color: '#FFFFFF', fontFamily: 'Roboto, sans-serif' }}
      >
        9:41
      </span>
      
      {/* Right side - Icons */}
      <div className="flex items-center gap-[6px]">
        {/* Network type */}
        <span className="text-[12px] font-medium" style={{ color: '#FFFFFF' }}>4G</span>
        
        {/* Signal strength - Android style triangular */}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M0 14L14 0V14H0Z" fill="#FFFFFF" fillOpacity="0.3"/>
          <path d="M4 14L14 4V14H4Z" fill="#FFFFFF"/>
        </svg>
        
        {/* WiFi - Android style */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <path d="M8 3C10.2 3 12.2 3.8 13.7 5.1L12.3 6.7C11.1 5.6 9.6 5 8 5C6.4 5 4.9 5.6 3.7 6.7L2.3 5.1C3.8 3.8 5.8 3 8 3Z" fill="#FFFFFF"/>
          <path d="M8 7C9.3 7 10.5 7.5 11.4 8.3L10 9.9C9.4 9.4 8.7 9 8 9C7.3 9 6.6 9.4 6 9.9L4.6 8.3C5.5 7.5 6.7 7 8 7Z" fill="#FFFFFF"/>
          <circle cx="8" cy="11" r="1" fill="#FFFFFF"/>
        </svg>
        
        {/* Battery percentage */}
        <span className="text-[12px]" style={{ color: isLowBattery ? '#F44336' : '#FFFFFF' }}>
          {batteryLevel}%
        </span>
        
        {/* Battery icon - Android style */}
        <svg width="20" height="10" viewBox="0 0 20 10" fill="none">
          <rect x="0.5" y="0.5" width="16" height="9" rx="1" stroke="#FFFFFF" strokeOpacity="0.5"/>
          <rect x="2" y="2" width={batteryWidth} height="6" rx="0.5" fill={batteryFillColor}/>
          <rect x="17" y="3" width="2" height="4" rx="0.5" fill="#FFFFFF" fillOpacity="0.5"/>
        </svg>
      </div>
    </div>
  )
}

// Android WhatsApp Header
const AndroidWhatsAppHeader = ({
  receiver,
  lastSeen,
  lastSeenTime,
  darkMode,
  isGroupChat,
  groupName,
  groupIcon,
  participantCount,
  t,
}: {
  receiver: User
  lastSeen: WhatsAppSettings['lastSeen']
  lastSeenTime?: Date
  darkMode: boolean
  isGroupChat?: boolean
  groupName?: string
  groupIcon?: string
  participantCount?: number
  t: ReturnType<typeof useTranslations>
}) => {
  const getStatusText = () => {
    if (isGroupChat && participantCount) {
      if (lastSeen === 'typing') return 'Sarah ' + t.preview.typing
      return `${participantCount} ${t.preview.participants}`
    }
    
    switch (lastSeen) {
      case 'online':
        return t.preview.online
      case 'typing':
        return t.preview.typing
      case 'last-seen':
        return `${t.preview.lastSeenToday} 14:30`
      case 'none':
        return t.preview.tapForContactInfo
      default:
        return t.preview.tapForContactInfo
    }
  }

  return (
    <div 
      className="flex items-center gap-[6px] px-[4px] py-[8px]"
      style={{ backgroundColor: darkMode ? '#075E54' : '#075E54' }}
    >
      {/* Back Arrow - Android style */}
      <button className="p-[8px]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="#FFFFFF"/>
        </svg>
      </button>
      
      {/* Avatar - key forces remount when chat type changes */}
      <Avatar key={isGroupChat ? `group-${groupIcon}` : `single-${receiver.avatar}`} className="w-[40px] h-[40px]">
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

      {/* Name and Status */}
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
      
      {/* Action Icons */}
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

// iOS WhatsApp Header
const IOSWhatsAppHeader = ({
  receiver,
  lastSeen,
  lastSeenTime,
  darkMode,
  isGroupChat,
  groupName,
  groupIcon,
  participantCount,
  t,
}: {
  receiver: User
  lastSeen: WhatsAppSettings['lastSeen']
  lastSeenTime?: Date
  darkMode: boolean
  isGroupChat?: boolean
  groupName?: string
  groupIcon?: string
  participantCount?: number
  t: ReturnType<typeof useTranslations>
}) => {
  const theme = darkMode ? themes.dark : themes.light

  const getStatusText = () => {
    if (isGroupChat && participantCount) {
      if (lastSeen === 'typing') return 'Sarah ' + t.preview.typing
      return `${participantCount} ${t.preview.participants}`
    }

    switch (lastSeen) {
      case 'online':
        return t.preview.online
      case 'typing':
        return t.preview.typing
      case 'last-seen':
        return `${t.preview.lastSeenToday} 14:30`
      case 'none':
        return t.preview.tapForContactInfo
      default:
        return t.preview.tapForContactInfo
    }
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

      {/* Avatar - key forces remount when chat type changes */}
      <Avatar key={isGroupChat ? `group-${groupIcon}` : `single-${receiver.avatar}`} className="w-[36px] h-[36px]">
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

// Forwarded Label
const ForwardedLabel = ({ darkMode, t }: { darkMode: boolean; t: ReturnType<typeof useTranslations> }) => {
  const theme = darkMode ? themes.dark : themes.light
  return (
    <div className="flex items-center gap-[4px] text-[12px] italic mb-[2px]" style={{ color: theme.timeText }}>
      <Forward className="w-[12px] h-[12px]" />
      <span>{t.preview.forwarded}</span>
    </div>
  )
}

// Reply Preview
const ReplyPreview = ({ 
  replyTo, 
  sender, 
  receiver,
  isSent,
  darkMode,
}: { 
  replyTo: ReplyTo
  sender: User
  receiver: User
  isSent: boolean
  darkMode: boolean
}) => {
  const isReplyFromSender = replyTo.userId === sender.id
  const replyUserName = isReplyFromSender ? 'You' : replyTo.userName || receiver.name
  
  return (
    <div className={cn(
      "rounded-[6px] px-[10px] py-[6px] mb-[4px] border-l-[3px]",
    )} style={{
      backgroundColor: darkMode 
        ? (isSent ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)')
        : (isSent ? '#C9E9B4' : '#F0F0F0'),
      borderLeftColor: isReplyFromSender ? '#53BDEB' : '#25D366',
    }}>
      <p className="text-[12px] font-semibold" style={{ color: isReplyFromSender ? '#53BDEB' : '#25D366' }}>
        {replyUserName}
      </p>
      <p className="text-[12px] truncate max-w-[200px]" style={{ color: darkMode ? '#8696A0' : '#667781' }}>
        {replyTo.content}
      </p>
    </div>
  )
}

// Reactions Display
const ReactionsDisplay = ({ reactions, darkMode }: { reactions: MessageReaction[]; darkMode: boolean }) => {
  if (!reactions || reactions.length === 0) return null
  
  return (
    <div 
      className="absolute -bottom-[12px] left-[8px] flex items-center gap-[2px] px-[6px] py-[3px] rounded-full"
      style={{ 
        backgroundColor: darkMode ? '#1F2C34' : '#FFFFFF',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
      }}
    >
      {reactions.map((reaction, idx) => (
        <span key={idx} className="text-[13px]">{reaction.emoji}</span>
      ))}
    </div>
  )
}

// Voice Message
const VoiceMessage = ({ 
  voiceData, 
  isSent, 
  darkMode,
  avatar,
}: { 
  voiceData: VoiceMessageData
  isSent: boolean
  darkMode: boolean
  avatar?: string | null
}) => {
  const theme = darkMode ? themes.dark : themes.light
  const minutes = Math.floor(voiceData.duration / 60)
  const seconds = voiceData.duration % 60
  const durationText = `${minutes}:${seconds.toString().padStart(2, '0')}`
  
  // Generate random waveform if not provided
  const waveform = voiceData.waveform || Array.from({ length: 25 }, () => Math.random() * 0.8 + 0.2)
  
  return (
    <div className="flex items-center gap-[8px] min-w-[200px]">
      {/* Avatar */}
      <div className="relative">
        <Avatar className="w-[40px] h-[40px]">
          {isImageAvatar(avatar) ? (
            <AvatarImage src={avatar!} />
          ) : (
            <AvatarFallback 
              className="text-white"
              style={{ 
                backgroundColor: getAvatarColor(avatar) || (isSent ? (darkMode ? '#00A884' : '#25D366') : (darkMode ? '#8696A0' : '#DFE5E7')),
                color: getAvatarColor(avatar) ? '#FFFFFF' : (isSent ? '#FFFFFF' : (darkMode ? '#1F2C34' : '#54656F')),
              }}
            >
              <Mic className="w-[20px] h-[20px]" />
            </AvatarFallback>
          )}
        </Avatar>
        {/* Play button overlay */}
        <div 
          className="absolute inset-0 flex items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
        >
          <Play className="w-[16px] h-[16px] text-white ml-[2px]" fill="white" />
        </div>
      </div>
      
      {/* Waveform */}
      <div className="flex-1 flex flex-col gap-[4px]">
        <div className="flex items-center gap-[1px] h-[20px]">
          {waveform.map((amp, i) => (
            <div
              key={i}
              className="w-[3px] rounded-full"
              style={{
                height: `${amp * 100}%`,
                backgroundColor: voiceData.isPlayed 
                  ? (darkMode ? '#8696A0' : '#667781')
                  : theme.voiceWave,
              }}
            />
          ))}
        </div>
        <span className="text-[11px]" style={{ color: darkMode ? '#8696A0' : '#667781' }}>
          {durationText}
        </span>
      </div>
    </div>
  )
}

// Document Message
const DocumentMessage = ({ 
  documentData, 
  darkMode,
}: { 
  documentData: DocumentData
  darkMode: boolean
}) => {
  const theme = darkMode ? themes.dark : themes.light
  
  const getFileIcon = (type: string) => {
    const colors: Record<string, string> = {
      pdf: '#FF5722',
      doc: '#2196F3',
      docx: '#2196F3',
      xls: '#4CAF50',
      xlsx: '#4CAF50',
      ppt: '#FF9800',
      pptx: '#FF9800',
      default: theme.documentIcon,
    }
    return colors[type.toLowerCase()] || colors.default
  }
  
  return (
    <div className="flex items-center gap-[10px] min-w-[200px] p-[8px] rounded-[8px]" style={{
      backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    }}>
      <div 
        className="w-[40px] h-[48px] rounded-[4px] flex items-center justify-center"
        style={{ backgroundColor: getFileIcon(documentData.fileType) }}
      >
        <FileText className="w-[20px] h-[20px] text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium truncate" style={{ color: darkMode ? '#FFFFFF' : '#000000' }}>
          {documentData.fileName}
        </p>
        <p className="text-[12px]" style={{ color: darkMode ? '#8696A0' : '#667781' }}>
          {documentData.fileSize} · {documentData.fileType.toUpperCase()}
          {documentData.pageCount && ` · ${documentData.pageCount} pages`}
        </p>
      </div>
    </div>
  )
}

// Video Message
const VideoMessage = ({ 
  videoData,
  imageUrl,
}: { 
  videoData: VideoData
  imageUrl?: string
}) => {
  const minutes = Math.floor(videoData.duration / 60)
  const seconds = videoData.duration % 60
  const durationText = `${minutes}:${seconds.toString().padStart(2, '0')}`
  
  return (
    <div className="relative rounded-[8px] overflow-hidden max-w-[220px]">
      <img 
        src={videoData.thumbnail || imageUrl || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&h=200&fit=crop'} 
        alt="Video thumbnail" 
        className="w-full h-auto object-cover"
        style={{ maxHeight: '200px' }}
      />
      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
        <div className="w-[50px] h-[50px] rounded-full bg-black/50 flex items-center justify-center">
          <Play className="w-[24px] h-[24px] text-white ml-[2px]" fill="white" />
        </div>
      </div>
      {/* Duration */}
      <div className="absolute bottom-[8px] left-[8px] bg-black/60 px-[6px] py-[2px] rounded text-white text-[11px]">
        {durationText}
      </div>
    </div>
  )
}

// Image Message
const ImageMessage = ({ imageUrl }: { imageUrl: string }) => (
  <div className="rounded-[8px] overflow-hidden max-w-[220px]">
    <img 
      src={imageUrl} 
      alt="Shared image" 
      className="w-full h-auto object-cover"
      style={{ maxHeight: '260px' }}
    />
  </div>
)

// Location Message
const LocationMessage = ({ 
  locationData, 
  darkMode,
}: { 
  locationData: LocationData
  darkMode: boolean
}) => {
  // Generate static map URL (using OpenStreetMap static image service)
  const mapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${locationData.latitude},${locationData.longitude}&zoom=15&size=220x120&maptype=osmarenderer&markers=${locationData.latitude},${locationData.longitude},red-pushpin`
  
  return (
    <div className="rounded-[8px] overflow-hidden max-w-[220px]">
      {/* Map Image */}
      <div className="relative h-[120px] bg-gray-200">
        <img 
          src={mapUrl}
          alt="Location map" 
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to a gradient background if map fails to load
            (e.target as HTMLImageElement).style.display = 'none'
          }}
        />
        {/* Fallback gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
          <MapPin className="w-8 h-8 text-white" />
        </div>
        {/* Pin overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
        </div>
        {/* Live indicator */}
        {locationData.isLive && (
          <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            Live
          </div>
        )}
      </div>
      {/* Location Info */}
      <div className="p-[10px]" style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
        {locationData.name && (
          <p className="text-[14px] font-medium truncate" style={{ color: darkMode ? '#FFFFFF' : '#000000' }}>
            {locationData.name}
          </p>
        )}
        {locationData.address && (
          <p className="text-[12px] truncate" style={{ color: darkMode ? '#8696A0' : '#667781' }}>
            {locationData.address}
          </p>
        )}
        {locationData.isLive && locationData.duration && (
          <p className="text-[11px] mt-1" style={{ color: '#25D366' }}>
            Sharing for {locationData.duration} min
          </p>
        )}
      </div>
    </div>
  )
}

// Contact Message
const ContactMessage = ({ 
  contactData, 
  darkMode,
}: { 
  contactData: ContactData
  darkMode: boolean
}) => {
  return (
    <div className="min-w-[200px] max-w-[250px]">
      {/* Contact Card */}
      <div 
        className="flex items-center gap-[12px] p-[12px] rounded-t-[8px]"
        style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
      >
        {/* Avatar */}
        <Avatar className="w-[44px] h-[44px]">
          {isImageAvatar(contactData.avatar) ? (
            <AvatarImage src={contactData.avatar!} />
          ) : (
            <AvatarFallback 
              className="text-white"
              style={{ 
                backgroundColor: getAvatarColor(contactData.avatar) || (darkMode ? '#00A884' : '#25D366'),
                color: '#FFFFFF',
              }}
            >
              <UserIcon className="w-[22px] h-[22px]" />
            </AvatarFallback>
          )}
        </Avatar>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium truncate" style={{ color: darkMode ? '#FFFFFF' : '#000000' }}>
            {contactData.name}
          </p>
          {contactData.phone && (
            <p className="text-[13px] truncate" style={{ color: darkMode ? '#8696A0' : '#667781' }}>
              {contactData.phone}
            </p>
          )}
          {contactData.organization && (
            <p className="text-[12px] truncate" style={{ color: darkMode ? '#8696A0' : '#667781' }}>
              {contactData.organization}
            </p>
          )}
        </div>
      </div>
      
      {/* Action Button */}
      <button 
        className="w-full py-[10px] text-center border-t flex items-center justify-center gap-2"
        style={{ 
          borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          color: darkMode ? '#00A884' : '#25D366',
        }}
      >
        <MessageCircle className="w-4 h-4" />
        <span className="text-[14px] font-medium">Message</span>
      </button>
    </div>
  )
}

// Group Chat Sender Name
const GroupSenderName = ({ name, color }: { name: string; color?: string }) => (
  <p className="text-[12px] font-semibold" style={{ color: color || '#25D366' }}>
    {name}
  </p>
)

// iOS WhatsApp Message Bubble
const IOSMessageBubble = ({
  message,
  sender,
  receiver,
  timeFormat,
  isFirstInGroup,
  isLastInGroup,
  darkMode,
  isGroupChat,
  participants,
  t,
}: {
  message: Message
  sender: User
  receiver: User
  timeFormat: '12h' | '24h'
  isFirstInGroup: boolean
  isLastInGroup: boolean
  darkMode: boolean
  isGroupChat?: boolean
  participants?: User[]
  t: ReturnType<typeof useTranslations>
}) => {
  const theme = darkMode ? themes.dark : themes.light
  // Check if message is from current user - supports sender.id, 'me', and 'sender-1' (group chat default)
  const isSent = message.userId === sender.id || message.userId === 'me' || message.userId === 'sender-1'
  const timestamp = message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp)
  const time = formatTime(timestamp, timeFormat)
  const status = message.status || 'read'
  const hasReactions = message.reactions && message.reactions.length > 0
  const hasImage = message.type === 'image' && message.imageUrl
  const hasVoice = message.type === 'voice' && message.voiceData
  const hasDocument = message.type === 'document' && message.documentData
  const hasVideo = message.type === 'video' && message.videoData
  const hasLocation = message.type === 'location' && message.locationData
  const hasContact = message.type === 'contact' && message.contactData

  // Get sender info for group chat
  // First check message's own sender info (senderName, senderColor), then fallback to participants lookup
  const participantData = participants?.find(p => p.id === message.userId)
  const messageSender = isGroupChat && !isSent
    ? (message.senderName
        ? { id: message.senderId || message.userId, name: message.senderName, color: message.senderColor, avatar: participantData?.avatar || null }
        : participantData || receiver)
    : null

  const bubbleBg = isSent ? theme.sentBubble : theme.receivedBubble
  const textColor = isSent ? theme.sentText : theme.receivedText
  const timeColor = isSent ? theme.sentTimeText : theme.timeText

  // Check if we should show avatar (group chat, received message, last in group - next to tail)
  const showGroupAvatar = isGroupChat && !isSent && isLastInGroup && messageSender

  return (
    <div className={cn(
      "flex px-[12px]",
      isSent ? "justify-end" : "justify-start",
      isFirstInGroup ? "mt-[8px]" : "mt-[2px]",
      hasReactions ? "mb-[16px]" : ""
    )}>
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
            padding: (hasImage || hasVideo || hasLocation) ? '3px' : undefined,
          }}
        >
          {/* Tail - shown on last message in a group from same sender */}
          {isLastInGroup && (
            <svg
              className={cn("absolute bottom-0", isSent ? "-right-[8px]" : "-left-[8px]")}
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
          
          {/* Forwarded Label */}
          {message.isForwarded && (
            <div className="px-[12px] pt-[6px]">
              <ForwardedLabel darkMode={darkMode} t={t} />
            </div>
          )}
          
          {/* Reply Preview */}
          {message.replyTo && (
            <div className="px-[6px] pt-[6px]">
              <ReplyPreview 
                replyTo={message.replyTo} 
                sender={sender}
                receiver={receiver}
                isSent={isSent}
                darkMode={darkMode}
              />
            </div>
          )}
          
          {/* Image */}
          {hasImage && <ImageMessage imageUrl={message.imageUrl!} />}
          
          {/* Video */}
          {hasVideo && <VideoMessage videoData={message.videoData!} imageUrl={message.imageUrl} />}
          
          {/* Voice Message */}
          {hasVoice && (
            <div className="px-[12px] py-[8px]">
              <VoiceMessage 
                voiceData={message.voiceData!} 
                isSent={isSent} 
                darkMode={darkMode}
                avatar={isSent ? sender.avatar : receiver.avatar}
              />
            </div>
          )}
          
          {/* Document */}
          {hasDocument && (
            <div className="px-[6px] py-[6px]">
              <DocumentMessage documentData={message.documentData!} darkMode={darkMode} />
            </div>
          )}
          
          {/* Location */}
          {hasLocation && (
            <LocationMessage locationData={message.locationData!} darkMode={darkMode} />
          )}
          
          {/* Contact */}
          {hasContact && (
            <div className="px-[3px] py-[3px]">
              <ContactMessage contactData={message.contactData!} darkMode={darkMode} />
            </div>
          )}
          
          {/* Message Content */}
          <div className={cn(
            "relative",
            (hasImage || hasVideo || hasLocation) ? "px-[8px] pb-[6px] pt-[4px]" :
            (hasVoice || hasDocument || hasContact) ? "px-[12px] pb-[8px]" :
            (isGroupChat && !isSent && isFirstInGroup && messageSender) ? "px-[12px] pt-[2px] pb-[8px]" : "px-[12px] py-[8px]"
          )}>
            {/* Image/Video without text - absolute time overlay */}
            {(hasImage || hasVideo) && !message.content && (
              <span
                className="absolute bottom-[8px] right-[10px] inline-flex items-center gap-[3px] whitespace-nowrap text-[11px] bg-black/40 px-[6px] py-[2px] rounded-full text-white/90"
              >
                {time}
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
              </span>
            )}

            {/* Text content with inline time */}
            {message.content && (
              <span className="text-[17px] leading-[22px] whitespace-pre-wrap break-words" style={{ color: textColor }}>
                {message.content}
                {/* Invisible spacer to reserve space for time */}
                <span className="inline-block opacity-0 text-[11px] ml-[6px]" aria-hidden="true">
                  {time}{isSent ? ' ✓✓' : ''}
                </span>
              </span>
            )}

            {/* Visible time - absolute positioned over the spacer */}
            {message.content && (
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
            )}
          </div>
        </div>
        
        {/* Reactions */}
        {hasReactions && <ReactionsDisplay reactions={message.reactions!} darkMode={darkMode} />}
      </div>
    </div>
  )
}

// Typing Indicator
const TypingIndicator = ({ darkMode, senderName }: { darkMode: boolean; senderName?: string }) => {
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

// iOS WhatsApp Footer
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
      {/* Emoji button */}
      <button className="w-[40px] h-[40px] flex items-center justify-center">
        <Smile className="w-[24px] h-[24px]" style={{ color: darkMode ? '#8696A0' : '#54656F' }} strokeWidth={1.5} />
      </button>
      
      {/* Input field with camera and attachment inside */}
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
        
        {/* Paperclip / Attachment */}
        <button className="w-[36px] h-[36px] flex items-center justify-center">
          <Paperclip 
            className="w-[22px] h-[22px] rotate-45" 
            style={{ color: darkMode ? '#8696A0' : '#54656F' }} 
            strokeWidth={1.5} 
          />
        </button>
        
        {/* Camera */}
        <button className="w-[36px] h-[36px] flex items-center justify-center">
          <Camera className="w-[22px] h-[22px]" style={{ color: darkMode ? '#8696A0' : '#54656F' }} strokeWidth={1.5} />
        </button>
      </div>
      
      {/* Mic button - green circle */}
      <button 
        className="w-[48px] h-[48px] rounded-full flex items-center justify-center"
        style={{ backgroundColor: '#00A884' }}
      >
        <Mic className="w-[24px] h-[24px] text-white" strokeWidth={2} />
      </button>
    </div>
  )
}

// Group messages by date - always show "Today" to avoid hydration issues
const groupMessagesByDate = (messages: Message[]): { date: string; messages: Message[] }[] => {
  // For a mockup app, we always show "Today" as the date
  // This avoids hydration mismatch between server and client
  if (messages.length === 0) return []
  
  return [{ date: 'Today', messages: [...messages] }]
}

// Main Component
export const WhatsAppPreview = memo(function WhatsAppPreview({
  sender,
  receiver,
  messages,
  darkMode,
  mobileView,
  timeFormat,
  transparentBg,
  settings = defaultSettings,
  language = 'en',
  fontFamily = 'sf-pro',
  batteryLevel = 100,
  deviceType = 'ios',
  visibleMessageCount,
  showTypingIndicator,
  forExport = false,
}: WhatsAppPreviewProps) {
  // Memoize theme to avoid recreating object on every render
  const theme = useMemo(() => darkMode ? themes.dark : themes.light, [darkMode])
  const t = useTranslations(language)

  // Memoize font style lookup
  const fontStyle = useMemo(
    () => SUPPORTED_FONTS.find(f => f.code === fontFamily)?.style || SUPPORTED_FONTS[0].style,
    [fontFamily]
  )

  // Memoize visible messages slice
  const visibleMessages = useMemo(
    () => visibleMessageCount !== undefined ? messages.slice(0, visibleMessageCount) : messages,
    [messages, visibleMessageCount]
  )

  // Memoize message groups
  const messageGroups = useMemo(
    () => groupMessagesByDate(visibleMessages),
    [visibleMessages]
  )

  // Check if group chat mode is enabled AND there are participants
  const isGroupChat = settings.groupParticipants && settings.groupParticipants.length > 0

  // Create a lookup map for participants by ID for efficient access
  const participantsMap = useMemo(() => {
    if (!settings.groupParticipants) return new Map<string, User>()
    return new Map(settings.groupParticipants.map(p => [p.id, p]))
  }, [settings.groupParticipants])

  // Show typing indicator either from settings or from animation prop
  const showTyping = showTypingIndicator || settings.lastSeen === 'typing'

  // Memoize background color calculation
  const bgColor = useMemo(() => {
    if (transparentBg) return 'transparent'
    if (settings.backgroundType === 'image' && settings.backgroundImage) return 'transparent'
    if (darkMode) return themes.dark.chatBg
    return settings.backgroundColor || themes.light.chatBg
  }, [transparentBg, settings.backgroundType, settings.backgroundImage, darkMode, settings.backgroundColor])

  // Desktop view - wider chat window without phone frame
  if (!mobileView) {
    return (
      <div
        className="transition-all duration-300 overflow-hidden"
        style={{
          width: '420px',
          height: '680px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          backgroundColor: darkMode ? '#000000' : '#FFFFFF',
          fontFamily: fontStyle,
        }}
      >
        <div className="flex flex-col h-full overflow-hidden antialiased">
          <IOSWhatsAppHeader
            receiver={receiver}
            lastSeen={settings.lastSeen || 'online'}
            lastSeenTime={settings.lastSeenTime}
            darkMode={darkMode}
            isGroupChat={isGroupChat}
            groupName={settings.groupName}
            groupIcon={settings.groupIcon}
            participantCount={settings.groupParticipants?.length}
            t={t}
          />

          {/* Chat Area Container */}
          <div className="flex-1 relative overflow-hidden">
            {/* Fixed Background Layer */}
            <div
              className="absolute inset-0 w-full h-full"
              style={{ 
                backgroundColor: settings.backgroundType === 'solid'
                  ? (settings.backgroundColor || theme.chatBg)
                  : theme.chatBg
              }}
            >
              {/* Image Background - Fixed */}
              {!transparentBg && settings.backgroundType === 'image' && settings.backgroundImage && (
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
              {!transparentBg && settings.backgroundType === 'doodle' && (settings.showDoodle !== false) && (
                <WhatsAppDoodle
                  opacity={settings.doodleOpacity || 0.06}
                  color={darkMode ? theme.doodleColor : '#C8C4BA'}
                  darkMode={darkMode}
                />
              )}
            </div>

            {/* Scrollable Content Layer */}
            <div className={cn(
              "absolute inset-0 overflow-y-auto overflow-x-hidden",
              darkMode ? "chat-scrollbar-dark" : "chat-scrollbar"
            )}>
              <div className="relative z-10 py-[4px]">
                {settings.showEncryptionNotice && <EncryptionNotice darkMode={darkMode} t={t} />}

                {messageGroups.map((group) => (
                  <div key={group.date}>
                    <DateSeparator date={t.preview.today} darkMode={darkMode} />
                    {group.messages.map((message, index) => {
                      const prevMessage = index > 0 ? group.messages[index - 1] : null
                      const nextMessage = index < group.messages.length - 1 ? group.messages[index + 1] : null
                      const isFirstInGroup = !prevMessage || prevMessage.userId !== message.userId
                      const isLastInGroup = !nextMessage || nextMessage.userId !== message.userId

                      return (
                        <IOSMessageBubble
                          key={message.id}
                          message={message}
                          sender={sender}
                          receiver={receiver}
                          timeFormat={timeFormat}
                          isFirstInGroup={isFirstInGroup}
                          isLastInGroup={isLastInGroup}
                          darkMode={darkMode}
                          isGroupChat={isGroupChat}
                          participants={settings.groupParticipants}
                          t={t}
                        />
                      )
                    })}
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {showTyping && <TypingIndicator darkMode={darkMode} />}
              </div>
            </div>
          </div>

          {/* Simple footer for desktop */}
          <div className="border-t" style={{ backgroundColor: theme.footer, borderColor: theme.footerBorder }}>
            <div className="flex items-center gap-[8px] px-[12px] py-[10px]">
              <button className="w-[32px] h-[32px] flex items-center justify-center">
                <Plus className="w-[24px] h-[24px]" style={{ color: theme.headerIcon }} strokeWidth={1.5} />
              </button>
              
              <div 
                className="flex-1 flex items-center rounded-full border px-[12px] py-[8px]"
                style={{ backgroundColor: theme.inputBg, borderColor: theme.inputBorder }}
              >
                <input
                  type="text"
                  placeholder={t.preview.message}
                  className="flex-1 text-[15px] bg-transparent outline-none"
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
          </div>
        </div>
      </div>
    )
  }

  // Check if Android
  const isAndroid = deviceType === 'android'

  // Mobile view - phone frame with status bar
  return (
    <div
      className={cn(
        "transition-all duration-300 overflow-hidden w-[375px]",
        forExport && "!rounded-none !shadow-none !bg-transparent !p-0"
      )}
      style={forExport ? {
        borderRadius: '0px',
        boxShadow: 'none',
        background: 'transparent',
        padding: '0px',
        fontFamily: fontStyle,
      } : {
        borderRadius: isAndroid ? '24px' : '44px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.1)',
        background: '#000',
        padding: '2px',
        fontFamily: fontStyle,
      }}
      data-export-mode={forExport ? 'true' : 'false'}
    >
      <div
        className={cn(
          "flex flex-col overflow-hidden antialiased",
          forExport && "!rounded-none"
        )}
        style={forExport ? {
          height: '812px',
          borderRadius: '0px',
          backgroundColor: darkMode ? '#000000' : '#FFFFFF',
        } : {
          height: '812px',
          borderRadius: isAndroid ? '22px' : '42px',
          backgroundColor: darkMode ? '#000000' : '#FFFFFF',
        }}
      >
        {/* Status Bar - Conditional */}
        {isAndroid ? (
          <AndroidStatusBar darkMode={darkMode} batteryLevel={batteryLevel} />
        ) : (
          <IOSStatusBar darkMode={darkMode} batteryLevel={batteryLevel} />
        )}

        {/* Header - Conditional */}
        {isAndroid ? (
          <AndroidWhatsAppHeader
            receiver={receiver}
            lastSeen={settings.lastSeen || 'online'}
            lastSeenTime={settings.lastSeenTime}
            darkMode={darkMode}
            isGroupChat={isGroupChat}
            groupName={settings.groupName}
            groupIcon={settings.groupIcon}
            participantCount={settings.groupParticipants?.length}
            t={t}
          />
        ) : (
          <IOSWhatsAppHeader
            receiver={receiver}
            lastSeen={settings.lastSeen || 'online'}
            lastSeenTime={settings.lastSeenTime}
            darkMode={darkMode}
            isGroupChat={isGroupChat}
            groupName={settings.groupName}
            groupIcon={settings.groupIcon}
            participantCount={settings.groupParticipants?.length}
            t={t}
          />
        )}

        {/* Chat Area Container */}
        <div className="flex-1 relative overflow-hidden">
          {/* Fixed Background Layer */}
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              backgroundColor: settings.backgroundType === 'solid'
                ? (settings.backgroundColor || theme.chatBg)
                : theme.chatBg
            }}
          >
            {/* Image Background - Fixed */}
            {!transparentBg && settings.backgroundType === 'image' && settings.backgroundImage && (
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
            {!transparentBg && settings.backgroundType === 'doodle' && (settings.showDoodle !== false) && (
              <WhatsAppDoodle
                opacity={settings.doodleOpacity || 0.06}
                color={darkMode ? theme.doodleColor : '#C8C4BA'}
                darkMode={darkMode}
              />
            )}
          </div>

          {/* Scrollable Content Layer */}
          <div className={cn(
            "absolute inset-0 overflow-y-auto overflow-x-hidden",
            darkMode ? "chat-scrollbar-dark" : "chat-scrollbar"
          )}>
            <div className="relative z-10 py-[4px]">
              {settings.showEncryptionNotice && <EncryptionNotice darkMode={darkMode} t={t} />}

              {messageGroups.map((group) => (
                <div key={group.date}>
                  <DateSeparator date={t.preview.today} darkMode={darkMode} />
                  {group.messages.map((message, index) => {
                    const prevMessage = index > 0 ? group.messages[index - 1] : null
                    const nextMessage = index < group.messages.length - 1 ? group.messages[index + 1] : null
                    const isFirstInGroup = !prevMessage || prevMessage.userId !== message.userId
                    const isLastInGroup = !nextMessage || nextMessage.userId !== message.userId

                    return (
                      <IOSMessageBubble
                        key={message.id}
                        message={message}
                        sender={sender}
                        receiver={receiver}
                        timeFormat={timeFormat}
                        isFirstInGroup={isFirstInGroup}
                        isLastInGroup={isLastInGroup}
                        darkMode={darkMode}
                        isGroupChat={isGroupChat}
                        participants={settings.groupParticipants}
                        t={t}
                      />
                    )
                  })}
                </div>
              ))}

              {/* Typing Indicator */}
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
