export type Platform = 
  | 'whatsapp' 
  | 'imessage' 
  | 'instagram' 
  | 'messenger' 
  | 'telegram' 
  | 'discord' 
  | 'slack'
  | 'signal'
  | 'snapchat'
  | 'tiktok'
  | 'twitter'
  | 'linkedin'

// Supported languages
export type Language = 'en' | 'tr'

// Supported device types
export type DeviceType = 'ios' | 'android'

export const SUPPORTED_DEVICES: { code: DeviceType; name: string; icon: string }[] = [
  { code: 'ios', name: 'iOS', icon: '' },
  { code: 'android', name: 'Android', icon: '🤖' },
]

// Supported font families
export type FontFamily = 'sf-pro' | 'roboto' | 'inter' | 'open-sans' | 'system' | 'arial' | 'helvetica' | 'georgia' | 'times' | 'verdana' | 'tahoma' | 'trebuchet' | 'comic-sans'

export const SUPPORTED_FONTS: { code: FontFamily; name: string; style: string }[] = [
  { code: 'sf-pro', name: 'SF Pro (iOS)', style: '"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif' },
  { code: 'roboto', name: 'Roboto (Android)', style: '"Roboto", "Noto Sans", sans-serif' },
  { code: 'inter', name: 'Inter', style: '"Inter", sans-serif' },
  { code: 'open-sans', name: 'Open Sans', style: '"Open Sans", sans-serif' },
  { code: 'arial', name: 'Arial', style: 'Arial, sans-serif' },
  { code: 'helvetica', name: 'Helvetica', style: 'Helvetica, Arial, sans-serif' },
  { code: 'georgia', name: 'Georgia', style: 'Georgia, serif' },
  { code: 'times', name: 'Times New Roman', style: '"Times New Roman", Times, serif' },
  { code: 'verdana', name: 'Verdana', style: 'Verdana, Geneva, sans-serif' },
  { code: 'tahoma', name: 'Tahoma', style: 'Tahoma, Geneva, sans-serif' },
  { code: 'trebuchet', name: 'Trebuchet MS', style: '"Trebuchet MS", sans-serif' },
  { code: 'comic-sans', name: 'Comic Sans MS', style: '"Comic Sans MS", cursive, sans-serif' },
  { code: 'system', name: 'System Default', style: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
]

export const SUPPORTED_LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
]

export interface User {
  id: string
  name: string
  avatar: string | null
  color?: string // For group chat name colors
  phone?: string // For contact sharing
}

// WhatsApp specific message status
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read'

// Reply reference
export interface ReplyTo {
  id: string
  content: string
  userId: string
  userName: string
}

// Message type
export type MessageType = 'text' | 'image' | 'voice' | 'video' | 'document' | 'location' | 'contact'

// Voice message data
export interface VoiceMessageData {
  duration: number // in seconds
  waveform?: number[] // amplitude values for visualization
  isPlayed?: boolean
}

// Document message data
export interface DocumentData {
  fileName: string
  fileSize: string
  fileType: string // pdf, doc, xls, etc.
  pageCount?: number
}

// Video message data
export interface VideoData {
  duration: number // in seconds
  thumbnail?: string
}

// Location message data
export interface LocationData {
  latitude: number
  longitude: number
  name?: string // Location name (e.g., "Starbucks Coffee")
  address?: string // Full address
  isLive?: boolean // Live location sharing
  duration?: number // Live location duration in minutes
}

// Contact message data
export interface ContactData {
  name: string
  phone?: string
  email?: string
  avatar?: string
  organization?: string
}

export interface Message {
  id: string
  userId: string
  content: string
  timestamp: Date
  type: MessageType
  // Media
  imageUrl?: string
  imageThumbnail?: string
  // Voice message
  voiceData?: VoiceMessageData
  // Document
  documentData?: DocumentData
  // Video
  videoData?: VideoData
  // Location
  locationData?: LocationData
  // Contact
  contactData?: ContactData
  // WhatsApp specific
  status?: MessageStatus
  isForwarded?: boolean
  forwardCount?: number // "Forwarded many times" when > 4
  isStarred?: boolean
  replyTo?: ReplyTo
  reactions?: MessageReaction[]
  // Group chat specific
  senderId?: string        // Which participant sent the message
  senderName?: string      // Participant name (for quick access)
  senderColor?: string     // Participant color
  isSystemMessage?: boolean
  systemMessageType?: SystemMessageType
  systemMessageData?: {    // For system messages like "X added Y"
    actorName?: string
    targetName?: string
    newValue?: string      // For name/description changes
  }
  mentions?: string[]      // Array of participant IDs mentioned (@mention)
}

// Emoji reaction
export interface MessageReaction {
  emoji: string
  count: number
  fromMe?: boolean
}

// System message types for group chat
export type SystemMessageType = 
  | 'created'
  | 'joined'
  | 'left'
  | 'removed'
  | 'changed_name'
  | 'changed_icon'
  | 'changed_description'

// Group chat participant
export interface GroupParticipant {
  id: string
  name: string
  phone?: string
  avatar?: string
  isAdmin?: boolean
  color: string
}

// Group chat settings
export interface GroupChatSettings {
  isGroupChat: boolean
  groupName: string
  groupIcon?: string
  groupDescription?: string
  participants: GroupParticipant[]
  createdBy?: string
  createdAt?: string
}

export interface ChatSettings {
  platform: Platform
  sender: User
  receiver: User
  messages: Message[]
  darkMode: boolean
  mobileView: boolean
  timeFormat: '12h' | '24h'
  transparentBg: boolean
  conversationType: 'direct-message' | 'group-chat'
}

// Background type for WhatsApp
export type WhatsAppBackgroundType = 'solid' | 'image' | 'doodle'

// WhatsApp specific settings
export interface WhatsAppSettings {
  // Background
  backgroundType: WhatsAppBackgroundType
  backgroundColor: string
  backgroundImage?: string
  // Doodle pattern (only for 'doodle' type)
  showDoodle: boolean
  doodleOpacity: number
  wallpaperColor: string
  // Other settings
  showEncryptionNotice: boolean
  lastSeen: 'online' | 'typing' | 'last-seen' | 'none'
  lastSeenTime?: Date
  // Group chat
  groupName?: string
  groupParticipants?: User[]
}

export interface PlatformConfig {
  id: Platform
  name: string
  icon: string
  primaryColor: string
  secondaryColor: string
  sentBubbleColor: string
  receivedBubbleColor: string
  sentTextColor: string
  receivedTextColor: string
}

// Available reactions for WhatsApp
export const WHATSAPP_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

// Emoji categories for picker
export const EMOJI_CATEGORIES = {
  smileys: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐'],
  gestures: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶'],
  hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️'],
  objects: ['🎁', '🎈', '🎉', '🎊', '🎂', '🍰', '☕', '🍺', '🍻', '🥂', '🍷', '🍸', '🍹', '🧃', '📱', '💻', '⌨️', '🖥️', '🖨️', '📷', '📸', '📹', '🎥', '📞', '☎️', '📺', '📻', '🎵', '🎶', '🎤', '🎧', '🎸', '🎹', '🎺', '🎻', '🥁', '📚', '📖', '📝', '✏️', '🖊️', '🖋️', '✒️', '📌', '📍', '🔍', '🔎'],
  nature: ['🌸', '💐', '🌷', '🌹', '🥀', '🌺', '🌻', '🌼', '🌱', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🍄', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗'],
  food: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪'],
  travel: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛹', '🛼', '🚁', '🛸', '✈️', '🛩️', '🛫', '🛬', '🚀', '🛶', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '🗼', '🗽', '🗿', '🏰', '🏯', '🏟️', '🎡', '🎢', '🎠', '⛲', '⛱️', '🏖️', '🏝️', '🏜️', '🌋', '⛰️', '🏔️', '🗻', '🏕️', '⛺', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏗️', '🧱'],
  symbols: ['❤️', '💔', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '🔥', '✨', '🌟', '💫', '⭐', '🌈', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '🌪️', '🌫️', '🌊', '💧', '💦', '☔', '☂️', '🌂', '⚡', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '🟤', '⚫', '⚪', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫', '⬛', '⬜', '◼️', '◻️', '◾', '◽', '▪️', '▫️', '🔶', '🔷', '🔸', '🔹', '🔺', '🔻', '💠', '🔘', '🔳', '🔲', '✅', '❌', '❎', '➕', '➖', '➗', '✖️', '♾️', '💲', '💱', '™️', '©️', '®️', '〰️', '➰', '➿', '🔚', '🔙', '🔛', '🔝', '🔜', '✔️', '☑️', '🔘', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤'],
}

// Frequently used emojis
export const FREQUENT_EMOJIS = ['😀', '😂', '❤️', '👍', '🔥', '✨', '🎉', '💯', '🙏', '😍', '🥰', '😊', '🤔', '👏', '💪', '🙌']

// WhatsApp preset background colors - Light mode
export const WHATSAPP_BG_COLORS_LIGHT = [
  '#EFEFE4', // Default beige
  '#E2D6C8', // Light brown
  '#D5E8D4', // Light green
  '#DAE8FC', // Light blue
  '#F5E6D3', // Peach
  '#E6E0F8', // Light purple
  '#FFE6E6', // Light pink
  '#E8E8E8', // Light gray
  '#FFF9E6', // Light yellow
  '#E0F2F1', // Teal
]

// WhatsApp preset background colors - Dark mode
export const WHATSAPP_BG_COLORS_DARK = [
  '#0B141A', // Default dark
  '#1F2C34', // Dark gray
  '#122229', // Dark teal
  '#1A1D21', // Dark slate
  '#1E1E1E', // Pure dark
  '#172027', // Dark blue
  '#1A1512', // Dark brown
  '#141A1F', // Midnight
  '#0D1418', // Darker
  '#111B21', // WhatsApp dark
]

// Combined for backward compatibility
export const WHATSAPP_BG_COLORS = [
  ...WHATSAPP_BG_COLORS_LIGHT,
  ...WHATSAPP_BG_COLORS_DARK.slice(0, 2),
]

// WhatsApp preset background images
export const WHATSAPP_BG_IMAGES = [
  'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=800&fit=crop', // Gradient
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=800&fit=crop', // Colorful
  'https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=400&h=800&fit=crop', // Abstract
  'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=400&h=800&fit=crop', // Nature
  'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=800&fit=crop', // Ocean
  'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=400&h=800&fit=crop', // Dark gradient
]

// Group chat name colors
export const GROUP_CHAT_COLORS = [
  '#25D366', // WhatsApp green
  '#34B7F1', // Blue
  '#FF6B6B', // Red/coral
  '#9B59B6', // Purple
  '#F39C12', // Orange
  '#1ABC9C', // Teal
  '#E91E63', // Pink
  '#3498DB', // Sky blue
]

// Default group participants (4 people) - with international names
// Note: 'sender-1' is the current user (matches defaultSender.id in use-chat-state.ts)
export const DEFAULT_GROUP_PARTICIPANTS: GroupParticipant[] = [
  { id: 'sender-1', name: 'You', isAdmin: true, color: GROUP_CHAT_COLORS[0] },
  { id: 'p1', name: 'Emma', isAdmin: false, color: GROUP_CHAT_COLORS[1] },
  { id: 'p2', name: 'James', isAdmin: false, color: GROUP_CHAT_COLORS[2] },
  { id: 'p3', name: 'Sophie', isAdmin: false, color: GROUP_CHAT_COLORS[3] },
]

// Default group settings
export const DEFAULT_GROUP_SETTINGS: GroupChatSettings = {
  isGroupChat: false,
  groupName: 'Weekend Plans 🎉',
  groupIcon: undefined,
  groupDescription: '',
  participants: DEFAULT_GROUP_PARTICIPANTS,
  createdBy: 'sender-1',
}

// Preset group icons
export const PRESET_GROUP_ICONS = [
  '👨‍👩‍👧‍👦', // Family
  '👥',      // Group
  '💼',      // Work
  '🎉',      // Party
  '⚽',      // Sports
  '🎮',      // Gaming
  '📚',      // Study
  '🎵',      // Music
  '✈️',      // Travel
  '🍕',      // Food
  '❤️',      // Love
  '🏠',      // Home
]

// Preset locations for quick selection
export const PRESET_LOCATIONS = [
  { name: 'Times Square', address: 'Manhattan, NY 10036, USA', latitude: 40.758896, longitude: -73.985130 },
  { name: 'Eiffel Tower', address: 'Champ de Mars, 75007 Paris, France', latitude: 48.858844, longitude: 2.294351 },
  { name: 'Big Ben', address: 'Westminster, London SW1A 0AA, UK', latitude: 51.500729, longitude: -0.124625 },
  { name: 'Colosseum', address: 'Piazza del Colosseo, 00184 Roma, Italy', latitude: 41.890251, longitude: 12.492373 },
  { name: 'Sydney Opera House', address: 'Bennelong Point, Sydney NSW 2000, Australia', latitude: -33.856784, longitude: 151.215297 },
  { name: 'Tokyo Tower', address: '4-2-8 Shibakoen, Minato, Tokyo, Japan', latitude: 35.658581, longitude: 139.745438 },
]
