'use client'

import { useEffect, useState, useCallback } from 'react'
import { AdminHeader } from '@/components/admin/admin-header'
import { getAdminLogs } from '@/lib/admin/queries'
import { AdminLog } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  ScrollText,
  UserCog,
  Flag,
  Settings,
  Shield,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const ITEMS_PER_PAGE = 20

const ACTION_LABELS: Record<string, { label: string; icon: typeof UserCog; color: string }> = {
  user_tier_changed: { label: 'Tier Changed', icon: UserCog, color: 'bg-blue-100 text-blue-700' },
  user_role_changed: { label: 'Role Changed', icon: Shield, color: 'bg-purple-100 text-purple-700' },
  user_banned: { label: 'User Banned', icon: Shield, color: 'bg-red-100 text-red-700' },
  user_unbanned: { label: 'User Unbanned', icon: Shield, color: 'bg-green-100 text-green-700' },
  feature_flag_created: { label: 'Flag Created', icon: Flag, color: 'bg-emerald-100 text-emerald-700' },
  feature_flag_updated: { label: 'Flag Updated', icon: Flag, color: 'bg-amber-100 text-amber-700' },
  feature_flag_deleted: { label: 'Flag Deleted', icon: Flag, color: 'bg-red-100 text-red-700' },
  system_setting_updated: { label: 'Setting Changed', icon: Settings, color: 'bg-gray-100 text-gray-700' },
  content_report_reviewed: { label: 'Report Reviewed', icon: Shield, color: 'bg-blue-100 text-blue-700' },
  content_report_actioned: { label: 'Report Actioned', icon: Shield, color: 'bg-orange-100 text-orange-700' },
}

export default function LogsPage() {
  const { toast } = useToast()

  const [logs, setLogs] = useState<AdminLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [actionFilter, setActionFilter] = useState('all')

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const { logs: data, total: count } = await getAdminLogs({
        limit: ITEMS_PER_PAGE,
        offset: page * ITEMS_PER_PAGE,
        action: actionFilter,
      })
      setLogs(data)
      setTotal(count)
    } catch (error) {
      console.error('Error loading logs:', error)
      toast({
        title: 'Error',
        description: 'Failed to load admin logs',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [page, actionFilter, toast])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const getActionBadge = (action: string) => {
    const config = ACTION_LABELS[action] || {
      label: action,
      icon: ScrollText,
      color: 'bg-gray-100 text-gray-700',
    }
    const Icon = config.icon

    return (
      <Badge className={`${config.color} hover:${config.color}`}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const formatDetails = (details: Record<string, unknown> | null) => {
    if (!details) return '-'
    return Object.entries(details)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(', ')
  }

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  return (
    <div>
      <AdminHeader
        title="Admin Logs"
        description="Track all administrative actions"
      />

      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-4">
          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0) }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="user_tier_changed">Tier Changed</SelectItem>
              <SelectItem value="user_role_changed">Role Changed</SelectItem>
              <SelectItem value="user_banned">User Banned</SelectItem>
              <SelectItem value="user_unbanned">User Unbanned</SelectItem>
              <SelectItem value="feature_flag_created">Flag Created</SelectItem>
              <SelectItem value="feature_flag_updated">Flag Updated</SelectItem>
              <SelectItem value="feature_flag_deleted">Flag Deleted</SelectItem>
              <SelectItem value="system_setting_updated">Setting Changed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    <ScrollText className="mx-auto h-8 w-8 text-gray-300" />
                    <p className="mt-2">No logs found</p>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {log.admin?.username || log.admin?.email || 'Unknown'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {log.target_id ? (
                          <>
                            <span className="font-medium">
                              {log.target?.username || log.target?.email || log.target_id.slice(0, 8) + '...'}
                            </span>
                            {log.target_type && (
                              <span className="text-xs text-gray-400 block">{log.target_type}</span>
                            )}
                          </>
                        ) : '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-500 max-w-[200px] truncate block">
                        {formatDetails(log.details)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {page * ITEMS_PER_PAGE + 1} to {Math.min((page + 1) * ITEMS_PER_PAGE, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
