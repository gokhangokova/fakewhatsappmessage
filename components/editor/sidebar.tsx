'use client'

import { useState, useRef } from 'react'
import { Platform, Message, User, MessageStatus, WhatsAppSettings, ReplyTo, MessageReaction, WHATSAPP_REACTIONS, WHATSAPP_BG_COLORS, WHATSAPP_BG_IMAGES, WhatsAppBackgroundType, MessageType, VoiceMessageData, DocumentData, VideoData } from '@/types'
import { platforms } from '@/lib/platforms'
import { cn } from '@/lib/utils'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { AvatarUpload } from '@/components/ui/avatar-upload'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Palette,
  Info,
  Plus,
  Trash2,
  GripVertical,
  Image as ImageIcon,
  RotateCcw,
  Check,
  CheckCheck,
  Clock,
  Settings2,
  Forward,
  Reply,
  Smile,
  X,
  Upload,
  Mic,
  FileText,
  Video,
  Type,
} from 'lucide-react'
import { generateId } from '@/lib/utils'

interface EditorSidebarProps {
  platform: Platform
  setPlatform: (platform: Platform) => void
  sender: User
  setSender: (user: User) => void
  receiver: User
  setReceiver: (user: User) => void
  messages: Message[]
  setMessages: (messages: Message[]) => void
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
  onReset?: () => void
}

const platformIcons: Record<Platform, string> = {
  whatsapp: '📱',
  imessage: '💬',
  instagram: '📸',
  messenger: '💬',
  telegram: '✈️',
  discord: '🎮',
  slack: '💼',
  signal: '🔒',
  snapchat: '👻',
  tiktok: '🎵',
  twitter: '🐦',
  linkedin: '💼',
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

  const isSent = message.userId === sender.id
  const isWhatsApp = platform === 'whatsapp'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative bg-muted/50 rounded-lg p-3 space-y-2',
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
              ? 'bg-primary/10 text-primary'
              : 'bg-secondary text-secondary-foreground'
          )}
        >
          <span className="w-4 h-4 rounded-full bg-current opacity-20" />
          {isSent ? sender.name : receiver.name}
        </button>
        <DateTimePicker
          value={timestamp}
          onChange={onUpdateTimestamp}
        />
        <button
          onClick={onDelete}
          className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </button>
      </div>

      {/* Message Type Indicator */}
      {message.imageUrl && (
        <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
          <ImageIcon className="w-3 h-3" />
          <span>Image message</span>
        </div>
      )}
      
      {/* Reply Indicator */}
      {message.replyTo && (
        <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
          <Reply className="w-3 h-3" />
          <span className="truncate">Replying to: {message.replyTo.content}</span>
        </div>
      )}

      {/* Forwarded Indicator */}
      {message.isForwarded && (
        <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
          <Forward className="w-3 h-3" />
          <span>Forwarded message</span>
        </div>
      )}

      {/* Reactions Indicator */}
      {message.reactions && message.reactions.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
          <Smile className="w-3 h-3" />
          <span>Reactions: {message.reactions.map(r => r.emoji).join(' ')}</span>
        </div>
      )}

      {/* Content Textarea */}
      <Textarea
        value={message.content}
        onChange={(e) => onUpdateContent(e.target.value)}
        placeholder="Type your message..."
        className="min-h-[60px] resize-none"
      />

      {/* Action Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* Image Upload */}
          {isWhatsApp && onUpdateImage && (
            <ImageUploader
              imageUrl={message.imageUrl}
              onChange={onUpdateImage}
            />
          )}
          
          {/* Reply Selector */}
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
          
          {/* Forwarded Toggle */}
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
          
          {/* Reactions Selector */}
          {isWhatsApp && onUpdateReactions && (
            <ReactionSelector
              reactions={message.reactions || []}
              onChange={onUpdateReactions}
            />
          )}
        </div>

        {/* Message Status for WhatsApp (only for sent messages) */}
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

// Background Image Uploader for WhatsApp
const BackgroundImageUploader = ({
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

  return (
    <div className="space-y-3">
      {/* Current Image Preview */}
      {imageUrl && (
        <div className="relative">
          <img 
            src={imageUrl} 
            alt="Background" 
            className="w-full h-24 object-cover rounded-lg"
          />
          <button
            onClick={() => onChange(undefined)}
            className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      
      {/* Upload Button */}
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-4 h-4 mr-2" />
        {imageUrl ? 'Change Image' : 'Upload Image'}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      
      {/* Preset Images */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Preset backgrounds:</p>
        <div className="grid grid-cols-3 gap-1">
          {WHATSAPP_BG_IMAGES.map((url, i) => (
            <button
              key={i}
              onClick={() => onChange(url)}
              className={cn(
                "aspect-[3/4] rounded overflow-hidden transition-all",
                imageUrl === url ? "ring-2 ring-primary" : "hover:ring-2 ring-muted-foreground/50"
              )}
            >
              <img src={url} alt={`Preset ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// WhatsApp Settings Panel
function WhatsAppSettingsPanel({
  settings,
  onChange,
  darkMode,
}: {
  settings: WhatsAppSettings
  onChange: (settings: Partial<WhatsAppSettings>) => void
  darkMode: boolean
}) {
  const backgroundType = settings.backgroundType || 'doodle'
  
  return (
    <div className="space-y-4 pt-2">
      {/* Last Seen Status */}
      <div className="space-y-2">
        <Label className="text-sm">Status</Label>
        <div className="grid grid-cols-2 gap-2">
          {(['online', 'typing', 'last-seen', 'none'] as const).map((status) => (
            <button
              key={status}
              onClick={() => onChange({ lastSeen: status })}
              className={cn(
                'px-3 py-2 rounded-md text-xs font-medium transition-colors capitalize',
                settings.lastSeen === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              {status === 'last-seen' ? 'Last Seen' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Background Type */}
      <div className="space-y-2">
        <Label className="text-sm">Background Type</Label>
        <div className="grid grid-cols-3 gap-2">
          {(['solid', 'doodle', 'image'] as WhatsAppBackgroundType[]).map((type) => (
            <button
              key={type}
              onClick={() => onChange({ backgroundType: type })}
              className={cn(
                'px-3 py-2 rounded-md text-xs font-medium transition-colors capitalize',
                backgroundType === type
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              {type === 'doodle' ? 'Pattern' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Solid Color Selector */}
      {backgroundType === 'solid' && (
        <div className="space-y-2">
          <Label className="text-sm">Background Color</Label>
          <div className="grid grid-cols-6 gap-2">
            {WHATSAPP_BG_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => onChange({ backgroundColor: color })}
                className={cn(
                  'w-full aspect-square rounded-lg border-2 transition-all',
                  settings.backgroundColor === color
                    ? 'border-primary scale-110'
                    : 'border-transparent hover:border-muted-foreground/50'
                )}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          {/* Custom Color Input */}
          <div className="flex items-center gap-2 mt-2">
            <input
              type="color"
              value={settings.backgroundColor || '#EFEFE4'}
              onChange={(e) => onChange({ backgroundColor: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border-0"
            />
            <Input
              value={settings.backgroundColor || '#EFEFE4'}
              onChange={(e) => onChange({ backgroundColor: e.target.value })}
              placeholder="#EFEFE4"
              className="flex-1 text-sm h-8"
            />
          </div>
        </div>
      )}

      {/* Doodle Pattern Settings */}
      {backgroundType === 'doodle' && (
        <>
          <div className="space-y-2">
            <Label className="text-sm">Base Color</Label>
            <div className="grid grid-cols-6 gap-2">
              {WHATSAPP_BG_COLORS.slice(0, 6).map((color) => (
                <button
                  key={color}
                  onClick={() => onChange({ backgroundColor: color })}
                  className={cn(
                    'w-full aspect-square rounded-lg border-2 transition-all',
                    settings.backgroundColor === color
                      ? 'border-primary scale-110'
                      : 'border-transparent hover:border-muted-foreground/50'
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm">Pattern Opacity: {Math.round((settings.doodleOpacity || 0.06) * 100)}%</Label>
            <input
              type="range"
              min="0.02"
              max="0.2"
              step="0.02"
              value={settings.doodleOpacity || 0.06}
              onChange={(e) => onChange({ doodleOpacity: parseFloat(e.target.value) })}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </>
      )}

      {/* Image Background Settings */}
      {backgroundType === 'image' && (
        <BackgroundImageUploader
          imageUrl={settings.backgroundImage}
          onChange={(url) => onChange({ backgroundImage: url })}
        />
      )}

      {/* Show Encryption Notice */}
      <div className="flex items-center justify-between">
        <Label className="text-sm">Show Encryption Notice</Label>
        <Switch
          checked={settings.showEncryptionNotice}
          onCheckedChange={(checked) => onChange({ showEncryptionNotice: checked })}
        />
      </div>
    </div>
  )
}

export function EditorSidebar({
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
  onReset,
}: EditorSidebarProps) {
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
    const newMessage: Message = {
      id: generateId(),
      userId: sender.id,
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
    setMessages(
      messages.map((msg) =>
        msg.id === id
          ? { ...msg, userId: msg.userId === sender.id ? receiver.id : sender.id }
          : msg
      )
    )
  }

  return (
    <div className="w-80 border-r bg-background flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <Accordion
          type="multiple"
          defaultValue={['app', 'people', 'messages', 'appearance']}
          className="w-full"
        >
          {/* Platform Info - WhatsApp Only */}
          <div className="px-4 py-3 border-b">
            <div className="flex items-center gap-3 bg-green-50 dark:bg-green-950 rounded-lg p-3">
              <span className="text-2xl">📱</span>
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">WhatsApp</p>
                <p className="text-xs text-green-600 dark:text-green-400">iOS Style</p>
              </div>
            </div>
          </div>

          {/* People */}
          <AccordionItem value="people" className="border-b px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>People</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              {/* Sender */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Sender (You)</Label>
                <div className="flex items-center gap-3">
                  <AvatarUpload
                    value={sender.avatar}
                    onChange={(avatar) => setSender({ ...sender, avatar })}
                    fallback={sender.name}
                    variant="primary"
                  />
                  <Input
                    value={sender.name}
                    onChange={(e) => setSender({ ...sender, name: e.target.value })}
                    className="flex-1"
                    placeholder="Your name"
                  />
                </div>
              </div>

              {/* Receiver */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Receiver</Label>
                <div className="flex items-center gap-3">
                  <AvatarUpload
                    value={receiver.avatar}
                    onChange={(avatar) => setReceiver({ ...receiver, avatar })}
                    fallback={receiver.name}
                    variant="secondary"
                  />
                  <Input
                    value={receiver.name}
                    onChange={(e) => setReceiver({ ...receiver, name: e.target.value })}
                    className="flex-1"
                    placeholder="Their name"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Messages */}
          <AccordionItem value="messages" className="border-b px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>Messages</span>
                <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {messages.length}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              {/* WhatsApp Features Info */}
              {platform === 'whatsapp' && (
                <div className="text-xs text-muted-foreground bg-green-50 p-2 rounded-lg">
                  <p className="font-medium text-green-700 mb-1">💡 WhatsApp Features</p>
                  <p>Use the icons below each message to add images, replies, forwarded labels, and reactions.</p>
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
                  {messages.map((message) => (
                    <SortableMessageItem
                      key={message.id}
                      message={message}
                      sender={sender}
                      receiver={receiver}
                      platform={platform}
                      messages={messages}
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
                </SortableContext>
              </DndContext>
              <Button
                onClick={addMessage}
                variant="outline"
                className="w-full"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Message
              </Button>
            </AccordionContent>
          </AccordionItem>

          {/* Appearance */}
          <AccordionItem value="appearance" className="border-b px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                <span>Appearance</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              {/* View Toggle */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">VIEW</Label>
                <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                  <button
                    onClick={() => setMobileView(false)}
                    className={cn(
                      'flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                      !mobileView
                        ? 'bg-background shadow-sm'
                        : 'text-muted-foreground'
                    )}
                  >
                    Desktop
                  </button>
                  <button
                    onClick={() => setMobileView(true)}
                    className={cn(
                      'flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                      mobileView
                        ? 'bg-background shadow-sm'
                        : 'text-muted-foreground'
                    )}
                  >
                    Mobile
                  </button>
                </div>
              </div>

              {/* General Settings */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground">GENERAL</Label>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Dark Mode</span>
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Transparent Background</span>
                  <Switch checked={transparentBg} onCheckedChange={setTransparentBg} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Time Format</span>
                  <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                    <button
                      onClick={() => setTimeFormat('12h')}
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium transition-colors',
                        timeFormat === '12h'
                          ? 'bg-background shadow-sm'
                          : 'text-muted-foreground'
                      )}
                    >
                      12h
                    </button>
                    <button
                      onClick={() => setTimeFormat('24h')}
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium transition-colors',
                        timeFormat === '24h'
                          ? 'bg-background shadow-sm'
                          : 'text-muted-foreground'
                      )}
                    >
                      24h
                    </button>
                  </div>
                </div>
              </div>

              {/* Reset Button */}
              {onReset && (
                <Button
                  onClick={onReset}
                  variant="outline"
                  size="sm"
                  className="w-full text-muted-foreground"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset to Defaults
                </Button>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* WhatsApp Settings - Only show when WhatsApp is selected */}
          {platform === 'whatsapp' && whatsappSettings && setWhatsAppSettings && (
            <AccordionItem value="whatsapp-settings" className="border-b px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  <span>WhatsApp</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <WhatsAppSettingsPanel
                  settings={whatsappSettings}
                  onChange={setWhatsAppSettings}
                  darkMode={darkMode}
                />
              </AccordionContent>
            </AccordionItem>
          )}

          {/* About */}
          <AccordionItem value="about" className="px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                <span>About</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground">
                FakeSocialMessage is a free tool to create realistic fake chat
                screenshots for social media platforms. Your changes are automatically
                saved to your browser.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
