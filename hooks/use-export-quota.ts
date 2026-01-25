'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'
import { useSystemSettings } from './use-system-settings'

interface ExportCounts {
  image_count: number
  video_count: number
}

interface UseExportQuotaReturn {
  // Current counts
  todayImageCount: number
  todayVideoCount: number

  // Limits (0 = unlimited)
  imageLimit: number
  videoLimit: number

  // Remaining
  remainingImages: number | null  // null = unlimited
  remainingVideos: number | null  // null = unlimited

  // Can export?
  canExportImage: boolean
  canExportVideo: boolean

  // Actions
  incrementImageCount: () => Promise<boolean>
  incrementVideoCount: () => Promise<boolean>

  // Loading
  isLoading: boolean
}

export function useExportQuota(): UseExportQuotaReturn {
  const { user, profile } = useAuth()
  const { settings } = useSystemSettings()
  const [counts, setCounts] = useState<ExportCounts>({ image_count: 0, video_count: 0 })
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()
  const isPro = profile?.subscription_tier === 'pro' || profile?.subscription_tier === 'business'

  // Get limits from settings
  const imageLimit = settings.free_tier_export_quota?.image_limit ?? 0
  const videoLimit = settings.free_tier_export_quota?.video_limit ?? 0

  // Fetch today's counts
  const fetchCounts = useCallback(async () => {
    if (!user) {
      setIsLoading(false)
      return
    }

    try {
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('user_export_counts')
        .select('image_count, video_count')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine
        console.error('Error fetching export counts:', error)
      }

      setCounts({
        image_count: data?.image_count ?? 0,
        video_count: data?.video_count ?? 0,
      })
    } catch (err) {
      console.error('Error in fetchCounts:', err)
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    fetchCounts()
  }, [fetchCounts])

  // Calculate remaining
  const remainingImages = isPro ? null : (imageLimit === 0 ? null : Math.max(0, imageLimit - counts.image_count))
  const remainingVideos = isPro ? null : (videoLimit === 0 ? null : Math.max(0, videoLimit - counts.video_count))

  // Can export checks
  const canExportImage = isPro || imageLimit === 0 || counts.image_count < imageLimit
  const canExportVideo = isPro || videoLimit === 0 || counts.video_count < videoLimit

  // Increment image count
  const incrementImageCount = useCallback(async (): Promise<boolean> => {
    if (!user) return false
    if (!canExportImage) return false

    const today = new Date().toISOString().split('T')[0]

    try {
      // Try to upsert the count
      const { error } = await supabase
        .from('user_export_counts')
        .upsert(
          {
            user_id: user.id,
            date: today,
            image_count: counts.image_count + 1,
            video_count: counts.video_count,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,date' }
        )

      if (error) {
        console.error('Error incrementing image count:', error)
        return false
      }

      setCounts(prev => ({ ...prev, image_count: prev.image_count + 1 }))
      return true
    } catch (err) {
      console.error('Error in incrementImageCount:', err)
      return false
    }
  }, [user, supabase, counts, canExportImage])

  // Increment video count
  const incrementVideoCount = useCallback(async (): Promise<boolean> => {
    if (!user) return false
    if (!canExportVideo) return false

    const today = new Date().toISOString().split('T')[0]

    try {
      // Try to upsert the count
      const { error } = await supabase
        .from('user_export_counts')
        .upsert(
          {
            user_id: user.id,
            date: today,
            image_count: counts.image_count,
            video_count: counts.video_count + 1,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,date' }
        )

      if (error) {
        console.error('Error incrementing video count:', error)
        return false
      }

      setCounts(prev => ({ ...prev, video_count: prev.video_count + 1 }))
      return true
    } catch (err) {
      console.error('Error in incrementVideoCount:', err)
      return false
    }
  }, [user, supabase, counts, canExportVideo])

  return {
    todayImageCount: counts.image_count,
    todayVideoCount: counts.video_count,
    imageLimit,
    videoLimit,
    remainingImages,
    remainingVideos,
    canExportImage,
    canExportVideo,
    incrementImageCount,
    incrementVideoCount,
    isLoading,
  }
}
