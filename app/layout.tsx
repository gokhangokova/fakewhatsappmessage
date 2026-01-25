import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { ChatProvider } from '@/contexts/chat-context'
import { AuthProvider } from '@/contexts/auth-context'

// Dynamic import Header to avoid SSG issues with usePathname
const Header = dynamic(() => import('@/components/layout/header').then(mod => ({ default: mod.Header })), {
  ssr: false,
})

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  variable: '--font-jakarta',
})

export const metadata: Metadata = {
  title: 'memesocial.app - Create Fake Chat Screenshots',
  description: 'Generate realistic fake chat screenshots for WhatsApp, iMessage, Instagram and more. Perfect for content creators, designers, and marketers.',
  keywords: ['fake chat', 'mockup', 'whatsapp', 'imessage', 'instagram', 'screenshot generator', 'meme'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jakarta.variable} font-sans antialiased min-h-screen`}>
        <AuthProvider>
          <ChatProvider>
            <Header />
            <main>
              {children}
            </main>
            <Toaster />
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
