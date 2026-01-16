'use client'

import { useState, useRef, useEffect } from 'react'
import { Platform, WhatsAppSettings, WhatsAppBackgroundType, WHATSAPP_BG_COLORS, WHATSAPP_BG_IMAGES, Language, SUPPORTED_LANGUAGES, FontFamily, SUPPORTED_FONTS, DeviceType } from '@/types'
import { useTranslations } from '@/lib/i18n/translations'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  X,
  FlaskConical,
  Palette,
  Info,
  ChevronRight,
  Upload,
  RotateCcw,
  Sparkles,
  Globe,
} from 'lucide-react'

interface SettingsPanelProps {
  platform: Platform
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
  language: Language
  setLanguage: (language: Language) => void
  fontFamily: FontFamily
  setFontFamily: (fontFamily: FontFamily) => void
  batteryLevel: number
  setBatteryLevel: (level: number) => void
  deviceType: DeviceType
  setDeviceType: (deviceType: DeviceType) => void
  onReset?: () => void
}

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

// Collapsible Section Component
function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3.5 transition-all',
          isOpen
            ? 'bg-[#d4f5e2] text-gray-900'
            : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
        )}
      >
        <Icon className={cn("w-5 h-5", isOpen ? "text-[#128C7E]" : "text-gray-500")} />
        <span className="font-medium flex-1 text-left">{title}</span>
        <ChevronRight className={cn(
          "w-4 h-4 transition-transform duration-200",
          isOpen && "rotate-90"
        )} />
      </button>
      {isOpen && (
        <div className="bg-white px-4 py-4 space-y-4 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  )
}

// Background Image Uploader
const BackgroundImageUploader = ({
  imageUrl,
  onChange,
  uploadLabel,
  changeLabel,
}: {
  imageUrl?: string
  onChange: (url?: string) => void
  uploadLabel: string
  changeLabel: string
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
        className="w-full"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-4 h-4 mr-2" />
        {imageUrl ? changeLabel : uploadLabel}
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
              imageUrl === url ? "ring-2 ring-[#25D366]" : "hover:ring-2 ring-gray-300"
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
  platform,
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
  language,
  setLanguage,
  fontFamily,
  setFontFamily,
  batteryLevel,
  setBatteryLevel,
  deviceType,
  setDeviceType,
  onReset,
}: SettingsPanelProps) {
  const backgroundType = whatsappSettings?.backgroundType || 'doodle'
  const t = useTranslations(language)

  return (
    <div className="fixed right-4 top-20 z-50 w-80">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-[#d4f5e2] flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-[#128C7E]" />
          </div>
          <span className="font-semibold text-gray-800 text-lg">{t.common.settings}</span>
        </div>

        {/* Content */}
        <div className="p-3 space-y-2 max-h-[calc(100vh-180px)] overflow-y-auto">
          {/* Appearance Section */}
          <CollapsibleSection
            title={t.settings.appearance}
            icon={Palette}
            defaultOpen={false}
          >
            {/* View Toggle */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-500 uppercase tracking-wider font-medium">{t.settings.view}</Label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMobileView(false)}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    !mobileView
                      ? 'bg-[#d4f5e2] text-[#128C7E]'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {t.settings.desktop}
                </button>
                <button
                  onClick={() => setMobileView(true)}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    mobileView
                      ? 'bg-[#d4f5e2] text-[#128C7E]'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {t.settings.mobile}
                </button>
              </div>
            </div>

            {/* Time Format */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-500 uppercase tracking-wider font-medium">{t.settings.timeFormat}</Label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTimeFormat('12h')}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    timeFormat === '12h'
                      ? 'bg-[#d4f5e2] text-[#128C7E]'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  12h
                </button>
                <button
                  onClick={() => setTimeFormat('24h')}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    timeFormat === '24h'
                      ? 'bg-[#d4f5e2] text-[#128C7E]'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  24h
                </button>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                <span className="text-sm text-gray-700">{t.settings.darkMode}</span>
                <Switch 
                  checked={darkMode} 
                  onCheckedChange={setDarkMode}
                  className="data-[state=checked]:bg-[#25D366]"
                />
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                <span className="text-sm text-gray-700">{t.settings.transparentBg}</span>
                <Switch 
                  checked={transparentBg} 
                  onCheckedChange={setTransparentBg}
                  className="data-[state=checked]:bg-[#25D366]"
                />
              </div>
            </div>

            {/* Font Family */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-500 uppercase tracking-wider font-medium">{t.settings.fontFamily}</Label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value as FontFamily)}
                className="w-full px-3 py-2.5 rounded-lg text-sm bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] focus:outline-none cursor-pointer appearance-none transition-colors"
                style={{ 
                  fontFamily: SUPPORTED_FONTS.find(f => f.code === fontFamily)?.style,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M2.5 4.5L6 8l3.5-3.5'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  paddingRight: '36px',
                }}
              >
                {SUPPORTED_FONTS.map((font) => (
                  <option 
                    key={font.code} 
                    value={font.code}
                    style={{ fontFamily: font.style }}
                  >
                    {font.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Battery Level */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-500 uppercase tracking-wider font-medium">{t.settings.batteryLevel}</Label>
                <span className={cn(
                  "text-xs font-medium",
                  batteryLevel <= 20 ? "text-red-500" : "text-[#128C7E]"
                )}>
                  {batteryLevel}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={batteryLevel}
                  onChange={(e) => setBatteryLevel(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: batteryLevel <= 20 ? '#EF4444' : '#25D366' }}
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={batteryLevel}
                  onChange={(e) => setBatteryLevel(parseInt(e.target.value) || 0)}
                  className="w-16 px-2 py-1.5 text-sm text-center rounded-lg bg-gray-50 border border-gray-200 focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] focus:outline-none"
                />
              </div>
            </div>

            {/* Device Type */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-500 uppercase tracking-wider font-medium">{t.settings.device}</Label>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeviceType('ios')}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2',
                    deviceType === 'ios'
                      ? 'bg-[#d4f5e2] text-[#128C7E]'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 814 1000" className="fill-current">
                    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
                  </svg>
                  <span>iOS</span>
                </button>
                <button
                  onClick={() => setDeviceType('android')}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2',
                    deviceType === 'android'
                      ? 'bg-[#d4f5e2] text-[#128C7E]'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  <span>🤖</span>
                  <span>{t.settings.android}</span>
                </button>
              </div>
            </div>
          </CollapsibleSection>

          {/* WhatsApp Settings Section */}
          {platform === 'whatsapp' && whatsappSettings && setWhatsAppSettings && (
            <CollapsibleSection
              title={t.settings.whatsapp}
              icon={Sparkles}
              defaultOpen={false}
            >
              {/* Status */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-500 uppercase tracking-wider font-medium">{t.settings.status}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'online', label: t.settings.online },
                    { value: 'typing', label: t.settings.typing },
                    { value: 'last-seen', label: t.settings.lastSeen },
                    { value: 'none', label: t.settings.none },
                  ] as const).map((status) => (
                    <button
                      key={status.value}
                      onClick={() => setWhatsAppSettings({ lastSeen: status.value })}
                      className={cn(
                        'px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                        whatsappSettings.lastSeen === status.value
                          ? 'bg-[#d4f5e2] text-[#128C7E]'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Type */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-500 uppercase tracking-wider font-medium">{t.settings.background}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 'solid', label: t.settings.solid },
                    { value: 'doodle', label: t.settings.pattern },
                    { value: 'image', label: t.settings.image },
                  ] as { value: WhatsAppBackgroundType; label: string }[]).map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setWhatsAppSettings({ backgroundType: type.value })}
                      className={cn(
                        'px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                        backgroundType === type.value
                          ? 'bg-[#d4f5e2] text-[#128C7E]'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Solid Color */}
              {backgroundType === 'solid' && (
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500 uppercase tracking-wider font-medium">{t.settings.color}</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {WHATSAPP_BG_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setWhatsAppSettings({ backgroundColor: color })}
                        className={cn(
                          'w-full aspect-square rounded-lg border-2 transition-all',
                          whatsappSettings.backgroundColor === color
                            ? 'border-[#25D366] scale-110 shadow-md'
                            : 'border-transparent hover:border-gray-300'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={whatsappSettings.backgroundColor || '#EFEFE4'}
                      onChange={(e) => setWhatsAppSettings({ backgroundColor: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                    />
                    <DebouncedInput
                      value={whatsappSettings.backgroundColor || '#EFEFE4'}
                      onChange={(value) => setWhatsAppSettings({ backgroundColor: value })}
                      placeholder="#EFEFE4"
                      className="flex-1 text-sm h-8"
                    />
                  </div>
                </div>
              )}

              {/* Doodle Settings */}
              {backgroundType === 'doodle' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-500 uppercase tracking-wider font-medium">{t.settings.baseColor}</Label>
                    <div className="grid grid-cols-6 gap-2">
                      {WHATSAPP_BG_COLORS.slice(0, 6).map((color) => (
                        <button
                          key={color}
                          onClick={() => setWhatsAppSettings({ backgroundColor: color })}
                          className={cn(
                            'w-full aspect-square rounded-lg border-2 transition-all',
                            whatsappSettings.backgroundColor === color
                              ? 'border-[#25D366] scale-110 shadow-md'
                              : 'border-transparent hover:border-gray-300'
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-500 uppercase tracking-wider font-medium">{t.settings.patternOpacity}</Label>
                      <span className="text-xs text-[#128C7E] font-medium">
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
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#25D366]"
                    />
                  </div>
                </>
              )}

              {/* Image Background */}
              {backgroundType === 'image' && (
                <BackgroundImageUploader
                  imageUrl={whatsappSettings.backgroundImage}
                  onChange={(url) => setWhatsAppSettings({ backgroundImage: url })}
                  uploadLabel={t.settings.upload}
                  changeLabel={t.settings.change}
                />
              )}

              {/* Encryption Notice */}
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                <span className="text-sm text-gray-700">{t.settings.encryptionNotice}</span>
                <Switch
                  checked={whatsappSettings.showEncryptionNotice}
                  onCheckedChange={(checked) => setWhatsAppSettings({ showEncryptionNotice: checked })}
                  className="data-[state=checked]:bg-[#25D366]"
                />
              </div>
            </CollapsibleSection>
          )}

          {/* Language Section */}
          <CollapsibleSection
            title={t.settings.language}
            icon={Globe}
            defaultOpen={false}
          >
            <div className="space-y-2">
              <Label className="text-xs text-gray-500 uppercase tracking-wider font-medium">{t.settings.selectLanguage}</Label>
              <div className="space-y-2">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      language === lang.code
                        ? 'bg-[#d4f5e2] text-[#128C7E]'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span>{lang.name}</span>
                    {language === lang.code && (
                      <span className="ml-auto text-[#25D366]">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </CollapsibleSection>

          {/* About Section */}
          <CollapsibleSection
            title={t.settings.about}
            icon={Info}
            defaultOpen={false}
          >
            <p className="text-sm text-gray-600 leading-relaxed">
              {t.about.description}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              {t.about.autoSave}
            </p>
          </CollapsibleSection>
        </div>

        {/* Footer */}
        {onReset && (
          <div className="p-3 border-t border-gray-100">
            <Button
              onClick={onReset}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {t.common.resetToDefaults}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
