'use client'

import { useEffect, useState, useCallback } from 'react'
import { AdminHeader } from '@/components/admin/admin-header'
import { StatsCard } from '@/components/admin/stats-card'
import { getDashboardStats } from '@/lib/admin/queries'
import { createClient } from '@/lib/supabase/client'
import { AdminDashboardStats, Platform } from '@/types'
import {
  Users,
  Crown,
  Building2,
  TrendingUp,
  MessageSquare,
  Loader2,
} from 'lucide-react'

interface PlatformStat {
  platform: Platform
  count: number
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [platformStats, setPlatformStats] = useState<PlatformStat[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [dashboardStats, platformData] = await Promise.all([
        getDashboardStats(),
        loadPlatformStats(),
      ])
      setStats(dashboardStats)
      setPlatformStats(platformData)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadPlatformStats = async (): Promise<PlatformStat[]> => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('chats')
      .select('platform')

    if (error) {
      console.error('Error loading platform stats:', error)
      return []
    }

    // Count by platform
    const counts: Record<string, number> = {}
    data?.forEach((chat) => {
      counts[chat.platform] = (counts[chat.platform] || 0) + 1
    })

    return Object.entries(counts)
      .map(([platform, count]) => ({
        platform: platform as Platform,
        count,
      }))
      .sort((a, b) => b.count - a.count)
  }

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const totalChats = platformStats.reduce((sum, p) => sum + p.count, 0)

  return (
    <div>
      <AdminHeader
        title="Analytics"
        description="View usage statistics and trends"
      />

      <div className="p-6 space-y-8">
        {/* User Distribution */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Users"
              value={stats?.totalUsers || 0}
              icon={Users}
              variant="default"
            />
            <StatsCard
              title="Free Users"
              value={stats?.freeUsers || 0}
              description={`${stats?.totalUsers ? Math.round((stats.freeUsers / stats.totalUsers) * 100) : 0}%`}
              icon={Users}
              variant="default"
            />
            <StatsCard
              title="Pro Users"
              value={stats?.proUsers || 0}
              description={`${stats?.totalUsers ? Math.round((stats.proUsers / stats.totalUsers) * 100) : 0}%`}
              icon={Crown}
              variant="success"
            />
            <StatsCard
              title="Business Users"
              value={stats?.businessUsers || 0}
              description={`${stats?.totalUsers ? Math.round((stats.businessUsers / stats.totalUsers) * 100) : 0}%`}
              icon={Building2}
              variant="info"
            />
          </div>
        </div>

        {/* Tier Distribution Bar */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Subscription Tier Distribution</h3>
          <div className="h-8 rounded-full overflow-hidden bg-gray-100 flex">
            {stats && stats.totalUsers > 0 && (
              <>
                <div
                  className="bg-gray-400 h-full transition-all"
                  style={{ width: `${(stats.freeUsers / stats.totalUsers) * 100}%` }}
                  title={`Free: ${stats.freeUsers}`}
                />
                <div
                  className="bg-emerald-500 h-full transition-all"
                  style={{ width: `${(stats.proUsers / stats.totalUsers) * 100}%` }}
                  title={`Pro: ${stats.proUsers}`}
                />
                <div
                  className="bg-blue-500 h-full transition-all"
                  style={{ width: `${(stats.businessUsers / stats.totalUsers) * 100}%` }}
                  title={`Business: ${stats.businessUsers}`}
                />
              </>
            )}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-400 rounded" />
              <span>Free ({stats?.freeUsers || 0})</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-emerald-500 rounded" />
              <span>Pro ({stats?.proUsers || 0})</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span>Business ({stats?.businessUsers || 0})</span>
            </div>
          </div>
        </div>

        {/* Growth Stats */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Growth</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <StatsCard
              title="New Users Today"
              value={stats?.newUsersToday || 0}
              icon={TrendingUp}
              variant="success"
            />
            <StatsCard
              title="New Users This Week"
              value={stats?.newUsersThisWeek || 0}
              icon={TrendingUp}
              variant="default"
            />
            <StatsCard
              title="Active Today"
              value={stats?.activeUsersToday || 0}
              icon={Users}
              variant="info"
            />
          </div>
        </div>

        {/* Platform Usage */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Usage</h2>
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Chats by Platform</h3>
              <span className="text-sm text-gray-400">{totalChats} total chats</span>
            </div>

            {platformStats.length > 0 ? (
              <div className="space-y-4">
                {platformStats.map((stat) => {
                  const percentage = totalChats > 0 ? (stat.count / totalChats) * 100 : 0
                  return (
                    <div key={stat.platform}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium capitalize">{stat.platform}</span>
                        <span className="text-sm text-gray-500">
                          {stat.count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full bg-[#128C7E] rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2">No chat data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
