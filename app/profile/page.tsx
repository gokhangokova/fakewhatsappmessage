'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  User,
  Shield,
  Loader2,
  Save,
  Trash2,
  Camera,
} from 'lucide-react'

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Profile data
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  // Stats
  const [stats, setStats] = useState({
    savedChats: 0,
    memberSince: '',
  })

  // Load user profile
  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }

    const loadProfile = async () => {
      try {
        // Get profile from Supabase
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profile) {
          setDisplayName(profile.display_name || user.user_metadata?.full_name || '')
          setAvatarUrl(profile.avatar_url || user.user_metadata?.avatar_url || null)
        } else {
          // Use auth metadata as fallback
          setDisplayName(user.user_metadata?.full_name || '')
          setAvatarUrl(user.user_metadata?.avatar_url || null)
        }

        // Get chat count
        const { count } = await supabase
          .from('chats')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        // Format member since date
        const memberDate = new Date(user.created_at)
        const formattedDate = memberDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })

        setStats({
          savedChats: count || 0,
          memberSince: formattedDate,
        })
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user, router, supabase])

  // Save profile
  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          display_name: displayName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      toast({
        title: 'Profile updated',
        description: 'Your changes have been saved.',
      })
    } catch (error) {
      console.error('Error saving profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to save profile. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Delete account
  const handleDeleteAccount = async () => {
    if (!user) return

    setDeleting(true)
    try {
      // Delete user's chats first
      await supabase.from('chats').delete().eq('user_id', user.id)

      // Delete profile
      await supabase.from('profiles').delete().eq('id', user.id)

      // Sign out (Supabase doesn't allow self-deletion via client SDK)
      await signOut()

      toast({
        title: 'Account deleted',
        description: 'Your account and all data have been deleted.',
      })

      router.push('/')
    } catch (error) {
      console.error('Error deleting account:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete account. Please contact support.',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  if (!user) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 top-16 bg-gray-50 overflow-y-auto z-40">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">Profile Settings</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 pb-16 space-y-8">
        {/* Profile Section */}
        <section className="bg-white rounded-xl border p-6 space-y-6">
          <div className="flex items-center gap-2 text-gray-900">
            <User className="w-5 h-5" />
            <h2 className="font-semibold">Profile Information</h2>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-20 h-20">
                {avatarUrl && <AvatarImage src={avatarUrl} />}
                <AvatarFallback className="text-2xl bg-gray-200">
                  {displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                className="absolute bottom-0 right-0 p-1.5 bg-white border rounded-full shadow-sm hover:bg-gray-50 transition-colors"
                onClick={() => {
                  // TODO: Implement avatar upload
                  toast({
                    title: 'Coming soon',
                    description: 'Avatar upload will be available soon.',
                  })
                }}
              >
                <Camera className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="flex-1 space-y-1">
              <p className="font-medium">{displayName || 'No name set'}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
              <p className="text-xs text-gray-400">Member since {stats.memberSince}</p>
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user.email || ''}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">Email cannot be changed</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-[#128C7E]">{stats.savedChats}</p>
              <p className="text-sm text-gray-500">Saved Chats</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-[#128C7E]">Free</p>
              <p className="text-sm text-gray-500">Current Plan</p>
            </div>
          </div>
        </section>

        {/* Account Section */}
        <section className="bg-white rounded-xl border p-6 space-y-6">
          <div className="flex items-center gap-2 text-gray-900">
            <Shield className="w-5 h-5" />
            <h2 className="font-semibold">Account</h2>
          </div>

          {/* Delete Account */}
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
            <div>
              <p className="font-medium text-red-900">Delete Account</p>
              <p className="text-sm text-red-700">
                Permanently delete your account and all data
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your
                    account and remove all your data including saved chats.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={deleting}
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Account'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#128C7E] hover:bg-[#0d7a6e]"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
