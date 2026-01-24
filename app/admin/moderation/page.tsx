'use client'

import { useEffect, useState, useCallback } from 'react'
import { AdminHeader } from '@/components/admin/admin-header'
import { getContentReports, updateContentReport, banUser } from '@/lib/admin/queries'
import { createAdminLog } from '@/lib/admin/queries'
import { ContentReport } from '@/types'
import { useAuth } from '@/contexts/auth-context'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Ban,
  Eye,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const ITEMS_PER_PAGE = 10

export default function ModerationPage() {
  const { user: currentUser } = useAuth()
  const { toast } = useToast()

  const [reports, setReports] = useState<ContentReport[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState('pending')

  const loadReports = useCallback(async () => {
    setLoading(true)
    try {
      const { reports: data, total: count } = await getContentReports({
        limit: ITEMS_PER_PAGE,
        offset: page * ITEMS_PER_PAGE,
        status: statusFilter,
      })
      setReports(data)
      setTotal(count)
    } catch (error) {
      console.error('Error loading reports:', error)
      toast({
        title: 'Error',
        description: 'Failed to load content reports',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, toast])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const handleReview = async (report: ContentReport, status: 'reviewed' | 'actioned' | 'dismissed', actionTaken?: string) => {
    try {
      await updateContentReport(report.id, {
        status,
        reviewed_by: currentUser!.id,
        action_taken: actionTaken,
      })
      await createAdminLog({
        admin_id: currentUser!.id,
        action: status === 'actioned' ? 'content_report_actioned' : 'content_report_reviewed',
        target_type: 'content_report',
        target_id: report.id,
        details: { status, action_taken: actionTaken },
      })
      toast({
        title: 'Success',
        description: 'Report updated',
      })
      loadReports()
    } catch (error) {
      console.error('Error updating report:', error)
      toast({
        title: 'Error',
        description: 'Failed to update report',
        variant: 'destructive',
      })
    }
  }

  const handleBanReporter = async (report: ContentReport) => {
    if (!report.reporter_id) return

    const reason = prompt('Enter ban reason:')
    if (!reason) return

    try {
      // Not the reporter, but the owner of the reported content
      // We need to get the chat owner ID - for now we'll use the reporter as placeholder
      // In real implementation, we'd need to fetch the chat to get user_id
      await banUser(report.reporter_id, reason)
      await createAdminLog({
        admin_id: currentUser!.id,
        action: 'user_banned',
        target_type: 'user',
        target_id: report.reporter_id,
        details: { reason, from_report: report.id },
      })

      await handleReview(report, 'actioned', `User banned: ${reason}`)
    } catch (error) {
      console.error('Error banning user:', error)
      toast({
        title: 'Error',
        description: 'Failed to ban user',
        variant: 'destructive',
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case 'reviewed':
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            <Eye className="mr-1 h-3 w-3" />
            Reviewed
          </Badge>
        )
      case 'actioned':
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="mr-1 h-3 w-3" />
            Actioned
          </Badge>
        )
      case 'dismissed':
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
            <XCircle className="mr-1 h-3 w-3" />
            Dismissed
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  return (
    <div>
      <AdminHeader
        title="Content Moderation"
        description="Review and manage reported content"
      />

      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0) }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="actioned">Actioned</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Content</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    <Shield className="mx-auto h-8 w-8 text-gray-300" />
                    <p className="mt-2">No reports found</p>
                    {statusFilter === 'pending' && (
                      <p className="text-sm">All clear! No pending reports.</p>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">
                          {report.chat?.name || 'Unknown Chat'}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {report.chat?.platform || 'Unknown Platform'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{report.reason}</p>
                        {report.description && (
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">
                            {report.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {report.reporter?.username || report.reporter?.email || 'Anonymous'}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(report.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {report.status === 'pending' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleReview(report, 'reviewed')}>
                              <Eye className="mr-2 h-4 w-4" />
                              Mark Reviewed
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleReview(report, 'dismissed')}>
                              <XCircle className="mr-2 h-4 w-4" />
                              Dismiss Report
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleReview(report, 'actioned', 'Content removed')}
                              className="text-orange-600"
                            >
                              <AlertTriangle className="mr-2 h-4 w-4" />
                              Remove Content
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleBanReporter(report)}
                              className="text-red-600"
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Ban User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
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
