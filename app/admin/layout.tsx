'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Loader2 } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, isAdmin, isLoading } = useAuth()
  const router = useRouter()
  const hasVerifiedAdmin = useRef(false)

  // Debug log
  console.log('[AdminLayout] State:', {
    isLoading,
    hasUser: !!user,
    hasProfile: !!profile,
    profileRole: profile?.role,
    isAdmin,
    hasVerifiedAdmin: hasVerifiedAdmin.current
  })

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) return

    // Wait for profile to load if user exists
    // This prevents redirect during profile fetch
    if (user && !profile) {
      console.log('[AdminLayout] Waiting for profile to load...')
      return
    }

    // Redirect if not logged in
    if (!user) {
      console.log('[AdminLayout] No user, redirecting...')
      router.push('/')
      return
    }

    // Redirect if not admin (only if profile is loaded)
    if (profile && !isAdmin) {
      console.log('[AdminLayout] Not admin, redirecting...')
      router.push('/')
      return
    }

    // Mark as verified once we confirm admin access
    if (isAdmin) {
      hasVerifiedAdmin.current = true
    }
  }, [user, profile, isAdmin, isLoading, router])

  // Show loading while checking auth or waiting for profile
  if (isLoading || (user && !profile)) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-[#128C7E]" />
      </div>
    )
  }

  // Don't render admin if not authorized
  // But if we've already verified admin, don't show access denied during re-renders
  if (!user || (!isAdmin && !hasVerifiedAdmin.current)) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#075E54]">Access Denied</h1>
          <p className="mt-2 text-[#128C7E]">You don&apos;t have permission to access this area.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-gray-100 pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}
