'use client'

import { useState, useRef } from 'react'
import { WhatsAppSettings, WhatsAppBackgroundType, WHATSAPP_BG_COLORS, WHATSAPP_BG_IMAGES } from '@/types'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
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
  Monitor,
  Moon,
  Sun,
  FlaskConical,
} from 'lucide-react'

interface SettingsPanelProps {
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
        className="w-full bg-[#2a2a2a] border-[#3a3a3a] text-[#b8d4a8] hover:bg-[#3a3a3a] hover:text-[#c8e4b8]"
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
              imageUrl === url ? "ring-2 ring-[#b8d4a8]" : "hover:ring-2 ring-[#4a4a4a]"
            )}
          >
            <img src={url} alt={`Preset ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}

export function SettingsPanel({
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
}: SettingsPanelProps) {
  const [activeSection, setActiveSection] = useState<'appearance' | 'whatsapp' | 'about' | null>('appearance')
  
  if (!isOpen) return null
  
  const backgroundType = whatsappSettings?.backgroundType || 'doodle'

  return (
    <div className="fixed top-20 right-4 z-50 w-[320px] animate-in slide-in-from-right-5 fade-in duration-300">
      <div className="bg-[#1c1c1c] rounded-2xl shadow-2xl border border-[#2a2a2a] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#b8d4a8]/20 to-[#8ab87a]/10 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-[#b8d4a8]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-lg">Settings</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#b8d4a8]/20 text-[#b8d4a8] font-medium tracking-wide">
                PREVIEW
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[#2a2a2a] text-[#606060] hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 space-y-2 max-h-[calc(100vh-180px)] overflow-y-auto scrollbar-thin">
          {/* Appearance Section */}
          <button
            onClick={() => setActiveSection(activeSection === 'appearance' ? null : 'appearance')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all",
              activeSection === 'appearance'
                ? "bg-[#b8d4a8] text-[#1a1a1a] shadow-lg shadow-[#b8d4a8]/20"
                : "bg-[#252525] text-[#909090] hover:bg-[#2a2a2a] hover:text-white"
            )}
          >
            <Palette className="w-5 h-5" />
            <span className="font-medium">Appearance</span>
            <ChevronDown className={cn(
              "w-4 h-4 ml-auto transition-transform duration-200",
              activeSection === 'appearance' && "rotate-180"
            )} />
          </button>
          
          {activeSection === 'appearance' && (
            <div className="px-3 py-4 space-y-5 animate-in slide-in-from-top-2 fade-in duration-200">
              {/* View Toggle */}
              <div className="space-y-2.5">
                <Label className="text-[11px] text-[#606060] uppercase tracking-widest font-medium">View Mode</Label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMobileView(false)}
                    className={cn(
                      'flex-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2',
                      !mobileView
                        ? 'bg-[#b8d4a8] text-[#1a1a1a] shadow-lg shadow-[#b8d4a8]/20'
                        : 'bg-[#252525] text-[#707070] hover:bg-[#2a2a2a] hover:text-white'
                    )}
                  >
                    <Monitor className="w-4 h-4" />
                    Desktop
                  </button>
                  <button
                    onClick={() => setMobileView(true)}
                    className={cn(
                      'flex-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2',
                      mobileView
                        ? 'bg-[#b8d4a8] text-[#1a1a1a] shadow-lg shadow-[#b8d4a8]/20'
                        : 'bg-[#252525] text-[#707070] hover:bg-[#2a2a2a] hover:text-white'
                    )}
                  >
                    <Smartphone className="w-4 h-4" />
                    Mobile
                  </button>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2">
                <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[#252525]">
                  <div className="flex items-center gap-3">
                    {darkMode ? <Moon className="w-4 h-4 text-[#b8d4a8]" /> : <Sun className="w-4 h-4 text-[#707070]" />}
                    <span className="text-sm text-[#c0c0c0]">Dark Mode</span>
                  </div>
                  <Switch 
                    checked={darkMode} 
                    onCheckedChange={setDarkMode}
                    className="data-[state=checked]:bg-[#b8d4a8]"
                  />
                </div>
                <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[#252525]">
                  <span className="text-sm text-[#c0c0c0]">Transparent Background</span>
                  <Switch 
                    checked={transparentBg} 
                    onCheckedChange={setTransparentBg}
                    className="data-[state=checked]:bg-[#b8d4a8]"
                  />
                </div>
              </div>

              {/* Time Format */}
              <div className="space-y-2.5">
                <Label className="text-[11px] text-[#606060] uppercase tracking-widest font-medium">Time Format</Label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTimeFormat('12h')}
                    className={cn(
                      'flex-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                      timeFormat === '12h'
                        ? 'bg-[#b8d4a8] text-[#1a1a1a] shadow-lg shadow-[#b8d4a8]/20'
                        : 'bg-[#252525] text-[#707070] hover:bg-[#2a2a2a] hover:text-white'
                    )}
                  >
                    12 Hour
                  </button>
                  <button
                    onClick={() => setTimeFormat('24h')}
                    className={cn(
                      'flex-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                      timeFormat === '24h'
                        ? 'bg-[#b8d4a8] text-[#1a1a1a] shadow-lg shadow-[#b8d4a8]/20'
                        : 'bg-[#252525] text-[#707070] hover:bg-[#2a2a2a] hover:text-white'
                    )}
                  >
                    24 Hour
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
                  "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all",
                  activeSection === 'whatsapp'
                    ? "bg-[#b8d4a8] text-[#1a1a1a] shadow-lg shadow-[#b8d4a8]/20"
                    : "bg-[#252525] text-[#909090] hover:bg-[#2a2a2a] hover:text-white"
                )}
              >
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">WhatsApp</span>
                <ChevronDown className={cn(
                  "w-4 h-4 ml-auto transition-transform duration-200",
                  activeSection === 'whatsapp' && "rotate-180"
                )} />
              </button>
              
              {activeSection === 'whatsapp' && (
                <div className="px-3 py-4 space-y-5 animate-in slide-in-from-top-2 fade-in duration-200">
                  {/* Status */}
                  <div className="space-y-2.5">
                    <Label className="text-[11px] text-[#606060] uppercase tracking-widest font-medium">Online Status</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['online', 'typing', 'last-seen', 'none'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => setWhatsAppSettings({ lastSeen: status })}
                          className={cn(
                            'px-3 py-2.5 rounded-xl text-xs font-medium transition-all capitalize',
                            whatsappSettings.lastSeen === status
                              ? 'bg-[#b8d4a8] text-[#1a1a1a] shadow-lg shadow-[#b8d4a8]/20'
                              : 'bg-[#252525] text-[#707070] hover:bg-[#2a2a2a] hover:text-white'
                          )}
                        >
                          {status === 'last-seen' ? 'Last Seen' : status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Background Type */}
                  <div className="space-y-2.5">
                    <Label className="text-[11px] text-[#606060] uppercase tracking-widest font-medium">Background Style</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['solid', 'doodle', 'image'] as WhatsAppBackgroundType[]).map((type) => (
                        <button
                          key={type}
                          onClick={() => setWhatsAppSettings({ backgroundType: type })}
                          className={cn(
                            'px-3 py-2.5 rounded-xl text-xs font-medium transition-all capitalize',
                            backgroundType === type
                              ? 'bg-[#b8d4a8] text-[#1a1a1a] shadow-lg shadow-[#b8d4a8]/20'
                              : 'bg-[#252525] text-[#707070] hover:bg-[#2a2a2a] hover:text-white'
                          )}
                        >
                          {type === 'doodle' ? 'Pattern' : type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Selector for solid/doodle */}
                  {(backgroundType === 'solid' || backgroundType === 'doodle') && (
                    <div className="space-y-2.5">
                      <Label className="text-[11px] text-[#606060] uppercase tracking-widest font-medium">Background Color</Label>
                      <div className="grid grid-cols-6 gap-2">
                        {WHATSAPP_BG_COLORS.slice(0, 6).map((color) => (
                          <button
                            key={color}
                            onClick={() => setWhatsAppSettings({ backgroundColor: color })}
                            className={cn(
                              'w-full aspect-square rounded-lg border-2 transition-all hover:scale-110',
                              whatsappSettings.backgroundColor === color
                                ? 'border-[#b8d4a8] scale-110 shadow-lg'
                                : 'border-transparent hover:border-[#4a4a4a]'
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pattern Opacity for doodle */}
                  {backgroundType === 'doodle' && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] text-[#606060] uppercase tracking-widest font-medium">Pattern Intensity</Label>
                        <span className="text-xs text-[#b8d4a8] font-medium">
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
                        className="w-full h-2 bg-[#252525] rounded-lg appearance-none cursor-pointer accent-[#b8d4a8]"
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
                  <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[#252525]">
                    <span className="text-sm text-[#c0c0c0]">Encryption Notice</span>
                    <Switch 
                      checked={whatsappSettings.showEncryptionNotice}
                      onCheckedChange={(checked) => setWhatsAppSettings({ showEncryptionNotice: checked })}
                      className="data-[state=checked]:bg-[#b8d4a8]"
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
              "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all",
              activeSection === 'about'
                ? "bg-[#b8d4a8] text-[#1a1a1a] shadow-lg shadow-[#b8d4a8]/20"
                : "bg-[#252525] text-[#909090] hover:bg-[#2a2a2a] hover:text-white"
            )}
          >
            <Info className="w-5 h-5" />
            <span className="font-medium">About</span>
            <ChevronDown className={cn(
              "w-4 h-4 ml-auto transition-transform duration-200",
              activeSection === 'about' && "rotate-180"
            )} />
          </button>
          
          {activeSection === 'about' && (
            <div className="px-3 py-4 animate-in slide-in-from-top-2 fade-in duration-200">
              <div className="p-4 rounded-xl bg-[#252525] space-y-3">
                <p className="text-sm text-[#909090] leading-relaxed">
                  <span className="text-[#b8d4a8] font-medium">FakeSocialMessage</span> is a free tool to create realistic chat screenshots for social media platforms.
                </p>
                <p className="text-xs text-[#606060]">
                  Your changes are automatically saved to your browser.
                </p>
              </div>
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
              className="w-full bg-[#252525] border-[#3a3a3a] text-[#707070] hover:bg-[#2a2a2a] hover:text-white hover:border-[#4a4a4a] rounded-xl h-10"
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
