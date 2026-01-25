'use client'

import { useAuth } from '@/contexts/auth-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { LogOut, User, Shield } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

interface AdminHeaderProps {
  title: string
  description?: string
}

export function AdminHeader({ title, description }: AdminHeaderProps) {
  const { user, profile, signOut, isAdmin, isSuperAdmin } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const displayName = profile?.username || user?.email?.split('@')[0] || 'Admin'
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url
  const initials = displayName.slice(0, 2).toUpperCase()

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[#128C7E]/20 bg-[#128C7E] px-6">
      <div>
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        {description && (
          <p className="text-sm text-white/70">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Role Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isSuperAdmin
                ? 'bg-[#25D366] text-white'
                : 'bg-white/20 text-white'
            }`}
          >
            <Shield className="h-3 w-3" />
            {isSuperAdmin ? 'Super Admin' : 'Admin'}
          </span>
        </div>

        {/* User Menu */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-white/10">
              <Avatar className="h-9 w-9 ring-2 ring-white/30">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="bg-[#25D366] text-white text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="end">
            <div className="flex items-center gap-3 p-2 mb-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="bg-[#128C7E] text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate">{displayName}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </span>
              </div>
            </div>

            <div className="border-t my-1" />

            <Link href="/profile" onClick={() => setIsOpen(false)}>
              <Button
                variant="ghost"
                className="w-full justify-start h-9 px-2"
                size="sm"
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </Button>
            </Link>

            <div className="border-t my-1" />

            <Button
              variant="ghost"
              className="w-full justify-start h-9 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              size="sm"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  )
}
