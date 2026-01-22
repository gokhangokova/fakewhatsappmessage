'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import {
  getUserChats,
  getChatById,
  createChat,
  updateChat,
  deleteChat,
  getChatCount,
  canCreateChat,
  ChatRow,
  ChatData
} from '@/lib/supabase/chats'

interface UseSavedChatsReturn {
  // Data
  savedChats: ChatRow[]
  currentChatId: string | null
  chatCount: number

  // Loading states
  isLoading: boolean
  isSaving: boolean

  // Actions
  loadChats: () => Promise<void>
  loadChat: (chatId: string) => Promise<ChatData | null>
  saveChat: (chatData: ChatData, thumbnailUrl?: string) => Promise<ChatRow | null>
  saveAsNewChat: (chatData: ChatData, thumbnailUrl?: string) => Promise<ChatRow | null>
  removeChat: (chatId: string) => Promise<void>
  setCurrentChatId: (chatId: string | null) => void

  // Limit checks
  canSaveNewChat: () => Promise<boolean>
  remainingChats: number | null // null = unlimited
}

export function useSavedChats(): UseSavedChatsReturn {
  const { user, profile } = useAuth()

  const [savedChats, setSavedChats] = useState<ChatRow[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [chatCount, setChatCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Calculate remaining chats for free tier
  const FREE_TIER_LIMIT = 2
  const remainingChats = profile?.subscription_tier === 'free'
    ? Math.max(0, FREE_TIER_LIMIT - chatCount)
    : null // null = unlimited for pro/business

  // Load all chats for the user
  const loadChats = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const chats = await getUserChats()
      setSavedChats(chats)
      setChatCount(chats.length)
    } catch (error) {
      console.error('Failed to load chats:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Load a specific chat by ID
  const loadChat = useCallback(async (chatId: string): Promise<ChatData | null> => {
    if (!user) return null

    setIsLoading(true)
    try {
      const chat = await getChatById(chatId)
      if (chat) {
        setCurrentChatId(chatId)
        return chat.data
      }
      return null
    } catch (error) {
      console.error('Failed to load chat:', error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Save current chat (update if exists, create if new)
  const saveChat = useCallback(async (
    chatData: ChatData,
    thumbnailUrl?: string
  ): Promise<ChatRow | null> => {
    if (!user) return null

    setIsSaving(true)
    try {
      let result: ChatRow

      if (currentChatId) {
        // Update existing chat
        result = await updateChat(currentChatId, chatData, thumbnailUrl)
      } else {
        // Check if can create new chat
        const canCreate = await canCreateChat(profile?.subscription_tier || 'free')
        if (!canCreate) {
          throw new Error('Chat limit reached. Upgrade to Pro for unlimited chats.')
        }

        // Create new chat
        result = await createChat(chatData, thumbnailUrl)
        setCurrentChatId(result.id)
        setChatCount(prev => prev + 1)
      }

      // Refresh the chat list
      await loadChats()

      return result
    } catch (error) {
      console.error('Failed to save chat:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }, [user, currentChatId, profile?.subscription_tier, loadChats])

  // Save as a new chat (always creates new, even if editing existing)
  const saveAsNewChat = useCallback(async (
    chatData: ChatData,
    thumbnailUrl?: string
  ): Promise<ChatRow | null> => {
    if (!user) return null

    setIsSaving(true)
    try {
      // Check if can create new chat
      const canCreate = await canCreateChat(profile?.subscription_tier || 'free')
      if (!canCreate) {
        throw new Error('Chat limit reached. Upgrade to Pro for unlimited chats.')
      }

      // Create new chat
      const result = await createChat(chatData, thumbnailUrl)
      setCurrentChatId(result.id)
      setChatCount(prev => prev + 1)

      // Refresh the chat list
      await loadChats()

      return result
    } catch (error) {
      console.error('Failed to save chat as new:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }, [user, profile?.subscription_tier, loadChats])

  // Delete a chat
  const removeChat = useCallback(async (chatId: string) => {
    if (!user) return

    setIsLoading(true)
    try {
      await deleteChat(chatId)

      // If deleting the current chat, clear the selection
      if (currentChatId === chatId) {
        setCurrentChatId(null)
      }

      setChatCount(prev => Math.max(0, prev - 1))

      // Refresh the chat list
      await loadChats()
    } catch (error) {
      console.error('Failed to delete chat:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [user, currentChatId, loadChats])

  // Check if user can save a new chat
  const canSaveNewChat = useCallback(async (): Promise<boolean> => {
    if (!user) return false

    // If editing existing chat, always can save
    if (currentChatId) return true

    return canCreateChat(profile?.subscription_tier || 'free')
  }, [user, currentChatId, profile?.subscription_tier])

  // Load chats when user logs in
  useEffect(() => {
    if (user) {
      loadChats()
    } else {
      // Clear state when user logs out
      setSavedChats([])
      setCurrentChatId(null)
      setChatCount(0)
    }
  }, [user, loadChats])

  return {
    savedChats,
    currentChatId,
    chatCount,
    isLoading,
    isSaving,
    loadChats,
    loadChat,
    saveChat,
    saveAsNewChat,
    removeChat,
    setCurrentChatId,
    canSaveNewChat,
    remainingChats,
  }
}
