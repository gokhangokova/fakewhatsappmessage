# FakeSocialMessage (MemeSocial) - Project Context

## Proje Hakkında
Fake chat screenshot generator - WhatsApp, Instagram, iMessage gibi platformların sahte sohbet ekran görüntülerini oluşturan Next.js uygulaması.

**Uygulama Adı:** MemeSocial / MemeChat
**Açıklama:** Create realistic fake chat screenshots for memes, stories, and social media content. Design WhatsApp-style conversations with customizable messages, avatars, and themes.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **UI:** React, TailwindCSS, shadcn/ui
- **Dil Desteği:** Türkçe (tr) ve İngilizce (en)
- **State:** React hooks + Supabase (cloud persistence)
- **Auth:** Supabase Auth (Google OAuth, Email/Password)
- **Database:** Supabase PostgreSQL
- **Export:** html-to-image (PNG/JPG/WebP), mp4-muxer (video), gif.js (GIF)

---

## Git Repository Yapılandırması

### Remote'lar
Proje iki farklı GitHub hesabına push edilebilir:

| Remote | Hesap | Repository |
|--------|-------|------------|
| `origin` | gokhangokova | fakewhatsappmessage |
| `ob` | ob-gokhan | memesocialapp-wp |
| `all` | Her ikisi | Paralel push |

### Push Komutları
```bash
# Kişisel hesaba push
git push origin main

# Overbrain hesabına push
git push ob main

# Her iki hesaba birden push
git push all main
```

### Claude için Push Talimatları
- `"pushla gokhan"` → `git push origin main`
- `"pushla ob"` → `git push ob main`
- `"pushla"` → `git push all main` (her ikisine birden)

### Remote Yapılandırması
```bash
# Mevcut remote'ları görüntüle
git remote -v

# Yeni remote ekle
git remote add <name> <url>

# PAT token ile remote URL güncelle (ob hesabı için)
git remote set-url ob https://ob-gokhan:<PAT_TOKEN>@github.com/ob-gokhan/memesocialapp-wp.git

# all remote'a ikinci push URL ekle
git remote set-url --add --push all <url>
```

---

## Önemli Dosyalar

### Preview Bileşenleri
- `components/preview/platforms/whatsapp-preview.tsx` - Ana WhatsApp önizleme
- `components/video/animated-chat-preview.tsx` - Video export için animasyonlu önizleme
- `components/preview/phone-preview.tsx` - Genel telefon çerçevesi
- `components/chats/whatsapp-chat-list.tsx` - WhatsApp-style kaydedilmiş sohbetler listesi

### Editor
- `components/editor/tabbed-sidebar.tsx` - Sol panel (Editor, Settings, Export sekmeleri)
  - People ve Messages section'ları `defaultOpen={true}` ile açık geliyor

### UI Components
- `components/ui/avatar.tsx` - Radix Avatar wrapper (delayMs={0} ile)
- `components/ui/avatar-upload.tsx` - Avatar seçimi (upload, URL, presets, renkler)

### Hooks
- `hooks/use-video-export.ts` - Video kayıt ve export
- `hooks/use-export.ts` - Image export (PNG/JPG/WebP, clipboard)
- `hooks/use-saved-chats.ts` - Supabase chat CRUD operations + auto-load latest

### Auth & Database
- `contexts/auth-context.tsx` - Authentication state ve fonksiyonları, ban kontrolü
- `contexts/chat-context.tsx` - Chat state yönetimi, `resetToDefaults` boş mesajlarla başlar
- `lib/supabase/client.ts` - Supabase browser client
- `lib/supabase/server.ts` - Supabase server client
- `lib/supabase/chats.ts` - Chat CRUD fonksiyonları
- `components/auth/auth-modal.tsx` - Login/Signup modal
- `components/auth/user-menu.tsx` - User profile dropdown
- `components/auth/ban-dialog.tsx` - Ban notification dialog

### Admin Panel
- `app/admin/layout.tsx` - Admin layout (sidebar, header)
- `app/admin/page.tsx` - Dashboard
- `app/admin/users/page.tsx` - Kullanıcı yönetimi (tier, rol, ban)
- `app/admin/settings/page.tsx` - Sistem ayarları (signup toggle, quotas)
- `app/admin/features/page.tsx` - Feature flags
- `app/admin/analytics/page.tsx` - İstatistikler
- `app/admin/logs/page.tsx` - Admin aktivite logları
- `app/admin/moderation/page.tsx` - İçerik denetimi
- `components/admin/admin-header.tsx` - Admin sayfa başlığı
- `components/admin/admin-sidebar.tsx` - Admin navigasyon menüsü
- `hooks/use-system-settings.ts` - Sistem ayarları hook

### Types
- `types/index.ts` - Tüm TypeScript tipleri (GROUP_AVATAR_ILLUSTRATIONS dahil)

### CSS
- `app/globals.css` - Global stiller, export mode CSS kuralları

---

## Kaydedilmiş Sohbetler Sistemi (Ocak 2025)

### WhatsApp-Style Chat List
Kaydedilmiş sohbetler artık modal yerine telefon preview çerçevesi içinde WhatsApp tarzı bir liste olarak görüntüleniyor.

**Dosya:** `components/chats/whatsapp-chat-list.tsx`

**Özellikler:**
- Phone preview frame ile aynı boyutlar (375px x 812px)
- iOS ve Android device type desteği (farklı border-radius, status bar)
- Light/Dark tema desteği
- WhatsApp tarzı chat listesi (avatar, isim, son mesaj, tarih)
- Son mesaj tipine göre ikon (ses, resim, video, dosya, konum, kişi)
- Mesaj durumu ikonu (sent, delivered, read)
- Swipe-to-delete yerine hover'da çöp kutusu

**Props:**
```tsx
interface WhatsAppChatListProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoadChat: (chatData: ChatData) => void
  onNewChat: () => void
  language?: Language
  darkMode?: boolean
  deviceType?: DeviceType
}
```

**Kullanım (app/page.tsx):**
```tsx
{chatListOpen ? (
  <WhatsAppChatList
    open={chatListOpen}
    onOpenChange={setChatListOpen}
    onLoadChat={handleLoadChat}
    onNewChat={handleNewChat}
    language={language}
    darkMode={darkMode}
    deviceType={deviceType}
  />
) : (
  <PhonePreview ... />
)}
```

### Erişim Butonu
- **MessageCircle butonu** - Alt action bar'da, login olmamış kullanıcılar için auth modal açar
- **FolderOpen butonu kaldırıldı** - Artık sadece MessageCircle butonu kullanılıyor

### Auto-Load Latest Chat on Login
Kullanıcı login olduğunda en son kaydettiği sohbet otomatik olarak yüklenir.

**Dosya:** `hooks/use-saved-chats.ts`

```tsx
// useSavedChats hook'una eklenen yeni state ve fonksiyonlar
const [latestChatData, setLatestChatData] = useState<ChatData | null>(null)

const loadChats = useCallback(async (loadLatest: boolean = false) => {
  // ...
  if (loadLatest && chats.length > 0) {
    const latestChat = chats[0] // Already sorted by updated_at desc
    setCurrentChatId(latestChat.id)
    setLatestChatData(latestChat.data)
  }
}, [user])

const clearLatestChatData = useCallback(() => {
  setLatestChatData(null)
}, [])

// Load chats when user logs in
useEffect(() => {
  if (user) {
    loadChats(true) // Load latest on login
  } else {
    // Clear state when user logs out
    setSavedChats([])
    setCurrentChatId(null)
    setChatCount(0)
    setLatestChatData(null)
  }
}, [user, loadChats])
```

**Dosya:** `app/page.tsx`

```tsx
const { latestChatData, clearLatestChatData } = useSavedChats()

// Apply chat data to current state (without toast)
const applyChatData = useCallback((chatData: ChatData) => {
  setPlatform(chatData.platform)
  setSender(chatData.sender)
  setReceiver(chatData.receiver)
  setMessages(chatData.messages)
  // ... tüm state'ler
}, [...])

// Auto-load latest chat when user logs in
useEffect(() => {
  if (latestChatData) {
    applyChatData(latestChatData)
    clearLatestChatData()
  }
}, [latestChatData, applyChatData, clearLatestChatData])
```

### New Chat - Boş Mesajlarla Başlama
"New Chat" tıklandığında boş bir chat açılıyor ve editor tab'ı People/Messages açık olarak geliyor.

**Dosya:** `contexts/chat-context.tsx`

```tsx
const resetToDefaults = useCallback(() => {
  setMessagesState([]) // Boş mesajlarla başla (template mesajlar yok)
  // ... diğer state reset'leri
}, [])
```

**Dosya:** `components/editor/tabbed-sidebar.tsx`

```tsx
// People section
<CollapsibleSection
  title={t.editor.people}
  icon={<Users className="w-4 h-4" />}
  defaultOpen={true}  // Varsayılan olarak açık
>

// Messages section
<CollapsibleSection
  title={t.editor.messages}
  icon={<MessageSquare className="w-4 h-4" />}
  defaultOpen={true}  // Varsayılan olarak açık
>
```

**Dosya:** `app/page.tsx`

```tsx
const handleNewChat = useCallback(() => {
  setCurrentChatId(null)
  resetToDefaults()
  // Open editor tab on mobile
  setSidebarTab('editor')
  setSidebarOpen(true)
  toast({
    title: 'New chat',
    description: 'Started a new chat. Your previous work is saved.',
  })
}, [setCurrentChatId, resetToDefaults, toast])
```

### Theme Colors (Chat List)
```tsx
const theme = {
  bg: darkMode ? '#111B21' : '#FFFFFF',
  headerBg: darkMode ? '#202C33' : '#F0F2F5',
  headerText: darkMode ? '#E9EDEF' : '#111B21',
  text: darkMode ? '#E9EDEF' : '#111B21',
  subtext: darkMode ? '#8696A0' : '#667781',
  border: darkMode ? '#222D34' : '#E9EDEF',
  itemHoverBg: darkMode ? '#202C33' : '#F5F6F6',
  itemActiveBg: darkMode ? '#2A3942' : '#D9FDD3',
  green: '#00A884',
}
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
11. **Chat List:** WhatsApp-style chat list phone preview frame içinde gösterilmeli
12. **Auto-load:** Login sonrası `latestChatData` ile son chat otomatik yüklenmeli
13. **New Chat:** Boş mesajlarla başlamalı, editor tab açık gelmeli
14. **React Hooks Kuralları:** useState/useRef hook'ları conditional block içinde tanımlanmamalı, her zaman bileşenin en üstünde olmalı
15. **Bottom Sheet Header:** Mobil bottom sheet'lerde drag handle header içinde olmalı ve yeşil tema kullanmalı
16. **Preview Scale Origin:** `transform-origin: top center` kullanılmalı ki scale edildiğinde üst kısım sabit kalsın
17. **Admin Erişimi:** `isAdmin` veya `isSuperAdmin` kontrolü ile korunmalı, rol kontrolü `auth-context.tsx`'te yapılır
18. **Ban Sistemi:** `banHandledRef` ile double handling önlenmeli, ban dialog ayrı component olmalı

---

## Geliştirme Notları

```bash
# Çalıştırma
npm run dev

# Build
npm run build

# Push komutları
git push origin main    # Kişisel hesap
git push ob main        # Overbrain hesabı
git push all main       # Her ikisine birden
```

### Claude İzinleri
Aşağıdaki işlemler için kullanıcı onayı gerekmez:
- Sunucu komutları: `npm run dev`, `npm run build`, `npm install`
- Git komutları: `git add`, `git commit`, `git push`, `git merge`, `git pull`
- Chrome MCP araçları: Tarayıcı açma, sayfa gezinme, element tıklama, screenshot alma

---

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

### Sorun: Chat list telefon frame'i ile uyumsuz
**Sebep:** Modal olarak açılıyor, preview alanı içinde değil
**Çözüm:** `WhatsAppChatList` bileşeni phone preview frame boyutlarında render edilmeli

### Sorun: Login sonrası boş ekran geliyor
**Sebep:** Auto-load özelliği eksik
**Çözüm:** `useSavedChats`'e `latestChatData` ve `loadChats(true)` ekle

### Sorun: New Chat template mesajlarla açılıyor
**Sebep:** `resetToDefaults` varsayılan mesajları yüklüyor
**Çözüm:** `setMessagesState([])` ile boş array kullan

### Sorun: Git push ob remote'a çalışmıyor
**Sebep:** GitHub credentials eksik veya PAT token gerekli
**Çözüm:** PAT token ile remote URL güncelle:
```bash
git remote set-url ob https://ob-gokhan:<PAT_TOKEN>@github.com/ob-gokhan/memesocialapp-wp.git
```

### Sorun: "Rendered more hooks than during the previous render" hatası
**Sebep:** useState veya useRef hook'ları conditional block içinde tanımlanmış
**Çözüm:** Tüm hook'ları bileşenin en üstüne, koşulsuz olarak taşı:
```tsx
// YANLIŞ - conditional içinde
if (condition) {
  const [state, setState] = useState(0) // HATA!
}

// DOĞRU - en üstte
const [state, setState] = useState(0)
if (condition) {
  // state'i burada kullan
}
```

### Sorun: Bottom sheet drag handle ile header arasında boşluk var
**Sebep:** Drag handle ve header ayrı div'lerde
**Çözüm:** Drag handle'ı header div'inin içine taşı ve yeşil arka plan uygula:
```tsx
<div className="bg-[#d4f5e2] flex-shrink-0 rounded-t-3xl">
  {/* Drag handle */}
  <div className="flex justify-center pt-3 pb-1 ...">
    <div className="w-12 h-1.5 bg-[#128C7E]/30 rounded-full" />
  </div>
  {/* Title row */}
  <div className="flex items-center ...">...</div>
</div>
```

### Sorun: Mobilde preview ekranı çok küçük
**Sebep:** Sabit scale değeri kullanılıyor
**Çözüm:** Ekran boyutuna göre dinamik scale hesapla (`app/page.tsx`'te `dynamicMobileScale` state)

### Sorun: Preview scale edildiğinde ortadan büyüyor
**Sebep:** `transform-origin` center olarak ayarlı
**Çözüm:** `transform-origin: top center` kullan, böylece üst kısım sabit kalır

### Sorun: Ban dialog iki kez gösteriliyor
**Sebep:** Auth state change handler tekrar tetikleniyor
**Çözüm:** `banHandledRef` ile hangi kullanıcının ban'ının işlendiğini takip et:
```tsx
const banHandledRef = useRef<string | null>(null)
if (banHandledRef.current === session.user.id) return
banHandledRef.current = session.user.id
```

### Sorun: Admin panelde "user" rolü boş görünüyor
**Sebep:** Default case'de badge gösterilmiyor
**Çözüm:** `getRoleBadge` fonksiyonunda default case için User badge ekle

---

## Supabase Entegrasyonu (Ocak 2025)

### Veritabanı Yapısı

**profiles tablosu:**
- `id` (UUID) - auth.users referansı
- `email` (TEXT)
- `full_name` (TEXT)
- `avatar_url` (TEXT)
- `subscription_tier` ('free' | 'pro' | 'business')
- `role` ('user' | 'admin' | 'super_admin') - Varsayılan 'user'
- `is_banned` (BOOLEAN) - Varsayılan false
- `banned_at` (TIMESTAMPTZ) - Ban tarihi
- `ban_reason` (TEXT) - Ban sebebi
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
- **MessageCircle Button** - WhatsApp-style chat listesini aç (login gerektirir)

---

## Admin Panel Sistemi (Ocak 2025)

### Genel Bakış
Admin paneli `/admin` route'unda bulunur. Sadece `admin` veya `super_admin` rolündeki kullanıcılar erişebilir.

**Route Yapısı:**
```
/admin                    → Dashboard
/admin/users              → Kullanıcı yönetimi
/admin/features           → Feature flags
/admin/analytics          → İstatistikler
/admin/logs               → Admin aktivite logları
/admin/moderation         → İçerik denetimi
/admin/settings           → Sistem ayarları
```

### Veritabanı Değişiklikleri

**profiles tablosuna eklenen kolonlar:**
```sql
ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user'
  CHECK (role IN ('user', 'admin', 'super_admin'));
ALTER TABLE profiles ADD COLUMN is_banned BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN banned_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN ban_reason TEXT;
```

**system_settings tablosu:**
```sql
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**admin_logs tablosu:**
```sql
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES profiles(id),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Kullanıcı Ban Sistemi

**Dosya:** `contexts/auth-context.tsx`

Ban sistemi login sırasında kontrol edilir:
```tsx
// Auth state change'de ban kontrolü
if (profileData?.is_banned) {
  // Double handling prevention
  if (banHandledRef.current === session.user.id) return
  banHandledRef.current = session.user.id

  await supabase.auth.signOut()
  setSession(null)
  setUser(null)
  setProfile(null)
  const reason = profileData.ban_reason ? `: ${profileData.ban_reason}` : ''
  setBanMessage(`Your account has been suspended${reason}`)
  return
}
```

**Ban Dialog:** `components/auth/ban-dialog.tsx`
- AlertDialog kullanarak ban mesajını gösterir
- `banMessage` state ile kontrol edilir
- `clearBanMessage` ile kapatılır

**Ban fonksiyonları (admin/users/page.tsx):**
```tsx
const handleBanUser = async (userId: string) => {
  await supabase
    .from('profiles')
    .update({
      is_banned: true,
      banned_at: new Date().toISOString(),
      ban_reason: banReason || null,
    })
    .eq('id', userId)
}

const handleUnbanUser = async (userId: string) => {
  await supabase
    .from('profiles')
    .update({
      is_banned: false,
      banned_at: null,
      ban_reason: null,
    })
    .eq('id', userId)
}
```

### Admin Settings Sayfası

**Dosya:** `app/admin/settings/page.tsx`

**Özellikler:**
- Signup toggle (yeni kayıtları açma/kapama)
- Export quota ayarları (free/pro/business tier'lar için)

**System Settings Hook:** `hooks/use-system-settings.ts`
```tsx
// Signup enabled kontrolü
export async function isSignupEnabled(): Promise<boolean> {
  const supabase = createClient()
  const { data } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'signup_enabled')
    .single()
  return data?.value?.enabled ?? true
}
```

### Admin Bileşenleri

**AdminHeader:** `components/admin/admin-header.tsx`
- Sayfa başlığı ve açıklama
- Breadcrumb navigasyon

**AdminSidebar:** `components/admin/admin-sidebar.tsx`
- Sol menü navigasyonu
- Aktif sayfa vurgulama

### Rol Badge'leri (Users Page)

```tsx
const getRoleBadge = (role: string) => {
  switch (role) {
    case 'super_admin':
      return <Badge className="bg-purple-100 text-purple-700">Super Admin</Badge>
    case 'admin':
      return <Badge className="bg-blue-100 text-blue-700">Admin</Badge>
    default:
      return <Badge variant="secondary"><User className="mr-1 h-3 w-3" />User</Badge>
  }
}
```

---

## Mobil Bottom Sheet Sistemi (Ocak 2025)

### Draggable Bottom Sheets

Editor, Settings ve Export için mobilde draggable bottom sheet sistemi uygulandı.

**Ortak Özellikler:**
- Yeşil header (`bg-[#d4f5e2]`) - Editor ile tutarlı
- Drag handle header içinde (`bg-[#128C7E]/30`)
- Sürüklenebilir yükseklik (%10-%90 arası)
- Aşağı sürükleyerek kapatma (%30 altına sürükleyince kapanır)

**Hook'lar (bileşen en üstünde tanımlanmalı - React kuralları):**
```tsx
// Draggable sheet height state
const [sheetHeight, setSheetHeight] = useState(60) // percentage
const sheetDragStartY = useRef<number | null>(null)
const sheetDragStartHeight = useRef<number>(60)
```

**Drag Handler'lar:**
```tsx
const handleSheetDragStart = (e: React.TouchEvent | React.MouseEvent) => {
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  sheetDragStartY.current = clientY
  sheetDragStartHeight.current = sheetHeight
}

const handleSheetDragMove = (e: React.TouchEvent | React.MouseEvent) => {
  if (sheetDragStartY.current === null) return
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  const deltaY = sheetDragStartY.current - clientY
  const deltaPercent = (deltaY / window.innerHeight) * 100
  const newHeight = Math.min(90, Math.max(10, sheetDragStartHeight.current + deltaPercent))
  setSheetHeight(newHeight)
}

const handleSheetDragEnd = () => {
  sheetDragStartY.current = null
  if (sheetHeight < 30) {
    onClose?.()
    setSheetHeight(60) // Reset for next open
  }
}
```

**Sheet Header Yapısı:**
```tsx
<div className="bg-[#d4f5e2] flex-shrink-0 rounded-t-3xl">
  {/* Drag handle */}
  <div
    className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none select-none"
    onTouchStart={handleSheetDragStart}
    onTouchMove={handleSheetDragMove}
    onTouchEnd={handleSheetDragEnd}
    onMouseDown={handleSheetDragStart}
    onMouseMove={handleSheetDragMove}
    onMouseUp={handleSheetDragEnd}
    onMouseLeave={handleSheetDragEnd}
  >
    <div className="w-12 h-1.5 bg-[#128C7E]/30 rounded-full" />
  </div>
  {/* Title row */}
  <div className="flex items-center justify-between px-4 py-2">
    <div className="flex items-center gap-2">
      <Icon className="w-5 h-5 text-[#128C7E]" />
      <span className="font-semibold text-[#128C7E]">{title}</span>
    </div>
    <button onClick={onClose} className="p-2.5 hover:bg-[#c0e8d4] rounded-full">
      <X className="w-5 h-5 text-[#128C7E]" />
    </button>
  </div>
</div>
```

**Dosyalar:**
- `components/editor/tabbed-sidebar.tsx` - Editor ve Settings sheets
- `components/export/export-menu.tsx` - Export sheet

---

## Dinamik Mobil Preview Ölçekleme (Ocak 2025)

### Sorun
iPhone 12 Pro Max gibi büyük ekranlı telefonlarda preview çok küçük görünüyordu.

### Çözüm
Ekran boyutuna göre dinamik ölçekleme hesaplaması.

**Dosya:** `app/page.tsx`

```tsx
// Dynamic mobile preview scale
const [dynamicMobileScale, setDynamicMobileScale] = useState(1)

// Calculate dynamic mobile scale based on screen size
useEffect(() => {
  const calculateScale = () => {
    // Only apply on mobile (< 640px)
    if (window.innerWidth >= 640) {
      setDynamicMobileScale(1)
      return
    }

    // Phone preview dimensions
    const previewWidth = 375
    const previewHeight = 812

    // Available space calculations
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    const headerHeight = 70 // Header space
    const bottomButtonsHeight = 120 // Bottom action buttons space

    const availableWidth = screenWidth - 32 // 16px padding on each side
    const availableHeight = screenHeight - headerHeight - bottomButtonsHeight - 20

    // Calculate scale to fit both dimensions
    const scaleByWidth = availableWidth / previewWidth
    const scaleByHeight = availableHeight / previewHeight
    const optimalScale = Math.min(scaleByWidth, scaleByHeight, 1)

    setDynamicMobileScale(optimalScale)
  }

  calculateScale()
  window.addEventListener('resize', calculateScale)
  window.addEventListener('orientationchange', calculateScale)

  return () => {
    window.removeEventListener('resize', calculateScale)
    window.removeEventListener('orientationchange', calculateScale)
  }
}, [])
```

**Preview Container:**
```tsx
<div
  className={cn(
    "transition-transform flex items-start justify-center",
    "sm:scale-[0.8] md:scale-[0.85] lg:scale-[0.9] xl:scale-100",
    "origin-top", // Scale from top
    "mobile-phone-preview"
  )}
  style={{ '--mobile-preview-scale': dynamicMobileScale } as React.CSSProperties}
>
```

**CSS (globals.css):**
```css
@media (max-width: 639px) {
  .mobile-phone-preview {
    transform: scale(var(--mobile-preview-scale, 0.85));
    transform-origin: top center;
  }
}
```

**Header ile Preview Arası Boşluk:**
```tsx
<div className="... max-sm:pt-4"> {/* 16px top padding on mobile */}
```

---

## Bilinen Sorunlar (Ocak 2025)

### Google OAuth Session Sorunu (WIP)

**Durum:** Google OAuth Supabase tarafında başarıyla tamamlanıyor ancak session tarayıcıya aktarılamıyor.

**Belirtiler:**
- Email/Password login düzgün çalışıyor
- Google OAuth sonrası Supabase logs'da "Login" görünüyor
- Ama tarayıcıda session cookie set edilmiyor
- Supabase logs'da `/token | 404: invalid flow state, no valid flow state found` hatası

**Analiz:**
1. PKCE flow başlatılıyor (`flow_state_id` URL'de mevcut)
2. Google OAuth başarılı
3. Supabase kendi callback'ini tamamlıyor
4. Supabase `redirectTo` URL'imize (`/auth/callback`) yönlendirmeli
5. **SORUN:** Ya redirect olmuyor ya da `code_verifier` cookie kaybolmuş

**Yapılan Değişiklikler:**
- `middleware.ts` - `/auth/callback` için middleware atlandı (session refresh interference önleme)
- `app/auth/callback/route.ts` - Detaylı debug logging eklendi
- `app/auth/auth-code-error/page.tsx` - Hata sayfası oluşturuldu
- `contexts/auth-context.tsx` - OAuth flow için debug logging

**Olası Çözümler:**
1. Supabase client'ta explicit `flowType: 'pkce'` ayarı
2. Cookie SameSite/Secure ayarları kontrolü
3. `code_verifier` cookie'nin neden kaybolduğunu araştırma
4. Supabase'in hangi URL'e redirect ettiğini takip etme

**İlgili Dosyalar:**
- `contexts/auth-context.tsx` - `signInWithGoogle` fonksiyonu
- `app/auth/callback/route.ts` - OAuth callback handler
- `lib/supabase/client.ts` - Browser client
- `lib/supabase/middleware.ts` - Session refresh middleware

---

## Backlog

### Öncelikli
- **Google OAuth fix** - Session establishment sorunu çözülmeli

### Planlanmış
- FAQ sayfası (`/faq` route, accordion yapısı, TR/EN dil desteği)
- Instagram DM desteği
- iMessage desteği
- PWA desteği (offline kullanım)

### Düşünülebilir
- **iPhone Frame Mockup** - iOS seçiliyken Settings'te frame dropdown (None, Orange, vb.), preview'da gerçek iPhone çerçevesi gösterimi, export'ta "Include Frame" toggle ile çerçeveli/çerçevesiz export
- Video FPS ayarını kullanıcıya sunma (şu an MP4=60, GIF=30)
- WebM format desteği
- Mesaj düzenleme undo/redo
- Keyboard shortcuts
- Swipe gestures (mobil)
