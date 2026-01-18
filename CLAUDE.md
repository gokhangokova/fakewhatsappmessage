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

### Hooks
- `hooks/use-video-export.ts` - Video kayıt ve export
- `hooks/use-chat-state.ts` - Sohbet durumu yönetimi

### Types
- `types/index.ts` - Tüm TypeScript tipleri

## Son Yapılan Önemli Değişiklikler

### Kuyruk (Tail) ve Avatar Pozisyonlama (Ocak 2025)
Ardışık mesajlarda kuyruk ve avatar artık **SON** mesajda görünüyor (ilk mesaj değil).

**Mantık:**
- `isFirstInGroup`: Aynı kişiden gelen ardışık mesajların İLKİ
- `isLastInGroup`: Aynı kişiden gelen ardışık mesajların SONUNCUSU
- Kuyruk (tail) → `isLastInGroup` true olduğunda göster
- Avatar → `isLastInGroup` true olduğunda göster (kuyrukla aynı hizada)

**Hesaplama:**
```tsx
{group.messages.map((message, index) => {
  const prevMessage = index > 0 ? group.messages[index - 1] : null
  const nextMessage = index < group.messages.length - 1 ? group.messages[index + 1] : null
  const isFirstInGroup = !prevMessage || prevMessage.userId !== message.userId
  const isLastInGroup = !nextMessage || nextMessage.userId !== message.userId
  // ...
})}
```

**Avatar ve Spacer:**
```tsx
// Avatar sadece son mesajda (kuyrukla aynı hizada)
const showGroupAvatar = isGroupChat && !isSent && isLastInGroup && messageSender

// Spacer: Avatar olmayan mesajlarda hizalama için
{isGroupChat && !isSent && !isLastInGroup && (
  <div className="w-[34px] flex-shrink-0" />
)}
```

### isSent Kontrolü (Kritik!)
Mesajın "gönderen" (You) tarafından mı yoksa "alıcı" tarafından mı gönderildiğini belirler:

```tsx
// 1-1 Chat: sender.id veya 'me'
// Group Chat: sender.id, 'me' veya 'sender-1' (varsayılan You ID'si)
const isSent = message.userId === sender.id || message.userId === 'me' || message.userId === 'sender-1'
```

**Önemli:** `sender-1` grup chat'te "You" için varsayılan ID'dir. Bu kontrol olmadan grup chat'te You mesajları yanlış şekilde "alınan mesaj" olarak işlenir.

### Grup Sohbet Avatarları
- Grup sohbetlerinde alınan mesajların yanında avatar gösterimi
- Avatar: Resim varsa resim, yoksa renk ve baş harfler
- `showGroupAvatar` kontrolü: `isGroupChat && !isSent && isLastInGroup && messageSender`

### Mesaj Balonu Border Radius
- `rounded-[18px]` yerine `rounded-[8px]` kullanılıyor (gerçek WhatsApp gibi)
- Kuyruk köşesi: `rounded-br-[2px]` (gönderilen) veya `rounded-bl-[2px]` (alınan)
- Kuyruk sadece `isLastInGroup` true olduğunda gösterilir

**Kuyruk SVG (Gönderilen - Sağ taraf):**
```tsx
{isLastInGroup && (
  <svg className="absolute -right-[8px] bottom-0" width="8" height="13" viewBox="0 0 8 13">
    <path d="M0 0v13l8-8.5L.5 0H0z" fill={theme.sentBubble} />
  </svg>
)}
```

**Kuyruk SVG (Alınan - Sol taraf):**
```tsx
{isLastInGroup && (
  <svg className="absolute -left-[8px] bottom-0" width="8" height="13" viewBox="0 0 8 13">
    <path d="M8 0v13L0 4.5 7.5 0H8z" fill={theme.receivedBubble} />
  </svg>
)}
```

### Saat/Durum Pozisyonlama (WhatsApp Stili)
Gerçek WhatsApp'taki gibi saat mesajla aynı satırda akıyor:
```tsx
{/* Görünmez spacer - saat için yer ayırır */}
<span className="inline-block opacity-0 text-[11px] ml-[6px]">
  {time}{isSent ? ' ✓✓' : ''}
</span>

{/* Gerçek saat - absolute pozisyonla spacer üzerine */}
<span className="absolute bottom-[8px] right-[12px]">
  {time}
  {/* checkmark svg */}
</span>
```

### Doodle Arka Plan
- `settings.showDoodle !== false` kontrolü (undefined = true)
- Doodle modunda `theme.chatBg` kullanılıyor

### GroupSenderName
- Mesaj içeriğiyle arasında boşluk yok (`mb-[2px]` kaldırıldı)
- Grup mesajlarında `pt-[2px] pb-[8px]` padding

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

### Mesaj Tipleri
- `text`, `image`, `video`, `voice`, `document`, `location`, `contact`

### Varsayılan Sender ID'leri
- 1-1 Chat: `sender.id` (dinamik) veya `'me'`
- Group Chat You: `'sender-1'` (varsayılan)
- Group Chat Participants: `'participant-{uuid}'`

## Dikkat Edilecekler

1. **Her iki dosyayı da güncelle:** `whatsapp-preview.tsx` ve `animated-chat-preview.tsx` senkronize tutulmalı
2. **iOS/Android farkları:** Header, footer ve bazı stiller cihaz tipine göre değişiyor
3. **Light/Dark mode:** Tüm renkler tema'ya göre belirlenmeli
4. **Türkçe çeviriler:** `lib/translations.ts` dosyasında
5. **isSent kontrolü:** Hem `sender.id`, `'me'` hem de `'sender-1'` kontrol edilmeli
6. **Kuyruk ve Avatar:** `isLastInGroup` kullan, `isFirstInGroup` değil

## Geliştirme Notları

```bash
# Çalıştırma
npm run dev

# Build
npm run build
```

## Gelecek Geliştirmeler İçin Notlar
- Video export performansı optimize edildi (requestAnimationFrame ile throttling)
- Grup sohbet katılımcı yönetimi tam çalışıyor (ekle/sil/düzenle)
- Mesaj sürükle-bırak ile sıralama çalışıyor (dnd-kit)

## Sık Karşılaşılan Sorunlar ve Çözümleri

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
