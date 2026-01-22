# FakeSocialMessage - Project Context

## Proje Hakkında
Fake chat screenshot generator - WhatsApp, Instagram, iMessage gibi platformların sahte sohbet ekran görüntülerini oluşturan Next.js uygulaması.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **UI:** React, TailwindCSS, shadcn/ui
- **Dil Desteği:** Türkçe (tr) ve İngilizce (en)
- **State:** React hooks + Supabase (cloud persistence)
- **Auth:** Supabase Auth (Google OAuth, Email/Password)
- **Database:** Supabase PostgreSQL
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
- `hooks/use-saved-chats.ts` - Supabase chat CRUD operations

### Auth & Database
- `contexts/auth-context.tsx` - Authentication state ve fonksiyonları
- `lib/supabase/client.ts` - Supabase browser client
- `lib/supabase/server.ts` - Supabase server client
- `lib/supabase/chats.ts` - Chat CRUD fonksiyonları
- `components/auth/auth-modal.tsx` - Login/Signup modal
- `components/auth/user-menu.tsx` - User profile dropdown
- `components/chats/saved-chats-modal.tsx` - My Chats modal
- `components/chats/save-chat-button.tsx` - Save button component

### Types
- `types/index.ts` - Tüm TypeScript tipleri (GROUP_AVATAR_ILLUSTRATIONS dahil)

### CSS
- `app/globals.css` - Global stiller, export mode CSS kuralları

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
// Hem 1-1 Chat hem Group Chat için tek kontrol
const isSent = message.userId === 'me'
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
- 1-1 Chat: `'me'` (You için standart ID)
- Group Chat You: `'me'` (You için standart ID)
- Group Chat Participants: `'p1'`, `'p2'`, `'p3'` veya `'participant-{uuid}'`

---

## Dikkat Edilecekler

1. **Her iki dosyayı da güncelle:** `whatsapp-preview.tsx` ve `animated-chat-preview.tsx` senkronize tutulmalı
2. **iOS/Android farkları:** Header, footer ve bazı stiller cihaz tipine göre değişiyor
3. **Light/Dark mode:** Tüm renkler tema'ya göre belirlenmeli
4. **Türkçe çeviriler:** `lib/i18n/translations.ts` dosyasında
5. **isSent kontrolü:** Sadece `'me'` kontrol edilmeli (standartlaştırıldı)
6. **Kuyruk ve Avatar:** `isLastInGroup` kullan, `isFirstInGroup` değil
7. **AvatarFallback:** Her zaman `AvatarImage` ile birlikte render et
8. **delayMs={0}:** Avatar fallback'in hemen görünmesi için gerekli
9. **Export timing:** `forExport` prop değişikliği için yeterli bekleme süresi gerekli (200ms+)
10. **data-export-mode:** CSS !important kuralları için attribute selector kullan

---

## Geliştirme Notları

```bash
# Çalıştırma
npm run dev

# Build
npm run build
```

### Claude İzinleri
Aşağıdaki işlemler için kullanıcı onayı gerekmez:
- Sunucu komutları: `npm run dev`, `npm run build`, `npm install`
- Git komutları: `git add`, `git commit`, `git push`, `git merge`, `git pull`
- Chrome MCP araçları: Tarayıcı açma, sayfa gezinme, element tıklama, screenshot alma

## Sık Karşılaşılan Sorunlar ve Çözümleri

### Sorun: Avatar/Fallback görünmüyor (boş kalıyor)
**Sebep:** Radix Avatar `delayMs` varsayılan gecikme kullanıyor
**Çözüm:** `components/ui/avatar.tsx`'te `delayMs={0}` ekle

### Sorun: Chat tipi değiştirildiğinde groupIcon kayboluyor
**Sebep:** `toggleGroupChat` her şeyi sıfırlıyor
**Çözüm:** `hooks/use-chat-state.ts`'te mevcut ayarları koru

### Sorun: Grup chat'te "You" mesajlarında kuyruk her mesajda görünüyor
**Sebep:** `isSent` kontrolü yanlış ID kullanıyor
**Çözüm:** Tüm "You" mesajları için `userId: 'me'` kullan:
```tsx
const isSent = message.userId === 'me'
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

---

## Supabase Entegrasyonu (Ocak 2025)

### Veritabanı Yapısı

**profiles tablosu:**
- `id` (UUID) - auth.users referansı
- `email` (TEXT)
- `full_name` (TEXT)
- `avatar_url` (TEXT)
- `subscription_tier` ('free' | 'pro' | 'business')
- `created_at`, `updated_at` (TIMESTAMPTZ)

**chats tablosu:**
- `id` (UUID) - Primary key
- `user_id` (UUID) - auth.users referansı
- `name` (TEXT) - Chat adı (receiver name veya group name)
- `platform` (TEXT) - 'whatsapp', 'instagram', etc.
- `data` (JSONB) - Tüm chat state'i (messages, settings, etc.)
- `thumbnail_url` (TEXT) - Opsiyonel önizleme
- `created_at`, `updated_at` (TIMESTAMPTZ)

### Free Tier Limiti
- Free kullanıcılar maksimum 2 chat kaydedebilir
- Pro ve Business kullanıcılar sınırsız chat
- `hooks/use-saved-chats.ts` → `remainingChats` değeri

### Supabase Migration
Yeni kurulumda `supabase/migrations/001_create_profiles_trigger.sql` dosyasını Supabase SQL Editor'de çalıştırın.

### Auth Flow
1. Google OAuth veya Email/Password ile giriş
2. Yeni kullanıcı → `on_auth_user_created` trigger → profiles tablosuna otomatik kayıt
3. `AuthProvider` → user ve profile state yönetimi
4. RLS politikaları ile veri güvenliği

### UI Butonları (app/page.tsx)
- **Save Button** - Mevcut chat'i kaydet (yeşil = kaydedilmiş, beyaz = yeni)
- **My Chats Button (FolderOpen)** - Kayıtlı chat'leri listele, yükle, sil

---

## Backlog

### Planlanmış
- FAQ sayfası (`/faq` route, accordion yapısı, TR/EN dil desteği)
- Instagram DM desteği
- iMessage desteği
- PWA desteği (offline kullanım)

### Düşünülebilir
- Video FPS ayarını kullanıcıya sunma (şu an MP4=60, GIF=30)
- WebM format desteği
- Mesaj düzenleme undo/redo
- Keyboard shortcuts
- Swipe gestures (mobil)
