'use client'

import { useEffect } from 'react'
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

  // Debug log
  console.log('[AdminLayout] State:', {
    isLoading,
    hasUser: !!user,
    hasProfile: !!profile,
    profileRole: profile?.role,
    isAdmin
  })

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) return

    // Redirect if not logged in
    if (!user) {
      router.push('/')
      return
    }

    // Redirect if not admin
    if (!isAdmin) {
      router.push('/')
      return
    }
  }, [user, isAdmin, isLoading, router])

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  // Don't render admin if not authorized
  if (!user || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-gray-500">You don&apos;t have permission to access this area.</p>
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
        <main className="flex-1 overflow-y-auto bg-gray-100">
          {children}
        </main>
      </div>
    </div>
  )
}
