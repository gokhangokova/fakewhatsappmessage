'use client'

import { useAuth } from '@/contexts/auth-context'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Ban } from 'lucide-react'

export function BanDialog() {
  const { banMessage, clearBanMessage } = useAuth()

  return (
    <AlertDialog open={!!banMessage} onOpenChange={(open) => !open && clearBanMessage()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <Ban className="h-5 w-5" />
            Account Suspended
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {banMessage}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={clearBanMessage}>
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
