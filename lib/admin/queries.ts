import { createClient } from '@/lib/supabase/client'
import { AdminDashboardStats, AdminProfile, FeatureFlag, AdminLog, SystemSetting, ContentReport } from '@/types'

const supabase = createClient()

// =============================================
// Dashboard Stats
// =============================================

export async function getDashboardStats(): Promise<AdminDashboardStats> {
  // Get total users by tier
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('subscription_tier, created_at, last_active')

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError)
    throw profilesError
  }

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - 7)

  const stats: AdminDashboardStats = {
    totalUsers: profiles?.length || 0,
    freeUsers: profiles?.filter(p => p.subscription_tier === 'free').length || 0,
    proUsers: profiles?.filter(p => p.subscription_tier === 'pro').length || 0,
    businessUsers: profiles?.filter(p => p.subscription_tier === 'business').length || 0,
    newUsersToday: profiles?.filter(p => new Date(p.created_at) >= todayStart).length || 0,
    newUsersThisWeek: profiles?.filter(p => new Date(p.created_at) >= weekStart).length || 0,
    activeUsersToday: profiles?.filter(p => p.last_active && new Date(p.last_active) >= todayStart).length || 0,
    totalChats: 0,
    pendingReports: 0,
  }

  // Get total chats
  const { count: chatCount } = await supabase
    .from('chats')
    .select('*', { count: 'exact', head: true })

  stats.totalChats = chatCount || 0

  // Get pending reports
  const { count: reportCount } = await supabase
    .from('content_reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  stats.pendingReports = reportCount || 0

  return stats
}

// =============================================
// Users
// =============================================

export async function getUsers(options?: {
  limit?: number
  offset?: number
  search?: string
  tier?: string
  role?: string
}): Promise<{ users: AdminProfile[]; total: number }> {
  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })

  if (options?.search) {
    query = query.or(`email.ilike.%${options.search}%,username.ilike.%${options.search}%`)
  }

  if (options?.tier && options.tier !== 'all') {
    query = query.eq('subscription_tier', options.tier)
  }

  if (options?.role && options.role !== 'all') {
    query = query.eq('role', options.role)
  }

  query = query.order('created_at', { ascending: false })

  if (options?.limit) {
    query = query.range(
      options.offset || 0,
      (options.offset || 0) + options.limit - 1
    )
  }

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching users:', error)
    throw error
  }

  return {
    users: (data as AdminProfile[]) || [],
    total: count || 0,
  }
}

export async function getUserById(id: string): Promise<AdminProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching user:', error)
    return null
  }

  // Get chat count
  const { count: chatCount } = await supabase
    .from('chats')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', id)

  return {
    ...data,
    chat_count: chatCount || 0,
  } as AdminProfile
}

export async function updateUserTier(
  userId: string,
  tier: 'free' | 'pro' | 'business'
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_tier: tier,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.error('Error updating user tier:', error)
    throw error
  }
}

export async function updateUserRole(
  userId: string,
  role: 'user' | 'admin' | 'super_admin'
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      role,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.error('Error updating user role:', error)
    throw error
  }
}

export async function banUser(
  userId: string,
  reason: string
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      is_banned: true,
      banned_at: new Date().toISOString(),
      ban_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.error('Error banning user:', error)
    throw error
  }
}

export async function unbanUser(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      is_banned: false,
      banned_at: null,
      ban_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.error('Error unbanning user:', error)
    throw error
  }
}

// =============================================
// Feature Flags
// =============================================

export async function getFeatureFlags(): Promise<FeatureFlag[]> {
  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching feature flags:', error)
    throw error
  }

  return (data as FeatureFlag[]) || []
}

export async function updateFeatureFlag(
  id: string,
  updates: Partial<FeatureFlag>
): Promise<void> {
  const { error } = await supabase
    .from('feature_flags')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating feature flag:', error)
    throw error
  }
}

export async function createFeatureFlag(
  flag: Omit<FeatureFlag, 'id' | 'created_at' | 'updated_at'>
): Promise<FeatureFlag> {
  const { data, error } = await supabase
    .from('feature_flags')
    .insert(flag)
    .select()
    .single()

  if (error) {
    console.error('Error creating feature flag:', error)
    throw error
  }

  return data as FeatureFlag
}

export async function deleteFeatureFlag(id: string): Promise<void> {
  const { error } = await supabase
    .from('feature_flags')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting feature flag:', error)
    throw error
  }
}

// =============================================
// Admin Logs
// =============================================

export async function getAdminLogs(options?: {
  limit?: number
  offset?: number
  action?: string
}): Promise<{ logs: AdminLog[]; total: number }> {
  let query = supabase
    .from('admin_logs')
    .select(`
      *,
      admin:profiles!admin_id(username, email)
    `, { count: 'exact' })

  if (options?.action && options.action !== 'all') {
    query = query.eq('action', options.action)
  }

  query = query.order('created_at', { ascending: false })

  if (options?.limit) {
    query = query.range(
      options.offset || 0,
      (options.offset || 0) + options.limit - 1
    )
  }

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching admin logs:', error)
    throw error
  }

  // Fetch target user info for logs where target_type is 'user'
  const logs = (data as AdminLog[]) || []
  const userTargetIds = logs
    .filter(log => log.target_type === 'user' && log.target_id)
    .map(log => log.target_id!)

  console.log('[AdminLogs] User target IDs:', userTargetIds)

  if (userTargetIds.length > 0) {
    const { data: targetUsers, error: targetError } = await supabase
      .from('profiles')
      .select('id, username, email')
      .in('id', userTargetIds)

    console.log('[AdminLogs] Target users query result:', { targetUsers, targetError })

    if (targetUsers) {
      const userMap = new Map(targetUsers.map(u => [u.id, u]))
      console.log('[AdminLogs] User map:', Object.fromEntries(userMap))
      logs.forEach(log => {
        if (log.target_type === 'user' && log.target_id) {
          const targetUser = userMap.get(log.target_id)
          console.log('[AdminLogs] Looking up target_id:', log.target_id, 'found:', targetUser)
          if (targetUser) {
            log.target = {
              username: targetUser.username,
              email: targetUser.email,
            }
          }
        }
      })
    }
  }

  return {
    logs,
    total: count || 0,
  }
}

export async function createAdminLog(log: {
  admin_id: string
  action: string
  target_type?: string
  target_id?: string
  details?: Record<string, unknown>
}): Promise<void> {
  const { error } = await supabase
    .from('admin_logs')
    .insert(log)

  if (error) {
    console.error('Error creating admin log:', error)
    throw error
  }
}

// =============================================
// System Settings
// =============================================

export async function getSystemSettings(): Promise<SystemSetting[]> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .order('key', { ascending: true })

  if (error) {
    console.error('Error fetching system settings:', error)
    throw error
  }

  return (data as SystemSetting[]) || []
}

export async function updateSystemSetting(
  key: string,
  value: Record<string, unknown>,
  updatedBy: string
): Promise<void> {
  const { error } = await supabase
    .from('system_settings')
    .update({
      value,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    })
    .eq('key', key)

  if (error) {
    console.error('Error updating system setting:', error)
    throw error
  }
}

// =============================================
// Content Reports
// =============================================

export async function getContentReports(options?: {
  limit?: number
  offset?: number
  status?: string
}): Promise<{ reports: ContentReport[]; total: number }> {
  let query = supabase
    .from('content_reports')
    .select(`
      *,
      reporter:profiles!reporter_id(username, email),
      reviewer:profiles!reviewed_by(username, email),
      chat:chats!chat_id(name, platform)
    `, { count: 'exact' })

  if (options?.status && options.status !== 'all') {
    query = query.eq('status', options.status)
  }

  query = query.order('created_at', { ascending: false })

  if (options?.limit) {
    query = query.range(
      options.offset || 0,
      (options.offset || 0) + options.limit - 1
    )
  }

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching content reports:', error)
    throw error
  }

  return {
    reports: (data as ContentReport[]) || [],
    total: count || 0,
  }
}

export async function updateContentReport(
  id: string,
  updates: {
    status: 'reviewed' | 'actioned' | 'dismissed'
    reviewed_by: string
    action_taken?: string
  }
): Promise<void> {
  const { error } = await supabase
    .from('content_reports')
    .update({
      ...updates,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating content report:', error)
    throw error
  }
}
