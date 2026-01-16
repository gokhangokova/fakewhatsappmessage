'use client'

import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 md:h-16 items-center px-3 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-lg bg-primary text-primary-foreground">
            <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <span className="font-bold text-lg md:text-xl">
            <span className="hidden sm:inline">FakeSocial</span>
            <span className="sm:hidden">FS</span>
            <span className="text-primary">.io</span>
          </span>
        </Link>

        {/* Right Side Actions */}
        <div className="flex items-center ml-auto space-x-2 md:space-x-4">
          <Button variant="default" size="sm" className="rounded-full text-xs md:text-sm h-8 md:h-9 px-3 md:px-4">
            <span className="hidden sm:inline">Upgrade</span>
            <span className="sm:hidden">Pro</span>
          </Button>
          <Link href="/sign-in" className="text-xs md:text-sm text-muted-foreground hover:text-foreground hidden sm:block">
            Sign In
          </Link>
        </div>
      </div>
    </header>
  )
}
