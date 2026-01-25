'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { AuthModal } from '@/components/auth/auth-modal'
import { UserMenu } from '@/components/auth/user-menu'

export function Header() {
  const { user, isLoading, isAdmin } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const pathname = usePathname()

  // Don't show header on admin pages (admin has its own layout)
  if (pathname.startsWith('/admin')) {
    return null
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 md:h-16 items-center px-3 md:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-lg bg-primary text-primary-foreground">
              <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <span className="font-bold text-lg md:text-xl">
              memesocial<span className="text-primary">.app</span>
            </span>
          </Link>

          {/* Right Side Actions */}
          <div className="flex items-center ml-auto space-x-2 md:space-x-4">
            {/* Don't show Upgrade button for admin users */}
            {!isAdmin && (
              <Button variant="default" size="sm" className="rounded-full text-xs md:text-sm h-8 md:h-9 px-3 md:px-4">
                <span className="hidden sm:inline">Upgrade</span>
                <span className="sm:hidden">Pro</span>
              </Button>
            )}

            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <UserMenu />
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="text-xs md:text-sm text-muted-foreground hover:text-foreground"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  )
}
