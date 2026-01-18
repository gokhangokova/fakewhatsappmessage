# FakeSocialMessage - Project Context

## Proje Hakkında
Fake chat screenshot generator - WhatsApp, Instagram, iMessage gibi platformların sahte sohbet ekran görüntülerini oluşturan Next.js uygulaması.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **UI:** React, TailwindCSS, shadcn/ui
- **Dil Desteği:** Türkçe (tr) ve İngilizce (en)
- **State:** React hooks, localStorage persistence

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
- `hooks/use-chat-state.ts` - Sohbet durumu yönetimi

### Types
- `types/index.ts` - Tüm TypeScript tipleri (GROUP_AVATAR_ILLUSTRATIONS dahil)

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

---

## Gelecek Geliştirmeler İçin Notlar
- Video export performansı optimize edildi (requestAnimationFrame ile throttling)
- Grup sohbet katılımcı yönetimi tam çalışıyor (ekle/sil/düzenle)
- Mesaj sürükle-bırak ile sıralama çalışıyor (dnd-kit)
- Grup icon seçimi illüstrasyon avatarlarla çalışıyor (DiceBear API)
