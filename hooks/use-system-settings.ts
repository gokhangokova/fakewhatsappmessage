'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface SystemSettings {
  maintenance_mode: {
    enabled: boolean
    message: string
  }
  signup_enabled: {
    enabled: boolean
  }
  free_tier_chat_limit: {
    limit: number
  }
  free_tier_export_quota: {
    image_limit: number  // 0 = unlimited
    video_limit: number  // 0 = unlimited
  }
  announcement: {
    enabled: boolean
    message: string
    type: 'info' | 'warning' | 'success' | 'error'
  }
}

const DEFAULT_SETTINGS: SystemSettings = {
  maintenance_mode: { enabled: false, message: '' },
  signup_enabled: { enabled: true },
  free_tier_chat_limit: { limit: 2 },
  free_tier_export_quota: { image_limit: 0, video_limit: 0 }, // 0 = unlimited
  announcement: { enabled: false, message: '', type: 'info' },
}

// Cache settings in memory to avoid repeated DB calls
let cachedSettings: SystemSettings | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 60 * 1000 // 1 minute cache

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>(cachedSettings || DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(!cachedSettings)
  const [error, setError] = useState<Error | null>(null)

  const fetchSettings = useCallback(async (force: boolean = false) => {
    // Use cache if valid and not forced refresh
    const now = Date.now()
    if (!force && cachedSettings && (now - cacheTimestamp) < CACHE_DURATION) {
      setSettings(cachedSettings)
      setIsLoading(false)
      return cachedSettings
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('system_settings')
        .select('key, value')

      if (fetchError) {
        throw fetchError
      }

      // Transform array to object
      const settingsObject: SystemSettings = { ...DEFAULT_SETTINGS }

      if (data) {
        data.forEach((row: { key: string; value: unknown }) => {
          const key = row.key
          if (key === 'maintenance_mode') {
            settingsObject.maintenance_mode = row.value as SystemSettings['maintenance_mode']
          } else if (key === 'signup_enabled') {
            settingsObject.signup_enabled = row.value as SystemSettings['signup_enabled']
          } else if (key === 'free_tier_chat_limit') {
            settingsObject.free_tier_chat_limit = row.value as SystemSettings['free_tier_chat_limit']
          } else if (key === 'free_tier_export_quota') {
            settingsObject.free_tier_export_quota = row.value as SystemSettings['free_tier_export_quota']
          } else if (key === 'announcement') {
            settingsObject.announcement = row.value as SystemSettings['announcement']
          }
        })
      }

      // Update cache
      cachedSettings = settingsObject
      cacheTimestamp = now

      setSettings(settingsObject)
      return settingsObject
    } catch (err) {
      console.error('[useSystemSettings] Error fetching settings:', err)
      setError(err as Error)
      return DEFAULT_SETTINGS
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return {
    settings,
    isLoading,
    error,
    refetch: () => fetchSettings(true),
  }
}

// Standalone function to get settings (for non-hook contexts)
export async function getSystemSettingsClient(): Promise<SystemSettings> {
  // Use cache if valid
  const now = Date.now()
  if (cachedSettings && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedSettings
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')

    if (error) {
      throw error
    }

    const settingsObject: SystemSettings = { ...DEFAULT_SETTINGS }

    if (data) {
      data.forEach((row: { key: string; value: unknown }) => {
        const key = row.key
        if (key === 'maintenance_mode') {
          settingsObject.maintenance_mode = row.value as SystemSettings['maintenance_mode']
        } else if (key === 'signup_enabled') {
          settingsObject.signup_enabled = row.value as SystemSettings['signup_enabled']
        } else if (key === 'free_tier_chat_limit') {
          settingsObject.free_tier_chat_limit = row.value as SystemSettings['free_tier_chat_limit']
        } else if (key === 'free_tier_export_quota') {
          settingsObject.free_tier_export_quota = row.value as SystemSettings['free_tier_export_quota']
        } else if (key === 'announcement') {
          settingsObject.announcement = row.value as SystemSettings['announcement']
        }
      })
    }

    // Update cache
    cachedSettings = settingsObject
    cacheTimestamp = now

    return settingsObject
  } catch (err) {
    console.error('[getSystemSettingsClient] Error:', err)
    return DEFAULT_SETTINGS
  }
}

// Get free tier export quota
export async function getFreeTierExportQuota(): Promise<{ image_limit: number; video_limit: number }> {
  const settings = await getSystemSettingsClient()
  return settings.free_tier_export_quota
}

// Get free tier chat limit
export async function getFreeTierChatLimit(): Promise<number> {
  const settings = await getSystemSettingsClient()
  return settings.free_tier_chat_limit.limit
}

// Check if signup is enabled
export async function isSignupEnabled(): Promise<boolean> {
  const settings = await getSystemSettingsClient()
  return settings.signup_enabled.enabled
}

// Check if maintenance mode is enabled
export async function isMaintenanceMode(): Promise<{ enabled: boolean; message: string }> {
  const settings = await getSystemSettingsClient()
  return settings.maintenance_mode
}
