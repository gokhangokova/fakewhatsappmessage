'use client'

import { useState, useRef, useEffect } from 'react'
import { WhatsAppSettings, WhatsAppBackgroundType, WHATSAPP_BG_COLORS, WHATSAPP_BG_IMAGES } from '@/types'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Settings2,
  Palette,
  Info,
  X,
  Upload,
  ChevronDown,
  RotateCcw,
  MessageCircle,
  Smartphone,
} from 'lucide-react'

// Debounced Input Component
function DebouncedInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  const [localValue, setLocalValue] = useState(value)
  
  useEffect(() => {
    setLocalValue(value)
  }, [value])
  
  const handleBlur = () => {
    if (localValue !== value) {
      onChange(localValue)
    }
  }
  
  return (
    <Input
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  )
}

// Background Image Uploader
const BackgroundImageUploader = ({
  imageUrl,
  onChange,
}: {
  imageUrl?: string
  onChange: (url?: string) => void
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        onChange(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-3">
      {imageUrl && (
        <div className="relative">
          <img 
            src={imageUrl} 
            alt="Background" 
            className="w-full h-20 object-cover rounded-lg"
          />
          <button
            onClick={() => onChange(undefined)}
            className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full bg-[#2a2a2a] border-[#3a3a3a] text-[#c5c5a5] hover:bg-[#3a3a3a] hover:text-[#d5e5a5]"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-4 h-4 mr-2" />
        {imageUrl ? 'Change' : 'Upload'}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      
      <div className="grid grid-cols-3 gap-1">
        {WHATSAPP_BG_IMAGES.map((url, i) => (
          <button
            key={i}
            onClick={() => onChange(url)}
            className={cn(
              "aspect-[3/4] rounded overflow-hidden transition-all",
              imageUrl === url ? "ring-2 ring-[#c5e5a5]" : "hover:ring-2 ring-[#5a5a5a]"
            )}
          >
            <img src={url} alt={`Preset ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}

interface FloatingSettingsProps {
  isOpen: boolean
  onClose: () => void
  darkMode: boolean
  setDarkMode: (value: boolean) => void
  mobileView: boolean
  setMobileView: (value: boolean) => void
  timeFormat: '12h' | '24h'
  setTimeFormat: (value: '12h' | '24h') => void
  transparentBg: boolean
  setTransparentBg: (value: boolean) => void
  whatsappSettings?: WhatsAppSettings
  setWhatsAppSettings?: (settings: Partial<WhatsAppSettings>) => void
  onReset?: () => void
}

export function FloatingSettings({
  isOpen,
  onClose,
  darkMode,
  setDarkMode,
  mobileView,
  setMobileView,
  timeFormat,
  setTimeFormat,
  transparentBg,
  setTransparentBg,
  whatsappSettings,
  setWhatsAppSettings,
  onReset,
}: FloatingSettingsProps) {
  const [activeSection, setActiveSection] = useState<'appearance' | 'whatsapp' | 'about' | null>('appearance')
  
  if (!isOpen) return null
  
  const backgroundType = whatsappSettings?.backgroundType || 'doodle'

  return (
    <div className="fixed top-20 right-4 z-50 w-80 animate-in slide-in-from-right-5 duration-200">
      <div className="bg-[#1a1a1a] rounded-2xl shadow-2xl border border-[#2a2a2a] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#c5e5a5]/20 flex items-center justify-center">
              <Settings2 className="w-4 h-4 text-[#c5e5a5]" />
            </div>
            <div>
              <span className="text-white font-medium">Settings</span>
              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-[#c5e5a5]/20 text-[#c5e5a5] font-medium">
                PREVIEW
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#2a2a2a] text-[#808080] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Appearance Section */}
          <button
            onClick={() => setActiveSection(activeSection === 'appearance' ? null : 'appearance')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
              activeSection === 'appearance'
                ? "bg-[#c5e5a5] text-[#1a1a1a]"
                : "bg-[#2a2a2a] text-[#a0a0a0] hover:bg-[#3a3a3a] hover:text-white"
            )}
          >
            <Palette className="w-5 h-5" />
            <span className="font-medium">Appearance</span>
            <ChevronDown className={cn(
              "w-4 h-4 ml-auto transition-transform",
              activeSection === 'appearance' && "rotate-180"
            )} />
          </button>
          
          {activeSection === 'appearance' && (
            <div className="px-2 py-3 space-y-4 animate-in slide-in-from-top-2 duration-200">
              {/* View Toggle */}
              <div className="space-y-2">
                <Label className="text-xs text-[#808080] uppercase tracking-wider">View</Label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMobileView(false)}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
                      !mobileView
                        ? 'bg-[#c5e5a5] text-[#1a1a1a]'
                        : 'bg-[#2a2a2a] text-[#808080] hover:bg-[#3a3a3a] hover:text-white'
                    )}
                  >
                    <Smartphone className="w-4 h-4 rotate-90" />
                    Desktop
                  </button>
                  <button
                    onClick={() => setMobileView(true)}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
                      mobileView
                        ? 'bg-[#c5e5a5] text-[#1a1a1a]'
                        : 'bg-[#2a2a2a] text-[#808080] hover:bg-[#3a3a3a] hover:text-white'
                    )}
                  >
                    <Smartphone className="w-4 h-4" />
                    Mobile
                  </button>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#2a2a2a]">
                  <span className="text-sm text-[#c0c0c0]">Dark Mode</span>
                  <Switch 
                    checked={darkMode} 
                    onCheckedChange={setDarkMode}
                    className="data-[state=checked]:bg-[#c5e5a5]"
                  />
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#2a2a2a]">
                  <span className="text-sm text-[#c0c0c0]">Transparent BG</span>
                  <Switch 
                    checked={transparentBg} 
                    onCheckedChange={setTransparentBg}
                    className="data-[state=checked]:bg-[#c5e5a5]"
                  />
                </div>
              </div>

              {/* Time Format */}
              <div className="space-y-2">
                <Label className="text-xs text-[#808080] uppercase tracking-wider">Time Format</Label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTimeFormat('12h')}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                      timeFormat === '12h'
                        ? 'bg-[#c5e5a5] text-[#1a1a1a]'
                        : 'bg-[#2a2a2a] text-[#808080] hover:bg-[#3a3a3a] hover:text-white'
                    )}
                  >
                    12h
                  </button>
                  <button
                    onClick={() => setTimeFormat('24h')}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                      timeFormat === '24h'
                        ? 'bg-[#c5e5a5] text-[#1a1a1a]'
                        : 'bg-[#2a2a2a] text-[#808080] hover:bg-[#3a3a3a] hover:text-white'
                    )}
                  >
                    24h
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* WhatsApp Section */}
          {whatsappSettings && setWhatsAppSettings && (
            <>
              <button
                onClick={() => setActiveSection(activeSection === 'whatsapp' ? null : 'whatsapp')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                  activeSection === 'whatsapp'
                    ? "bg-[#c5e5a5] text-[#1a1a1a]"
                    : "bg-[#2a2a2a] text-[#a0a0a0] hover:bg-[#3a3a3a] hover:text-white"
                )}
              >
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">WhatsApp</span>
                <ChevronDown className={cn(
                  "w-4 h-4 ml-auto transition-transform",
                  activeSection === 'whatsapp' && "rotate-180"
                )} />
              </button>
              
              {activeSection === 'whatsapp' && (
                <div className="px-2 py-3 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  {/* Status */}
                  <div className="space-y-2">
                    <Label className="text-xs text-[#808080] uppercase tracking-wider">Status</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['online', 'typing', 'last-seen', 'none'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => setWhatsAppSettings({ lastSeen: status })}
                          className={cn(
                            'px-3 py-2 rounded-lg text-xs font-medium transition-all capitalize',
                            whatsappSettings.lastSeen === status
                              ? 'bg-[#c5e5a5] text-[#1a1a1a]'
                              : 'bg-[#2a2a2a] text-[#808080] hover:bg-[#3a3a3a] hover:text-white'
                          )}
                        >
                          {status === 'last-seen' ? 'Last Seen' : status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Background Type */}
                  <div className="space-y-2">
                    <Label className="text-xs text-[#808080] uppercase tracking-wider">Background</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['solid', 'doodle', 'image'] as WhatsAppBackgroundType[]).map((type) => (
                        <button
                          key={type}
                          onClick={() => setWhatsAppSettings({ backgroundType: type })}
                          className={cn(
                            'px-3 py-2 rounded-lg text-xs font-medium transition-all capitalize',
                            backgroundType === type
                              ? 'bg-[#c5e5a5] text-[#1a1a1a]'
                              : 'bg-[#2a2a2a] text-[#808080] hover:bg-[#3a3a3a] hover:text-white'
                          )}
                        >
                          {type === 'doodle' ? 'Pattern' : type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Selector for solid/doodle */}
                  {(backgroundType === 'solid' || backgroundType === 'doodle') && (
                    <div className="space-y-2">
                      <Label className="text-xs text-[#808080] uppercase tracking-wider">Color</Label>
                      <div className="grid grid-cols-6 gap-2">
                        {WHATSAPP_BG_COLORS.slice(0, 6).map((color) => (
                          <button
                            key={color}
                            onClick={() => setWhatsAppSettings({ backgroundColor: color })}
                            className={cn(
                              'w-full aspect-square rounded-lg border-2 transition-all',
                              whatsappSettings.backgroundColor === color
                                ? 'border-[#c5e5a5] scale-110'
                                : 'border-transparent hover:border-[#5a5a5a]'
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pattern Opacity for doodle */}
                  {backgroundType === 'doodle' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-[#808080] uppercase tracking-wider">Pattern</Label>
                        <span className="text-xs text-[#c5e5a5]">
                          {Math.round((whatsappSettings.doodleOpacity || 0.06) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.02"
                        max="0.2"
                        step="0.02"
                        value={whatsappSettings.doodleOpacity || 0.06}
                        onChange={(e) => setWhatsAppSettings({ doodleOpacity: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-[#c5e5a5]"
                      />
                    </div>
                  )}

                  {/* Image Background */}
                  {backgroundType === 'image' && (
                    <BackgroundImageUploader
                      imageUrl={whatsappSettings.backgroundImage}
                      onChange={(url) => setWhatsAppSettings({ backgroundImage: url })}
                    />
                  )}

                  {/* Encryption Notice */}
                  <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#2a2a2a]">
                    <span className="text-sm text-[#c0c0c0]">Encryption Notice</span>
                    <Switch 
                      checked={whatsappSettings.showEncryptionNotice}
                      onCheckedChange={(checked) => setWhatsAppSettings({ showEncryptionNotice: checked })}
                      className="data-[state=checked]:bg-[#c5e5a5]"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* About Section */}
          <button
            onClick={() => setActiveSection(activeSection === 'about' ? null : 'about')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
              activeSection === 'about'
                ? "bg-[#c5e5a5] text-[#1a1a1a]"
                : "bg-[#2a2a2a] text-[#a0a0a0] hover:bg-[#3a3a3a] hover:text-white"
            )}
          >
            <Info className="w-5 h-5" />
            <span className="font-medium">About</span>
            <ChevronDown className={cn(
              "w-4 h-4 ml-auto transition-transform",
              activeSection === 'about' && "rotate-180"
            )} />
          </button>
          
          {activeSection === 'about' && (
            <div className="px-2 py-3 animate-in slide-in-from-top-2 duration-200">
              <p className="text-sm text-[#808080] leading-relaxed">
                FakeSocialMessage is a free tool to create realistic fake chat
                screenshots for social media platforms.
              </p>
              <p className="text-xs text-[#606060] mt-2">
                Your changes are automatically saved to your browser.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {onReset && (
          <div className="p-3 border-t border-[#2a2a2a]">
            <Button
              onClick={onReset}
              variant="outline"
              size="sm"
              className="w-full bg-[#2a2a2a] border-[#3a3a3a] text-[#808080] hover:bg-[#3a3a3a] hover:text-white"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
