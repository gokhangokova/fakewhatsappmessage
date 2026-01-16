'use client'

import { useState, useRef, useEffect } from 'react'
import { Platform, Message, User, MessageStatus, ReplyTo, MessageReaction, Language } from '@/types'
import { useTranslations } from '@/lib/i18n/translations'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

interface EditorSidebarProps {
  platform: Platform
  sender: User
  setSender: (user: User) => void
  receiver: User
  setReceiver: (user: User) => void
  messages: Message[]
  setMessages: (messages: Message[]) => void
  language: Language
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

  const isSent = message.userId === sender.id
  const isWhatsApp = platform === 'whatsapp'
  
  const handleBlur = () => {
    if (localContent !== message.content) {
      onUpdateContent(localContent)
    }
  }

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

export function EditorSidebar({
  platform,
  sender,
  setSender,
  receiver,
  setReceiver,
  messages,
  setMessages,
  language,
}: EditorSidebarProps) {
  const t = useTranslations(language)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollPositionRef = useRef(0)
  
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
    <div className="fixed left-4 top-20 z-50 w-80">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-[#d4f5e2] flex items-center justify-center">
            <Edit3 className="w-5 h-5 text-[#128C7E]" />
          </div>
          <span className="font-semibold text-gray-800 text-lg">{t.common.editor}</span>
        </div>

        {/* Content */}
        <div ref={scrollContainerRef} className="p-3 space-y-2 max-h-[calc(100vh-180px)] overflow-y-auto">
          {/* People Section */}
          <CollapsibleSection
            title={t.editor.people}
            icon={Users}
            defaultOpen={false}
          >
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
        </div>
      </div>
    </div>
  )
}
