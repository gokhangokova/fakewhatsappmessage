'use client'

import { Platform, Message, User, WhatsAppSettings, Language, FontFamily } from '@/types'
import { WhatsAppPreview } from './platforms/whatsapp-preview'
import { platforms } from '@/lib/platforms'
import { formatTime, cn } from '@/lib/utils'
import {
  Wifi,
  Signal,
  Battery,
  ChevronLeft,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Camera,
  Mic,
  Send,
  Check,
  CheckCheck,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface PhonePreviewProps {
  platform: Platform
  sender: User
  receiver: User
  messages: Message[]
  darkMode: boolean
  mobileView: boolean
  timeFormat: '12h' | '24h'
  transparentBg: boolean
  whatsappSettings?: WhatsAppSettings
  language?: Language
  fontFamily?: FontFamily
  batteryLevel?: number
  // Animation props for video export
  visibleMessageCount?: number
  showTypingIndicator?: boolean
}

export function PhonePreview({
  platform,
  sender,
  receiver,
  messages,
  darkMode,
  mobileView,
  timeFormat,
  transparentBg,
  whatsappSettings,
  language = 'en',
  fontFamily = 'sf-pro',
  batteryLevel = 100,
  visibleMessageCount,
  showTypingIndicator,
}: PhonePreviewProps) {
  // Use WhatsApp specific preview
  if (platform === 'whatsapp') {
    return (
      <WhatsAppPreview
        sender={sender}
        receiver={receiver}
        messages={messages}
        darkMode={darkMode}
        mobileView={mobileView}
        timeFormat={timeFormat}
        transparentBg={transparentBg}
        language={language}
        fontFamily={fontFamily}
        batteryLevel={batteryLevel}
        settings={whatsappSettings || {
          showDoodle: true,
          doodleOpacity: 0.4,
          wallpaperColor: darkMode ? '#0B141A' : '#E5DDD5',
          showEncryptionNotice: true,
          lastSeen: 'online',
          backgroundType: 'doodle',
          backgroundColor: darkMode ? '#0B141A' : '#E5DDD5',
        }}
        visibleMessageCount={visibleMessageCount}
        showTypingIndicator={showTypingIndicator}
      />
    )
  }

  // Generic preview for other platforms
  const config = platforms[platform]

  return (
    <div
      className={cn(
        'phone-frame transition-all duration-300',
        mobileView ? 'w-[375px]' : 'w-[420px]'
      )}
    >
      <div
        className={cn(
          'phone-screen flex flex-col',
          mobileView ? 'h-[700px]' : 'h-[600px]',
          darkMode ? 'bg-gray-900' : 'bg-white',
          transparentBg && 'bg-transparent'
        )}
      >
        {/* Status Bar */}
        <StatusBar darkMode={darkMode} platform={platform} />

        {/* Chat Header */}
        <ChatHeader
          platform={platform}
          receiver={receiver}
          darkMode={darkMode}
          config={config}
        />

        {/* Messages */}
        <div className={cn(
          'flex-1 overflow-y-auto p-4 space-y-2',
          getPlatformBackground(platform, darkMode)
        )}>
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              sender={sender}
              receiver={receiver}
              platform={platform}
              darkMode={darkMode}
              timeFormat={timeFormat}
              config={config}
              isLast={index === messages.length - 1}
            />
          ))}
        </div>

        {/* Chat Footer */}
        <ChatFooter platform={platform} darkMode={darkMode} />
      </div>
    </div>
  )
}

function StatusBar({ darkMode, platform }: { darkMode: boolean; platform: Platform }) {
  // Use fixed time to avoid hydration mismatch
  const timeStr = '9:41'

  const getBgColor = () => {
    if (platform === 'instagram' && !darkMode) return 'bg-white'
    if (darkMode) return 'bg-gray-900'
    return 'bg-gray-100'
  }

  const getTextColor = () => {
    if (darkMode) return 'text-white'
    return 'text-black'
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between px-6 py-2 text-xs font-medium',
        getBgColor(),
        getTextColor()
      )}
    >
      <span>{timeStr}</span>
      <div className="flex items-center gap-1">
        <Signal className="w-4 h-4" />
        <Wifi className="w-4 h-4" />
        <Battery className="w-5 h-5" />
      </div>
    </div>
  )
}

function ChatHeader({
  platform,
  receiver,
  darkMode,
  config,
}: {
  platform: Platform
  receiver: User
  darkMode: boolean
  config: typeof platforms[Platform]
}) {
  const getHeaderStyle = () => {
    switch (platform) {
      case 'imessage':
        return darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black'
      case 'instagram':
        return darkMode ? 'bg-black text-white border-b border-gray-800' : 'bg-white text-black border-b'
      default:
        return darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black border-b'
    }
  }

  return (
    <div className={cn('flex items-center gap-3 px-4 py-3', getHeaderStyle())}>
      <ChevronLeft className="w-6 h-6" />
      <Avatar className="w-9 h-9">
        {receiver.avatar ? (
          <AvatarImage src={receiver.avatar} />
        ) : (
          <AvatarFallback className="bg-gray-500 text-white text-sm">
            {receiver.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        )}
      </Avatar>
      <div className="flex-1">
        <p className="font-semibold text-sm">{receiver.name}</p>
        <p className={cn(
          'text-xs',
          darkMode ? 'text-gray-400' : 'text-gray-500'
        )}>
          Active now
        </p>
      </div>
      <div className="flex items-center gap-4">
        {platform === 'instagram' && (
          <>
            <Phone className="w-5 h-5" />
            <Video className="w-5 h-5" />
          </>
        )}
        {platform === 'imessage' && (
          <Video className="w-5 h-5 text-blue-500" />
        )}
        <MoreVertical className="w-5 h-5" />
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  sender,
  receiver,
  platform,
  darkMode,
  timeFormat,
  config,
  isLast,
}: {
  message: Message
  sender: User
  receiver: User
  platform: Platform
  darkMode: boolean
  timeFormat: '12h' | '24h'
  config: typeof platforms[Platform]
  isLast: boolean
}) {
  const isSent = message.userId === sender.id
  const timestamp = message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp)
  const time = formatTime(timestamp, timeFormat)

  const getBubbleStyle = () => {
    if (isSent) {
      switch (platform) {
        case 'imessage':
          return 'bg-[#007AFF] text-white'
        case 'instagram':
          return 'bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] text-white'
        default:
          return 'bg-primary text-primary-foreground'
      }
    } else {
      switch (platform) {
        case 'imessage':
          return darkMode ? 'bg-gray-700 text-white' : 'bg-[#E9E9EB] text-black'
        case 'instagram':
          return darkMode ? 'bg-[#262626] text-white' : 'bg-[#EFEFEF] text-black'
        default:
          return darkMode
            ? 'bg-gray-700 text-white'
            : 'bg-gray-200 text-black'
      }
    }
  }

  const getTimeStyle = () => {
    if (isSent) {
      switch (platform) {
        case 'imessage':
        case 'instagram':
          return 'text-white/70'
        default:
          return 'text-white/70'
      }
    }
    return darkMode ? 'text-gray-400' : 'text-gray-500'
  }

  return (
    <div
      className={cn(
        'flex',
        isSent ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2 message-bubble shadow-sm',
          getBubbleStyle(),
          isSent ? 'rounded-br-md' : 'rounded-bl-md'
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <div className={cn('flex items-center justify-end gap-1 mt-1', getTimeStyle())}>
          <span className="text-[10px]">{time}</span>
        </div>
      </div>
    </div>
  )
}

function ChatFooter({
  platform,
  darkMode,
}: {
  platform: Platform
  darkMode: boolean
}) {
  const getFooterStyle = () => {
    switch (platform) {
      case 'imessage':
        return darkMode ? 'bg-gray-800' : 'bg-gray-100'
      case 'instagram':
        return darkMode ? 'bg-black border-t border-gray-800' : 'bg-white border-t'
      default:
        return darkMode ? 'bg-gray-800' : 'bg-gray-100'
    }
  }

  const getInputStyle = () => {
    switch (platform) {
      case 'imessage':
        return darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-500'
      case 'instagram':
        return darkMode ? 'bg-transparent border-gray-700 text-gray-300' : 'bg-transparent border-gray-300 text-gray-500'
      default:
        return darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-500'
    }
  }

  return (
    <div className={cn('flex items-center gap-2 px-4 py-3', getFooterStyle())}>
      {platform === 'imessage' && (
        <>
          <Camera className="w-6 h-6 text-gray-500" />
          <div className={cn('flex-1 rounded-full border px-4 py-2 text-sm', getInputStyle())}>
            iMessage
          </div>
          <Mic className="w-6 h-6 text-gray-500" />
        </>
      )}
      {platform === 'instagram' && (
        <>
          <Camera className="w-6 h-6 text-gray-500" />
          <div className={cn('flex-1 rounded-full border px-4 py-2 text-sm', getInputStyle())}>
            Message...
          </div>
          <Mic className="w-6 h-6 text-gray-500" />
        </>
      )}
      {!['imessage', 'instagram'].includes(platform) && (
        <>
          <Smile className="w-6 h-6 text-gray-500" />
          <div className={cn('flex-1 rounded-full px-4 py-2 text-sm', getInputStyle())}>
            Type a message...
          </div>
          <Send className="w-6 h-6 text-gray-500" />
        </>
      )}
    </div>
  )
}

function getPlatformBackground(platform: Platform, darkMode: boolean): string {
  switch (platform) {
    case 'imessage':
      return darkMode ? 'bg-black' : 'bg-white'
    case 'instagram':
      return darkMode ? 'bg-black' : 'bg-white'
    default:
      return darkMode ? 'bg-gray-900' : 'bg-gray-50'
  }
}
