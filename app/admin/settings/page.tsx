'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AdminHeader } from '@/components/admin/admin-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, Save, Image, Video, UserPlus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SettingsData {
  signup_enabled: {
    enabled: boolean
  }
  free_tier_export_quota: {
    image_limit: number
    video_limit: number
  }
}

const DEFAULT_SETTINGS: SettingsData = {
  signup_enabled: { enabled: true },
  free_tier_export_quota: { image_limit: 0, video_limit: 0 },
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['signup_enabled', 'free_tier_export_quota'])

      if (error) throw error

      const settingsObj = { ...DEFAULT_SETTINGS }
      data?.forEach((row) => {
        if (row.key === 'signup_enabled') {
          settingsObj.signup_enabled = row.value as SettingsData['signup_enabled']
        } else if (row.key === 'free_tier_export_quota') {
          settingsObj.free_tier_export_quota = row.value as SettingsData['free_tier_export_quota']
        }
      })

      setSettings(settingsObj)
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveSetting = async (key: string, value: unknown) => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert(
          { key, value, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        )

      if (error) throw error

      toast({
        title: 'Saved',
        description: 'Setting updated successfully',
      })
    } catch (error) {
      console.error('Error saving setting:', error)
      toast({
        title: 'Error',
        description: 'Failed to save setting',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignupToggle = async (enabled: boolean) => {
    const newValue = { enabled }
    setSettings(prev => ({ ...prev, signup_enabled: newValue }))
    await saveSetting('signup_enabled', newValue)
  }

  const handleExportQuotaChange = (field: 'image_limit' | 'video_limit', value: number) => {
    setSettings(prev => ({
      ...prev,
      free_tier_export_quota: {
        ...prev.free_tier_export_quota,
        [field]: value,
      },
    }))
  }

  const handleSaveExportQuota = async () => {
    await saveSetting('free_tier_export_quota', settings.free_tier_export_quota)
  }

  if (isLoading) {
    return (
      <div>
        <AdminHeader
          title="Settings"
          description="Manage system settings and user limitations"
        />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#25D366]" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <AdminHeader
        title="Settings"
        description="Manage system settings and user limitations"
      />

      <div className="p-6 pb-12 space-y-6">
        {/* User Registration */}
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="h-5 w-5 text-[#25D366]" />
            <h2 className="text-lg font-semibold">User Registration</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Control whether new users can sign up for the application
          </p>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Allow New Registrations</p>
              <p className="text-sm text-gray-500">
                {settings.signup_enabled.enabled
                  ? 'New users can create accounts'
                  : 'Registration is currently disabled'}
              </p>
            </div>
            <Switch
              checked={settings.signup_enabled.enabled}
              onCheckedChange={handleSignupToggle}
              disabled={isSaving}
              className="data-[state=checked]:bg-[#25D366]"
            />
          </div>
        </div>

        {/* Export Quotas */}
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <Image className="h-5 w-5 text-[#25D366]" />
            <h2 className="text-lg font-semibold">Free Tier Export Quotas</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Set daily export limits for free users. Enter 0 for unlimited exports.
          </p>

          <div className="space-y-6">
            {/* Image Export Limit */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4 text-gray-500" />
                <Label htmlFor="image_limit" className="font-medium">
                  Image Exports (per day)
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  id="image_limit"
                  type="number"
                  min="0"
                  value={settings.free_tier_export_quota.image_limit}
                  onChange={(e) => handleExportQuotaChange('image_limit', parseInt(e.target.value) || 0)}
                  className="w-32"
                />
                <span className="text-sm text-gray-500">
                  {settings.free_tier_export_quota.image_limit === 0 ? 'Unlimited' : `${settings.free_tier_export_quota.image_limit} per day`}
                </span>
              </div>
            </div>

            {/* Video Export Limit */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-gray-500" />
                <Label htmlFor="video_limit" className="font-medium">
                  Video Exports (per day)
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  id="video_limit"
                  type="number"
                  min="0"
                  value={settings.free_tier_export_quota.video_limit}
                  onChange={(e) => handleExportQuotaChange('video_limit', parseInt(e.target.value) || 0)}
                  className="w-32"
                />
                <span className="text-sm text-gray-500">
                  {settings.free_tier_export_quota.video_limit === 0 ? 'Unlimited' : `${settings.free_tier_export_quota.video_limit} per day`}
                </span>
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSaveExportQuota}
              disabled={isSaving}
              className="bg-[#25D366] hover:bg-[#128C7E]"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Export Quotas
            </Button>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Pro and Business users have unlimited exports regardless of these settings.
                Export counts reset daily at midnight UTC.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
