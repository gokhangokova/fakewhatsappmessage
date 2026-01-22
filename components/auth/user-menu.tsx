'use client'

import { useAuth } from '@/contexts/auth-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { LogOut, User, CreditCard, Loader2 } from 'lucide-react'
import { useState } from 'react'

export function UserMenu() {
  const { user, profile, signOut, isLoading } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
    )
  }

  if (!user) {
    return null
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
      setIsOpen(false)
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setIsSigningOut(false)
    }
  }

  const displayName = profile?.username || user.email?.split('@')[0] || 'User'
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-8 w-8 rounded-full"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <div className="flex items-center gap-3 p-2 mb-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">{displayName}</span>
            <span className="text-xs text-muted-foreground truncate">
              {user.email}
            </span>
          </div>
        </div>

        <div className="border-t my-1" />

        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start h-9 px-2"
            size="sm"
          >
            <User className="mr-2 h-4 w-4" />
            Profile
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start h-9 px-2"
            size="sm"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Subscription
            <span className="ml-auto text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
              {profile?.subscription_tier || 'free'}
            </span>
          </Button>
        </div>

        <div className="border-t my-1" />

        <Button
          variant="ghost"
          className="w-full justify-start h-9 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          size="sm"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          Sign out
        </Button>
      </PopoverContent>
    </Popover>
  )
}
