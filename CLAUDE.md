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

### Grup Sohbet Avatarları (Ocak 2025)
- Grup sohbetlerinde alınan mesajların yanında avatar gösterimi eklendi
- Avatar: Resim varsa resim, yoksa renk ve baş harfler
- `showGroupAvatar` kontrolü: `isGroupChat && !isSent && isFirstInGroup && messageSender`

### Mesaj Balonu Border Radius
- `rounded-[18px]` yerine `rounded-[8px]` kullanılıyor (gerçek WhatsApp gibi)
- Kuyruk köşesi: `rounded-br-[2px]` (gönderilen) veya `rounded-bl-[2px]` (alınan)

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

## Dikkat Edilecekler

1. **Her iki dosyayı da güncelle:** `whatsapp-preview.tsx` ve `animated-chat-preview.tsx` senkronize tutulmalı
2. **iOS/Android farkları:** Header, footer ve bazı stiller cihaz tipine göre değişiyor
3. **Light/Dark mode:** Tüm renkler tema'ya göre belirlenmeli
4. **Türkçe çeviriler:** `lib/translations.ts` dosyasında

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
