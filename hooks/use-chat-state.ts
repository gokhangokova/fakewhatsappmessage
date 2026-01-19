'use client'

import { useState, useEffect, useCallback } from 'react'
import { Platform, Message, User, WhatsAppSettings, MessageStatus, ReplyTo, MessageReaction, Language, FontFamily, DeviceType, GroupChatSettings, DEFAULT_GROUP_SETTINGS, GroupParticipant } from '@/types'
import { useLocalStorage } from './use-local-storage'
import { generateId } from '@/lib/utils'

const STORAGE_KEY = 'fake-social-chat-state'

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

// Fixed timestamps to avoid hydration mismatch (9:41 AM is iOS default time)
const baseTime = new Date('2024-01-15T09:41:00')

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
    timestamp: new Date(baseTime.getTime() + 60000), // +1 min
    type: 'text',
    status: 'read',
  },
  {
    id: 'msg-default-3',
    userId: 'receiver-1',
    content: 'Do you know what time is it?',
    timestamp: new Date(baseTime.getTime() + 120000), // +2 min
    type: 'text',
  },
  {
    id: 'msg-default-4',
    userId: 'sender-1',
    content: "It's morning in Tokyo 😎",
    timestamp: new Date(baseTime.getTime() + 180000), // +3 min
    type: 'text',
    status: 'read',
  },
  {
    id: 'msg-default-5',
    userId: 'receiver-1',
    content: 'What is the most popular meal in Japan?',
    timestamp: new Date(baseTime.getTime() + 240000), // +4 min
    type: 'text',
  },
]

// Default group chat messages
const defaultGroupMessages: Message[] = [
  {
    id: 'grp-msg-1',
    userId: 'p1', // Emma
    senderId: 'p1',
    senderName: 'Emma',
    senderColor: '#34B7F1',
    content: 'Hey everyone! What\'s the plan for Saturday? 🎉',
    timestamp: new Date(baseTime.getTime()),
    type: 'text',
  },
  {
    id: 'grp-msg-2',
    userId: 'p2', // James
    senderId: 'p2',
    senderName: 'James',
    senderColor: '#FF6B6B',
    content: 'I was thinking we could go hiking 🥾',
    timestamp: new Date(baseTime.getTime() + 60000),
    type: 'text',
  },
  {
    id: 'grp-msg-3',
    userId: 'p3', // Sophie
    senderId: 'p3',
    senderName: 'Sophie',
    senderColor: '#9B59B6',
    content: 'Sounds fun! What time should we meet?',
    timestamp: new Date(baseTime.getTime() + 120000),
    type: 'text',
  },
  {
    id: 'grp-msg-4',
    userId: 'sender-1', // You (matches sender.id)
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
    userId: 'p1', // Emma
    senderId: 'p1',
    senderName: 'Emma',
    senderColor: '#34B7F1',
    content: 'Perfect! I\'ll bring snacks 🍪',
    timestamp: new Date(baseTime.getTime() + 240000),
    type: 'text',
  },
  {
    id: 'grp-msg-6',
    userId: 'p2', // James  
    senderId: 'p2',
    senderName: 'James',
    senderColor: '#FF6B6B',
    content: 'Count me in 👍',
    timestamp: new Date(baseTime.getTime() + 300000),
    type: 'text',
  },
]

const defaultWhatsAppSettings: WhatsAppSettings = {
  // Background
  backgroundType: 'doodle',
  backgroundColor: '#EFEFE4',
  backgroundImage: undefined,
  // Doodle
  showDoodle: true,
  doodleOpacity: 0.06,
  wallpaperColor: '#EFEFE4',
  // Other
  showEncryptionNotice: true,
  lastSeen: 'online',
  lastSeenTime: new Date(baseTime.getTime()), // Use fixed time to avoid hydration mismatch
}

// Session data for each chat type (1-1 and group)
interface ChatSessionData {
  sender: User
  receiver: User
  messages: Message[]
  groupSettings: GroupChatSettings
}

interface ChatState {
  platform: Platform
  darkMode: boolean
  mobileView: boolean
  timeFormat: '12h' | '24h'
  transparentBg: boolean
  whatsappSettings: WhatsAppSettings
  language: Language
  fontFamily: FontFamily
  batteryLevel: number
  deviceType: DeviceType
  mobilePreviewScale: number
  // Active chat type
  isGroupChat: boolean
  // Separate sessions for 1-1 and group chat
  directChatSession: ChatSessionData
  groupChatSession: ChatSessionData
}

// Default session for 1-1 chat
const defaultDirectChatSession: ChatSessionData = {
  sender: defaultSender,
  receiver: defaultReceiver,
  messages: defaultMessages,
  groupSettings: { ...DEFAULT_GROUP_SETTINGS, isGroupChat: false },
}

// Default session for group chat
const defaultGroupChatSession: ChatSessionData = {
  sender: defaultSender,
  receiver: defaultReceiver,
  messages: defaultGroupMessages,
  groupSettings: { ...DEFAULT_GROUP_SETTINGS, isGroupChat: true },
}

const defaultState: ChatState = {
  platform: 'whatsapp',
  darkMode: false,
  mobileView: true,
  timeFormat: '24h', // WhatsApp iOS uses 24h format
  transparentBg: false,
  whatsappSettings: defaultWhatsAppSettings,
  language: 'en',
  fontFamily: 'sf-pro',
  batteryLevel: 100,
  deviceType: 'ios',
  mobilePreviewScale: 50,
  isGroupChat: false,
  directChatSession: defaultDirectChatSession,
  groupChatSession: defaultGroupChatSession,
}

export function useChatState() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [state, setState] = useLocalStorage<ChatState>(STORAGE_KEY, defaultState)

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Get active session based on chat type
  const getActiveSession = useCallback((s: ChatState): ChatSessionData => {
    return s.isGroupChat ? s.groupChatSession : s.directChatSession
  }, [])

  // Update active session
  const updateActiveSession = useCallback((updates: Partial<ChatSessionData>) => {
    setState((prev) => {
      const sessionKey = prev.isGroupChat ? 'groupChatSession' : 'directChatSession'
      return {
        ...prev,
        [sessionKey]: {
          ...prev[sessionKey],
          ...updates,
        },
      }
    })
  }, [setState])

  // Convert stored date strings back to Date objects and migrate old state structure
  useEffect(() => {
    if (isHydrated) {
      // Check if we need to migrate from old state structure
      const needsMigration = !state.directChatSession || !state.groupChatSession

      if (needsMigration) {
        // Migrate from old structure to new session-based structure
        const oldMessages = (state as unknown as { messages?: Message[] }).messages || defaultMessages
        const oldSender = (state as unknown as { sender?: User }).sender || defaultSender
        const oldReceiver = (state as unknown as { receiver?: User }).receiver || defaultReceiver
        const oldGroupSettings = (state as unknown as { groupSettings?: GroupChatSettings }).groupSettings || DEFAULT_GROUP_SETTINGS

        setState((prev) => ({
          ...prev,
          isGroupChat: oldGroupSettings.isGroupChat || false,
          directChatSession: {
            sender: oldSender,
            receiver: oldReceiver,
            messages: oldGroupSettings.isGroupChat ? defaultMessages : oldMessages,
            groupSettings: { ...DEFAULT_GROUP_SETTINGS, isGroupChat: false },
          },
          groupChatSession: {
            sender: oldSender,
            receiver: oldReceiver,
            messages: oldGroupSettings.isGroupChat ? oldMessages : defaultGroupMessages,
            groupSettings: oldGroupSettings.isGroupChat ? oldGroupSettings : { ...DEFAULT_GROUP_SETTINGS, isGroupChat: true },
          },
        }))
        return
      }

      // Convert date strings in both sessions
      const directHasStringDates = state.directChatSession?.messages?.some(
        (msg) => typeof msg.timestamp === 'string'
      )
      const groupHasStringDates = state.groupChatSession?.messages?.some(
        (msg) => typeof msg.timestamp === 'string'
      )

      if (directHasStringDates || groupHasStringDates) {
        setState((prev) => ({
          ...prev,
          directChatSession: {
            ...prev.directChatSession,
            messages: prev.directChatSession.messages.map((msg) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          },
          groupChatSession: {
            ...prev.groupChatSession,
            messages: prev.groupChatSession.messages.map((msg) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          },
        }))
      }
    }
  }, [isHydrated])

  // Platform
  const setPlatform = useCallback((platform: Platform) => {
    setState((prev) => ({ ...prev, platform }))
  }, [setState])

  // Sender - updates active session
  const setSender = useCallback((sender: User) => {
    setState((prev) => {
      const sessionKey = prev.isGroupChat ? 'groupChatSession' : 'directChatSession'
      return {
        ...prev,
        [sessionKey]: {
          ...prev[sessionKey],
          sender,
        },
      }
    })
  }, [setState])

  // Receiver - updates active session
  const setReceiver = useCallback((receiver: User) => {
    setState((prev) => {
      const sessionKey = prev.isGroupChat ? 'groupChatSession' : 'directChatSession'
      return {
        ...prev,
        [sessionKey]: {
          ...prev[sessionKey],
          receiver,
        },
      }
    })
  }, [setState])

  // Messages - updates active session
  const setMessages = useCallback((messages: Message[]) => {
    setState((prev) => {
      const sessionKey = prev.isGroupChat ? 'groupChatSession' : 'directChatSession'
      return {
        ...prev,
        [sessionKey]: {
          ...prev[sessionKey],
          messages,
        },
      }
    })
  }, [setState])

  // Get current sender from active session
  const currentSender = state.isGroupChat
    ? state.groupChatSession?.sender
    : state.directChatSession?.sender

  const addMessage = useCallback(() => {
    const senderId = currentSender?.id || 'sender-1'
    const newMessage: Message = {
      id: generateId(),
      userId: senderId,
      content: '',
      timestamp: new Date(),
      type: 'text',
      status: 'read',
    }
    setState((prev) => {
      const sessionKey = prev.isGroupChat ? 'groupChatSession' : 'directChatSession'
      return {
        ...prev,
        [sessionKey]: {
          ...prev[sessionKey],
          messages: [...prev[sessionKey].messages, newMessage],
        },
      }
    })
    return newMessage.id
  }, [currentSender?.id, setState])

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setState((prev) => {
      const sessionKey = prev.isGroupChat ? 'groupChatSession' : 'directChatSession'
      return {
        ...prev,
        [sessionKey]: {
          ...prev[sessionKey],
          messages: prev[sessionKey].messages.map((msg) =>
            msg.id === id ? { ...msg, ...updates } : msg
          ),
        },
      }
    })
  }, [setState])

  const updateMessageStatus = useCallback((id: string, status: MessageStatus) => {
    setState((prev) => {
      const sessionKey = prev.isGroupChat ? 'groupChatSession' : 'directChatSession'
      return {
        ...prev,
        [sessionKey]: {
          ...prev[sessionKey],
          messages: prev[sessionKey].messages.map((msg) =>
            msg.id === id ? { ...msg, status } : msg
          ),
        },
      }
    })
  }, [setState])

  const updateMessageForwarded = useCallback((id: string, isForwarded: boolean) => {
    setState((prev) => {
      const sessionKey = prev.isGroupChat ? 'groupChatSession' : 'directChatSession'
      return {
        ...prev,
        [sessionKey]: {
          ...prev[sessionKey],
          messages: prev[sessionKey].messages.map((msg) =>
            msg.id === id ? { ...msg, isForwarded } : msg
          ),
        },
      }
    })
  }, [setState])

  const updateMessageReplyTo = useCallback((id: string, replyTo?: ReplyTo) => {
    setState((prev) => {
      const sessionKey = prev.isGroupChat ? 'groupChatSession' : 'directChatSession'
      return {
        ...prev,
        [sessionKey]: {
          ...prev[sessionKey],
          messages: prev[sessionKey].messages.map((msg) =>
            msg.id === id ? { ...msg, replyTo } : msg
          ),
        },
      }
    })
  }, [setState])

  const updateMessageReactions = useCallback((id: string, reactions: MessageReaction[]) => {
    setState((prev) => {
      const sessionKey = prev.isGroupChat ? 'groupChatSession' : 'directChatSession'
      return {
        ...prev,
        [sessionKey]: {
          ...prev[sessionKey],
          messages: prev[sessionKey].messages.map((msg) =>
            msg.id === id ? { ...msg, reactions } : msg
          ),
        },
      }
    })
  }, [setState])

  const updateMessageImage = useCallback((id: string, imageUrl?: string) => {
    setState((prev) => {
      const sessionKey = prev.isGroupChat ? 'groupChatSession' : 'directChatSession'
      return {
        ...prev,
        [sessionKey]: {
          ...prev[sessionKey],
          messages: prev[sessionKey].messages.map((msg) =>
            msg.id === id ? { ...msg, imageUrl, type: imageUrl ? 'image' : 'text' } : msg
          ),
        },
      }
    })
  }, [setState])

  const deleteMessage = useCallback((id: string) => {
    setState((prev) => {
      const sessionKey = prev.isGroupChat ? 'groupChatSession' : 'directChatSession'
      return {
        ...prev,
        [sessionKey]: {
          ...prev[sessionKey],
          messages: prev[sessionKey].messages.filter((msg) => msg.id !== id),
        },
      }
    })
  }, [setState])

  const reorderMessages = useCallback((fromIndex: number, toIndex: number) => {
    setState((prev) => {
      const sessionKey = prev.isGroupChat ? 'groupChatSession' : 'directChatSession'
      const newMessages = [...prev[sessionKey].messages]
      const [removed] = newMessages.splice(fromIndex, 1)
      newMessages.splice(toIndex, 0, removed)
      return {
        ...prev,
        [sessionKey]: {
          ...prev[sessionKey],
          messages: newMessages,
        },
      }
    })
  }, [setState])

  // Appearance
  const setDarkMode = useCallback((darkMode: boolean) => {
    setState((prev) => ({ ...prev, darkMode }))
  }, [setState])

  const setMobileView = useCallback((mobileView: boolean) => {
    setState((prev) => ({ ...prev, mobileView }))
  }, [setState])

  const setTimeFormat = useCallback((timeFormat: '12h' | '24h') => {
    setState((prev) => ({ ...prev, timeFormat }))
  }, [setState])

  const setTransparentBg = useCallback((transparentBg: boolean) => {
    setState((prev) => ({ ...prev, transparentBg }))
  }, [setState])

  // WhatsApp Settings
  const setWhatsAppSettings = useCallback((settings: Partial<WhatsAppSettings>) => {
    setState((prev) => ({
      ...prev,
      whatsappSettings: { ...prev.whatsappSettings, ...settings },
    }))
  }, [setState])

  // Language
  const setLanguage = useCallback((language: Language) => {
    setState((prev) => ({ ...prev, language }))
  }, [setState])

  // Font Family
  const setFontFamily = useCallback((fontFamily: FontFamily) => {
    setState((prev) => ({ ...prev, fontFamily }))
  }, [setState])

  // Battery Level
  const setBatteryLevel = useCallback((batteryLevel: number) => {
    setState((prev) => ({ ...prev, batteryLevel: Math.min(100, Math.max(0, batteryLevel)) }))
  }, [setState])

  // Device Type - automatically sets appropriate font
  const setDeviceType = useCallback((deviceType: DeviceType) => {
    setState((prev) => ({
      ...prev,
      deviceType,
      // Auto-set font based on device type
      fontFamily: deviceType === 'android' ? 'roboto' : 'sf-pro',
    }))
  }, [setState])

  // Mobile Preview Scale (10-100%)
  const setMobilePreviewScale = useCallback((mobilePreviewScale: number) => {
    setState((prev) => ({ ...prev, mobilePreviewScale: Math.min(100, Math.max(10, mobilePreviewScale)) }))
  }, [setState])

  // Group Settings - updates active session's groupSettings
  const setGroupSettings = useCallback((settings: Partial<GroupChatSettings>) => {
    setState((prev) => {
      const sessionKey = prev.isGroupChat ? 'groupChatSession' : 'directChatSession'
      return {
        ...prev,
        [sessionKey]: {
          ...prev[sessionKey],
          groupSettings: { ...prev[sessionKey].groupSettings, ...settings },
        },
      }
    })
  }, [setState])

  // Toggle group chat mode - switches between sessions (no data loss)
  const toggleGroupChat = useCallback((isGroupChat: boolean) => {
    setState((prev) => ({
      ...prev,
      isGroupChat,
    }))
  }, [setState])

  // Add participant to group - updates group session
  const addParticipant = useCallback((participant: GroupParticipant) => {
    setState((prev) => ({
      ...prev,
      groupChatSession: {
        ...prev.groupChatSession,
        groupSettings: {
          ...prev.groupChatSession.groupSettings,
          participants: [...prev.groupChatSession.groupSettings.participants, participant],
        },
      },
    }))
  }, [setState])

  // Remove participant from group - updates group session
  const removeParticipant = useCallback((participantId: string) => {
    setState((prev) => ({
      ...prev,
      groupChatSession: {
        ...prev.groupChatSession,
        groupSettings: {
          ...prev.groupChatSession.groupSettings,
          participants: prev.groupChatSession.groupSettings.participants.filter((p) => p.id !== participantId),
        },
      },
    }))
  }, [setState])

  // Update participant - updates group session
  const updateParticipant = useCallback((participantId: string, updates: Partial<GroupParticipant>) => {
    setState((prev) => ({
      ...prev,
      groupChatSession: {
        ...prev.groupChatSession,
        groupSettings: {
          ...prev.groupChatSession.groupSettings,
          participants: prev.groupChatSession.groupSettings.participants.map((p) =>
            p.id === participantId ? { ...p, ...updates } : p
          ),
        },
      },
    }))
  }, [setState])

  // Reset
  const resetToDefaults = useCallback(() => {
    setState(defaultState)
  }, [setState])

  // Get active session data for return
  const activeSession = state.isGroupChat
    ? (state.groupChatSession || defaultGroupChatSession)
    : (state.directChatSession || defaultDirectChatSession)

  // Return initial state during SSR
  if (!isHydrated) {
    const defaultActiveSession = defaultDirectChatSession
    return {
      platform: defaultState.platform,
      sender: defaultActiveSession.sender,
      receiver: defaultActiveSession.receiver,
      messages: defaultActiveSession.messages,
      darkMode: defaultState.darkMode,
      mobileView: defaultState.mobileView,
      timeFormat: defaultState.timeFormat,
      transparentBg: defaultState.transparentBg,
      whatsappSettings: defaultState.whatsappSettings,
      language: defaultState.language,
      fontFamily: defaultState.fontFamily,
      batteryLevel: defaultState.batteryLevel,
      deviceType: defaultState.deviceType,
      mobilePreviewScale: defaultState.mobilePreviewScale,
      groupSettings: defaultActiveSession.groupSettings,
      setPlatform,
      setSender,
      setReceiver,
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
      setDarkMode,
      setMobileView,
      setTimeFormat,
      setTransparentBg,
      setWhatsAppSettings,
      setLanguage,
      setFontFamily,
      setBatteryLevel,
      setDeviceType,
      setMobilePreviewScale,
      setGroupSettings,
      toggleGroupChat,
      addParticipant,
      removeParticipant,
      updateParticipant,
      resetToDefaults,
      isHydrated: false,
    }
  }

  return {
    platform: state.platform,
    sender: activeSession.sender,
    receiver: activeSession.receiver,
    messages: activeSession.messages,
    darkMode: state.darkMode,
    mobileView: state.mobileView,
    timeFormat: state.timeFormat,
    transparentBg: state.transparentBg,
    whatsappSettings: state.whatsappSettings,
    language: state.language,
    fontFamily: state.fontFamily,
    batteryLevel: state.batteryLevel,
    deviceType: state.deviceType,
    mobilePreviewScale: state.mobilePreviewScale ?? 50,
    groupSettings: activeSession.groupSettings,
    setPlatform,
    setSender,
    setReceiver,
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
    setDarkMode,
    setMobileView,
    setTimeFormat,
    setTransparentBg,
    setWhatsAppSettings,
    setLanguage,
    setFontFamily,
    setBatteryLevel,
    setDeviceType,
    setMobilePreviewScale,
    setGroupSettings,
    toggleGroupChat,
    addParticipant,
    removeParticipant,
    updateParticipant,
    resetToDefaults,
    isHydrated: true,
  }
}
