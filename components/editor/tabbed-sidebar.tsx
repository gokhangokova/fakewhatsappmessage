'use client'

import { useState, useRef, useEffect } from 'react'
import { Platform, Message, User, MessageStatus, ReplyTo, MessageReaction, Language, WhatsAppSettings, WhatsAppBackgroundType, WHATSAPP_BG_COLORS, WHATSAPP_BG_IMAGES, FontFamily, SUPPORTED_FONTS, SUPPORTED_LANGUAGES, DeviceType, GroupChatSettings, GroupParticipant, GROUP_CHAT_COLORS } from '@/types'
import { useTranslations } from '@/lib/i18n/translations'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { AvatarUpload } from '@/components/ui/avatar-upload'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  MessageSquare,
  Users,
  Users2,
  Plus,
  Trash2,
  GripVertical,
  Image as ImageIcon,
  Check,
  CheckCheck,
  Clock,
  Forward,
  Reply,
  Smile,
  X,
  Upload,
  ChevronRight,
  Edit3,
  FlaskConical,
  Palette,
  Info,
  RotateCcw,
  Sparkles,
  Globe,
} from 'lucide-react'
import { generateId } from '@/lib/utils'

// Debounced Input Component to prevent scroll jumping
function DebouncedInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  const [localValue, setLocalValue] = useState(value)
  
  useEffect(() => {
    setLocalValue(value)
  }, [value])
  
  const handleBlur = () => {
    if (localValue !== value) {
      onChange(localValue)
    }
  }
  
  return (
    <Input
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  )
}

interface TabbedSidebarProps {
  // Editor props
  platform: Platform
  sender: User
  setSender: (user: User) => void
  receiver: User
  setReceiver: (user: User) => void
  messages: Message[]
  setMessages: (messages: Message[]) => void
  // Settings props
  darkMode: boolean
  setDarkMode: (value: boolean) => void
  mobileView: boolean
  setMobileView: (value: boolean) => void
  timeFormat: '12h' | '24h'
  setTimeFormat: (value: '12h' | '24h') => void
  transparentBg: boolean
  setTransparentBg: (value: boolean) => void
  whatsappSettings?: WhatsAppSettings
  setWhatsAppSettings?: (settings: Partial<WhatsAppSettings>) => void
  language: Language
  setLanguage: (language: Language) => void
  fontFamily: FontFamily
  setFontFamily: (fontFamily: FontFamily) => void
  batteryLevel: number
  setBatteryLevel: (level: number) => void
  deviceType: DeviceType
  setDeviceType: (deviceType: DeviceType) => void
  // Group chat props
  groupSettings?: GroupChatSettings
  setGroupSettings?: (settings: Partial<GroupChatSettings>) => void
  toggleGroupChat?: (isGroupChat: boolean) => void
  addParticipant?: (participant: GroupParticipant) => void
  removeParticipant?: (participantId: string) => void
  updateParticipant?: (participantId: string, updates: Partial<GroupParticipant>) => void
  onReset?: () => void
  // Mobile props
  isOpen?: boolean
  onClose?: () => void
}

// Collapsible Section Component
function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  badge,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  defaultOpen?: boolean
  badge?: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3.5 transition-all',
          isOpen
            ? 'bg-[#d4f5e2] text-gray-900'
            : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
        )}
      >
        <Icon className={cn("w-5 h-5", isOpen ? "text-[#128C7E]" : "text-gray-500")} />
        <span className="font-medium flex-1 text-left">{title}</span>
        {badge}
        <ChevronRight className={cn(
          "w-4 h-4 transition-transform duration-200",
          isOpen && "rotate-90"
        )} />
      </button>
      {isOpen && (
        <div className="bg-white px-4 py-4 space-y-4 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  )
}

// Message Status Selector for WhatsApp
const MessageStatusSelector = ({
  status,
  onChange,
}: {
  status: MessageStatus
  onChange: (status: MessageStatus) => void
}) => {
  const statuses: { value: MessageStatus; icon: React.ReactNode; label: string }[] = [
    { value: 'sending', icon: <Clock className="w-3 h-3" />, label: 'Sending' },
    { value: 'sent', icon: <Check className="w-3 h-3" />, label: 'Sent' },
    { value: 'delivered', icon: <CheckCheck className="w-3 h-3" />, label: 'Delivered' },
    { value: 'read', icon: <CheckCheck className="w-3 h-3 text-blue-500" />, label: 'Read' },
  ]

  return (
    <div className="flex items-center gap-1">
      {statuses.map((s) => (
        <button
          key={s.value}
          onClick={() => onChange(s.value)}
          className={cn(
            'p-1.5 rounded transition-colors',
            status === s.value
              ? 'bg-primary/10 text-primary'
              : 'hover:bg-muted text-muted-foreground'
          )}
          title={s.label}
        >
          {s.icon}
        </button>
      ))}
    </div>
  )
}

// Reaction Selector Component
const ReactionSelector = ({
  reactions,
  onChange,
}: {
  reactions: MessageReaction[]
  onChange: (reactions: MessageReaction[]) => void
}) => {
  const availableReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🎉', '🔥', '👏', '💯']
  
  const toggleReaction = (emoji: string) => {
    const existing = reactions.find(r => r.emoji === emoji)
    if (existing) {
      onChange(reactions.filter(r => r.emoji !== emoji))
    } else {
      onChange([...reactions, { emoji, count: 1 }])
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={cn(
          "p-1.5 rounded transition-colors",
          reactions.length > 0 
            ? "bg-amber-100 text-amber-600" 
            : "hover:bg-muted text-muted-foreground"
        )}>
          <Smile className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {availableReactions.map((emoji) => {
            const isSelected = reactions.some(r => r.emoji === emoji)
            return (
              <button
                key={emoji}
                onClick={() => toggleReaction(emoji)}
                className={cn(
                  "text-xl p-1 rounded hover:bg-muted transition-colors",
                  isSelected && "bg-primary/10 ring-2 ring-primary/50"
                )}
              >
                {emoji}
              </button>
            )
          })}
        </div>
        {reactions.length > 0 && (
          <div className="mt-2 pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Selected:</p>
            <div className="flex gap-1">
              {reactions.map((r, i) => (
                <span key={i} className="text-sm bg-muted px-1.5 py-0.5 rounded">
                  {r.emoji}
                </span>
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// Reply Selector Component
const ReplySelector = ({
  messages,
  currentMessageId,
  replyTo,
  sender,
  receiver,
  onChange,
}: {
  messages: Message[]
  currentMessageId: string
  replyTo?: ReplyTo
  sender: User
  receiver: User
  onChange: (replyTo?: ReplyTo) => void
}) => {
  const availableMessages = messages.filter(m => m.id !== currentMessageId && m.content)
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={cn(
          "p-1.5 rounded transition-colors",
          replyTo 
            ? "bg-blue-100 text-blue-600" 
            : "hover:bg-muted text-muted-foreground"
        )}>
          <Reply className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <div className="space-y-2">
          <p className="text-sm font-medium">Reply to message</p>
          {replyTo && (
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded text-sm">
              <span className="truncate flex-1">{replyTo.content}</span>
              <button 
                onClick={() => onChange(undefined)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="max-h-[200px] overflow-y-auto space-y-1">
            {availableMessages.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No messages to reply to</p>
            ) : (
              availableMessages.map((msg) => {
                const isFromSender = msg.userId === sender.id
                const userName = isFromSender ? sender.name : receiver.name
                return (
                  <button
                    key={msg.id}
                    onClick={() => onChange({
                      id: msg.id,
                      content: msg.content,
                      userId: msg.userId,
                      userName: userName,
                    })}
                    className={cn(
                      "w-full text-left p-2 rounded text-sm hover:bg-muted transition-colors",
                      replyTo?.id === msg.id && "bg-blue-50"
                    )}
                  >
                    <p className="text-xs font-medium text-muted-foreground">{userName}</p>
                    <p className="truncate">{msg.content}</p>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Image Upload Component
const ImageUploader = ({
  imageUrl,
  onChange,
}: {
  imageUrl?: string
  onChange: (url?: string) => void
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        onChange(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const handleUrlInput = (url: string) => {
    if (url) {
      onChange(url)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={cn(
          "p-1.5 rounded transition-colors",
          imageUrl 
            ? "bg-green-100 text-green-600" 
            : "hover:bg-muted text-muted-foreground"
        )}>
          <ImageIcon className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-3">
          <p className="text-sm font-medium">Add Image</p>
          
          {imageUrl && (
            <div className="relative">
              <img 
                src={imageUrl} 
                alt="Preview" 
                className="w-full h-32 object-cover rounded"
              />
              <button
                onClick={() => onChange(undefined)}
                className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          
          <div className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Image
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            
            <Input
              placeholder="Paste image URL..."
              className="text-sm"
              onBlur={(e) => handleUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleUrlInput((e.target as HTMLInputElement).value)
                }
              }}
            />
          </div>
          
          {/* Sample Images */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Sample images:</p>
            <div className="grid grid-cols-3 gap-1">
              {[
                'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop',
                'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200&h=200&fit=crop',
                'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=200&h=200&fit=crop',
              ].map((url, i) => (
                <button
                  key={i}
                  onClick={() => onChange(url)}
                  className="aspect-square rounded overflow-hidden hover:ring-2 ring-primary transition-all"
                >
                  <img src={url} alt={`Sample ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Sortable Message Item Component
function SortableMessageItem({
  message,
  sender,
  receiver,
  platform,
  messages,
  groupSettings,
  onUpdateContent,
  onUpdateTimestamp,
  onUpdateStatus,
  onUpdateForwarded,
  onUpdateReplyTo,
  onUpdateReactions,
  onUpdateImage,
  onDelete,
  onToggleUser,
}: {
  message: Message
  sender: User
  receiver: User
  platform: Platform
  messages: Message[]
  groupSettings?: GroupChatSettings
  onUpdateContent: (content: string) => void
  onUpdateTimestamp: (timestamp: Date) => void
  onUpdateStatus?: (status: MessageStatus) => void
  onUpdateForwarded?: (isForwarded: boolean) => void
  onUpdateReplyTo?: (replyTo?: ReplyTo) => void
  onUpdateReactions?: (reactions: MessageReaction[]) => void
  onUpdateImage?: (imageUrl?: string) => void
  onDelete: () => void
  onToggleUser: () => void
}) {
  const [localContent, setLocalContent] = useState(message.content)
  
  useEffect(() => {
    setLocalContent(message.content)
  }, [message.content])
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: message.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const timestamp = message.timestamp instanceof Date
    ? message.timestamp
    : new Date(message.timestamp)

  // For group chat, check if user is 'sender-1' (You) or find in participants
  const isGroupChat = groupSettings?.isGroupChat && groupSettings.participants.length > 0
  const isSent = message.userId === sender.id || message.userId === 'sender-1'
  const isWhatsApp = platform === 'whatsapp'

  // Get the display name for the message sender
  const getMessageSenderName = () => {
    if (isGroupChat) {
      // First check message's own senderName, then lookup in participants
      if (message.senderName) return message.senderName
      const participant = groupSettings?.participants.find(p => p.id === message.userId)
      return participant?.name || (isSent ? sender.name : receiver.name)
    }
    return isSent ? sender.name : receiver.name
  }

  // Get the color for the message sender (for group chat)
  const getMessageSenderColor = () => {
    if (isGroupChat) {
      if (message.senderColor) return message.senderColor
      const participant = groupSettings?.participants.find(p => p.id === message.userId)
      return participant?.color || '#128C7E'
    }
    return undefined
  }

  const handleBlur = () => {
    if (localContent !== message.content) {
      onUpdateContent(localContent)
    }
  }

  const senderName = getMessageSenderName()
  const senderColor = getMessageSenderColor()

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative bg-gray-50 rounded-lg p-3 space-y-2',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      {/* Header Row */}
      <div className="flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          onClick={onToggleUser}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors',
            isSent
              ? 'bg-[#d4f5e2] text-[#128C7E]'
              : 'bg-gray-200 text-gray-700'
          )}
          style={isGroupChat && senderColor ? { backgroundColor: `${senderColor}20`, color: senderColor } : undefined}
        >
          <span
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: senderColor || (isSent ? '#128C7E' : '#6B7280'), opacity: 0.4 }}
          />
          {senderName}
        </button>
        <DateTimePicker
          value={timestamp}
          onChange={onUpdateTimestamp}
        />
        <button
          onClick={onDelete}
          className="ml-auto opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity p-2 lg:p-1 hover:bg-destructive/10 rounded active:bg-destructive/20"
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </button>
      </div>

      {/* Message Type Indicators */}
      {message.imageUrl && (
        <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
          <ImageIcon className="w-3 h-3" />
          <span>Image message</span>
        </div>
      )}
      
      {message.replyTo && (
        <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
          <Reply className="w-3 h-3" />
          <span className="truncate">Replying to: {message.replyTo.content}</span>
        </div>
      )}

      {message.isForwarded && (
        <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
          <Forward className="w-3 h-3" />
          <span>Forwarded message</span>
        </div>
      )}

      {message.reactions && message.reactions.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
          <Smile className="w-3 h-3" />
          <span>Reactions: {message.reactions.map(r => r.emoji).join(' ')}</span>
        </div>
      )}

      {/* Content Textarea */}
      <Textarea
        value={localContent}
        onChange={(e) => setLocalContent(e.target.value)}
        onBlur={handleBlur}
        placeholder="Type your message..."
        className="min-h-[60px] resize-none"
      />

      {/* Action Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {isWhatsApp && onUpdateImage && (
            <ImageUploader
              imageUrl={message.imageUrl}
              onChange={onUpdateImage}
            />
          )}
          
          {isWhatsApp && onUpdateReplyTo && (
            <ReplySelector
              messages={messages}
              currentMessageId={message.id}
              replyTo={message.replyTo}
              sender={sender}
              receiver={receiver}
              onChange={onUpdateReplyTo}
            />
          )}
          
          {isWhatsApp && onUpdateForwarded && (
            <button
              onClick={() => onUpdateForwarded(!message.isForwarded)}
              className={cn(
                "p-1.5 rounded transition-colors",
                message.isForwarded 
                  ? "bg-orange-100 text-orange-600" 
                  : "hover:bg-muted text-muted-foreground"
              )}
              title="Toggle Forwarded"
            >
              <Forward className="w-4 h-4" />
            </button>
          )}
          
          {isWhatsApp && onUpdateReactions && (
            <ReactionSelector
              reactions={message.reactions || []}
              onChange={onUpdateReactions}
            />
          )}
        </div>

        {isWhatsApp && isSent && onUpdateStatus && (
          <MessageStatusSelector
            status={message.status || 'read'}
            onChange={onUpdateStatus}
          />
        )}
      </div>
    </div>
  )
}

// Background Image Uploader
const BackgroundImageUploader = ({
  imageUrl,
  onChange,
  uploadLabel,
  changeLabel,
}: {
  imageUrl?: string
  onChange: (url?: string) => void
  uploadLabel: string
  changeLabel: string
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        onChange(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-3">
      {imageUrl && (
        <div className="relative">
          <img 
            src={imageUrl} 
            alt="Background" 
            className="w-full h-20 object-cover rounded-lg"
          />
          <button
            onClick={() => onChange(undefined)}
            className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-4 h-4 mr-2" />
        {imageUrl ? changeLabel : uploadLabel}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      
      <div className="grid grid-cols-3 gap-1">
        {WHATSAPP_BG_IMAGES.map((url, i) => (
          <button
            key={i}
            onClick={() => onChange(url)}
            className={cn(
              "aspect-[3/4] rounded overflow-hidden transition-all",
              imageUrl === url ? "ring-2 ring-[#25D366]" : "hover:ring-2 ring-gray-300"
            )}
          >
            <img src={url} alt={`Preset ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}

type TabType = 'editor' | 'settings'

export function TabbedSidebar({
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
  onReset,
  isOpen = false,
  onClose,
}: TabbedSidebarProps) {
  const t = useTranslations(language)
  const [activeTab, setActiveTab] = useState<TabType>('editor')
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollPositionRef = useRef(0)
  
  const backgroundType = whatsappSettings?.backgroundType || 'doodle'

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    
    const handleScroll = () => {
      scrollPositionRef.current = container.scrollTop
    }
    
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])
  
  useEffect(() => {
    requestAnimationFrame(() => {
      if (scrollContainerRef.current && scrollPositionRef.current > 0) {
        scrollContainerRef.current.scrollTop = scrollPositionRef.current
      }
    })
  })
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = messages.findIndex((msg) => msg.id === active.id)
      const newIndex = messages.findIndex((msg) => msg.id === over.id)
      setMessages(arrayMove(messages, oldIndex, newIndex))
    }
  }

  const addMessage = () => {
    // Alternatif sıralama: Son mesaj kimden geldiyse, yeni mesaj diğer kişiden gelsin
    const lastMessage = messages[messages.length - 1]
    const nextUserId = lastMessage 
      ? (lastMessage.userId === sender.id ? receiver.id : sender.id)
      : sender.id
    
    const newMessage: Message = {
      id: generateId(),
      userId: nextUserId,
      content: '',
      timestamp: new Date(),
      type: 'text',
      status: 'read',
    }
    setMessages([...messages, newMessage])
  }

  const updateMessageContent = (id: string, content: string) => {
    setMessages(
      messages.map((msg) =>
        msg.id === id ? { ...msg, content } : msg
      )
    )
  }

  const updateMessageTimestamp = (id: string, timestamp: Date) => {
    setMessages(
      messages.map((msg) =>
        msg.id === id ? { ...msg, timestamp } : msg
      )
    )
  }

  const updateMessageStatus = (id: string, status: MessageStatus) => {
    setMessages(
      messages.map((msg) =>
        msg.id === id ? { ...msg, status } : msg
      )
    )
  }

  const updateMessageForwarded = (id: string, isForwarded: boolean) => {
    setMessages(
      messages.map((msg) =>
        msg.id === id ? { ...msg, isForwarded } : msg
      )
    )
  }

  const updateMessageReplyTo = (id: string, replyTo?: ReplyTo) => {
    setMessages(
      messages.map((msg) =>
        msg.id === id ? { ...msg, replyTo } : msg
      )
    )
  }

  const updateMessageReactions = (id: string, reactions: MessageReaction[]) => {
    setMessages(
      messages.map((msg) =>
        msg.id === id ? { ...msg, reactions } : msg
      )
    )
  }

  const updateMessageImage = (id: string, imageUrl?: string) => {
    setMessages(
      messages.map((msg) =>
        msg.id === id ? { ...msg, imageUrl, type: imageUrl ? 'image' : 'text' } : msg
      )
    )
  }

  const deleteMessage = (id: string) => {
    setMessages(messages.filter((msg) => msg.id !== id))
  }

  const toggleMessageUser = (id: string) => {
    // For group chat, cycle through all participants
    if (groupSettings?.isGroupChat && groupSettings.participants.length > 0) {
      setMessages(
        messages.map((msg) => {
          if (msg.id !== id) return msg

          const participants = groupSettings.participants
          const currentIndex = participants.findIndex(p => p.id === msg.userId)
          const nextIndex = (currentIndex + 1) % participants.length
          const nextParticipant = participants[nextIndex]

          return {
            ...msg,
            userId: nextParticipant.id,
            senderId: nextParticipant.id,
            senderName: nextParticipant.name,
            senderColor: nextParticipant.color,
            // Only sent messages (from 'sender-1' / 'You') should have status
            status: nextParticipant.id === 'sender-1' ? (msg.status || 'read') : undefined,
          }
        })
      )
    } else {
      // For 1-1 chat, toggle between sender and receiver
      setMessages(
        messages.map((msg) =>
          msg.id === id
            ? { ...msg, userId: msg.userId === sender.id ? receiver.id : sender.id }
            : msg
        )
      )
    }
  }

  return (
    <div className={cn(
      // Mobile: Full-screen slide-in panel
      "lg:fixed lg:left-4 lg:top-20 lg:z-50 lg:w-80",
      // Mobile positioning
      "fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[340px]",
      // Mobile animation
      "transform transition-transform duration-300 ease-in-out",
      isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      // Hide on mobile when closed (but always show on lg+)
      !isOpen && "lg:block"
    )}>
      <div className={cn(
        "bg-white shadow-2xl border border-gray-200 overflow-hidden h-full lg:h-auto",
        "lg:rounded-2xl rounded-r-2xl"
      )}>
        {/* Tab Header */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('editor')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3.5 transition-all font-medium',
              activeTab === 'editor'
                ? 'bg-[#d4f5e2] text-[#128C7E] border-b-2 border-[#128C7E]'
                : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            <Edit3 className="w-4 h-4" />
            <span>{t.common.editor}</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3.5 transition-all font-medium',
              activeTab === 'settings'
                ? 'bg-[#d4f5e2] text-[#128C7E] border-b-2 border-[#128C7E]'
                : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            <FlaskConical className="w-4 h-4" />
            <span>{t.common.settings}</span>
          </button>
          {/* Mobile Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden flex items-center justify-center w-12 border-l border-gray-200 text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div ref={scrollContainerRef} className={cn(
          "p-3 space-y-2 overflow-y-auto",
          // Mobile: full height minus header and footer
          "h-[calc(100vh-120px)] lg:h-auto",
          // Desktop: max height
          activeTab === 'settings' && onReset 
            ? "lg:max-h-[calc(100vh-240px)]" 
            : "lg:max-h-[calc(100vh-180px)]"
        )}>
          {/* Editor Tab Content */}
          {activeTab === 'editor' && (
            <>
              {/* Chat Type Section - Only for WhatsApp */}
              {platform === 'whatsapp' && groupSettings && toggleGroupChat && (
                <CollapsibleSection
                  title={t.editor.chatType}
                  icon={Users2}
                  defaultOpen={true}
                  badge={
                    <span className="text-xs text-[#128C7E] bg-[#d4f5e2] px-2 py-0.5 rounded-full font-medium">
                      {groupSettings.isGroupChat ? t.editor.groupChat : t.editor.oneToOne}
                    </span>
                  }
                >
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleGroupChat(false)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        !groupSettings.isGroupChat
                          ? 'bg-[#d4f5e2] text-[#128C7E]'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      <Users className="w-4 h-4" />
                      <span>{t.editor.oneToOne}</span>
                    </button>
                    <button
                      onClick={() => toggleGroupChat(true)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        groupSettings.isGroupChat
                          ? 'bg-[#d4f5e2] text-[#128C7E]'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      <Users2 className="w-4 h-4" />
                      <span>{t.editor.groupChat}</span>
                    </button>
                  </div>
                </CollapsibleSection>
              )}

              {/* People Section */}
              <CollapsibleSection
                title={groupSettings?.isGroupChat ? t.editor.groupInfo : t.editor.people}
                icon={Users}
                defaultOpen={false}
              >
                {/* Group Chat Settings */}
                {groupSettings?.isGroupChat && setGroupSettings ? (
                  <>
                    {/* Group Name */}
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-500 uppercase tracking-wider font-medium">{t.editor.groupName}</Label>
                      <DebouncedInput
                        value={groupSettings.groupName}
                        onChange={(groupName) => setGroupSettings({ groupName })}
                        placeholder={t.editor.groupNamePlaceholder}
                        className="w-full"
                      />
                    </div>

                    {/* Participants */}
                    <div className="space-y-3">
                      <Label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                        {t.editor.participants} ({groupSettings.participants.length})
                      </Label>
                      <div className="space-y-2">
                        {groupSettings.participants.map((participant) => (
                          <div
                            key={participant.id}
                            className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                          >
                            {/* Avatar */}
                            <AvatarUpload
                              value={participant.avatar || null}
                              onChange={(avatar) => updateParticipant?.(participant.id, { avatar: avatar || undefined })}
                              fallback={participant.name}
                              size="sm"
                              language={language}
                              accentColor={participant.color}
                            />
                            
                            {/* Name Input */}
                            <DebouncedInput
                              value={participant.name}
                              onChange={(name) => updateParticipant?.(participant.id, { name })}
                              placeholder={t.editor.participantName}
                              className="flex-1 h-8 text-sm"
                            />
                            
                            {/* Color Picker */}
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm flex-shrink-0 hover:scale-110 transition-transform"
                                  style={{ backgroundColor: participant.color }}
                                  title={t.editor.participantColor}
                                />
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-2" align="end">
                                <div className="grid grid-cols-4 gap-1">
                                  {GROUP_CHAT_COLORS.map((color) => (
                                    <button
                                      key={color}
                                      onClick={() => updateParticipant?.(participant.id, { color })}
                                      className={cn(
                                        "w-6 h-6 rounded-full transition-all",
                                        participant.color === color
                                          ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
                                          : "hover:scale-110"
                                      )}
                                      style={{ backgroundColor: color }}
                                    />
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                            
                            {/* You badge or Delete button */}
                            {participant.id === 'me' ? (
                              <span className="text-xs text-[#128C7E] bg-[#d4f5e2] px-2 py-0.5 rounded flex-shrink-0">{language === 'tr' ? 'Sen' : 'You'}</span>
                            ) : (
                              <button
                                onClick={() => removeParticipant?.(participant.id)}
                                className="p-1 hover:bg-red-100 rounded text-red-500 flex-shrink-0 transition-colors"
                                title={t.common.delete}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* Add Participant Button */}
                      <Button
                        onClick={() => {
                          const newId = `p${Date.now()}`
                          const usedColors = groupSettings.participants.map(p => p.color)
                          const availableColor = GROUP_CHAT_COLORS.find(c => !usedColors.includes(c)) || GROUP_CHAT_COLORS[groupSettings.participants.length % GROUP_CHAT_COLORS.length]
                          addParticipant?.({
                            id: newId,
                            name: language === 'tr' ? `Kişi ${groupSettings.participants.length}` : `Person ${groupSettings.participants.length}`,
                            color: availableColor,
                            isAdmin: false,
                          })
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {t.editor.addParticipant}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Sender */}
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-500 uppercase tracking-wider font-medium">{t.editor.senderYou}</Label>
                      <div className="flex items-center gap-3">
                        <AvatarUpload
                          value={sender.avatar}
                          onChange={(avatar) => setSender({ ...sender, avatar })}
                          fallback={sender.name}
                          variant="primary"
                          language={language}
                        />
                        <DebouncedInput
                          value={sender.name}
                          onChange={(name) => setSender({ ...sender, name })}
                          className="flex-1"
                          placeholder="Your name"
                        />
                      </div>
                    </div>

                    {/* Receiver */}
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-500 uppercase tracking-wider font-medium">{t.editor.receiver}</Label>
                      <div className="flex items-center gap-3">
                        <AvatarUpload
                          value={receiver.avatar}
                          onChange={(avatar) => setReceiver({ ...receiver, avatar })}
                          fallback={receiver.name}
                          variant="secondary"
                          language={language}
                        />
                        <DebouncedInput
                          value={receiver.name}
                          onChange={(name) => setReceiver({ ...receiver, name })}
                          className="flex-1"
                          placeholder="Their name"
                        />
                      </div>
                    </div>
                  </>
                )}
              </CollapsibleSection>

              {/* Messages Section */}
              <CollapsibleSection
                title={t.editor.messages}
                icon={MessageSquare}
                defaultOpen={false}
                badge={
                  <span className="text-xs text-[#128C7E] bg-[#d4f5e2] px-2 py-0.5 rounded-full font-medium">
                    {messages.length}
                  </span>
                }
              >
                {/* WhatsApp Features Info */}
                {platform === 'whatsapp' && (
                  <div className="text-xs text-gray-500 bg-[#d4f5e2]/50 p-2 rounded-lg">
                    <p className="font-medium text-[#128C7E] mb-1">{t.editor.whatsappFeatures}</p>
                    <p>{t.editor.whatsappFeaturesDesc}</p>
                  </div>
                )}
                
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={messages.map((m) => m.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {messages.map((message) => (
                        <SortableMessageItem
                          key={message.id}
                          message={message}
                          sender={sender}
                          receiver={receiver}
                          platform={platform}
                          messages={messages}
                          groupSettings={groupSettings}
                          onUpdateContent={(content) => updateMessageContent(message.id, content)}
                          onUpdateTimestamp={(timestamp) => updateMessageTimestamp(message.id, timestamp)}
                          onUpdateStatus={platform === 'whatsapp' ? (status) => updateMessageStatus(message.id, status) : undefined}
                          onUpdateForwarded={platform === 'whatsapp' ? (isForwarded) => updateMessageForwarded(message.id, isForwarded) : undefined}
                          onUpdateReplyTo={platform === 'whatsapp' ? (replyTo) => updateMessageReplyTo(message.id, replyTo) : undefined}
                          onUpdateReactions={platform === 'whatsapp' ? (reactions) => updateMessageReactions(message.id, reactions) : undefined}
                          onUpdateImage={platform === 'whatsapp' ? (imageUrl) => updateMessageImage(message.id, imageUrl) : undefined}
                          onDelete={() => deleteMessage(message.id)}
                          onToggleUser={() => toggleMessageUser(message.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                
                <Button
                  onClick={addMessage}
                  variant="outline"
                  className="w-full mt-3"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t.editor.addMessage}
                </Button>
              </CollapsibleSection>
            </>
          )}

          {/* Settings Tab Content */}
          {activeTab === 'settings' && (
            <>
              {/* Appearance Section */}
              <CollapsibleSection
                title={t.settings.appearance}
                icon={Palette}
                defaultOpen={false}
              >
                {/* View Toggle */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500 uppercase tracking-wider font-medium">{t.settings.view}</Label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMobileView(false)}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        !mobileView
                          ? 'bg-[#d4f5e2] text-[#128C7E]'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {t.settings.desktop}
                    </button>
                    <button
                      onClick={() => setMobileView(true)}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        mobileView
                          ? 'bg-[#d4f5e2] text-[#128C7E]'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {t.settings.mobile}
                    </button>
                  </div>
                </div>

                {/* Time Format */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500 uppercase tracking-wider font-medium">{t.settings.timeFormat}</Label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTimeFormat('12h')}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        timeFormat === '12h'
                          ? 'bg-[#d4f5e2] text-[#128C7E]'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      12h
                    </button>
                    <button
                      onClick={() => setTimeFormat('24h')}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        timeFormat === '24h'
                          ? 'bg-[#d4f5e2] text-[#128C7E]'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      24h
                    </button>
                  </div>
                </div>

                {/* Battery Level */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-gray-500 uppercase tracking-wider font-medium">{t.settings.batteryLevel}</Label>
                    <span className={cn(
                      "text-xs font-medium",
                      batteryLevel <= 20 ? "text-red-500" : "text-[#128C7E]"
                    )}>
                      {batteryLevel}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={batteryLevel}
                      onChange={(e) => setBatteryLevel(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      style={{ accentColor: batteryLevel <= 20 ? '#EF4444' : '#25D366' }}
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={batteryLevel}
                      onChange={(e) => setBatteryLevel(parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1.5 text-sm text-center rounded-lg bg-gray-50 border border-gray-200 focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Device Type */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500 uppercase tracking-wider font-medium">{t.settings.device}</Label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeviceType('ios')}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2',
                        deviceType === 'ios'
                          ? 'bg-[#d4f5e2] text-[#128C7E]'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 814 1000" className="fill-current">
                        <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
                      </svg>
                      <span>iOS</span>
                    </button>
                    <button
                      onClick={() => setDeviceType('android')}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2',
                        deviceType === 'android'
                          ? 'bg-[#d4f5e2] text-[#128C7E]'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      <span>🤖</span>
                      <span>{t.settings.android}</span>
                    </button>
                  </div>
                </div>
              </CollapsibleSection>

              {/* WhatsApp Settings Section */}
              {platform === 'whatsapp' && whatsappSettings && setWhatsAppSettings && (
                <CollapsibleSection
                  title={t.settings.whatsapp}
                  icon={Sparkles}
                  defaultOpen={false}
                >
                  {/* Dark Mode & Transparent Bg Toggles */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                      <span className="text-sm text-gray-700">{t.settings.darkMode}</span>
                      <Switch
                        checked={darkMode}
                        onCheckedChange={setDarkMode}
                        className="data-[state=checked]:bg-[#25D366]"
                      />
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                      <span className="text-sm text-gray-700">{t.settings.transparentBg}</span>
                      <Switch
                        checked={transparentBg}
                        onCheckedChange={setTransparentBg}
                        className="data-[state=checked]:bg-[#25D366]"
                      />
                    </div>
                  </div>

                  {/* Font Family */}
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-500 uppercase tracking-wider font-medium">{t.settings.fontFamily}</Label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value as FontFamily)}
                      className="w-full px-3 py-2.5 rounded-lg text-sm bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] focus:outline-none cursor-pointer appearance-none transition-colors"
                      style={{
                        fontFamily: SUPPORTED_FONTS.find(f => f.code === fontFamily)?.style,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M2.5 4.5L6 8l3.5-3.5'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        paddingRight: '36px',
                      }}
                    >
                      {SUPPORTED_FONTS.map((font) => (
                        <option
                          key={font.code}
                          value={font.code}
                          style={{ fontFamily: font.style }}
                        >
                          {font.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-500 uppercase tracking-wider font-medium">{t.settings.status}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { value: 'online', label: t.settings.online },
                        { value: 'typing', label: t.settings.typing },
                        { value: 'last-seen', label: t.settings.lastSeen },
                        { value: 'none', label: t.settings.none },
                      ] as const).map((status) => (
                        <button
                          key={status.value}
                          onClick={() => setWhatsAppSettings({ lastSeen: status.value })}
                          className={cn(
                            'px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                            whatsappSettings.lastSeen === status.value
                              ? 'bg-[#d4f5e2] text-[#128C7E]'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          )}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Background Type */}
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-500 uppercase tracking-wider font-medium">{t.settings.background}</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { value: 'solid', label: t.settings.solid },
                        { value: 'doodle', label: t.settings.pattern },
                        { value: 'image', label: t.settings.image },
                      ] as { value: WhatsAppBackgroundType; label: string }[]).map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setWhatsAppSettings({ backgroundType: type.value })}
                          className={cn(
                            'px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                            backgroundType === type.value
                              ? 'bg-[#d4f5e2] text-[#128C7E]'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          )}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Solid Color */}
                  {backgroundType === 'solid' && (
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-500 uppercase tracking-wider font-medium">{t.settings.color}</Label>
                      <div className="grid grid-cols-6 gap-2">
                        {WHATSAPP_BG_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setWhatsAppSettings({ backgroundColor: color })}
                            className={cn(
                              'w-full aspect-square rounded-lg border-2 transition-all',
                              whatsappSettings.backgroundColor === color
                                ? 'border-[#25D366] scale-110 shadow-md'
                                : 'border-transparent hover:border-gray-300'
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={whatsappSettings.backgroundColor || '#EFEFE4'}
                          onChange={(e) => setWhatsAppSettings({ backgroundColor: e.target.value })}
                          className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                        />
                        <DebouncedInput
                          value={whatsappSettings.backgroundColor || '#EFEFE4'}
                          onChange={(value) => setWhatsAppSettings({ backgroundColor: value })}
                          placeholder="#EFEFE4"
                          className="flex-1 text-sm h-8"
                        />
                      </div>
                    </div>
                  )}

                  {/* Doodle Settings - Opacity control only (color is fixed in authentic images) */}
                  {backgroundType === 'doodle' && (
                    <>
                      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg mb-3">
                        <p>✨ {language === 'tr' ? 'Orijinal WhatsApp desen görseli kullanılıyor.' : 'Using authentic WhatsApp pattern image.'}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-gray-500 uppercase tracking-wider font-medium">{t.settings.patternOpacity}</Label>
                          <span className="text-xs text-[#128C7E] font-medium">
                            {Math.round((whatsappSettings.doodleOpacity || 1) * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="1"
                          step="0.05"
                          value={whatsappSettings.doodleOpacity || 1}
                          onChange={(e) => setWhatsAppSettings({ doodleOpacity: parseFloat(e.target.value) })}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#25D366]"
                        />
                      </div>
                    </>
                  )}

                  {/* Image Background */}
                  {backgroundType === 'image' && (
                    <BackgroundImageUploader
                      imageUrl={whatsappSettings.backgroundImage}
                      onChange={(url) => setWhatsAppSettings({ backgroundImage: url })}
                      uploadLabel={t.settings.upload}
                      changeLabel={t.settings.change}
                    />
                  )}

                  {/* Encryption Notice */}
                  <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                    <span className="text-sm text-gray-700">{t.settings.encryptionNotice}</span>
                    <Switch
                      checked={whatsappSettings.showEncryptionNotice}
                      onCheckedChange={(checked) => setWhatsAppSettings({ showEncryptionNotice: checked })}
                      className="data-[state=checked]:bg-[#25D366]"
                    />
                  </div>
                </CollapsibleSection>
              )}

              {/* Language Section */}
              <CollapsibleSection
                title={t.settings.language}
                icon={Globe}
                defaultOpen={false}
              >
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500 uppercase tracking-wider font-medium">{t.settings.selectLanguage}</Label>
                  <div className="space-y-2">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                          language === lang.code
                            ? 'bg-[#d4f5e2] text-[#128C7E]'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        )}
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <span>{lang.name}</span>
                        {language === lang.code && (
                          <span className="ml-auto text-[#25D366]">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </CollapsibleSection>

              {/* About Section */}
              <CollapsibleSection
                title={t.settings.about}
                icon={Info}
                defaultOpen={false}
              >
                <p className="text-sm text-gray-600 leading-relaxed">
                  {t.about.description}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {t.about.autoSave}
                </p>
              </CollapsibleSection>
            </>
          )}
        </div>

        {/* Footer - Reset Button (only on Settings tab) */}
        {activeTab === 'settings' && onReset && (
          <div className="p-3 border-t border-gray-100">
            <Button
              onClick={onReset}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {t.common.resetToDefaults}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
