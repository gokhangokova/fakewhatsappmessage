'use client'

import { useEffect, useState, useCallback } from 'react'
import { AdminHeader } from '@/components/admin/admin-header'
import { getFeatureFlags, updateFeatureFlag, createFeatureFlag, deleteFeatureFlag } from '@/lib/admin/queries'
import { createAdminLog } from '@/lib/admin/queries'
import { FeatureFlag, FEATURE_FLAG_CATEGORIES } from '@/types'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Trash2,
  Flag,
  Loader2,
  Crown,
  Building2,
  Users,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function FeaturesPage() {
  const { user: currentUser } = useAuth()
  const { toast } = useToast()

  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newFlag, setNewFlag] = useState({
    name: '',
    description: '',
    category: 'general',
    free_enabled: false,
    pro_enabled: true,
    business_enabled: true,
  })

  const loadFlags = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getFeatureFlags()
      setFlags(data)
    } catch (error) {
      console.error('Error loading feature flags:', error)
      toast({
        title: 'Error',
        description: 'Failed to load feature flags',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadFlags()
  }, [loadFlags])

  const handleToggle = async (flag: FeatureFlag, tier: 'free' | 'pro' | 'business') => {
    const key = `${tier}_enabled` as keyof FeatureFlag
    const newValue = !flag[key]

    try {
      await updateFeatureFlag(flag.id, { [key]: newValue })
      await createAdminLog({
        admin_id: currentUser!.id,
        action: 'feature_flag_updated',
        target_type: 'feature_flag',
        target_id: flag.id,
        details: { field: key, old_value: flag[key], new_value: newValue },
      })
      toast({
        title: 'Success',
        description: `${flag.name} updated for ${tier} tier`,
      })
      loadFlags()
    } catch (error) {
      console.error('Error updating feature flag:', error)
      toast({
        title: 'Error',
        description: 'Failed to update feature flag',
        variant: 'destructive',
      })
    }
  }

  const handleCreate = async () => {
    if (!newFlag.name) {
      toast({
        title: 'Error',
        description: 'Feature name is required',
        variant: 'destructive',
      })
      return
    }

    try {
      const created = await createFeatureFlag(newFlag)
      await createAdminLog({
        admin_id: currentUser!.id,
        action: 'feature_flag_created',
        target_type: 'feature_flag',
        target_id: created.id,
        details: { name: newFlag.name },
      })
      toast({
        title: 'Success',
        description: 'Feature flag created',
      })
      setDialogOpen(false)
      setNewFlag({
        name: '',
        description: '',
        category: 'general',
        free_enabled: false,
        pro_enabled: true,
        business_enabled: true,
      })
      loadFlags()
    } catch (error) {
      console.error('Error creating feature flag:', error)
      toast({
        title: 'Error',
        description: 'Failed to create feature flag',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (flag: FeatureFlag) => {
    try {
      await deleteFeatureFlag(flag.id)
      await createAdminLog({
        admin_id: currentUser!.id,
        action: 'feature_flag_deleted',
        target_type: 'feature_flag',
        target_id: flag.id,
        details: { name: flag.name },
      })
      toast({
        title: 'Success',
        description: 'Feature flag deleted',
      })
      loadFlags()
    } catch (error) {
      console.error('Error deleting feature flag:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete feature flag',
        variant: 'destructive',
      })
    }
  }

  // Group flags by category
  const groupedFlags = flags.reduce((acc, flag) => {
    const category = flag.category || 'general'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(flag)
    return acc
  }, {} as Record<string, FeatureFlag[]>)

  const getCategoryLabel = (category: string) => {
    return FEATURE_FLAG_CATEGORIES.find(c => c.value === category)?.label || category
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div>
      <AdminHeader
        title="Feature Flags"
        description="Control which features are available for each subscription tier"
      />

      <div className="p-6 space-y-6">
        {/* Add New Button */}
        <div className="flex justify-end">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Feature Flag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Feature Flag</DialogTitle>
                <DialogDescription>
                  Add a new feature flag to control feature availability by tier
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., video_export"
                    value={newFlag.name}
                    onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="What does this feature do?"
                    value={newFlag.description}
                    onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newFlag.category}
                    onValueChange={(v) => setNewFlag({ ...newFlag, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FEATURE_FLAG_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 pt-2">
                  <Label>Enable for tiers</Label>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>Free</span>
                    </div>
                    <Switch
                      checked={newFlag.free_enabled}
                      onCheckedChange={(checked) => setNewFlag({ ...newFlag, free_enabled: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-emerald-500" />
                      <span>Pro</span>
                    </div>
                    <Switch
                      checked={newFlag.pro_enabled}
                      onCheckedChange={(checked) => setNewFlag({ ...newFlag, pro_enabled: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-500" />
                      <span>Business</span>
                    </div>
                    <Switch
                      checked={newFlag.business_enabled}
                      onCheckedChange={(checked) => setNewFlag({ ...newFlag, business_enabled: checked })}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Feature Flags by Category */}
        {Object.entries(groupedFlags).map(([category, categoryFlags]) => (
          <div key={category} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {getCategoryLabel(category)}
            </h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categoryFlags.map((flag) => (
                <div
                  key={flag.id}
                  className="rounded-lg border bg-white p-4 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Flag className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{flag.name}</p>
                        {flag.description && (
                          <p className="text-sm text-gray-500">{flag.description}</p>
                        )}
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Feature Flag</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;{flag.name}&quot;? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(flag)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Free</span>
                      </div>
                      <Switch
                        checked={flag.free_enabled}
                        onCheckedChange={() => handleToggle(flag, 'free')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm">Pro</span>
                      </div>
                      <Switch
                        checked={flag.pro_enabled}
                        onCheckedChange={() => handleToggle(flag, 'pro')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Business</span>
                      </div>
                      <Switch
                        checked={flag.business_enabled}
                        onCheckedChange={() => handleToggle(flag, 'business')}
                      />
                    </div>
                  </div>

                  <div className="flex gap-1 pt-2 border-t">
                    {flag.free_enabled && (
                      <Badge variant="secondary" className="text-xs">Free</Badge>
                    )}
                    {flag.pro_enabled && (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">Pro</Badge>
                    )}
                    {flag.business_enabled && (
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs">Business</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {flags.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Flag className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4">No feature flags yet</p>
            <p className="text-sm">Create your first feature flag to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
