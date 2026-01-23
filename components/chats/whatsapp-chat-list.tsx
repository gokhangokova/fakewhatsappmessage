'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useSavedChats } from '@/hooks/use-saved-chats'
import { useAuth } from '@/contexts/auth-context'
import { ChatData, ChatRow } from '@/lib/supabase/chats'
import { Language, DeviceType } from '@/types'
import {
  MessageSquare,
  Loader2,
  Plus,
  Crown,
  Trash2,
  Camera,
  MoreHorizontal,
  Check,
  CheckCheck,
  Mic,
  Image as ImageIcon,
  Video,
  FileText,
  MapPin,
  User as UserIcon,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface WhatsAppChatListProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoadChat: (chatData: ChatData) => void
  onNewChat: () => void
  language?: Language
  darkMode?: boolean
  deviceType?: DeviceType
}

// Helper to get avatar color or default
const getAvatarBgColor = (avatar: string | null | undefined): string => {
  if (avatar?.startsWith('color:')) {
    return avatar.replace('color:', '')
  }
  return '#128C7E' // WhatsApp green default
}

// Helper to check if avatar is an image
const isImageAvatar = (avatar: string | null | undefined): boolean => {
  return !!avatar && !avatar.startsWith('color:')
}

// Get last message preview with icon
const getMessagePreview = (chat: ChatRow, darkMode: boolean): { icon?: React.ReactNode; text: string; isSent: boolean } => {
  const messages = chat.data.messages || []
  if (messages.length === 0) {
    return { text: 'No messages yet', isSent: false }
  }

  const lastMessage = messages[messages.length - 1]
  const isSent = lastMessage.userId === 'me'
  const iconColor = darkMode ? '#8696A0' : '#667781'

  // Get message type icon and text
  let icon: React.ReactNode = null
  let text = ''

  switch (lastMessage.type) {
    case 'voice':
      icon = <Mic className="w-4 h-4 inline mr-1" style={{ color: iconColor }} />
      text = `Voice message (${lastMessage.voiceData?.duration || 0}s)`
      break
    case 'image':
      icon = <ImageIcon className="w-4 h-4 inline mr-1" style={{ color: iconColor }} />
      text = lastMessage.content || 'Photo'
      break
    case 'video':
      icon = <Video className="w-4 h-4 inline mr-1" style={{ color: iconColor }} />
      text = 'Video'
      break
    case 'document':
      icon = <FileText className="w-4 h-4 inline mr-1" style={{ color: iconColor }} />
      text = lastMessage.documentData?.fileName || 'Document'
      break
    case 'location':
      icon = <MapPin className="w-4 h-4 inline mr-1" style={{ color: iconColor }} />
      text = lastMessage.locationData?.name || 'Location'
      break
    case 'contact':
      icon = <UserIcon className="w-4 h-4 inline mr-1" style={{ color: iconColor }} />
      text = lastMessage.contactData?.name || 'Contact'
      break
    default:
      text = lastMessage.content || ''
  }

  return { icon, text, isSent }
}

// Get status icon for sent messages
const StatusIcon = ({ status, darkMode }: { status: string; darkMode?: boolean }) => {
  const blueColor = '#53BDEB'
  const grayColor = darkMode ? '#8696A0' : '#667781'

  if (status === 'read') {
    return <CheckCheck className="w-4 h-4 flex-shrink-0" style={{ color: blueColor }} />
  }
  if (status === 'delivered') {
    return <CheckCheck className="w-4 h-4 flex-shrink-0" style={{ color: grayColor }} />
  }
  if (status === 'sent') {
    return <Check className="w-4 h-4 flex-shrink-0" style={{ color: grayColor }} />
  }
  return null
}

// Format date for chat list (WhatsApp style)
const formatChatDate = (dateStr: string, language: Language): string => {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const chatDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffTime = today.getTime() - chatDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    // Today - show time
    return date.toLocaleTimeString(language === 'tr' ? 'tr-TR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  if (diffDays === 1) {
    return language === 'tr' ? 'Dün' : 'Yesterday'
  }

  if (diffDays < 7) {
    const dayNames = language === 'tr'
      ? ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
      : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return dayNames[date.getDay()]
  }

  // Older - show date
  return date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

export function WhatsAppChatList({
  open,
  onOpenChange,
  onLoadChat,
  onNewChat,
  language = 'en',
  darkMode = false,
  deviceType = 'ios',
}: WhatsAppChatListProps) {
  const isAndroid = deviceType === 'android'
  const { profile } = useAuth()
  const {
    savedChats,
    currentChatId,
    isLoading,
    loadChat,
    removeChat,
    setCurrentChatId,
    remainingChats,
  } = useSavedChats()

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleLoadChat = async (chatId: string) => {
    const chatData = await loadChat(chatId)
    if (chatData) {
      onLoadChat(chatData)
      onOpenChange(false)
    }
  }

  const handleDeleteChat = async () => {
    if (!deleteConfirmId) return

    setIsDeleting(true)
    try {
      await removeChat(deleteConfirmId)
    } finally {
      setIsDeleting(false)
      setDeleteConfirmId(null)
    }
  }

  const handleNewChat = () => {
    setCurrentChatId(null)
    onNewChat()
    onOpenChange(false)
  }

  const isFreeTier = profile?.subscription_tier === 'free'
  const canCreateNew = remainingChats === null || remainingChats > 0

  // Theme colors - light and dark mode compatible
  const theme = {
    bg: darkMode ? '#111B21' : '#FFFFFF',
    headerBg: darkMode ? '#202C33' : '#F0F2F5',
    headerText: darkMode ? '#E9EDEF' : '#111B21',
    text: darkMode ? '#E9EDEF' : '#111B21',
    subtext: darkMode ? '#8696A0' : '#667781',
    border: darkMode ? '#222D34' : '#E9EDEF',
    itemHoverBg: darkMode ? '#202C33' : '#F5F6F6',
    itemActiveBg: darkMode ? '#2A3942' : '#D9FDD3',
    green: '#00A884',
  }

  if (!open) return null

  return (
    <>
      {/* Outer phone frame - matches WhatsApp preview exactly */}
      <div
        className="transition-all duration-300 overflow-hidden w-[375px]"
        style={{
          borderRadius: isAndroid ? '24px' : '44px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.1)',
          background: '#000',
          padding: '2px',
        }}
      >
        {/* Inner content container */}
        <div
          className="flex flex-col overflow-hidden antialiased"
          style={{
            height: '812px',
            borderRadius: isAndroid ? '22px' : '42px',
            backgroundColor: darkMode ? '#000000' : '#FFFFFF',
          }}
        >
          {/* Status Bar - iOS or Android */}
          {isAndroid ? (
            // Android Status Bar
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
          ) : (
            // iOS Status Bar
            <div
              className="flex items-center justify-between px-[21px] pt-[12px] pb-[10px]"
              style={{ backgroundColor: darkMode ? '#1F2C34' : '#F6F6F6' }}
            >
              <span className="text-[15px] font-semibold tracking-[-0.3px]" style={{ color: darkMode ? '#FFFFFF' : '#000000' }}>
                9:41
              </span>
              <div className="flex items-center gap-[5px]">
                <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
                  <rect x="0" y="7" width="3" height="5" rx="0.5" fill={darkMode ? '#FFFFFF' : '#000000'}/>
                  <rect x="4" y="5" width="3" height="7" rx="0.5" fill={darkMode ? '#FFFFFF' : '#000000'}/>
                  <rect x="8" y="3" width="3" height="9" rx="0.5" fill={darkMode ? '#FFFFFF' : '#000000'}/>
                  <rect x="12" y="0" width="3" height="12" rx="0.5" fill={darkMode ? '#FFFFFF' : '#000000'}/>
                </svg>
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                  <path d="M8 2.4C10.9 2.4 13.5 3.5 15.4 5.3L14.1 6.6C12.5 5.1 10.4 4.2 8 4.2C5.6 4.2 3.5 5.1 1.9 6.6L0.6 5.3C2.5 3.5 5.1 2.4 8 2.4Z" fill={darkMode ? '#FFFFFF' : '#000000'}/>
                  <path d="M8 5.8C9.9 5.8 11.6 6.5 12.9 7.7L11.6 9C10.6 8.1 9.4 7.6 8 7.6C6.6 7.6 5.4 8.1 4.4 9L3.1 7.7C4.4 6.5 6.1 5.8 8 5.8Z" fill={darkMode ? '#FFFFFF' : '#000000'}/>
                  <circle cx="8" cy="10.5" r="1.5" fill={darkMode ? '#FFFFFF' : '#000000'}/>
                </svg>
                <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
                  <rect x="0.5" y="0.5" width="21" height="11" rx="2.5" stroke={darkMode ? '#FFFFFF' : '#000000'} strokeOpacity="0.35"/>
                  <rect x="2" y="2" width="18" height="8" rx="1.5" fill={darkMode ? '#FFFFFF' : '#000000'}/>
                  <path d="M23 4V8C24.1 7.5 24.1 4.5 23 4Z" fill={darkMode ? '#FFFFFF' : '#000000'} fillOpacity="0.4"/>
                </svg>
              </div>
            </div>
          )}

          {/* Header */}
          <div
            className="px-4 py-2 flex items-center justify-between"
            style={{ backgroundColor: theme.headerBg }}
          >
            <h1 className="text-xl font-bold" style={{ color: theme.headerText }}>
              {language === 'tr' ? 'Sohbetler' : 'Chats'}
            </h1>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
                style={{ color: theme.green }}
                onClick={handleNewChat}
                disabled={!canCreateNew}
              >
                <Plus className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
                style={{ color: theme.headerText }}
                onClick={() => onOpenChange(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Free tier limit warning */}
          {isFreeTier && remainingChats === 0 && (
            <div
              className="px-4 py-2 flex items-center gap-2 text-sm"
              style={{ backgroundColor: darkMode ? '#182229' : '#FFF3CD', color: darkMode ? '#F7C948' : '#856404' }}
            >
              <Crown className="w-4 h-4" />
              <span>{language === 'tr' ? 'Limit doldu' : 'Limit reached'}</span>
            </div>
          )}

          {/* Chat List */}
          <div className="flex-1 overflow-hidden" style={{ backgroundColor: theme.bg }}>
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.subtext }} />
              </div>
            ) : savedChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <MessageSquare className="w-16 h-16 mb-4 opacity-30" style={{ color: theme.subtext }} />
                <p className="font-medium" style={{ color: theme.text }}>
                  {language === 'tr' ? 'Henüz kayıtlı sohbet yok' : 'No saved chats yet'}
                </p>
                <p className="text-sm mt-1" style={{ color: theme.subtext }}>
                  {language === 'tr' ? 'İlk sohbetinizi oluşturun' : 'Create your first chat'}
                </p>
                <Button
                  onClick={handleNewChat}
                  className="mt-4"
                  style={{ backgroundColor: theme.green, color: '#FFFFFF' }}
                  disabled={!canCreateNew}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {language === 'tr' ? 'Yeni Sohbet' : 'New Chat'}
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div>
                  {savedChats.map((chat) => (
                    <ChatListItem
                      key={chat.id}
                      chat={chat}
                      isActive={currentChatId === chat.id}
                      onLoad={() => handleLoadChat(chat.id)}
                      onDelete={() => setDeleteConfirmId(chat.id)}
                      theme={theme}
                      language={language}
                      darkMode={darkMode}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Home Indicator - iOS only */}
          {!isAndroid && (
            <div className="h-8 flex items-center justify-center" style={{ backgroundColor: theme.bg }}>
              <div
                className="w-32 h-1 rounded-full"
                style={{ backgroundColor: darkMode ? '#FFFFFF' : '#000000', opacity: 0.2 }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'tr' ? 'Sohbeti Sil' : 'Delete Chat'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'tr'
                ? 'Bu sohbeti silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'
                : 'Are you sure you want to delete this chat? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {language === 'tr' ? 'İptal' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChat}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              {language === 'tr' ? 'Sil' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Individual chat list item (WhatsApp style)
function ChatListItem({
  chat,
  isActive,
  onLoad,
  onDelete,
  theme,
  language,
  darkMode,
}: {
  chat: ChatRow
  isActive: boolean
  onLoad: () => void
  onDelete: () => void
  theme: Record<string, string>
  language: Language
  darkMode?: boolean
}) {
  const isGroupChat = chat.data.groupSettings?.isGroupChat
  const preview = getMessagePreview(chat, darkMode || false)
  const lastMessage = chat.data.messages?.[chat.data.messages.length - 1]

  // Get avatar info
  const avatarSrc = isGroupChat
    ? chat.data.groupSettings?.groupIcon
    : chat.data.receiver?.avatar
  const avatarName = isGroupChat
    ? chat.data.groupSettings?.groupName || 'Group'
    : chat.data.receiver?.name || 'Chat'
  const avatarBgColor = getAvatarBgColor(avatarSrc)
  const hasImageAvatar = isImageAvatar(avatarSrc)

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors relative group'
      )}
      style={{
        backgroundColor: isActive ? theme.itemActiveBg : 'transparent',
        borderBottom: `1px solid ${theme.border}`,
      }}
      onClick={onLoad}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = theme.itemHoverBg
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent'
        }
      }}
    >
      {/* Avatar */}
      <Avatar className="w-12 h-12 flex-shrink-0">
        {hasImageAvatar && (
          <AvatarImage src={avatarSrc!} alt={avatarName} />
        )}
        <AvatarFallback
          className="text-white text-lg font-medium"
          style={{ backgroundColor: avatarBgColor }}
        >
          {avatarName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Chat Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span
            className="font-medium truncate"
            style={{ color: theme.text }}
          >
            {chat.name}
          </span>
          <span
            className="text-xs flex-shrink-0 ml-2"
            style={{ color: theme.subtext }}
          >
            {formatChatDate(chat.updated_at, language)}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {/* Status icon for sent messages */}
          {preview.isSent && lastMessage?.status && (
            <StatusIcon status={lastMessage.status} darkMode={darkMode} />
          )}
          {/* Message preview */}
          <span
            className="text-sm truncate"
            style={{ color: theme.subtext }}
          >
            {preview.icon}
            {preview.text}
          </span>
        </div>
      </div>

      {/* Delete button (on hover) */}
      <Button
        variant="ghost"
        size="icon"
        className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 h-8 w-8"
        style={{ color: theme.subtext }}
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
}
