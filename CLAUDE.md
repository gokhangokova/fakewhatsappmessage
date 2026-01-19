# FakeSocialMessage - Project Context

## Proje Hakkında
Fake chat screenshot generator - WhatsApp, Instagram, iMessage gibi platformların sahte sohbet ekran görüntülerini oluşturan Next.js uygulaması.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **UI:** React, TailwindCSS, shadcn/ui
- **Dil Desteği:** Türkçe (tr) ve İngilizce (en)
- **State:** React hooks, localStorage persistence
- **Export:** html-to-image (PNG/JPG/WebP), mp4-muxer (video), gif.js (GIF)

## Önemli Dosyalar

### Preview Bileşenleri
- `components/preview/platforms/whatsapp-preview.tsx` - Ana WhatsApp önizleme
- `components/video/animated-chat-preview.tsx` - Video export için animasyonlu önizleme
- `components/preview/phone-preview.tsx` - Genel telefon çerçevesi

### Editor
- `components/editor/tabbed-sidebar.tsx` - Sol panel (Editor, Settings, Export sekmeleri)

### UI Components
- `components/ui/avatar.tsx` - Radix Avatar wrapper (delayMs={0} ile)
- `components/ui/avatar-upload.tsx` - Avatar seçimi (upload, URL, presets, renkler)

### Hooks
- `hooks/use-video-export.ts` - Video kayıt ve export
- `hooks/use-export.ts` - Image export (PNG/JPG/WebP, clipboard)
- `hooks/use-chat-state.ts` - Sohbet durumu yönetimi (localStorage ile)
- `hooks/use-toast.ts` - Toast bildirimleri (auto-dismiss 3 saniye)

### Contexts
- `contexts/chat-context.tsx` - Ana state yönetimi (Context API ile)

### Types
- `types/index.ts` - Tüm TypeScript tipleri (GROUP_AVATAR_ILLUSTRATIONS dahil)

### CSS
- `app/globals.css` - Global stiller, export mode CSS kuralları

---

## State Yönetimi Mimarisi

### İki State Sistemi
Projede iki farklı state yönetim yaklaşımı var:

1. **`hooks/use-chat-state.ts`** - localStorage hook tabanlı
   - `useLocalStorage` custom hook kullanır
   - Dual session sistemi (1-1 ve Group chat için ayrı session'lar)
   - `directChatSession` ve `groupChatSession` ayrı tutulur
   - `isGroupChat` flag ile aktif session belirlenir

2. **`contexts/chat-context.tsx`** - Context API tabanlı
   - Multiple context'ler: `MessagesContext`, `UsersContext`, `AppearanceContext`, `SettingsContext`, `HydrationContext`
   - `useChatState()` hook'u tüm context'leri birleştirir
   - Debounced localStorage save (500ms)

### Hangi Dosya Kullanılıyor?
- **Ana uygulama (`app/page.tsx`)**: `contexts/chat-context.tsx` kullanıyor
- Her iki dosya da `useChatState` export ediyor, import path'e dikkat et!

### Dual Session Sistemi (`hooks/use-chat-state.ts`)
```tsx
interface ChatSessionData {
  sender: User
  receiver: User
  messages: Message[]
  groupSettings: GroupChatSettings
}

interface ChatState {
  // Görünüm ayarları (paylaşılan)
  darkMode: boolean
  deviceType: DeviceType
  mobilePreviewScale: number
  // ...

  // Aktif chat tipi
  isGroupChat: boolean

  // Ayrı session'lar
  directChatSession: ChatSessionData
  groupChatSession: ChatSessionData
}
```

### localStorage Key
```tsx
const STORAGE_KEY = 'fake-social-message-state'
```

---

## Export Sistemi (Ocak 2025)

### Image Export - Keskin Köşeler

**Sorun:** Image export'ta telefon çerçevesi (oval köşeler, gölge) dahil ediliyordu.

**Çözüm:** `forExport` prop'u eklendi. Export sırasında:
- `borderRadius: 0` (keskin köşeler)
- `boxShadow: none` (gölge yok)
- `padding: 0` (çerçeve yok)
- `background: transparent`

**Dosyalar:**

1. **`hooks/use-export.ts`** - Render bekleme mekanizması:
```tsx
// setIsExporting(true) sonrası React'in yeniden render etmesini bekle
await new Promise<void>((resolve) => {
  setTimeout(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 50)  // Ek bekleme
      })
    })
  }, 150)
})
```

2. **`components/preview/platforms/whatsapp-preview.tsx`** - forExport stilleri:
```tsx
<div
  className={cn(
    "transition-all duration-300 overflow-hidden w-[375px]",
    forExport && "!rounded-none !shadow-none !bg-transparent !p-0"
  )}
  style={forExport ? {
    borderRadius: '0px',
    boxShadow: 'none',
    background: 'transparent',
    padding: '0px',
    fontFamily: fontStyle,
  } : {
    borderRadius: isAndroid ? '24px' : '44px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), ...',
    background: '#000',
    padding: '2px',
    fontFamily: fontStyle,
  }}
  data-export-mode={forExport ? 'true' : 'false'}
>
```

3. **`app/globals.css`** - CSS !important kuralları:
```css
/* Export mode - sharp corners, no frame */
[data-export-mode="true"] {
  border-radius: 0 !important;
  box-shadow: none !important;
  background: transparent !important;
  padding: 0 !important;
}

[data-export-mode="true"] > * {
  border-radius: 0 !important;
}
```

4. **`app/page.tsx`** - forExport prop geçirme:
```tsx
<PhonePreview
  platform={platform}
  // ... diğer proplar
  forExport={isExporting}
/>
```

### Video Export - Grup Chat Gecikmesi Fix

**Sorun:** Grup chat video export'u başlatıldığında uzun bekleme süresi oluyordu.

**Çözüm:** `isReady` state ve polling mekanizması eklendi.

**`components/video/animated-chat-preview.tsx`:**
```tsx
const [isReady, setIsReady] = useState(false)

// Props değiştiğinde hazırlık durumunu sıfırla
useEffect(() => {
  setIsReady(false)
  const timer = setTimeout(() => {
    setIsReady(true)
  }, 50)
  return () => clearTimeout(timer)
}, [isGroupChat, messages.length])

const startAnimation = useCallback(() => {
  if (!isReady) {
    // Bileşen hazır değilse bekle ve tekrar dene
    setTimeout(() => {
      setVisibleMessageCount(0)
      setShowTyping(false)
      setIsAnimating(true)
      setPhase('waiting_before_typing')
      animationStoppedRef.current = false
      onAnimationStart?.()
    }, 100)
    return
  }
  // Normal başlatma
  setVisibleMessageCount(0)
  // ...
}, [onAnimationStart, isReady])
```

**`app/page.tsx`** - Ref polling:
```tsx
const handleStartVideoRecording = useCallback(async () => {
  setIsRecordingMode(true)
  setIsVideoMode(true)

  // Bileşen mount beklemesi
  await new Promise(resolve => setTimeout(resolve, 100))

  // Ref hazır olana kadar polling
  let attempts = 0
  const maxAttempts = 20
  while (!animatedPreviewRef.current && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 50))
    attempts++
  }

  if (videoPreviewContainerRef.current && animatedPreviewRef.current) {
    // DOM tamamen render olduktan sonra ek bekleme
    await new Promise(resolve => setTimeout(resolve, 200))

    await startRecording(videoPreviewContainerRef.current, {...})

    // Kayıt başladıktan sonra animasyonu başlat
    await new Promise(resolve => setTimeout(resolve, 100))
    animatedPreviewRef.current.startAnimation()
  }
}, [startRecording, videoSettings])
```

---

## Avatar Sistemi (Ocak 2025)

### AvatarUpload Component
`components/ui/avatar-upload.tsx` - Tüm avatar seçimleri için kullanılan bileşen.

**Props:**
```tsx
interface AvatarUploadProps {
  value: string | null          // Mevcut avatar (URL, data:base64, veya "color:#HEX")
  onChange: (value: string | null) => void
  fallback: string              // İsim (ilk harf gösterilir)
  className?: string
  variant?: 'primary' | 'secondary'
  language?: Language
  size?: 'sm' | 'md' | 'lg'
  accentColor?: string          // Varsayılan arka plan rengi
  customPresets?: string[]      // Özel preset avatarlar (grup için illüstrasyonlar)
}
```

**Kullanım Örnekleri:**
```tsx
// Group Icon (illüstrasyon avatarlarla)
<AvatarUpload
  value={groupSettings.groupIcon || null}
  onChange={(icon) => setGroupSettings({ groupIcon: icon || undefined })}
  fallback={groupSettings.groupName || 'G'}
  size="sm"
  language={language}
  accentColor="#128C7E"
  customPresets={GROUP_AVATAR_ILLUSTRATIONS}
/>

// Participant Avatar (katılımcı rengiyle)
<AvatarUpload
  value={participant.avatar || null}
  onChange={(avatar) => updateParticipant?.(participant.id, { avatar: avatar || undefined })}
  fallback={participant.name}
  size="sm"
  language={language}
  accentColor={participant.color}
/>

// Receiver Avatar (1-1 chat)
<AvatarUpload
  value={receiver.avatar}
  onChange={(avatar) => setReceiver({ ...receiver, avatar })}
  fallback={receiver.name}
  language={language}
  accentColor="#128C7E"
/>
```

### Avatar Değer Formatları
- **URL:** `"https://example.com/image.jpg"` veya `"data:image/..."`
- **Renk:** `"color:#128C7E"` formatında (başında "color:" prefix)
- **Null:** Avatar yok, fallback gösterilir

### Radix Avatar delayMs Fix
`components/ui/avatar.tsx` dosyasında `AvatarFallback`'e `delayMs={0}` eklendi:
```tsx
<AvatarPrimitive.Fallback
  ref={ref}
  delayMs={0}  // Fallback hemen gösterilir, gecikme yok
  className={cn('flex h-full w-full items-center justify-center rounded-full bg-muted', className)}
  {...props}
/>
```
**Neden?** Radix Avatar varsayılan olarak fallback'i geciktiriyor. `delayMs={0}` ile resim yoksa fallback hemen görünür.

### Grup Avatar İllüstrasyonları
`types/index.ts` dosyasında tanımlı:
```tsx
export const GROUP_AVATAR_ILLUSTRATIONS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=group1&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/bottts/svg?seed=group2&backgroundColor=c0aede',
  // ... 12 adet toplam
]
```

### Varsayılan Renkler
- **WhatsApp Yeşili:** `#128C7E` (group icon, receiver, header fallback)
- **Katılımcı Renkleri:** `GROUP_CHAT_COLORS` array'inden (types/index.ts)

---

## Chat Tipi Değişimi (toggleGroupChat)

### Sorun ve Çözüm
1-1 ve Group Chat arasında geçiş yapıldığında `groupSettings` (groupIcon dahil) kaybediliyordu.

**Eski kod (sorunlu):**
```tsx
groupSettings: isGroupChat
  ? { ...DEFAULT_GROUP_SETTINGS, isGroupChat: true }  // HER ŞEY SİLİNİYOR!
  : { ...prev.groupSettings, isGroupChat: false },
```

**Yeni kod (düzeltilmiş):**
```tsx
groupSettings: {
  ...prev.groupSettings,
  isGroupChat,
  // Sadece ilk kez grup chat'e geçildiğinde varsayılanları yükle
  ...(isGroupChat && prev.groupSettings.participants.length === 0 ? {
    groupName: DEFAULT_GROUP_SETTINGS.groupName,
    participants: DEFAULT_GROUP_SETTINGS.participants,
  } : {}),
},
```

---

## Header Avatar Gösterimi

### iOS ve Android Header'larında Avatar
Her iki header'da da aynı yapı kullanılıyor:

```tsx
<Avatar className="w-[36px] h-[36px]">
  {isGroupChat ? (
    // Group chat avatar
    <>
      {groupIcon && !groupIcon.startsWith('color:') && (
        <AvatarImage src={groupIcon} />
      )}
      <AvatarFallback
        className="text-[14px] font-medium text-white"
        style={{
          backgroundColor: groupIcon?.startsWith('color:')
            ? groupIcon.replace('color:', '')
            : '#128C7E',
          color: '#FFFFFF',
        }}
      >
        {groupName?.charAt(0).toUpperCase() || 'G'}
      </AvatarFallback>
    </>
  ) : (
    // 1-1 chat avatar
    <>
      {isImageAvatar(receiver.avatar) && (
        <AvatarImage src={receiver.avatar!} />
      )}
      <AvatarFallback
        className="text-[14px] font-medium text-white"
        style={{
          backgroundColor: getAvatarColor(receiver.avatar) || '#128C7E',
          color: '#FFFFFF',
        }}
      >
        {receiver.name?.charAt(0).toUpperCase()}
      </AvatarFallback>
    </>
  )}
</Avatar>
```

**Önemli Kurallar:**
1. `AvatarImage` ve `AvatarFallback` her zaman birlikte render edilmeli
2. `AvatarImage` koşullu olarak gösterilir (resim varsa)
3. `AvatarFallback` her zaman render edilir (delayMs={0} sayesinde hemen görünür)
4. Varsayılan renk her zaman `#128C7E` (WhatsApp yeşili)

### Helper Fonksiyonlar
```tsx
// Resim URL'i mi kontrol et
const isImageAvatar = (avatar: string | null | undefined): boolean => {
  return !!avatar && !avatar.startsWith('color:')
}

// Renk değerini çıkar
const getAvatarColor = (avatar: string | null | undefined): string | null => {
  if (avatar?.startsWith('color:')) {
    return avatar.replace('color:', '')
  }
  return null
}

// Renk avatarı mı kontrol et
const isColorAvatar = (avatar: string | null | undefined): boolean => {
  return avatar?.startsWith('color:') || false
}
```

---

## Kuyruk (Tail) ve Avatar Pozisyonlama

### Mantık
Ardışık mesajlarda kuyruk ve avatar **SON** mesajda görünüyor:

- `isFirstInGroup`: Aynı kişiden gelen ardışık mesajların İLKİ
- `isLastInGroup`: Aynı kişiden gelen ardışık mesajların SONUNCUSU
- **Kuyruk (tail)** → `isLastInGroup` true olduğunda göster
- **Avatar** → `isLastInGroup` true olduğunda göster

### Hesaplama
```tsx
{group.messages.map((message, index) => {
  const prevMessage = index > 0 ? group.messages[index - 1] : null
  const nextMessage = index < group.messages.length - 1 ? group.messages[index + 1] : null
  const isFirstInGroup = !prevMessage || prevMessage.userId !== message.userId
  const isLastInGroup = !nextMessage || nextMessage.userId !== message.userId
})}
```

### isSent Kontrolü (Kritik!)
```tsx
// 1-1 Chat: sender.id veya 'me'
// Group Chat: sender.id, 'me' veya 'sender-1' (varsayılan You ID'si)
const isSent = message.userId === sender.id || message.userId === 'me' || message.userId === 'sender-1'
```

### Grup Chat Avatar Gösterimi
```tsx
// Avatar sadece son mesajda (kuyrukla aynı hizada)
const showGroupAvatar = isGroupChat && !isSent && isLastInGroup && messageSender

// Spacer: Avatar olmayan mesajlarda hizalama için
{isGroupChat && !isSent && !isLastInGroup && (
  <div className="w-[34px] flex-shrink-0" />
)}
```

### Kuyruk SVG
```tsx
// Gönderilen (Sağ taraf)
{isLastInGroup && (
  <svg className="absolute -right-[8px] bottom-0" width="8" height="13" viewBox="0 0 8 13">
    <path d="M0 0v13l8-8.5L.5 0H0z" fill={theme.sentBubble} />
  </svg>
)}

// Alınan (Sol taraf)
{isLastInGroup && (
  <svg className="absolute -left-[8px] bottom-0" width="8" height="13" viewBox="0 0 8 13">
    <path d="M8 0v13L0 4.5 7.5 0H8z" fill={theme.receivedBubble} />
  </svg>
)}
```

---

## Kod Stilleri

### WhatsApp Renkleri
```tsx
// Light Theme
sentBubble: '#DCF8C6'
receivedBubble: '#FFFFFF'
chatBg: '#E5DDD5'

// Dark Theme
sentBubble: '#005C4B'
receivedBubble: '#202C33'
chatBg: '#0B141A'
```

### Mesaj Balonu Border Radius
- Genel: `rounded-[8px]` (gerçek WhatsApp gibi)
- Kuyruk köşesi: `rounded-br-[2px]` (gönderilen) veya `rounded-bl-[2px]` (alınan)

### Varsayılan Sender ID'leri
- 1-1 Chat: `sender.id` (dinamik) veya `'me'`
- Group Chat You: `'sender-1'` (varsayılan)
- Group Chat Participants: `'participant-{uuid}'`

---

## Dikkat Edilecekler

1. **Her iki dosyayı da güncelle:** `whatsapp-preview.tsx` ve `animated-chat-preview.tsx` senkronize tutulmalı
2. **iOS/Android farkları:** Header, footer ve bazı stiller cihaz tipine göre değişiyor
3. **Light/Dark mode:** Tüm renkler tema'ya göre belirlenmeli
4. **Türkçe çeviriler:** `lib/i18n/translations.ts` dosyasında
5. **isSent kontrolü:** Hem `sender.id`, `'me'` hem de `'sender-1'` kontrol edilmeli
6. **Kuyruk ve Avatar:** `isLastInGroup` kullan, `isFirstInGroup` değil
7. **AvatarFallback:** Her zaman `AvatarImage` ile birlikte render et
8. **delayMs={0}:** Avatar fallback'in hemen görünmesi için gerekli
9. **Export timing:** `forExport` prop değişikliği için yeterli bekleme süresi gerekli (200ms+)
10. **data-export-mode:** CSS !important kuralları için attribute selector kullan
11. **State import path:** `useChatState` iki dosyada var - `@/contexts/chat-context` kullan
12. **CSS variable inheritance:** Inline style'dan CSS class'a variable geçirmek için element'e set et
13. **Mobil responsive:** `max-sm:` ve `sm:` prefix'leri doğru kullan (639px breakpoint)
14. **Toast auto-dismiss:** 3 saniye sonra otomatik kapanır, manuel dismiss gerekmiyor

---

## Geliştirme Notları

```bash
# Çalıştırma
npm run dev

# Build
npm run build
```

## Sık Karşılaşılan Sorunlar ve Çözümleri

### Sorun: Avatar/Fallback görünmüyor (boş kalıyor)
**Sebep:** Radix Avatar `delayMs` varsayılan gecikme kullanıyor
**Çözüm:** `components/ui/avatar.tsx`'te `delayMs={0}` ekle

### Sorun: Chat tipi değiştirildiğinde groupIcon kayboluyor
**Sebep:** `toggleGroupChat` her şeyi sıfırlıyor
**Çözüm:** `hooks/use-chat-state.ts`'te mevcut ayarları koru

### Sorun: Grup chat'te "You" mesajlarında kuyruk her mesajda görünüyor
**Sebep:** `isSent` kontrolü `'sender-1'` ID'sini içermiyor
**Çözüm:**
```tsx
const isSent = message.userId === sender.id || message.userId === 'me' || message.userId === 'sender-1'
```

### Sorun: Kuyruk ilk mesajda görünüyor, son mesajda değil
**Sebep:** `isFirstInGroup` kullanılıyor
**Çözüm:** `isLastInGroup` kullan

### Sorun: Avatar kuyrukla aynı hizada değil
**Sebep:** Avatar `isFirstInGroup` ile gösteriliyor
**Çözüm:** `showGroupAvatar` için `isLastInGroup` kullan

### Sorun: iOS ve Android header'larında avatar farklı görünüyor
**Sebep:** Varsayılan renk tutarsızlığı
**Çözüm:** Her iki header'da da `#128C7E` varsayılan kullan

### Sorun: Image export'ta kenarlar oval geliyor
**Sebep:** `forExport` prop uygulanmadan önce görüntü yakalanıyor
**Çözüm:**
1. `hooks/use-export.ts`'te render bekleme süresi ekle (150ms + 50ms)
2. `app/globals.css`'te `[data-export-mode="true"]` CSS kuralları
3. Hem inline style hem Tailwind `!important` class'ları kullan

### Sorun: Grup chat video export başlatıldığında uzun bekleme
**Sebep:** Bileşen hazır değilken animasyon başlatılıyor
**Çözüm:**
1. `animated-chat-preview.tsx`'te `isReady` state ekle
2. `app/page.tsx`'te ref polling mekanizması ekle
3. DOM render tamamlanana kadar bekle (200ms+)

### Sorun: Mobile preview scale slider çalışmıyor
**Sebep:** CSS custom property inheritance sorunu - CSS class içinde tanımlanan variable, aynı class'ta kullanılamıyor
**Çözüm:**
1. CSS'i sadeleştir - viewport hesaplamalarını kaldır
2. Inline style'dan gelen `--mobile-preview-scale` değerini doğrudan kullan
```css
/* app/globals.css */
@media (max-width: 639px) {
  .mobile-phone-preview {
    transform: scale(var(--mobile-preview-scale, 0.5));
    transform-origin: center center;
  }
}
```
3. React'ta CSS variable'ı inline style ile geçir:
```tsx
style={{
  '--mobile-preview-scale': mobilePreviewScale / 100,
} as React.CSSProperties}
```

---

## Mobile Preview Scale Özelliği (Ocak 2025)

### Açıklama
Mobil cihazlarda kullanıcının preview ekranının ölçeğini ayarlamasını sağlayan slider. Settings > Appearance altında bulunur.

### Dosyalar ve Değişiklikler

1. **`hooks/use-chat-state.ts`**:
   - `ChatState` interface'ine `mobilePreviewScale: number` eklendi
   - `defaultState`'e `mobilePreviewScale: 50` eklendi
   - `setMobilePreviewScale` callback fonksiyonu (10-100 arası sınırlama)
   - SSR ve normal return value'larda fallback: `mobilePreviewScale: state.mobilePreviewScale ?? 50`

2. **`contexts/chat-context.tsx`**:
   - `AppearanceContextType` interface'ine eklendi
   - `ChatState` interface ve `defaultState`'e eklendi
   - State: `useState(defaultState.mobilePreviewScale)`
   - localStorage load: `setMobilePreviewScaleState(parsed.mobilePreviewScale ?? 50)`
   - `saveToStorage` ve `beforeunload` handler'larına eklendi
   - `setMobilePreviewScale` callback
   - `resetToDefaults`'a eklendi
   - `appearanceValue` memo'ya eklendi
   - `useChatState` return value'ya eklendi

3. **`lib/i18n/translations.ts`**:
   - Interface'e `previewScale: string` eklendi
   - English: `previewScale: 'Preview Scale'`
   - Turkish: `previewScale: 'Önizleme Ölçeği'`

4. **`components/editor/tabbed-sidebar.tsx`**:
   - Interface'e `mobilePreviewScale` ve `setMobilePreviewScale` eklendi
   - Settings > Appearance altına slider UI eklendi (range input + number input)
   - Sadece mobilde görünür (sm:hidden ile gizlenmemiş, mobil sidebar'da gösterilir)

5. **`app/page.tsx`**:
   - `useChatState` destructure'a eklendi
   - `sidebarProps` memo'ya eklendi
   - Preview container'a CSS variable inline style eklendi

6. **`app/globals.css`**:
   - Mobile preview class basitleştirildi
   - `transform: scale(var(--mobile-preview-scale, 0.5))`
   - Viewport hesaplamaları kaldırıldı (artık sadece user scale kullanılıyor)

### Slider UI Kodu
```tsx
{/* Preview Scale - Mobile only */}
<div className="space-y-2">
  <div className="flex items-center justify-between">
    <Label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
      {t.settings.previewScale}
    </Label>
    <span className="text-xs font-medium text-[#128C7E]">
      {mobilePreviewScale}%
    </span>
  </div>
  <div className="flex items-center gap-3">
    <input
      type="range"
      min="10"
      max="100"
      step="5"
      value={mobilePreviewScale}
      onChange={(e) => setMobilePreviewScale(parseInt(e.target.value))}
      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      style={{ accentColor: '#25D366' }}
    />
    <input
      type="number"
      min="10"
      max="100"
      value={mobilePreviewScale}
      onChange={(e) => setMobilePreviewScale(parseInt(e.target.value) || 50)}
      className="w-14 px-2 py-1.5 text-sm text-center rounded-lg bg-gray-50 border border-gray-200 focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] focus:outline-none"
    />
  </div>
</div>
```

### Önemli Notlar
- Varsayılan değer: 50 (50%)
- Min: 10%, Max: 100%
- Step: 5%
- localStorage'da persist ediliyor
- Desktop'ta Tailwind class'ları override ediyor (sm:scale-[0.8] vb.)

---

## Mobile UI Layout (Ocak 2025)

### Mobil Buton Yerleşimi
Mobilde butonlar ekranın altında yatay sıralanır:

```tsx
{/* Floating Export Panel - Mobile: horizontal at bottom center */}
<div className="absolute bottom-3 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:bottom-6 md:bottom-8 sm:right-4 md:right-8 flex flex-row sm:flex-col items-center sm:items-end gap-2.5 sm:gap-3">
  {/* Editor Button - Mobile only */}
  <Button className="sm:hidden" onClick={() => { setSidebarTab('editor'); setSidebarOpen(true) }}>
    <Edit3 />
  </Button>

  {/* Settings Button - Mobile only */}
  <Button className="sm:hidden" onClick={() => { setSidebarTab('settings'); setSidebarOpen(true) }}>
    <FlaskConical />
  </Button>

  {/* Preview Animation Button */}
  <Button onClick={handleStartPreview}>
    <Play />
  </Button>

  {/* Export Menu */}
  <ExportMenu ... />
</div>
```

### Preview Container Padding
Mobilde butonlar için alt padding:
```tsx
<div className="... max-sm:pb-20">
  {/* Phone Preview */}
</div>
```

### Mobil Sidebar
- `TabbedSidebar` bileşeni Radix Sheet kullanır
- `initialTab` prop ile açıldığında hangi sekme gösterilecek belirlenir
- `isOpen` ve `onClose` props ile kontrol edilir

---

## Toast Sistemi

### Auto-Dismiss Özelliği
`hooks/use-toast.ts` dosyasında toast'lar otomatik kapanır:

```tsx
const TOAST_REMOVE_DELAY = 3000  // 3 saniye

function toast({ ...props }: Toast) {
  // ... toast oluştur

  // Auto-dismiss after TOAST_REMOVE_DELAY
  setTimeout(() => {
    dismiss()
  }, TOAST_REMOVE_DELAY)
}
```

### Kullanım
```tsx
const { toast } = useToast()

toast({
  title: '✅ Screenshot downloaded!',
  description: 'Your PNG screenshot has been saved.',
})

// Hata durumunda
toast({
  variant: 'destructive',
  title: 'Export failed',
  description: error,
})
```

---

## Dialog Component

### hideCloseButton Prop
`components/ui/dialog.tsx` dosyasında close button gizlenebilir:

```tsx
interface DialogContentProps {
  hideCloseButton?: boolean
}

const DialogContent = ({ hideCloseButton = false, ...props }) => (
  <DialogPrimitive.Content>
    {children}
    {!hideCloseButton && (
      <DialogPrimitive.Close>
        <X className="h-4 w-4" />
      </DialogPrimitive.Close>
    )}
  </DialogPrimitive.Content>
)
```

### Kullanım
```tsx
<Dialog>
  <DialogContent hideCloseButton>
    {/* Close button yok */}
  </DialogContent>
</Dialog>
```

---

## Gelecek Geliştirmeler İçin Notlar
- Video export performansı optimize edildi (requestAnimationFrame ile throttling)
- Grup sohbet katılımcı yönetimi tam çalışıyor (ekle/sil/düzenle)
- Mesaj sürükle-bırak ile sıralama çalışıyor (dnd-kit)
- Grup icon seçimi illüstrasyon avatarlarla çalışıyor (DiceBear API)
- Image export keskin köşelerle çalışıyor (forExport prop)
- Video export grup chat gecikmesi düzeltildi (isReady state)
- Mobile preview scale slider eklendi (Settings > Appearance)
