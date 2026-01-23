'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
import { Language } from '@/types'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface WhatsAppChatListProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoadChat: (chatData: ChatData) => void
  onNewChat: () => void
  language?: Language
  darkMode?: boolean
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
const getMessagePreview = (chat: ChatRow): { icon?: React.ReactNode; text: string; isSent: boolean } => {
  const messages = chat.data.messages || []
  if (messages.length === 0) {
    return { text: 'No messages yet', isSent: false }
  }

  const lastMessage = messages[messages.length - 1]
  const isSent = lastMessage.userId === 'me'

  // Get message type icon and text
  let icon: React.ReactNode = null
  let text = ''

  switch (lastMessage.type) {
    case 'voice':
      icon = <Mic className="w-4 h-4 inline mr-1 text-muted-foreground" />
      text = `Voice message (${lastMessage.voiceData?.duration || 0}s)`
      break
    case 'image':
      icon = <ImageIcon className="w-4 h-4 inline mr-1 text-muted-foreground" />
      text = lastMessage.content || 'Photo'
      break
    case 'video':
      icon = <Video className="w-4 h-4 inline mr-1 text-muted-foreground" />
      text = 'Video'
      break
    case 'document':
      icon = <FileText className="w-4 h-4 inline mr-1 text-muted-foreground" />
      text = lastMessage.documentData?.fileName || 'Document'
      break
    case 'location':
      icon = <MapPin className="w-4 h-4 inline mr-1 text-muted-foreground" />
      text = lastMessage.locationData?.name || 'Location'
      break
    case 'contact':
      icon = <UserIcon className="w-4 h-4 inline mr-1 text-muted-foreground" />
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
  darkMode = true,
}: WhatsAppChatListProps) {
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

  // Theme colors (WhatsApp dark theme)
  const theme = {
    bg: darkMode ? '#0B141A' : '#FFFFFF',
    headerBg: darkMode ? '#1F2C34' : '#008069',
    headerText: '#FFFFFF',
    itemBg: darkMode ? '#111B21' : '#FFFFFF',
    itemHoverBg: darkMode ? '#202C33' : '#F5F6F6',
    itemActiveBg: darkMode ? '#2A3942' : '#D9FDD3',
    text: darkMode ? '#E9EDEF' : '#111B21',
    subtext: darkMode ? '#8696A0' : '#667781',
    border: darkMode ? '#222D34' : '#E9EDEF',
    green: '#00A884',
    unread: '#00A884',
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="left"
          className="w-full sm:w-[400px] p-0 border-0"
          style={{ backgroundColor: theme.bg }}
        >
          {/* WhatsApp Header */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ backgroundColor: theme.headerBg }}
          >
            <SheetTitle className="text-xl font-semibold" style={{ color: theme.headerText }}>
              {language === 'tr' ? 'Sohbetler' : 'Chats'}
            </SheetTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={handleNewChat}
                disabled={!canCreateNew}
              >
                <Plus className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
              >
                <Camera className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
              >
                <MoreHorizontal className="w-5 h-5" />
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
              <span>{language === 'tr' ? 'Limit doldu - Daha fazlası için yükselt' : 'Limit reached - Upgrade for more'}</span>
            </div>
          )}

          {/* Chat List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.subtext }} />
            </div>
          ) : savedChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <MessageSquare className="w-16 h-16 mb-4 opacity-30" style={{ color: theme.subtext }} />
              <p style={{ color: theme.text }}>
                {language === 'tr' ? 'Henüz kayıtlı sohbet yok' : 'No saved chats yet'}
              </p>
              <p className="text-sm mt-1" style={{ color: theme.subtext }}>
                {language === 'tr' ? 'İlk sohbetinizi oluşturun' : 'Create your first chat to get started'}
              </p>
              <Button
                onClick={handleNewChat}
                className="mt-4"
                style={{ backgroundColor: theme.green }}
                disabled={!canCreateNew}
              >
                <Plus className="w-4 h-4 mr-2" />
                {language === 'tr' ? 'Yeni Sohbet' : 'New Chat'}
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-64px)]">
              <div className="divide-y" style={{ borderColor: theme.border }}>
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
        </SheetContent>
      </Sheet>

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
  const preview = getMessagePreview(chat)
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
