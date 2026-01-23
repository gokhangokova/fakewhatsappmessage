import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  console.log('[Auth Callback] Code received:', code ? 'yes' : 'no')

  if (code) {
    const cookieStore = await cookies()
    const response = NextResponse.redirect(`${origin}${next}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            console.log('[Auth Callback] setAll called with:', cookiesToSet.map(c => c.name))
            cookiesToSet.forEach(({ name, value, options }) => {
              // Set directly on response
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      // Manuel olarak session cookie'lerini oluştur
      const sessionStr = JSON.stringify({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
        token_type: data.session.token_type,
        user: data.session.user
      })

      // Supabase cookie adı
      const cookieName = `sb-rfvzikdnuyiloadbynsc-auth-token`

      // Cookie çok büyükse chunk'lara böl (4KB limit)
      const chunkSize = 3500
      const chunks = []
      for (let i = 0; i < sessionStr.length; i += chunkSize) {
        chunks.push(sessionStr.slice(i, i + chunkSize))
      }

      // Her chunk için cookie set et
      chunks.forEach((chunk, index) => {
        const name = chunks.length > 1 ? `${cookieName}.${index}` : cookieName
        response.cookies.set(name, chunk, {
          path: '/',
          sameSite: 'lax',
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 24 * 400 // 400 days
        })
        console.log('[Auth Callback] Set cookie:', name)
      })

      // code-verifier cookie'sini sil
      response.cookies.set(`${cookieName}-code-verifier`, '', {
        path: '/',
        maxAge: 0
      })

      console.log('[Auth Callback] SUCCESS! User:', data.session.user.email)
      console.log('[Auth Callback] Response cookies:', response.cookies.getAll().map(c => c.name))
      return response
    }

    console.error('[Auth Callback] Error:', error?.message || 'No session')
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
