import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/header'
import { Toaster } from '@/components/ui/toaster'

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  variable: '--font-jakarta',
})

export const metadata: Metadata = {
  title: 'FakeSocialMessage - Create Fake Chat Screenshots',
  description: 'Generate realistic fake chat screenshots for WhatsApp, iMessage, Instagram and more. Perfect for content creators, designers, and marketers.',
  keywords: ['fake chat', 'mockup', 'whatsapp', 'imessage', 'instagram', 'screenshot generator'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jakarta.variable} font-sans antialiased`}>
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  )
}
