'use client'

import { useState, useEffect, useCallback } from 'react'
import { Platform, Message, User, WhatsAppSettings, MessageStatus, ReplyTo, MessageReaction, Language, FontFamily } from '@/types'
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

const defaultMessages: Message[] = [
  {
    id: generateId(),
    userId: 'sender-1',
    content: 'Good morning!',
    timestamp: new Date(),
    type: 'text',
    status: 'read',
  },
  {
    id: generateId(),
    userId: 'sender-1',
    content: 'Japan looks amazing!',
    timestamp: new Date(),
    type: 'text',
    status: 'read',
  },
  {
    id: generateId(),
    userId: 'receiver-1',
    content: 'Do you know what time is it?',
    timestamp: new Date(),
    type: 'text',
  },
  {
    id: generateId(),
    userId: 'sender-1',
    content: "It's morning in Tokyo 😎",
    timestamp: new Date(),
    type: 'text',
    status: 'read',
  },
  {
    id: generateId(),
    userId: 'receiver-1',
    content: 'What is the most popular meal in Japan?',
    timestamp: new Date(),
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
  lastSeenTime: new Date(),
}

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
}

const defaultState: ChatState = {
  platform: 'whatsapp',
  sender: defaultSender,
  receiver: defaultReceiver,
  messages: defaultMessages,
  darkMode: false,
  mobileView: true,
  timeFormat: '24h', // WhatsApp iOS uses 24h format
  transparentBg: false,
  whatsappSettings: defaultWhatsAppSettings,
  language: 'en',
  fontFamily: 'sf-pro',
  batteryLevel: 100,
}

export function useChatState() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [state, setState] = useLocalStorage<ChatState>(STORAGE_KEY, defaultState)

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Convert stored date strings back to Date objects
  useEffect(() => {
    if (isHydrated && state.messages) {
      const hasStringDates = state.messages.some(
        (msg) => typeof msg.timestamp === 'string'
      )
      if (hasStringDates) {
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }))
      }
    }
  }, [isHydrated])

  // Platform
  const setPlatform = useCallback((platform: Platform) => {
    setState((prev) => ({ ...prev, platform }))
  }, [setState])

  // Sender
  const setSender = useCallback((sender: User) => {
    setState((prev) => ({ ...prev, sender }))
  }, [setState])

  // Receiver
  const setReceiver = useCallback((receiver: User) => {
    setState((prev) => ({ ...prev, receiver }))
  }, [setState])

  // Messages
  const setMessages = useCallback((messages: Message[]) => {
    setState((prev) => ({ ...prev, messages }))
  }, [setState])

  const addMessage = useCallback(() => {
    const newMessage: Message = {
      id: generateId(),
      userId: state.sender.id,
      content: '',
      timestamp: new Date(),
      type: 'text',
      status: 'read',
    }
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, newMessage],
    }))
    return newMessage.id
  }, [state.sender.id, setState])

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setState((prev) => ({
      ...prev,
      messages: prev.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    }))
  }, [setState])

  const updateMessageStatus = useCallback((id: string, status: MessageStatus) => {
    setState((prev) => ({
      ...prev,
      messages: prev.messages.map((msg) =>
        msg.id === id ? { ...msg, status } : msg
      ),
    }))
  }, [setState])

  const updateMessageForwarded = useCallback((id: string, isForwarded: boolean) => {
    setState((prev) => ({
      ...prev,
      messages: prev.messages.map((msg) =>
        msg.id === id ? { ...msg, isForwarded } : msg
      ),
    }))
  }, [setState])

  const updateMessageReplyTo = useCallback((id: string, replyTo?: ReplyTo) => {
    setState((prev) => ({
      ...prev,
      messages: prev.messages.map((msg) =>
        msg.id === id ? { ...msg, replyTo } : msg
      ),
    }))
  }, [setState])

  const updateMessageReactions = useCallback((id: string, reactions: MessageReaction[]) => {
    setState((prev) => ({
      ...prev,
      messages: prev.messages.map((msg) =>
        msg.id === id ? { ...msg, reactions } : msg
      ),
    }))
  }, [setState])

  const updateMessageImage = useCallback((id: string, imageUrl?: string) => {
    setState((prev) => ({
      ...prev,
      messages: prev.messages.map((msg) =>
        msg.id === id ? { ...msg, imageUrl, type: imageUrl ? 'image' : 'text' } : msg
      ),
    }))
  }, [setState])

  const deleteMessage = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      messages: prev.messages.filter((msg) => msg.id !== id),
    }))
  }, [setState])

  const reorderMessages = useCallback((fromIndex: number, toIndex: number) => {
    setState((prev) => {
      const newMessages = [...prev.messages]
      const [removed] = newMessages.splice(fromIndex, 1)
      newMessages.splice(toIndex, 0, removed)
      return { ...prev, messages: newMessages }
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

  // Reset
  const resetToDefaults = useCallback(() => {
    setState(defaultState)
  }, [setState])

  // Return initial state during SSR
  if (!isHydrated) {
    return {
      ...defaultState,
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
      resetToDefaults,
      isHydrated: false,
    }
  }

  return {
    ...state,
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
    resetToDefaults,
    isHydrated: true,
  }
}
