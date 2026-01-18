'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Platform, Message, User, WhatsAppSettings, MessageStatus, ReplyTo, MessageReaction, Language, FontFamily, DeviceType, GroupChatSettings, DEFAULT_GROUP_SETTINGS, GroupParticipant } from '@/types'
import { generateId } from '@/lib/utils'

// Storage key
const STORAGE_KEY = 'fake-social-chat-state'

// Default values
const baseTime = new Date('2024-01-15T09:41:00')

const defaultSender: User = {
  id: 'sender-1',
  name: 'John',
  avatar: null,
}

const defaultReceiver: User = {
  id: 'receiver-1',
  name: 'Martha Craig',
  avatar: null,
}

const defaultMessages: Message[] = [
  {
    id: 'msg-default-1',
    userId: 'sender-1',
    content: 'Good morning!',
    timestamp: new Date(baseTime.getTime()),
    type: 'text',
    status: 'read',
  },
  {
    id: 'msg-default-2',
    userId: 'sender-1',
    content: 'Japan looks amazing!',
    timestamp: new Date(baseTime.getTime() + 60000),
    type: 'text',
    status: 'read',
  },
  {
    id: 'msg-default-3',
    userId: 'receiver-1',
    content: 'Do you know what time is it?',
    timestamp: new Date(baseTime.getTime() + 120000),
    type: 'text',
  },
  {
    id: 'msg-default-4',
    userId: 'sender-1',
    content: "It's morning in Tokyo 😎",
    timestamp: new Date(baseTime.getTime() + 180000),
    type: 'text',
    status: 'read',
  },
  {
    id: 'msg-default-5',
    userId: 'receiver-1',
    content: 'What is the most popular meal in Japan?',
    timestamp: new Date(baseTime.getTime() + 240000),
    type: 'text',
  },
]

const defaultGroupMessages: Message[] = [
  {
    id: 'grp-msg-1',
    userId: 'p1',
    senderId: 'p1',
    senderName: 'Emma',
    senderColor: '#34B7F1',
    content: 'Hey everyone! What\'s the plan for Saturday? 🎉',
    timestamp: new Date(baseTime.getTime()),
    type: 'text',
  },
  {
    id: 'grp-msg-2',
    userId: 'p2',
    senderId: 'p2',
    senderName: 'James',
    senderColor: '#FF6B6B',
    content: 'I was thinking we could go hiking 🥾',
    timestamp: new Date(baseTime.getTime() + 60000),
    type: 'text',
  },
  {
    id: 'grp-msg-3',
    userId: 'p3',
    senderId: 'p3',
    senderName: 'Sophie',
    senderColor: '#9B59B6',
    content: 'Sounds fun! What time should we meet?',
    timestamp: new Date(baseTime.getTime() + 120000),
    type: 'text',
  },
  {
    id: 'grp-msg-4',
    userId: 'sender-1',
    senderId: 'sender-1',
    senderName: 'You',
    senderColor: '#25D366',
    content: 'How about 9am at the park entrance?',
    timestamp: new Date(baseTime.getTime() + 180000),
    type: 'text',
    status: 'read',
  },
  {
    id: 'grp-msg-5',
    userId: 'p1',
    senderId: 'p1',
    senderName: 'Emma',
    senderColor: '#34B7F1',
    content: 'Perfect! I\'ll bring snacks 🍪',
    timestamp: new Date(baseTime.getTime() + 240000),
    type: 'text',
  },
  {
    id: 'grp-msg-6',
    userId: 'p2',
    senderId: 'p2',
    senderName: 'James',
    senderColor: '#FF6B6B',
    content: 'Count me in 👍',
    timestamp: new Date(baseTime.getTime() + 300000),
    type: 'text',
  },
]

const defaultWhatsAppSettings: WhatsAppSettings = {
  backgroundType: 'doodle',
  backgroundColor: '#EFEFE4',
  backgroundImage: undefined,
  showDoodle: true,
  doodleOpacity: 0.06,
  wallpaperColor: '#EFEFE4',
  showEncryptionNotice: true,
  lastSeen: 'online',
  lastSeenTime: new Date(baseTime.getTime()),
}

// ============= MESSAGES CONTEXT =============
interface MessagesContextType {
  messages: Message[]
  setMessages: (messages: Message[]) => void
  addMessage: () => string
  updateMessage: (id: string, updates: Partial<Message>) => void
  updateMessageStatus: (id: string, status: MessageStatus) => void
  updateMessageForwarded: (id: string, isForwarded: boolean) => void
  updateMessageReplyTo: (id: string, replyTo?: ReplyTo) => void
  updateMessageReactions: (id: string, reactions: MessageReaction[]) => void
  updateMessageImage: (id: string, imageUrl?: string) => void
  deleteMessage: (id: string) => void
  reorderMessages: (fromIndex: number, toIndex: number) => void
}

const MessagesContext = createContext<MessagesContextType | null>(null)

export function useMessages() {
  const context = useContext(MessagesContext)
  if (!context) throw new Error('useMessages must be used within ChatProvider')
  return context
}

// ============= USERS CONTEXT =============
interface UsersContextType {
  sender: User
  receiver: User
  setSender: (sender: User) => void
  setReceiver: (receiver: User) => void
  groupSettings: GroupChatSettings
  setGroupSettings: (settings: Partial<GroupChatSettings>) => void
  toggleGroupChat: (isGroupChat: boolean) => void
  addParticipant: (participant: GroupParticipant) => void
  removeParticipant: (participantId: string) => void
  updateParticipant: (participantId: string, updates: Partial<GroupParticipant>) => void
}

const UsersContext = createContext<UsersContextType | null>(null)

export function useUsers() {
  const context = useContext(UsersContext)
  if (!context) throw new Error('useUsers must be used within ChatProvider')
  return context
}

// ============= APPEARANCE CONTEXT =============
interface AppearanceContextType {
  darkMode: boolean
  mobileView: boolean
  timeFormat: '12h' | '24h'
  transparentBg: boolean
  fontFamily: FontFamily
  deviceType: DeviceType
  setDarkMode: (darkMode: boolean) => void
  setMobileView: (mobileView: boolean) => void
  setTimeFormat: (timeFormat: '12h' | '24h') => void
  setTransparentBg: (transparentBg: boolean) => void
  setFontFamily: (fontFamily: FontFamily) => void
  setDeviceType: (deviceType: DeviceType) => void
}

const AppearanceContext = createContext<AppearanceContextType | null>(null)

export function useAppearance() {
  const context = useContext(AppearanceContext)
  if (!context) throw new Error('useAppearance must be used within ChatProvider')
  return context
}

// ============= SETTINGS CONTEXT =============
interface SettingsContextType {
  platform: Platform
  language: Language
  batteryLevel: number
  whatsappSettings: WhatsAppSettings
  setPlatform: (platform: Platform) => void
  setLanguage: (language: Language) => void
  setBatteryLevel: (batteryLevel: number) => void
  setWhatsAppSettings: (settings: Partial<WhatsAppSettings>) => void
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) throw new Error('useSettings must be used within ChatProvider')
  return context
}

// ============= HYDRATION CONTEXT =============
interface HydrationContextType {
  isHydrated: boolean
  resetToDefaults: () => void
}

const HydrationContext = createContext<HydrationContextType | null>(null)

export function useHydration() {
  const context = useContext(HydrationContext)
  if (!context) throw new Error('useHydration must be used within ChatProvider')
  return context
}

// ============= FULL STATE TYPE =============
interface ChatState {
  platform: Platform
  sender: User
  receiver: User
  messages: Message[]
  darkMode: boolean
  mobileView: boolean
  timeFormat: '12h' | '24h'
  transparentBg: boolean
  whatsappSettings: WhatsAppSettings
  language: Language
  fontFamily: FontFamily
  batteryLevel: number
  deviceType: DeviceType
  groupSettings: GroupChatSettings
}

const defaultState: ChatState = {
  platform: 'whatsapp',
  sender: defaultSender,
  receiver: defaultReceiver,
  messages: defaultMessages,
  darkMode: false,
  mobileView: true,
  timeFormat: '24h',
  transparentBg: false,
  whatsappSettings: defaultWhatsAppSettings,
  language: 'en',
  fontFamily: 'sf-pro',
  batteryLevel: 100,
  deviceType: 'ios',
  groupSettings: DEFAULT_GROUP_SETTINGS,
}

// ============= CHAT PROVIDER =============
interface ChatProviderProps {
  children: React.ReactNode
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false)

  // Individual state pieces
  const [messages, setMessagesState] = useState<Message[]>(defaultState.messages)
  const [sender, setSenderState] = useState<User>(defaultState.sender)
  const [receiver, setReceiverState] = useState<User>(defaultState.receiver)
  const [groupSettings, setGroupSettingsState] = useState<GroupChatSettings>(defaultState.groupSettings)
  const [darkMode, setDarkModeState] = useState(defaultState.darkMode)
  const [mobileView, setMobileViewState] = useState(defaultState.mobileView)
  const [timeFormat, setTimeFormatState] = useState<'12h' | '24h'>(defaultState.timeFormat)
  const [transparentBg, setTransparentBgState] = useState(defaultState.transparentBg)
  const [fontFamily, setFontFamilyState] = useState<FontFamily>(defaultState.fontFamily)
  const [deviceType, setDeviceTypeState] = useState<DeviceType>(defaultState.deviceType)
  const [platform, setPlatformState] = useState<Platform>(defaultState.platform)
  const [language, setLanguageState] = useState<Language>(defaultState.language)
  const [batteryLevel, setBatteryLevelState] = useState(defaultState.batteryLevel)
  const [whatsappSettings, setWhatsappSettingsState] = useState<WhatsAppSettings>(defaultState.whatsappSettings)

  // Debounce ref for localStorage
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: ChatState = JSON.parse(stored)

        // Convert date strings to Date objects
        const messagesWithDates = parsed.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))

        setMessagesState(messagesWithDates)
        setSenderState(parsed.sender)
        setReceiverState(parsed.receiver)
        setGroupSettingsState(parsed.groupSettings || DEFAULT_GROUP_SETTINGS)
        setDarkModeState(parsed.darkMode)
        setMobileViewState(parsed.mobileView)
        setTimeFormatState(parsed.timeFormat)
        setTransparentBgState(parsed.transparentBg)
        setFontFamilyState(parsed.fontFamily)
        setDeviceTypeState(parsed.deviceType)
        setPlatformState(parsed.platform)
        setLanguageState(parsed.language)
        setBatteryLevelState(parsed.batteryLevel)
        setWhatsappSettingsState(parsed.whatsappSettings)
      }
    } catch (error) {
      console.warn('Error loading from localStorage:', error)
    }
    setIsHydrated(true)
  }, [])

  // Save to localStorage with debounce (batching writes)
  const saveToStorage = useCallback(() => {
    if (!isHydrated) return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      const state: ChatState = {
        platform,
        sender,
        receiver,
        messages,
        darkMode,
        mobileView,
        timeFormat,
        transparentBg,
        whatsappSettings,
        language,
        fontFamily,
        batteryLevel,
        deviceType,
        groupSettings,
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }, 500) // 500ms debounce for batching multiple changes
  }, [isHydrated, platform, sender, receiver, messages, darkMode, mobileView, timeFormat, transparentBg, whatsappSettings, language, fontFamily, batteryLevel, deviceType, groupSettings])

  // Trigger save whenever state changes
  useEffect(() => {
    saveToStorage()
  }, [saveToStorage])

  // Save immediately on unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      const state: ChatState = {
        platform,
        sender,
        receiver,
        messages,
        darkMode,
        mobileView,
        timeFormat,
        transparentBg,
        whatsappSettings,
        language,
        fontFamily,
        batteryLevel,
        deviceType,
        groupSettings,
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [platform, sender, receiver, messages, darkMode, mobileView, timeFormat, transparentBg, whatsappSettings, language, fontFamily, batteryLevel, deviceType, groupSettings])

  // ============= MESSAGES ACTIONS =============
  const setMessages = useCallback((newMessages: Message[]) => {
    setMessagesState(newMessages)
  }, [])

  const addMessage = useCallback(() => {
    const newMessage: Message = {
      id: generateId(),
      userId: sender.id,
      content: '',
      timestamp: new Date(),
      type: 'text',
      status: 'read',
    }
    setMessagesState(prev => [...prev, newMessage])
    return newMessage.id
  }, [sender.id])

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessagesState(prev => prev.map(msg => msg.id === id ? { ...msg, ...updates } : msg))
  }, [])

  const updateMessageStatus = useCallback((id: string, status: MessageStatus) => {
    setMessagesState(prev => prev.map(msg => msg.id === id ? { ...msg, status } : msg))
  }, [])

  const updateMessageForwarded = useCallback((id: string, isForwarded: boolean) => {
    setMessagesState(prev => prev.map(msg => msg.id === id ? { ...msg, isForwarded } : msg))
  }, [])

  const updateMessageReplyTo = useCallback((id: string, replyTo?: ReplyTo) => {
    setMessagesState(prev => prev.map(msg => msg.id === id ? { ...msg, replyTo } : msg))
  }, [])

  const updateMessageReactions = useCallback((id: string, reactions: MessageReaction[]) => {
    setMessagesState(prev => prev.map(msg => msg.id === id ? { ...msg, reactions } : msg))
  }, [])

  const updateMessageImage = useCallback((id: string, imageUrl?: string) => {
    setMessagesState(prev => prev.map(msg => msg.id === id ? { ...msg, imageUrl, type: imageUrl ? 'image' : 'text' } : msg))
  }, [])

  const deleteMessage = useCallback((id: string) => {
    setMessagesState(prev => prev.filter(msg => msg.id !== id))
  }, [])

  const reorderMessages = useCallback((fromIndex: number, toIndex: number) => {
    setMessagesState(prev => {
      const newMessages = [...prev]
      const [removed] = newMessages.splice(fromIndex, 1)
      newMessages.splice(toIndex, 0, removed)
      return newMessages
    })
  }, [])

  // ============= USERS ACTIONS =============
  const setSender = useCallback((newSender: User) => {
    setSenderState(newSender)
  }, [])

  const setReceiver = useCallback((newReceiver: User) => {
    setReceiverState(newReceiver)
  }, [])

  const setGroupSettings = useCallback((settings: Partial<GroupChatSettings>) => {
    setGroupSettingsState(prev => ({ ...prev, ...settings }))
  }, [])

  const toggleGroupChat = useCallback((isGroupChat: boolean) => {
    setMessagesState(isGroupChat ? defaultGroupMessages : defaultMessages)
    setGroupSettingsState(prev => ({ ...prev, isGroupChat }))
  }, [])

  const addParticipant = useCallback((participant: GroupParticipant) => {
    setGroupSettingsState(prev => ({
      ...prev,
      participants: [...prev.participants, participant],
    }))
  }, [])

  const removeParticipant = useCallback((participantId: string) => {
    setGroupSettingsState(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p.id !== participantId),
    }))
  }, [])

  const updateParticipant = useCallback((participantId: string, updates: Partial<GroupParticipant>) => {
    setGroupSettingsState(prev => ({
      ...prev,
      participants: prev.participants.map(p => p.id === participantId ? { ...p, ...updates } : p),
    }))
  }, [])

  // ============= APPEARANCE ACTIONS =============
  const setDarkMode = useCallback((value: boolean) => {
    setDarkModeState(value)
  }, [])

  const setMobileView = useCallback((value: boolean) => {
    setMobileViewState(value)
  }, [])

  const setTimeFormat = useCallback((value: '12h' | '24h') => {
    setTimeFormatState(value)
  }, [])

  const setTransparentBg = useCallback((value: boolean) => {
    setTransparentBgState(value)
  }, [])

  const setFontFamily = useCallback((value: FontFamily) => {
    setFontFamilyState(value)
  }, [])

  const setDeviceType = useCallback((value: DeviceType) => {
    setDeviceTypeState(value)
    setFontFamilyState(value === 'android' ? 'roboto' : 'sf-pro')
  }, [])

  // ============= SETTINGS ACTIONS =============
  const setPlatform = useCallback((value: Platform) => {
    setPlatformState(value)
  }, [])

  const setLanguage = useCallback((value: Language) => {
    setLanguageState(value)
  }, [])

  const setBatteryLevel = useCallback((value: number) => {
    setBatteryLevelState(Math.min(100, Math.max(0, value)))
  }, [])

  const setWhatsAppSettings = useCallback((settings: Partial<WhatsAppSettings>) => {
    setWhatsappSettingsState(prev => ({ ...prev, ...settings }))
  }, [])

  // ============= RESET =============
  const resetToDefaults = useCallback(() => {
    setMessagesState(defaultState.messages)
    setSenderState(defaultState.sender)
    setReceiverState(defaultState.receiver)
    setGroupSettingsState(defaultState.groupSettings)
    setDarkModeState(defaultState.darkMode)
    setMobileViewState(defaultState.mobileView)
    setTimeFormatState(defaultState.timeFormat)
    setTransparentBgState(defaultState.transparentBg)
    setFontFamilyState(defaultState.fontFamily)
    setDeviceTypeState(defaultState.deviceType)
    setPlatformState(defaultState.platform)
    setLanguageState(defaultState.language)
    setBatteryLevelState(defaultState.batteryLevel)
    setWhatsappSettingsState(defaultState.whatsappSettings)
  }, [])

  // ============= MEMOIZED CONTEXT VALUES =============
  const messagesValue = useMemo<MessagesContextType>(() => ({
    messages,
    setMessages,
    addMessage,
    updateMessage,
    updateMessageStatus,
    updateMessageForwarded,
    updateMessageReplyTo,
    updateMessageReactions,
    updateMessageImage,
    deleteMessage,
    reorderMessages,
  }), [messages, setMessages, addMessage, updateMessage, updateMessageStatus, updateMessageForwarded, updateMessageReplyTo, updateMessageReactions, updateMessageImage, deleteMessage, reorderMessages])

  const usersValue = useMemo<UsersContextType>(() => ({
    sender,
    receiver,
    setSender,
    setReceiver,
    groupSettings,
    setGroupSettings,
    toggleGroupChat,
    addParticipant,
    removeParticipant,
    updateParticipant,
  }), [sender, receiver, setSender, setReceiver, groupSettings, setGroupSettings, toggleGroupChat, addParticipant, removeParticipant, updateParticipant])

  const appearanceValue = useMemo<AppearanceContextType>(() => ({
    darkMode,
    mobileView,
    timeFormat,
    transparentBg,
    fontFamily,
    deviceType,
    setDarkMode,
    setMobileView,
    setTimeFormat,
    setTransparentBg,
    setFontFamily,
    setDeviceType,
  }), [darkMode, mobileView, timeFormat, transparentBg, fontFamily, deviceType, setDarkMode, setMobileView, setTimeFormat, setTransparentBg, setFontFamily, setDeviceType])

  const settingsValue = useMemo<SettingsContextType>(() => ({
    platform,
    language,
    batteryLevel,
    whatsappSettings,
    setPlatform,
    setLanguage,
    setBatteryLevel,
    setWhatsAppSettings,
  }), [platform, language, batteryLevel, whatsappSettings, setPlatform, setLanguage, setBatteryLevel, setWhatsAppSettings])

  const hydrationValue = useMemo<HydrationContextType>(() => ({
    isHydrated,
    resetToDefaults,
  }), [isHydrated, resetToDefaults])

  return (
    <HydrationContext.Provider value={hydrationValue}>
      <SettingsContext.Provider value={settingsValue}>
        <AppearanceContext.Provider value={appearanceValue}>
          <UsersContext.Provider value={usersValue}>
            <MessagesContext.Provider value={messagesValue}>
              {children}
            </MessagesContext.Provider>
          </UsersContext.Provider>
        </AppearanceContext.Provider>
      </SettingsContext.Provider>
    </HydrationContext.Provider>
  )
}

// ============= COMBINED HOOK FOR BACKWARD COMPATIBILITY =============
export function useChatState() {
  const messagesCtx = useMessages()
  const usersCtx = useUsers()
  const appearanceCtx = useAppearance()
  const settingsCtx = useSettings()
  const hydrationCtx = useHydration()

  return {
    // Messages
    messages: messagesCtx.messages,
    setMessages: messagesCtx.setMessages,
    addMessage: messagesCtx.addMessage,
    updateMessage: messagesCtx.updateMessage,
    updateMessageStatus: messagesCtx.updateMessageStatus,
    updateMessageForwarded: messagesCtx.updateMessageForwarded,
    updateMessageReplyTo: messagesCtx.updateMessageReplyTo,
    updateMessageReactions: messagesCtx.updateMessageReactions,
    updateMessageImage: messagesCtx.updateMessageImage,
    deleteMessage: messagesCtx.deleteMessage,
    reorderMessages: messagesCtx.reorderMessages,
    // Users
    sender: usersCtx.sender,
    receiver: usersCtx.receiver,
    setSender: usersCtx.setSender,
    setReceiver: usersCtx.setReceiver,
    groupSettings: usersCtx.groupSettings,
    setGroupSettings: usersCtx.setGroupSettings,
    toggleGroupChat: usersCtx.toggleGroupChat,
    addParticipant: usersCtx.addParticipant,
    removeParticipant: usersCtx.removeParticipant,
    updateParticipant: usersCtx.updateParticipant,
    // Appearance
    darkMode: appearanceCtx.darkMode,
    mobileView: appearanceCtx.mobileView,
    timeFormat: appearanceCtx.timeFormat,
    transparentBg: appearanceCtx.transparentBg,
    fontFamily: appearanceCtx.fontFamily,
    deviceType: appearanceCtx.deviceType,
    setDarkMode: appearanceCtx.setDarkMode,
    setMobileView: appearanceCtx.setMobileView,
    setTimeFormat: appearanceCtx.setTimeFormat,
    setTransparentBg: appearanceCtx.setTransparentBg,
    setFontFamily: appearanceCtx.setFontFamily,
    setDeviceType: appearanceCtx.setDeviceType,
    // Settings
    platform: settingsCtx.platform,
    language: settingsCtx.language,
    batteryLevel: settingsCtx.batteryLevel,
    whatsappSettings: settingsCtx.whatsappSettings,
    setPlatform: settingsCtx.setPlatform,
    setLanguage: settingsCtx.setLanguage,
    setBatteryLevel: settingsCtx.setBatteryLevel,
    setWhatsAppSettings: settingsCtx.setWhatsAppSettings,
    // Hydration
    isHydrated: hydrationCtx.isHydrated,
    resetToDefaults: hydrationCtx.resetToDefaults,
  }
}
