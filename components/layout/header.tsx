'use client'

import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
            <MessageSquare className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl">FakeSocial</span>
        </Link>

        {/* Right Side Actions */}
        <div className="flex items-center ml-auto space-x-4">
          <Button variant="default" size="sm" className="rounded-full">
            Upgrade
          </Button>
          <Link href="/sign-in" className="text-sm text-muted-foreground hover:text-foreground">
            Sign In
          </Link>
        </div>
      </div>
    </header>
  )
}
