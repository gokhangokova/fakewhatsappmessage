## 🗨️ Epic 12: WhatsApp Grup Chat

### Yüksek Öncelik (MVP)
- [x] Grup chat tip tanımlamaları (GroupParticipant, GroupChatSettings, SystemMessageType)
- [x] State hook güncelleme (groupSettings, toggleGroupChat, participant CRUD)
- [x] Chat tipi toggle (1-1 / Grup)
- [x] Grup adı input alanı
- [x] Mesaj baloncuğunda sender ismi + renk gösterimi
- [x] Header'da grup adı gösterimi

### Orta Öncelik
- [ ] Katılımcı listesi görünümü (Editor panel)
- [ ] Katılımcı ekleme/çıkarma UI
- [ ] Katılımcı renk seçimi
- [ ] Mesaj eklerken sender dropdown seçimi
- [ ] Sistem mesajları (X gruba katıldı, vb.)
- [ ] Grup ikonu seçimi (preset + yükleme)
- [ ] Header'da katılımcı listesi

### Düşük Öncelik
- [ ] Mention özelliği (@Ali)
- [ ] Grup açıklaması
- [ ] Admin badge gösterimi
- [ ] Katılımcı avatarları
- [ ] Video export'ta grup desteği
- [ ] Typing indicator'da isim gösterimi

---

# 📋 FakeSocialMessage - Product Backlog

> Son güncelleme: 17 Ocak 2026

---

## 🎯 Epic 1: Kimlik Doğrulama (Authentication)

### Yüksek Öncelik
- [ ] Email/Şifre ile kayıt sistemi
- [ ] Google OAuth login
- [ ] Şifremi unuttum (email ile reset)
- [ ] Email doğrulama sistemi

### Orta Öncelik
- [ ] Apple Login (iOS kullanıcıları için)
- [ ] Magic Link (şifresiz email ile giriş)
- [ ] GitHub Login (developer hedef kitle için)

### Düşük Öncelik
- [ ] 2FA (iki faktörlü doğrulama)
- [ ] Session yönetimi ve güvenlik logları

---

## 👤 Epic 2: Kullanıcı Profili

### Yüksek Öncelik
- [ ] Profil sayfası (temel bilgiler)
- [ ] Kullanıcı adı / Display name
- [ ] Tercih edilen dil ayarı (TR/EN)
- [ ] Tema tercihi (Light/Dark/System)

### Orta Öncelik
- [ ] Profil fotoğrafı yükleme
- [ ] Hesap oluşturma tarihi gösterimi
- [ ] Son giriş tarihi
- [ ] Email doğrulama badge'i

### Düşük Öncelik
- [ ] Profil URL'i (username bazlı)
- [ ] Bio/açıklama alanı

---

## 💬 Epic 3: Kaydedilen Konuşmalar (Projects)

### Yüksek Öncelik
- [ ] Konuşma kaydetme (isimle)
- [ ] Konuşma listesi sayfası
- [ ] Kaydedilmiş konuşmayı yükleme
- [ ] Konuşma silme
- [ ] Son düzenleme tarihi gösterimi

### Orta Öncelik
- [ ] Önizleme thumbnail oluşturma
- [ ] Grid/Liste görünüm seçeneği
- [ ] Arama (isim veya içerik ile)
- [ ] Favoriler (yıldızlı konuşmalar)
- [ ] Duplicate (kopyasını oluşturma)

### Düşük Öncelik
- [ ] Klasörler/Kategoriler
- [ ] Etiketleme (tags)
- [ ] Sıralama seçenekleri (tarih, isim, boyut)
- [ ] Export history (dışa aktarma geçmişi)
- [ ] Paylaşım linki (public/private)

---

## ⚙️ Epic 4: Ayarlar Senkronizasyonu

### Yüksek Öncelik
- [ ] Varsayılan tema kaydetme
- [ ] Varsayılan dil kaydetme
- [ ] Varsayılan export ayarları (format, scale, quality)

### Orta Öncelik
- [ ] Varsayılan platform tercihi
- [ ] Varsayılan video ayarları (speed, duration)
- [ ] Son kullanılan sender/receiver isimleri
- [ ] Device type tercihi (iPhone/Android)

### Düşük Öncelik
- [ ] Favori renk paleti
- [ ] Sık kullanılan emojiler
- [ ] Özel keyboard shortcuts

---

## 💰 Epic 5: Abonelik Sistemi (Monetization)

### Tier Yapısı
```
FREE:
- 5 kayıtlı konuşma limiti
- Watermark zorunlu
- Temel export (1x, 2x)
- Temel video export

PRO ($X/ay):
- Sınırsız kayıtlı konuşma
- Watermark opsiyonel
- HD export (3x)
- Tüm video ayarları
- Öncelikli destek

BUSINESS ($Y/ay):
- Pro'daki her şey
- API erişimi
- Bulk export
- Özel watermark/branding
- Takım özellikleri
```

### Yüksek Öncelik
- [ ] Stripe entegrasyonu
- [ ] Abonelik sayfası UI
- [ ] Free tier limitleri
- [ ] Pro tier özellikleri
- [ ] Ödeme geçmişi

### Orta Öncelik
- [ ] Yıllık indirim seçeneği
- [ ] Promo kod sistemi
- [ ] Fatura oluşturma
- [ ] Abonelik iptal akışı

### Düşük Öncelik
- [ ] Business tier
- [ ] Takım faturalandırma
- [ ] Usage-based pricing seçeneği

---

## 🎨 Epic 6: Template Gallery

### Orta Öncelik
- [ ] Hazır konuşma şablonları
- [ ] Şablon kategorileri (komik, romantik, iş, vb.)
- [ ] Şablon önizleme
- [ ] Şablondan yeni proje oluşturma

### Düşük Öncelik
- [ ] Community templates (kullanıcı paylaşımları)
- [ ] Like/Save sistemi
- [ ] En popüler şablonlar
- [ ] Şablon arama

---

## 🤖 Epic 7: AI Özellikleri

### Orta Öncelik
- [ ] AI Chat Generator (prompt ile otomatik mesaj üretimi)
- [ ] Örnek: "Komik bir tartışma oluştur"
- [ ] Örnek: "Romantik bir sohbet yaz"

### Düşük Öncelik
- [ ] Smart Suggestions (sonraki mesaj önerisi)
- [ ] Tone Adjuster (mesaj tonunu değiştirme)
- [ ] Otomatik emoji önerileri
- [ ] Dil çevirisi

---

## 📊 Epic 8: Analytics & Dashboard

### Düşük Öncelik
- [ ] Kullanım istatistikleri
- [ ] Kaç export yapıldı
- [ ] En çok kullanılan platform
- [ ] Görsel grafiklerle özet dashboard

---

## 👥 Epic 9: Takım Özellikleri (Business)

### Düşük Öncelik
- [ ] Workspace oluşturma
- [ ] Takım üyesi davet etme
- [ ] Paylaşılan projeler
- [ ] Rol bazlı izinler (admin, editor, viewer)
- [ ] Yorum/Feedback sistemi
- [ ] Version history

---

## 🔗 Epic 10: Entegrasyonlar

### Orta Öncelik
- [ ] Google Drive export
- [ ] Dropbox export

### Düşük Öncelik
- [ ] Webhook Integration
- [ ] Zapier entegrasyonu
- [ ] API (public)
- [ ] Slack bildirimleri

---

## 🔒 Epic 11: Güvenlik

### Yüksek Öncelik
- [ ] Rate limiting
- [ ] HTTPS zorunluluğu
- [ ] Güvenli session yönetimi

### Orta Öncelik
- [ ] CAPTCHA (bot koruması)
- [ ] GDPR uyumluluğu (veri silme hakkı)
- [ ] Şifre politikası (min 8 karakter, vb.)
- [ ] Login attempt limiti

### Düşük Öncelik
- [ ] Security audit logs
- [ ] IP bazlı blocking
- [ ] Suspicious activity alerts

---

## 🛠️ Teknik Altyapı Kararları

### Authentication
- [ ] Karar: NextAuth.js / Clerk / Supabase Auth / Firebase Auth

### Database
- [ ] Karar: Supabase (PostgreSQL) / PlanetScale / MongoDB Atlas

### Storage (Görseller)
- [ ] Karar: Supabase Storage / Cloudinary / AWS S3

### Payments
- [ ] Karar: Stripe / LemonSqueezy / Paddle

### Önerilen Kombinasyon
```
Seçenek A (All-in-one):
- Supabase (Auth + DB + Storage)
- Stripe (Payments)

Seçenek B (Best-of-breed):
- Clerk (Auth)
- PlanetScale (DB)
- Cloudinary (Storage)
- Stripe (Payments)
```

---

## 📅 MVP Tanımı (Minimum Viable Product)

İlk release için minimum gereksinimler:

1. ✅ Google Login
2. ✅ Email/Şifre kayıt
3. ✅ Konuşma kaydetme (5 adet limit)
4. ✅ Kaydedilmiş konuşmaları listeleme
5. ✅ Temel ayar senkronizasyonu
6. ✅ Free/Pro tier ayrımı (watermark)

---

## 📝 Notlar

- Hedef kitle: Content creator'lar, sosyal medya yöneticileri, bireysel kullanıcılar
- Öncelik: Önce sağlam kullanıcı tabanı, sonra monetization
- Tech stack kararı: Tartışılacak

---

*Bu backlog yaşayan bir dokümandır ve önceliklere göre güncellenecektir.*
