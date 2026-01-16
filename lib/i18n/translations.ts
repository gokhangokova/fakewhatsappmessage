import { Language } from '@/types'

// Translation keys type
export interface Translations {
  // Common
  common: {
    settings: string
    editor: string
    resetToDefaults: string
    save: string
    cancel: string
    delete: string
    add: string
    edit: string
    close: string
    loading: string
  }
  
  // Settings Panel
  settings: {
    appearance: string
    whatsapp: string
    language: string
    about: string
    selectLanguage: string
    // Appearance
    view: string
    desktop: string
    mobile: string
    timeFormat: string
    darkMode: string
    transparentBg: string
    fontFamily: string
    batteryLevel: string
    device: string
    ios: string
    android: string
    // WhatsApp
    status: string
    online: string
    typing: string
    lastSeen: string
    none: string
    background: string
    solid: string
    pattern: string
    image: string
    color: string
    baseColor: string
    patternOpacity: string
    encryptionNotice: string
    upload: string
    change: string
  }
  
  // Editor Panel
  editor: {
    people: string
    messages: string
    sender: string
    senderYou: string
    receiver: string
    addMessage: string
    typeMessage: string
    whatsappFeatures: string
    whatsappFeaturesDesc: string
    imageMessage: string
    forwardedMessage: string
    replyingTo: string
    reactions: string
  }
  
  // Avatar Upload
  avatar: {
    chooseAvatar: string
    remove: string
    currentAvatar: string
    upload: string
    url: string
    pasteImageUrl: string
    add: string
    selectPhoto: string
    orUseInitials: string
  }
  
  // WhatsApp Preview
  whatsappPreview: {
    encryptionNotice: string
    today: string
    yesterday: string
    online: string
    typing: string
    lastSeenToday: string
    lastSeenYesterday: string
    tapForInfo: string
    participants: string
    message: string
  }
  
  // About
  about: {
    description: string
    autoSave: string
  }
  
  // Export
  export: {
    export: string
    exportOptions: string
    format: string
    quality: string
    scale: string
    watermark: string
    watermarkDesc: string
    download: string
    copyToClipboard: string
    copied: string
    downloading: string
    preview: string
    stop: string
  }
  
  // Video Export
  video: {
    videoExport: string
    videoExportDesc: string
    record: string
    recording: string
    processing: string
    downloadVideo: string
    reset: string
    typingDuration: string
    messageDelay: string
    messageAppearDuration: string
    endPause: string
    outputFormat: string
    estimatedDuration: string
    animationSettings: string
    animationSpeed: string
    createVideo: string
    createAnother: string
    videoReady: string
    duration: string
    creatingVideo: string
    pleaseWait: string
    complete: string
    slow: string
    normal: string
    fast: string
    mp4Desc: string
    gifDesc: string
    lowQuality: string
    mediumQuality: string
    highQuality: string
    smallerFile: string
    balanced: string
    bestQuality: string
  }
  
  // Quick Info
  info: {
    darkModeOn: string
    lightModeOn: string
    mobileView: string
    desktopView: string
    previewing: string
    recordingVideo: string
  }
  
  // Preview / Chat
  preview: {
    today: string
    yesterday: string
    online: string
    typing: string
    lastSeenToday: string
    lastSeenYesterday: string
    tapForContactInfo: string
    encryptionNotice: string
    message: string
    forwarded: string
    participants: string
  }
  
  // Toasts / Notifications
  toast: {
    screenshotDownloaded: string
    screenshotSaved: string
    exportFailed: string
    copiedToClipboard: string
    pasteAnywhere: string
    copyFailed: string
    tryDownloading: string
    videoDownloaded: string
    videoSaved: string
  }
}

// English translations
export const en: Translations = {
  common: {
    settings: 'Settings',
    editor: 'Editor',
    resetToDefaults: 'Reset to Defaults',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    add: 'Add',
    edit: 'Edit',
    close: 'Close',
    loading: 'Loading...',
  },
  
  settings: {
    appearance: 'Appearance',
    whatsapp: 'WhatsApp',
    language: 'Language',
    about: 'About',
    selectLanguage: 'Select Language',
    view: 'View',
    desktop: 'Desktop',
    mobile: 'Mobile',
    timeFormat: 'Time Format',
    darkMode: 'Dark Mode',
    transparentBg: 'Transparent BG',
    fontFamily: 'Font',
    batteryLevel: 'Battery',
    device: 'Device',
    ios: 'iOS',
    android: 'Android',
    status: 'Status',
    online: 'Online',
    typing: 'Typing',
    lastSeen: 'Last Seen',
    none: 'None',
    background: 'Background',
    solid: 'Solid',
    pattern: 'Pattern',
    image: 'Image',
    color: 'Color',
    baseColor: 'Base Color',
    patternOpacity: 'Pattern Opacity',
    encryptionNotice: 'Encryption Notice',
    upload: 'Upload',
    change: 'Change',
  },
  
  editor: {
    people: 'People',
    messages: 'Messages',
    sender: 'Sender',
    senderYou: 'Sender (You)',
    receiver: 'Receiver',
    addMessage: 'Add Message',
    typeMessage: 'Type your message...',
    whatsappFeatures: '💡 WhatsApp Features',
    whatsappFeaturesDesc: 'Use the icons below each message to add images, replies, forwarded labels, and reactions.',
    imageMessage: 'Image message',
    forwardedMessage: 'Forwarded message',
    replyingTo: 'Replying to',
    reactions: 'Reactions',
  },
  
  avatar: {
    chooseAvatar: 'Choose Avatar',
    remove: 'Remove',
    currentAvatar: 'Current avatar',
    upload: 'Upload',
    url: 'URL',
    pasteImageUrl: 'Paste image URL...',
    add: 'Add',
    selectPhoto: 'Avatar selection',
    orUseInitials: 'Or use initials',
  },
  
  whatsappPreview: {
    encryptionNotice: 'Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.',
    today: 'Today',
    yesterday: 'Yesterday',
    online: 'online',
    typing: 'typing...',
    lastSeenToday: 'last seen today at',
    lastSeenYesterday: 'last seen yesterday at',
    tapForInfo: 'tap here for contact info',
    participants: 'participants',
    message: 'Message',
  },
  
  about: {
    description: 'FakeSocialMessage is a free tool to create realistic fake chat screenshots for social media platforms.',
    autoSave: 'Your changes are automatically saved to your browser.',
  },
  
  export: {
    export: 'Export',
    exportOptions: 'Export Options',
    format: 'Format',
    quality: 'Quality',
    scale: 'Scale',
    watermark: 'Watermark',
    watermarkDesc: 'Add subtle branding',
    download: 'Download',
    copyToClipboard: 'Copy to Clipboard',
    copied: 'Copied!',
    downloading: 'Exporting...',
    preview: 'Preview',
    stop: 'Stop',
  },
  
  video: {
    videoExport: 'Export Video',
    videoExportDesc: 'Create an animated video of your chat conversation',
    record: 'Record',
    recording: 'Recording',
    processing: 'Processing',
    downloadVideo: 'Download Video',
    reset: 'Reset',
    typingDuration: 'Typing Duration',
    messageDelay: 'Message Delay',
    messageAppearDuration: 'Message Appear Duration',
    endPause: 'End Pause',
    outputFormat: 'Output Format',
    estimatedDuration: 'Estimated Duration',
    animationSettings: 'Animation Settings',
    animationSpeed: 'Animation Speed',
    createVideo: 'Create',
    createAnother: 'Create Another',
    videoReady: 'ready!',
    duration: 'Duration',
    creatingVideo: 'Creating video...',
    pleaseWait: 'Please wait while we generate your video',
    complete: 'complete',
    slow: '🐢 Slow',
    normal: '⚡ Normal',
    fast: '🚀 Fast',
    mp4Desc: 'Universal format, works everywhere',
    gifDesc: 'Easy to share everywhere',
    lowQuality: 'Low',
    mediumQuality: 'Medium',
    highQuality: 'High',
    smallerFile: 'Smaller file',
    balanced: 'Balanced',
    bestQuality: 'Best quality',
  },
  
  info: {
    darkModeOn: '🌙 Dark Mode',
    lightModeOn: '☀️ Light Mode',
    mobileView: '📱 Mobile',
    desktopView: '🖥️ Desktop',
    previewing: '👁️ Previewing',
    recordingVideo: '🎬 Recording',
  },
  
  preview: {
    today: 'Today',
    yesterday: 'Yesterday',
    online: 'online',
    typing: 'typing...',
    lastSeenToday: 'last seen today at',
    lastSeenYesterday: 'last seen yesterday at',
    tapForContactInfo: 'tap here for contact info',
    encryptionNotice: 'Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.',
    message: 'Message',
    forwarded: 'Forwarded',
    participants: 'participants',
  },
  
  toast: {
    screenshotDownloaded: '✅ Screenshot downloaded!',
    screenshotSaved: 'Your screenshot has been saved.',
    exportFailed: 'Export failed',
    copiedToClipboard: '📋 Copied to clipboard!',
    pasteAnywhere: 'You can now paste the screenshot anywhere.',
    copyFailed: 'Copy failed',
    tryDownloading: 'Could not copy to clipboard. Try downloading instead.',
    videoDownloaded: '🎬 Video downloaded!',
    videoSaved: 'Your video has been saved.',
  },
}

// Turkish translations
export const tr: Translations = {
  common: {
    settings: 'Ayarlar',
    editor: 'Editör',
    resetToDefaults: 'Varsayılana Sıfırla',
    save: 'Kaydet',
    cancel: 'İptal',
    delete: 'Sil',
    add: 'Ekle',
    edit: 'Düzenle',
    close: 'Kapat',
    loading: 'Yükleniyor...',
  },
  
  settings: {
    appearance: 'Görünüm',
    whatsapp: 'WhatsApp',
    language: 'Dil',
    about: 'Hakkında',
    selectLanguage: 'Dil Seçin',
    view: 'Görünüm',
    desktop: 'Masaüstü',
    mobile: 'Mobil',
    timeFormat: 'Saat Formatı',
    darkMode: 'Karanlık Mod',
    transparentBg: 'Şeffaf Arka Plan',
    fontFamily: 'Yazı Tipi',
    batteryLevel: 'Şarj',
    device: 'Cihaz',
    ios: 'iOS',
    android: 'Android',
    status: 'Durum',
    online: 'Çevrimiçi',
    typing: 'Yazıyor',
    lastSeen: 'Son Görülme',
    none: 'Yok',
    background: 'Arka Plan',
    solid: 'Düz Renk',
    pattern: 'Desen',
    image: 'Resim',
    color: 'Renk',
    baseColor: 'Ana Renk',
    patternOpacity: 'Desen Opaklığı',
    encryptionNotice: 'Şifreleme Bildirimi',
    upload: 'Yükle',
    change: 'Değiştir',
  },
  
  editor: {
    people: 'Kişiler',
    messages: 'Mesajlar',
    sender: 'Gönderen',
    senderYou: 'Gönderen (Siz)',
    receiver: 'Alıcı',
    addMessage: 'Mesaj Ekle',
    typeMessage: 'Mesajınızı yazın...',
    whatsappFeatures: '💡 WhatsApp Özellikleri',
    whatsappFeaturesDesc: 'Her mesajın altındaki simgeleri kullanarak resim, yanıt, iletildi etiketi ve tepkiler ekleyebilirsiniz.',
    imageMessage: 'Resimli mesaj',
    forwardedMessage: 'İletilen mesaj',
    replyingTo: 'Yanıtlanan',
    reactions: 'Tepkiler',
  },
  
  avatar: {
    chooseAvatar: 'Avatar Seç',
    remove: 'Kaldır',
    currentAvatar: 'Mevcut avatar',
    upload: 'Yükle',
    url: 'URL',
    pasteImageUrl: 'Resim URL\'si yapıştırın...',
    add: 'Ekle',
    selectPhoto: 'Avatar seçimi',
    orUseInitials: 'Veya baş harfleri kullanın',
  },
  
  whatsappPreview: {
    encryptionNotice: 'Mesajlar ve aramalar uçtan uca şifrelidir. Bu sohbetin dışında WhatsApp dahil hiç kimse bunları okuyamaz veya dinleyemez.',
    today: 'Bugün',
    yesterday: 'Dün',
    online: 'çevrimiçi',
    typing: 'yazıyor...',
    lastSeenToday: 'bugün saat',
    lastSeenYesterday: 'dün saat',
    tapForInfo: 'kişi bilgisi için dokunun',
    participants: 'katılımcı',
    message: 'Mesaj',
  },
  
  about: {
    description: 'FakeSocialMessage, sosyal medya platformları için gerçekçi sahte sohbet ekran görüntüleri oluşturmaya yarayan ücretsiz bir araçtır.',
    autoSave: 'Değişiklikleriniz otomatik olarak tarayıcınıza kaydedilir.',
  },
  
  export: {
    export: 'Dışa Aktar',
    exportOptions: 'Dışa Aktarma Seçenekleri',
    format: 'Format',
    quality: 'Kalite',
    scale: 'Ölçek',
    watermark: 'Filigran',
    watermarkDesc: 'Hafif marka ekle',
    download: 'İndir',
    copyToClipboard: 'Panoya Kopyala',
    copied: 'Kopyalandı!',
    downloading: 'Dışa aktarılıyor...',
    preview: 'Önizleme',
    stop: 'Durdur',
  },
  
  video: {
    videoExport: 'Video Dışa Aktar',
    videoExportDesc: 'Sohbetinizin animasyonlu videosunu oluşturun',
    record: 'Kaydet',
    recording: 'Kaydediliyor',
    processing: 'İşleniyor',
    downloadVideo: 'Videoyu İndir',
    reset: 'Sıfırla',
    typingDuration: 'Yazma Süresi',
    messageDelay: 'Mesaj Gecikmesi',
    messageAppearDuration: 'Mesaj Görünme Süresi',
    endPause: 'Bitiş Beklemesi',
    outputFormat: 'Çıktı Formatı',
    estimatedDuration: 'Tahmini Süre',
    animationSettings: 'Animasyon Ayarları',
    animationSpeed: 'Animasyon Hızı',
    createVideo: 'Oluştur',
    createAnother: 'Yeni Oluştur',
    videoReady: 'hazır!',
    duration: 'Süre',
    creatingVideo: 'Video oluşturuluyor...',
    pleaseWait: 'Lütfen videonuz oluşturulurken bekleyin',
    complete: 'tamamlandı',
    slow: '🐢 Yavaş',
    normal: '⚡ Normal',
    fast: '🚀 Hızlı',
    mp4Desc: 'Evrensel format, her yerde çalışır',
    gifDesc: 'Her yerde kolayca paylaşılır',
    lowQuality: 'Düşük',
    mediumQuality: 'Orta',
    highQuality: 'Yüksek',
    smallerFile: 'Küçük dosya',
    balanced: 'Dengeli',
    bestQuality: 'En iyi kalite',
  },
  
  info: {
    darkModeOn: '🌙 Karanlık Mod',
    lightModeOn: '☀️ Aydınlık Mod',
    mobileView: '📱 Mobil',
    desktopView: '🖥️ Masaüstü',
    previewing: '👁️ Önizleme',
    recordingVideo: '🎬 Kaydediliyor',
  },
  
  preview: {
    today: 'Bugün',
    yesterday: 'Dün',
    online: 'çevrimiçi',
    typing: 'yazıyor...',
    lastSeenToday: 'bugün görüldü, saat',
    lastSeenYesterday: 'dün görüldü, saat',
    tapForContactInfo: 'kişi bilgisi için dokunun',
    encryptionNotice: 'Mesajlar ve aramalar uçtan uca şifrelidir. Bu sohbetin dışında WhatsApp dahil hiç kimse bunları okuyamaz veya dinleyemez.',
    message: 'Mesaj',
    forwarded: 'İletildi',
    participants: 'katılımcı',
  },
  
  toast: {
    screenshotDownloaded: '✅ Ekran görüntüsü indirildi!',
    screenshotSaved: 'Ekran görüntünüz kaydedildi.',
    exportFailed: 'Dışa aktarma başarısız',
    copiedToClipboard: '📋 Panoya kopyalandı!',
    pasteAnywhere: 'Artık ekran görüntüsünü herhangi bir yere yapıştırabilirsiniz.',
    copyFailed: 'Kopyalama başarısız',
    tryDownloading: 'Panoya kopyalanamadı. Bunun yerine indirmeyi deneyin.',
    videoDownloaded: '🎬 Video indirildi!',
    videoSaved: 'Videonuz kaydedildi.',
  },
}

// All translations
const translations: Record<Language, Translations> = {
  en,
  tr,
}

// Get translations for a specific language
export function getTranslations(language: Language): Translations {
  return translations[language] || translations.en
}

// Translation hook helper
export function useTranslations(language: Language) {
  return getTranslations(language)
}
