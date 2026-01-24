'use client'

import { useEffect, useState } from 'react'
import { AdminHeader } from '@/components/admin/admin-header'
import { StatsCard } from '@/components/admin/stats-card'
import { getDashboardStats } from '@/lib/admin/queries'
import { AdminDashboardStats } from '@/types'
import {
  Users,
  Crown,
  Building2,
  UserPlus,
  Activity,
  MessageSquare,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getDashboardStats()
        setStats(data)
      } catch (err) {
        console.error('Error loading stats:', err)
        setError('Failed to load dashboard stats')
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <AdminHeader
        title="Dashboard"
        description="Overview of your application"
      />

      <div className="p-6 space-y-6">
        {/* User Stats */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Users</h2>
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
              description={`${stats?.totalUsers ? Math.round((stats.freeUsers / stats.totalUsers) * 100) : 0}% of total`}
              icon={Users}
              variant="default"
            />
            <StatsCard
              title="Pro Users"
              value={stats?.proUsers || 0}
              description={`${stats?.totalUsers ? Math.round((stats.proUsers / stats.totalUsers) * 100) : 0}% of total`}
              icon={Crown}
              variant="success"
            />
            <StatsCard
              title="Business Users"
              value={stats?.businessUsers || 0}
              description={`${stats?.totalUsers ? Math.round((stats.businessUsers / stats.totalUsers) * 100) : 0}% of total`}
              icon={Building2}
              variant="info"
            />
          </div>
        </div>

        {/* Activity Stats */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="New Users Today"
              value={stats?.newUsersToday || 0}
              icon={UserPlus}
              variant="success"
            />
            <StatsCard
              title="New Users This Week"
              value={stats?.newUsersThisWeek || 0}
              icon={UserPlus}
              variant="default"
            />
            <StatsCard
              title="Active Today"
              value={stats?.activeUsersToday || 0}
              icon={Activity}
              variant="info"
            />
            <StatsCard
              title="Total Chats"
              value={stats?.totalChats || 0}
              icon={MessageSquare}
              variant="default"
            />
          </div>
        </div>

        {/* Alerts */}
        {(stats?.pendingReports || 0) > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Alerts</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Link href="/admin/moderation">
                <StatsCard
                  title="Pending Reports"
                  value={stats?.pendingReports || 0}
                  description="Requires attention"
                  icon={AlertTriangle}
                  variant="warning"
                />
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/users">
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
            </Link>
            <Link href="/admin/features">
              <Button variant="outline">
                <Crown className="mr-2 h-4 w-4" />
                Feature Flags
              </Button>
            </Link>
            <Link href="/admin/analytics">
              <Button variant="outline">
                <Activity className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="outline">
                <Building2 className="mr-2 h-4 w-4" />
                System Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
