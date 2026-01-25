'use client'

import { createClient } from './client'
import { getFreeTierChatLimit } from '@/hooks/use-system-settings'
import type {
  Message,
  User,
  WhatsAppSettings,
  GroupChatSettings,
  Platform,
  Language,
  FontFamily,
  DeviceType
} from '@/types'

// Chat data structure stored in Supabase
export interface ChatData {
  // Basic info
  platform: Platform
  name: string // Chat name for display in list

  // Users
  sender: User
  receiver: User

  // Messages
  messages: Message[]

  // Appearance
  darkMode: boolean
  timeFormat: '12h' | '24h'
  fontFamily: FontFamily
  deviceType: DeviceType

  // Settings
  language: Language
  batteryLevel: number
  whatsappSettings: WhatsAppSettings

  // Group chat
  groupSettings: GroupChatSettings
}

// Database row type
export interface ChatRow {
  id: string
  user_id: string
  name: string
  platform: string
  data: ChatData
  thumbnail_url: string | null
  created_at: string
  updated_at: string
}

// Serialization helpers - convert Date objects to ISO strings for JSON storage
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeMessages(messages: Message[]): any[] {
  return messages.map(msg => ({
    ...msg,
    timestamp: msg.timestamp instanceof Date
      ? msg.timestamp.toISOString()
      : msg.timestamp,
  }))
}

// Deserialization helpers - convert ISO strings back to Date objects
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deserializeMessages(messages: any[]): Message[] {
  return messages.map(msg => ({
    ...msg,
    timestamp: new Date(msg.timestamp),
  }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeChatData(data: ChatData): any {
  return {
    ...data,
    messages: serializeMessages(data.messages),
    whatsappSettings: {
      ...data.whatsappSettings,
      lastSeenTime: data.whatsappSettings.lastSeenTime instanceof Date
        ? data.whatsappSettings.lastSeenTime.toISOString()
        : data.whatsappSettings.lastSeenTime,
    },
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deserializeChatData(data: any): ChatData {
  return {
    ...data,
    messages: deserializeMessages(data.messages || []),
    whatsappSettings: {
      ...data.whatsappSettings,
      lastSeenTime: data.whatsappSettings?.lastSeenTime
        ? new Date(data.whatsappSettings.lastSeenTime)
        : undefined,
    },
  }
}

// Get all chats for the current user
export async function getUserChats(): Promise<ChatRow[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching chats:', error)
    throw error
  }

  // Deserialize the data field for each chat
  return (data || []).map(chat => ({
    ...chat,
    data: deserializeChatData(chat.data as ChatData),
  }))
}

// Get a single chat by ID
export async function getChatById(chatId: string): Promise<ChatRow | null> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('id', chatId)
    .eq('user_id', user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    console.error('Error fetching chat:', error)
    throw error
  }

  return {
    ...data,
    data: deserializeChatData(data.data as ChatData),
  }
}

// Create a new chat
export async function createChat(
  chatData: ChatData,
  thumbnailUrl?: string
): Promise<ChatRow> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Generate chat name from receiver or group name
  const chatName = chatData.groupSettings.isGroupChat
    ? chatData.groupSettings.groupName
    : chatData.receiver.name

  const { data, error } = await supabase
    .from('chats')
    .insert({
      user_id: user.id,
      name: chatName,
      platform: chatData.platform,
      data: serializeChatData(chatData),
      thumbnail_url: thumbnailUrl || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating chat:', error)
    throw error
  }

  return {
    ...data,
    data: deserializeChatData(data.data as ChatData),
  }
}

// Update an existing chat
export async function updateChat(
  chatId: string,
  chatData: ChatData,
  thumbnailUrl?: string
): Promise<ChatRow> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Generate chat name from receiver or group name
  const chatName = chatData.groupSettings.isGroupChat
    ? chatData.groupSettings.groupName
    : chatData.receiver.name

  const updateData: Record<string, unknown> = {
    name: chatName,
    platform: chatData.platform,
    data: serializeChatData(chatData),
    updated_at: new Date().toISOString(),
  }

  if (thumbnailUrl !== undefined) {
    updateData.thumbnail_url = thumbnailUrl
  }

  const { data, error } = await supabase
    .from('chats')
    .update(updateData)
    .eq('id', chatId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating chat:', error)
    throw error
  }

  return {
    ...data,
    data: deserializeChatData(data.data as ChatData),
  }
}

// Delete a chat
export async function deleteChat(chatId: string): Promise<void> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await supabase
    .from('chats')
    .delete()
    .eq('id', chatId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting chat:', error)
    throw error
  }
}

// Get chat count for free tier limit check
export async function getChatCount(): Promise<number> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { count, error } = await supabase
    .from('chats')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (error) {
    console.error('Error counting chats:', error)
    throw error
  }

  return count || 0
}

// Check if user can create more chats (free tier limit)
export async function canCreateChat(subscriptionTier: 'free' | 'pro' | 'business'): Promise<boolean> {
  // Pro and Business users have unlimited chats
  if (subscriptionTier !== 'free') {
    return true
  }

  // Get limit from system settings (defaults to 2 if not configured)
  const limit = await getFreeTierChatLimit()

  // If limit is 0, it means unlimited
  if (limit === 0) {
    return true
  }

  const count = await getChatCount()
  return count < limit
}
