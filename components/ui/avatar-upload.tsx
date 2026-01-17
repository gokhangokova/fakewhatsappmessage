'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Camera, Upload, Trash2, Link, X } from 'lucide-react'
import { Language } from '@/types'
import { useTranslations } from '@/lib/i18n/translations'

interface AvatarUploadProps {
  value: string | null
  onChange: (value: string | null) => void
  fallback: string
  className?: string
  variant?: 'primary' | 'secondary'
  language?: Language
  size?: 'sm' | 'md' | 'lg'
  accentColor?: string
}

// Preset avatar images - using reliable sources
const presetAvatars = [
  // Row 1
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=face',
  // Row 2
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
  // Row 3
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face',
]

// Fallback color avatars (initials)
const presetColors = [
  '#25D366', // WhatsApp green
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#6366F1', // Indigo
]

export function AvatarUpload({
  value,
  onChange,
  fallback,
  className,
  variant = 'primary',
  language = 'en',
  size = 'md',
  accentColor,
}: AvatarUploadProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [urlInput, setUrlInput] = React.useState('')
  const [showUrlInput, setShowUrlInput] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const t = useTranslations(language)

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }
  
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  // Check if value is a color
  const isColorAvatar = value?.startsWith('color:')
  const avatarColor = isColorAvatar && value ? value.replace('color:', '') : accentColor

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        onChange(reader.result as string)
        setIsOpen(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePresetSelect = (url: string) => {
    onChange(url)
    setIsOpen(false)
  }

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim())
      setUrlInput('')
      setShowUrlInput(false)
      setIsOpen(false)
    }
  }

  const handleRemove = () => {
    onChange(null)
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button 
          type="button"
          className={cn('relative group cursor-pointer', className)}
        >
          <Avatar className={cn(sizeClasses[size], "ring-2 ring-transparent hover:ring-primary/50 transition-all")}>
            {value && !isColorAvatar ? (
              <AvatarImage src={value} />
            ) : avatarColor ? (
              <AvatarFallback
                className={cn(textSizeClasses[size], "font-medium text-white")}
                style={{ backgroundColor: avatarColor }}
              >
                {fallback?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            ) : (
              <AvatarFallback
                className={cn(
                  textSizeClasses[size],
                  'font-medium',
                  variant === 'primary'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                )}
              >
                {fallback?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className={cn(size === 'sm' ? 'w-3 h-3' : 'w-4 h-4', "text-white")} />
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 max-h-[70vh] overflow-y-auto" align="start" sideOffset={8}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t.avatar.chooseAvatar}</span>
            {value && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-destructive hover:text-destructive"
                onClick={handleRemove}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                {t.avatar.remove}
              </Button>
            )}
          </div>
          
          {/* Current Avatar Preview */}
          {value && (
            <div className="flex items-center gap-3 p-2 bg-muted rounded-lg">
              <Avatar className="w-12 h-12">
                {isColorAvatar ? (
                  <AvatarFallback
                    className="text-lg font-medium text-white"
                    style={{ backgroundColor: avatarColor || undefined }}
                  >
                    {fallback?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                ) : (
                  <AvatarImage src={value} />
                )}
              </Avatar>
              <span className="text-xs text-muted-foreground">{t.avatar.currentAvatar}</span>
            </div>
          )}

          {/* Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              {t.avatar.upload}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowUrlInput(!showUrlInput)}
            >
              <Link className="w-4 h-4 mr-2" />
              {t.avatar.url}
            </Button>
          </div>

          {/* URL Input */}
          {showUrlInput && (
            <div className="flex gap-2">
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder={t.avatar.pasteImageUrl}
                className="text-sm h-9"
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
              />
              <Button size="sm" className="h-9 px-3" onClick={handleUrlSubmit}>
                {t.avatar.add}
              </Button>
            </div>
          )}

          {/* Preset Avatars */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground font-medium">{t.avatar.selectPhoto}</div>
            <div className="grid grid-cols-4 gap-2">
              {presetAvatars.map((url, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handlePresetSelect(url)}
                  className={cn(
                    'w-[60px] h-[60px] rounded-full overflow-hidden border-2 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary',
                    value === url ? 'border-primary ring-2 ring-primary' : 'border-muted hover:border-primary/50'
                  )}
                >
                  <img 
                    src={url} 
                    alt={`Avatar ${index + 1}`} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Color Options (for initials) */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground font-medium">{t.avatar.orUseInitials}</div>
            <div className="grid grid-cols-8 gap-1.5">
              {presetColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    onChange(`color:${color}`)
                    setIsOpen(false)
                  }}
                  className={cn(
                    "w-7 h-7 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                    value === `color:${color}` && "ring-2 ring-offset-2 ring-primary"
                  )}
                  style={{ backgroundColor: color }}
                  title={`${fallback?.charAt(0).toUpperCase() || 'U'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
