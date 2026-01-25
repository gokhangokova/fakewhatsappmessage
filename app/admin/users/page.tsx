'use client'

import { useEffect, useState, useCallback } from 'react'
import { AdminHeader } from '@/components/admin/admin-header'
import { getUsers, updateUserTier, updateUserRole, banUser, unbanUser } from '@/lib/admin/queries'
import { createAdminLog } from '@/lib/admin/queries'
import { AdminProfile, SubscriptionTier, UserRole } from '@/types'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  MoreHorizontal,
  Crown,
  Building2,
  Shield,
  Ban,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const ITEMS_PER_PAGE = 10

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const { toast } = useToast()

  const [users, setUsers] = useState<AdminProfile[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const { users: data, total: count } = await getUsers({
        limit: ITEMS_PER_PAGE,
        offset: page * ITEMS_PER_PAGE,
        search: search || undefined,
        tier: tierFilter,
        role: roleFilter,
      })
      setUsers(data)
      setTotal(count)
    } catch (error) {
      console.error('Error loading users:', error)
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [page, search, tierFilter, roleFilter, toast])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleTierChange = async (userId: string, newTier: SubscriptionTier) => {
    try {
      await updateUserTier(userId, newTier)
      await createAdminLog({
        admin_id: currentUser!.id,
        action: 'user_tier_changed',
        target_type: 'user',
        target_id: userId,
        details: { new_tier: newTier },
      })
      toast({
        title: 'Success',
        description: 'User tier updated',
      })
      loadUsers()
    } catch (error) {
      console.error('Error updating tier:', error)
      toast({
        title: 'Error',
        description: 'Failed to update user tier',
        variant: 'destructive',
      })
    }
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateUserRole(userId, newRole)
      await createAdminLog({
        admin_id: currentUser!.id,
        action: 'user_role_changed',
        target_type: 'user',
        target_id: userId,
        details: { new_role: newRole },
      })
      toast({
        title: 'Success',
        description: 'User role updated',
      })
      loadUsers()
    } catch (error) {
      console.error('Error updating role:', error)
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      })
    }
  }

  const handleBan = async (userId: string) => {
    const reason = prompt('Enter ban reason:')
    if (!reason) return

    try {
      await banUser(userId, reason)
      await createAdminLog({
        admin_id: currentUser!.id,
        action: 'user_banned',
        target_type: 'user',
        target_id: userId,
        details: { reason },
      })
      toast({
        title: 'Success',
        description: 'User banned',
      })
      loadUsers()
    } catch (error) {
      console.error('Error banning user:', error)
      toast({
        title: 'Error',
        description: 'Failed to ban user',
        variant: 'destructive',
      })
    }
  }

  const handleUnban = async (userId: string) => {
    try {
      await unbanUser(userId)
      await createAdminLog({
        admin_id: currentUser!.id,
        action: 'user_unbanned',
        target_type: 'user',
        target_id: userId,
      })
      toast({
        title: 'Success',
        description: 'User unbanned',
      })
      loadUsers()
    } catch (error) {
      console.error('Error unbanning user:', error)
      toast({
        title: 'Error',
        description: 'Failed to unban user',
        variant: 'destructive',
      })
    }
  }

  const getTierBadge = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'pro':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            <Crown className="mr-1 h-3 w-3" />
            Pro
          </Badge>
        )
      case 'business':
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            <Building2 className="mr-1 h-3 w-3" />
            Business
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">Free</Badge>
        )
    }
  }

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return (
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
            <Shield className="mr-1 h-3 w-3" />
            Super Admin
          </Badge>
        )
      case 'admin':
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            <Shield className="mr-1 h-3 w-3" />
            Admin
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            <User className="mr-1 h-3 w-3" />
            User
          </Badge>
        )
    }
  }

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  return (
    <div>
      <AdminHeader
        title="Users"
        description={`${total} total users`}
      />

      <div className="p-6 pb-12 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by email or username..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              className="pl-9"
            />
          </div>

          <Select value={tierFilter} onValueChange={(v) => { setTierFilter(v); setPage(0) }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="business">Business</SelectItem>
            </SelectContent>
          </Select>

          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(0) }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
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
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>
                            {user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.username || 'No name'}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getTierBadge(user.subscription_tier)}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      {user.is_banned ? (
                        <Badge variant="destructive">
                          <Ban className="mr-1 h-3 w-3" />
                          Banned
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Change Tier</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleTierChange(user.id, 'free')}>
                            <User className="mr-2 h-4 w-4 text-gray-600" />
                            Free
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTierChange(user.id, 'pro')}>
                            <Crown className="mr-2 h-4 w-4 text-emerald-600" />
                            Pro
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTierChange(user.id, 'business')}>
                            <Building2 className="mr-2 h-4 w-4 text-blue-600" />
                            Business
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'user')}>
                            <User className="mr-2 h-4 w-4 text-gray-600" />
                            User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'admin')}>
                            <Shield className="mr-2 h-4 w-4 text-blue-600" />
                            Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'super_admin')}>
                            <Shield className="mr-2 h-4 w-4 text-purple-600" />
                            Super Admin
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />
                          {user.is_banned ? (
                            <DropdownMenuItem onClick={() => handleUnban(user.id)}>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                              Unban User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleBan(user.id)}
                              className="text-red-600"
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Ban User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
