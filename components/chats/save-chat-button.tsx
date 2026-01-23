'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSavedChats } from '@/hooks/use-saved-chats'
import { useAuth } from '@/contexts/auth-context'
import { ChatData } from '@/lib/supabase/chats'
import { toast } from '@/hooks/use-toast'
import {
  Save,
  Loader2,
  ChevronDown,
  FilePlus,
  Crown,
} from 'lucide-react'

interface SaveChatButtonProps {
  getChatData: () => ChatData
  onAuthRequired: () => void
  className?: string
}

export function SaveChatButton({
  getChatData,
  onAuthRequired,
  className,
}: SaveChatButtonProps) {
  const { user, profile } = useAuth()
  const { saveChat, saveAsNewChat, currentChatId, isSaving, remainingChats } = useSavedChats()
  const [isOpen, setIsOpen] = useState(false)

  const handleSave = async () => {
    if (!user) {
      onAuthRequired()
      return
    }

    try {
      const chatData = getChatData()
      await saveChat(chatData)
      toast({
        title: 'Chat saved',
        description: currentChatId ? 'Your changes have been saved.' : 'New chat created successfully.',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save chat'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    }
  }

  const handleSaveAsNew = async () => {
    if (!user) {
      onAuthRequired()
      return
    }

    // Check if can create new
    if (remainingChats !== null && remainingChats <= 0) {
      toast({
        title: 'Limit reached',
        description: 'Upgrade to Pro for unlimited chats.',
        variant: 'destructive',
      })
      return
    }

    try {
      const chatData = getChatData()
      await saveAsNewChat(chatData)
      toast({
        title: 'Chat saved',
        description: 'New chat created successfully.',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save chat'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    }
  }

  // If user is not logged in, show simple sign in prompt
  if (!user) {
    return (
      <Button
        onClick={onAuthRequired}
        variant="outline"
        size="sm"
        className={className}
      >
        <Save className="w-4 h-4 mr-2" />
        Save
      </Button>
    )
  }

  // If editing an existing chat, show dropdown with "Save" and "Save as New"
  if (currentChatId) {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={className}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save
            <ChevronDown className="w-3 h-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSaveAsNew}
            disabled={isSaving || (remainingChats !== null && remainingChats <= 0)}
          >
            <FilePlus className="w-4 h-4 mr-2" />
            Save as New Chat
            {remainingChats !== null && remainingChats <= 0 && (
              <Crown className="w-3 h-3 ml-2 text-amber-500" />
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // New chat - simple save button
  return (
    <Button
      onClick={handleSave}
      variant="outline"
      size="sm"
      className={className}
      disabled={isSaving || (remainingChats !== null && remainingChats <= 0)}
    >
      {isSaving ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Save className="w-4 h-4 mr-2" />
      )}
      Save
      {remainingChats !== null && remainingChats <= 0 && (
        <Crown className="w-3 h-3 ml-1 text-amber-500" />
      )}
    </Button>
  )
}
