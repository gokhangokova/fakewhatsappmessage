# FakeSocialMessage

A modern web application to create realistic fake chat screenshots for social media platforms.

## ✨ Features

### General Features
- 🎨 **Multiple Platforms**: WhatsApp, iMessage, Instagram, and more (12 platforms)
- 🌙 **Dark Mode**: Toggle dark mode for all platforms
- 📱 **Responsive**: Desktop and mobile preview modes
- ⚡ **Real-time Preview**: See changes instantly
- 🖼️ **Avatar Upload**: Custom avatars with preset options
- 🔄 **Drag & Drop**: Reorder messages easily
- 📅 **Date/Time Picker**: Set custom timestamps for each message
- 💾 **Auto-Save**: Changes automatically saved to browser storage
- 📸 **PNG Export**: High-quality screenshot export with customizable settings
- 🏷️ **Watermark**: Optional watermark for exports
- 📋 **Copy to Clipboard**: Quick copy screenshots to clipboard

### WhatsApp Specific Features ✨
- 📱 **Authentic UI**: Pixel-perfect WhatsApp interface
- 🗨️ **Tail Bubbles**: Realistic chat bubble tails (like original app)
- ✓ **Message Status**: Sending → Sent → Delivered → Read (blue ticks)
- 📅 **Date Separators**: "TODAY", "YESTERDAY" or custom dates
- 🔐 **Encryption Notice**: End-to-end encryption banner
- 🎨 **Doodle Background**: WhatsApp pattern background with adjustable opacity
- 👤 **Status Options**: Online, Typing, Last Seen, or Hidden
- ↩️ **Reply Messages**: Reply to previous messages with preview
- ➡️ **Forwarded Label**: Mark messages as forwarded
- 😀 **Emoji Reactions**: Add reactions to messages (👍❤️😂😮😢🙏)
- 🖼️ **Image Messages**: Send photos with captions

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Drag & Drop**: @dnd-kit
- **Export**: html-to-image
- **Language**: TypeScript

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Navigate to project directory
cd /Users/gokhangokova/Developments/web/FakeSocialMessage

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
FakeSocialMessage/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with Toaster
│   ├── page.tsx           # Main editor page
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # Reusable UI components
│   ├── layout/            # Layout components (Header)
│   ├── editor/            # Editor sidebar components
│   ├── preview/           # Phone preview components
│   │   ├── phone-preview.tsx    # Main preview router
│   │   └── platforms/
│   │       └── whatsapp-preview.tsx  # WhatsApp specific preview
│   └── export/            # Export panel components
├── hooks/
│   ├── use-local-storage.ts
│   ├── use-chat-state.ts
│   ├── use-export.ts
│   └── use-toast.ts
├── lib/
│   ├── utils.ts           # Utility functions
│   └── platforms.ts       # Platform configurations
├── types/                 # TypeScript type definitions
└── public/                # Static assets
```

## 📋 Development Phases

- [x] **Phase 1**: Project setup, basic layout, navigation
- [x] **Phase 2**: Editor Sidebar improvements
- [x] **Phase 3**: PNG Export + Watermark
- [x] **Phase 4A (WhatsApp)**: WhatsApp basic improvements
  - [x] Tail bubbles (kuyruklu baloncuklar)
  - [x] Message status (sent/delivered/read)
  - [x] WhatsApp doodle background pattern
  - [x] Date separators (TODAY, YESTERDAY)
  - [x] Encryption notice
  - [x] Status options (online, typing, last seen)
- [x] **Phase 4B (WhatsApp)**: WhatsApp advanced features
  - [x] Reply (yanıtlama) özelliği
  - [x] Forwarded mesaj etiketi
  - [x] Emoji reactions
  - [x] Image messages (fotoğraf mesajları)
- [ ] **Phase 5**: Landing page template
- [ ] **Phase 6**: Other platform improvements (iMessage, Instagram, etc.)

## 📱 Supported Platforms

| Platform | Status | Features |
|----------|--------|----------|
| WhatsApp | ✅ Full | Tail bubbles, status, doodle bg, encryption, reply, forward, reactions, images |
| iMessage | 🔄 Basic | Standard chat UI |
| Instagram | 🔄 Basic | Standard DM UI |
| Messenger | 🔄 Basic | Standard UI |
| Telegram | 🔄 Basic | Standard UI |
| Discord | 🔄 Basic | Standard UI |
| Slack | 🔄 Basic | Standard UI |
| Signal | 🔄 Basic | Standard UI |
| Snapchat | 🔄 Basic | Standard UI |
| TikTok | 🔄 Basic | Standard UI |
| Twitter/X | 🔄 Basic | Standard UI |
| LinkedIn | 🔄 Basic | Standard UI |

## 🎯 WhatsApp Features

### Message Status Options
- ⏳ **Sending**: Clock icon (message being sent)
- ✓ **Sent**: Single gray tick (sent to server)
- ✓✓ **Delivered**: Double gray ticks (delivered to recipient)
- ✓✓ **Read**: Double blue ticks (seen by recipient)

### Message Features
- **Reply**: Click reply icon → Select a message → Shows reply preview in bubble
- **Forward**: Click forward icon → Adds "Forwarded" label
- **Reactions**: Click emoji icon → Select emoji(s) → Shows below message
- **Images**: Click image icon → Upload or paste URL → Shows image with optional caption

### Appearance Options
- **Status**: Online, Typing, Last Seen, None
- **Background Pattern**: Toggle doodle pattern on/off
- **Pattern Opacity**: Adjustable (10% - 80%)
- **Encryption Notice**: Show/hide the e2e encryption banner

## 🎮 Usage Guide

### Adding a Message with Reply
1. Click "Add Message" button
2. Click the ↩️ (Reply) icon below the message
3. Select which message to reply to
4. The reply preview will appear in the chat bubble

### Adding Image Messages
1. Click the 🖼️ (Image) icon below any message
2. Upload an image or paste a URL
3. Add optional caption text
4. Image appears in the chat with timestamp overlay

### Adding Reactions
1. Click the 😊 (Smile) icon below any message
2. Select one or more emoji reactions
3. Reactions appear below the message bubble

## 📄 License

MIT License

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
