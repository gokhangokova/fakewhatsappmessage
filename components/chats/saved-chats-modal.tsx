'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useSavedChats } from '@/hooks/use-saved-chats'
import { useAuth } from '@/contexts/auth-context'
import { ChatData, ChatRow } from '@/lib/supabase/chats'
import {
  MessageSquare,
  Users,
  Trash2,
  Loader2,
  Plus,
  FolderOpen,
  Crown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SavedChatsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoadChat: (chatData: ChatData) => void
  onNewChat: () => void
}

export function SavedChatsModal({
  open,
  onOpenChange,
  onLoadChat,
  onNewChat,
}: SavedChatsModalProps) {
  const { profile } = useAuth()
  const {
    savedChats,
    currentChatId,
    isLoading,
    loadChat,
    removeChat,
    setCurrentChatId,
    remainingChats,
    chatCount,
  } = useSavedChats()

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleLoadChat = async (chatId: string) => {
    const chatData = await loadChat(chatId)
    if (chatData) {
      onLoadChat(chatData)
      onOpenChange(false)
    }
  }

  const handleDeleteChat = async () => {
    if (!deleteConfirmId) return

    setIsDeleting(true)
    try {
      await removeChat(deleteConfirmId)
    } finally {
      setIsDeleting(false)
      setDeleteConfirmId(null)
    }
  }

  const handleNewChat = () => {
    setCurrentChatId(null)
    onNewChat()
    onOpenChange(false)
  }

  const isFreeTier = profile?.subscription_tier === 'free'
  const canCreateNew = remainingChats === null || remainingChats > 0

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              My Chats
            </DialogTitle>
            <DialogDescription>
              {isFreeTier ? (
                <span className="flex items-center gap-1">
                  {chatCount} / 2 chats used
                  {remainingChats === 0 && (
                    <span className="text-amber-600 ml-2">
                      (Limit reached - <Crown className="inline w-3 h-3" /> Upgrade for more)
                    </span>
                  )}
                </span>
              ) : (
                <span>{chatCount} saved chats</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* New Chat Button */}
            <Button
              onClick={handleNewChat}
              disabled={!canCreateNew}
              className="w-full"
              variant={canCreateNew ? 'default' : 'secondary'}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
              {!canCreateNew && isFreeTier && (
                <Crown className="w-4 h-4 ml-2 text-amber-500" />
              )}
            </Button>

            {/* Chat List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : savedChats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No saved chats yet</p>
                <p className="text-sm mt-1">Create your first chat to get started</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {savedChats.map((chat) => (
                    <ChatListItem
                      key={chat.id}
                      chat={chat}
                      isActive={currentChatId === chat.id}
                      onLoad={() => handleLoadChat(chat.id)}
                      onDelete={() => setDeleteConfirmId(chat.id)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChat}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Individual chat list item
function ChatListItem({
  chat,
  isActive,
  onLoad,
  onDelete,
}: {
  chat: ChatRow
  isActive: boolean
  onLoad: () => void
  onDelete: () => void
}) {
  const isGroupChat = chat.data.groupSettings?.isGroupChat

  return (
    <div
      className={cn(
        'group flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
        isActive
          ? 'bg-primary/5 border-primary/20'
          : 'bg-card hover:bg-accent border-transparent'
      )}
      onClick={onLoad}
    >
      {/* Icon */}
      <div className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center',
        isGroupChat ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
      )}>
        {isGroupChat ? (
          <Users className="w-5 h-5" />
        ) : (
          <MessageSquare className="w-5 h-5" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">
          {chat.name}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span className="capitalize">{chat.platform}</span>
          <span>•</span>
          <span>{format(new Date(chat.updated_at), 'MMM d, yyyy')}</span>
        </div>
      </div>

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="icon"
        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-red-600"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
}
