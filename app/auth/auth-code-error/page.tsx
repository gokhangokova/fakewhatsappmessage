'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Authentication Error</h1>
        <p className="text-muted-foreground">
          There was an error during the authentication process.
        </p>
        <p className="text-sm text-muted-foreground">
          Please try signing in again.
        </p>
        <Button asChild>
          <Link href="/">Go back to home</Link>
        </Button>
      </div>
    </div>
  )
}
