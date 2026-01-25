'use client'

import { useEffect, useState } from 'react'
import { useSystemSettings } from '@/hooks/use-system-settings'
import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SystemStatusWrapperProps {
  children: React.ReactNode
}

export function SystemStatusWrapper({ children }: SystemStatusWrapperProps) {
  const { settings, isLoading } = useSystemSettings()
  const [dismissedAnnouncement, setDismissedAnnouncement] = useState(false)

  // Check localStorage for dismissed announcement
  useEffect(() => {
    const dismissed = localStorage.getItem('dismissed_announcement')
    if (dismissed) {
      try {
        const { message, timestamp } = JSON.parse(dismissed)
        // Auto-clear dismissed state after 24 hours or if message changed
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000
        if (timestamp > dayAgo && message === settings.announcement.message) {
          setDismissedAnnouncement(true)
        } else {
          localStorage.removeItem('dismissed_announcement')
        }
      } catch {
        localStorage.removeItem('dismissed_announcement')
      }
    }
  }, [settings.announcement.message])

  const handleDismissAnnouncement = () => {
    setDismissedAnnouncement(true)
    localStorage.setItem('dismissed_announcement', JSON.stringify({
      message: settings.announcement.message,
      timestamp: Date.now(),
    }))
  }

  // Show loading state briefly
  if (isLoading) {
    return <>{children}</>
  }

  // Get announcement icon based on type
  const getAnnouncementIcon = () => {
    switch (settings.announcement.type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 flex-shrink-0" />
      case 'success':
        return <CheckCircle className="h-5 w-5 flex-shrink-0" />
      case 'error':
        return <XCircle className="h-5 w-5 flex-shrink-0" />
      default:
        return <Info className="h-5 w-5 flex-shrink-0" />
    }
  }

  // Get announcement colors based on type
  const getAnnouncementColors = () => {
    switch (settings.announcement.type) {
      case 'warning':
        return 'bg-yellow-500 text-yellow-950'
      case 'success':
        return 'bg-green-500 text-green-950'
      case 'error':
        return 'bg-red-500 text-red-950'
      default:
        return 'bg-blue-500 text-blue-950'
    }
  }

  return (
    <>
      {/* Announcement Banner */}
      {settings.announcement.enabled &&
       settings.announcement.message &&
       !dismissedAnnouncement && (
        <div className={`fixed top-0 left-0 right-0 z-[100] ${getAnnouncementColors()}`}>
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2">
            <div className="flex items-center gap-3">
              {getAnnouncementIcon()}
              <p className="text-sm font-medium">
                {settings.announcement.message}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-black/10"
              onClick={handleDismissAnnouncement}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Main content with padding for announcement */}
      <div
        className={
          settings.announcement.enabled && settings.announcement.message && !dismissedAnnouncement
            ? 'pt-10'
            : ''
        }
      >
        {children}
      </div>
    </>
  )
}
