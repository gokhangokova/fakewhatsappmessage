'use client'

import { useEffect, useState, useCallback } from 'react'
import { AdminHeader } from '@/components/admin/admin-header'
import { getSystemSettings, updateSystemSetting } from '@/lib/admin/queries'
import { createAdminLog } from '@/lib/admin/queries'
import { SystemSetting } from '@/types'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  Settings,
  Bell,
  Users,
  Shield,
  Save,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SettingConfig {
  key: string
  label: string
  description: string
  icon: typeof Settings
  type: 'toggle' | 'number' | 'text' | 'select'
  field: string
  options?: { value: string; label: string }[]
}

const SETTING_CONFIGS: SettingConfig[] = [
  {
    key: 'maintenance_mode',
    label: 'Maintenance Mode',
    description: 'Enable maintenance mode to temporarily disable the application',
    icon: Shield,
    type: 'toggle',
    field: 'enabled',
  },
  {
    key: 'signup_enabled',
    label: 'User Registration',
    description: 'Allow new users to sign up',
    icon: Users,
    type: 'toggle',
    field: 'enabled',
  },
  {
    key: 'free_tier_chat_limit',
    label: 'Free Tier Chat Limit',
    description: 'Maximum number of saved chats for free tier users',
    icon: Users,
    type: 'number',
    field: 'limit',
  },
  {
    key: 'announcement',
    label: 'Global Announcement',
    description: 'Show an announcement banner to all users',
    icon: Bell,
    type: 'toggle',
    field: 'enabled',
  },
]

export default function SettingsPage() {
  const { user: currentUser } = useAuth()
  const { toast } = useToast()

  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  // Local state for form values
  const [formValues, setFormValues] = useState<Record<string, Record<string, unknown>>>({})

  const loadSettings = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getSystemSettings()
      setSettings(data)

      // Initialize form values
      const values: Record<string, Record<string, unknown>> = {}
      data.forEach((setting) => {
        values[setting.key] = setting.value as Record<string, unknown>
      })
      setFormValues(values)
    } catch (error) {
      console.error('Error loading settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to load system settings',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleSave = async (key: string) => {
    setSaving(key)
    try {
      await updateSystemSetting(key, formValues[key], currentUser!.id)
      await createAdminLog({
        admin_id: currentUser!.id,
        action: 'system_setting_updated',
        target_type: 'system_setting',
        details: { key, value: formValues[key] },
      })
      toast({
        title: 'Success',
        description: 'Setting updated',
      })
    } catch (error) {
      console.error('Error saving setting:', error)
      toast({
        title: 'Error',
        description: 'Failed to save setting',
        variant: 'destructive',
      })
    } finally {
      setSaving(null)
    }
  }

  const updateFormValue = (key: string, field: string, value: unknown) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }))
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const getSetting = (key: string) => {
    return settings.find((s) => s.key === key)
  }

  return (
    <div>
      <AdminHeader
        title="System Settings"
        description="Configure global application settings"
      />

      <div className="p-6 pb-12 space-y-6">
        {/* Maintenance Mode */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100">
              <Shield className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-medium">Maintenance Mode</h3>
              <p className="text-sm text-gray-500">
                Enable to temporarily disable the application for maintenance
              </p>
            </div>
          </div>

          <div className="space-y-4 pl-12">
            <div className="flex items-center justify-between">
              <Label>Enable Maintenance Mode</Label>
              <Switch
                checked={formValues.maintenance_mode?.enabled as boolean || false}
                onCheckedChange={(checked) =>
                  updateFormValue('maintenance_mode', 'enabled', checked)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Maintenance Message</Label>
              <Textarea
                placeholder="We're currently performing maintenance..."
                value={(formValues.maintenance_mode?.message as string) || ''}
                onChange={(e) =>
                  updateFormValue('maintenance_mode', 'message', e.target.value)
                }
              />
            </div>

            <Button
              onClick={() => handleSave('maintenance_mode')}
              disabled={saving === 'maintenance_mode'}
            >
              {saving === 'maintenance_mode' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        </div>

        {/* User Registration */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium">User Registration</h3>
              <p className="text-sm text-gray-500">
                Control whether new users can sign up
              </p>
            </div>
          </div>

          <div className="space-y-4 pl-12">
            <div className="flex items-center justify-between">
              <Label>Allow New Registrations</Label>
              <Switch
                checked={formValues.signup_enabled?.enabled as boolean ?? true}
                onCheckedChange={(checked) =>
                  updateFormValue('signup_enabled', 'enabled', checked)
                }
              />
            </div>

            <Button
              onClick={() => handleSave('signup_enabled')}
              disabled={saving === 'signup_enabled'}
            >
              {saving === 'signup_enabled' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        </div>

        {/* Free Tier Limits */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium">Free Tier Limits</h3>
              <p className="text-sm text-gray-500">
                Set limits for free tier users
              </p>
            </div>
          </div>

          <div className="space-y-4 pl-12">
            <div className="space-y-2">
              <Label>Max Saved Chats</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={(formValues.free_tier_chat_limit?.limit as number) || 2}
                onChange={(e) =>
                  updateFormValue('free_tier_chat_limit', 'limit', parseInt(e.target.value) || 0)
                }
                className="w-32"
              />
              <p className="text-xs text-gray-500">
                Number of chats free users can save (0 = unlimited)
              </p>
            </div>

            <Button
              onClick={() => handleSave('free_tier_chat_limit')}
              disabled={saving === 'free_tier_chat_limit'}
            >
              {saving === 'free_tier_chat_limit' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Bell className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium">Global Announcement</h3>
              <p className="text-sm text-gray-500">
                Display a banner message to all users
              </p>
            </div>
          </div>

          <div className="space-y-4 pl-12">
            <div className="flex items-center justify-between">
              <Label>Show Announcement</Label>
              <Switch
                checked={formValues.announcement?.enabled as boolean || false}
                onCheckedChange={(checked) =>
                  updateFormValue('announcement', 'enabled', checked)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              <Input
                placeholder="Important announcement message..."
                value={(formValues.announcement?.message as string) || ''}
                onChange={(e) =>
                  updateFormValue('announcement', 'message', e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={(formValues.announcement?.type as string) || 'info'}
                onValueChange={(value) =>
                  updateFormValue('announcement', 'type', value)
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => handleSave('announcement')}
              disabled={saving === 'announcement'}
            >
              {saving === 'announcement' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
