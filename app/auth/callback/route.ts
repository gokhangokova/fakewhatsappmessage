import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  // DEBUG: Log that callback was hit
  console.log('\n\n')
  console.log('========================================')
  console.log('[Auth Callback] CALLBACK ROUTE HIT!')
  console.log('========================================')
  console.log('[Auth Callback] Full URL:', request.url)
  console.log('[Auth Callback] Code received:', code ? `yes (${code.substring(0, 10)}...)` : 'no')
  console.log('[Auth Callback] Origin:', origin)
  console.log('[Auth Callback] Next:', next)

  if (code) {
    const cookieStore = await cookies()

    // Log existing cookies
    const existingCookies = cookieStore.getAll()
    console.log('[Auth Callback] Existing cookies:', existingCookies.map(c => c.name))

    // Store cookies that need to be set on the response
    const cookiesToSet: { name: string; value: string; options: CookieOptions }[] = []

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const all = cookieStore.getAll()
            console.log('[Auth Callback] getAll called, returning:', all.map(c => c.name))
            return all
          },
          setAll(cookies) {
            console.log('[Auth Callback] setAll called with:', cookies.map(c => c.name))
            cookies.forEach(({ name, value, options }) => {
              // Store for later to set on response
              cookiesToSet.push({ name, value, options })
              console.log('[Auth Callback] Queued cookie:', name, 'options:', JSON.stringify(options))
              // Also try to set on cookie store
              try {
                cookieStore.set(name, value, options)
              } catch (e) {
                console.log('[Auth Callback] cookieStore.set error for', name, ':', e)
              }
            })
          },
        },
      }
    )

    console.log('[Auth Callback] Calling exchangeCodeForSession...')
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    console.log('[Auth Callback] Exchange result:', {
      session: data?.session ? 'exists' : 'null',
      sessionAccessToken: data?.session?.access_token ? 'exists' : 'null',
      user: data?.user?.email,
      error: error?.message,
      cookiesToSet: cookiesToSet.length,
      cookieNames: cookiesToSet.map(c => c.name)
    })

    if (!error && data?.session) {
      console.log('[Auth Callback] SUCCESS! Redirecting to:', `${origin}${next}`)

      // Create redirect response and set cookies on it
      const response = NextResponse.redirect(`${origin}${next}`)

      // Set all auth cookies on the response
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options)
        console.log('[Auth Callback] Set cookie on response:', name)
      })

      console.log('[Auth Callback] Response cookies:', response.cookies.getAll().map(c => c.name))
      console.log('[Auth Callback] ====== CALLBACK SUCCESS ======')
      return response
    }

    console.error('[Auth Callback] Error or no session:', error?.message || 'No session in response')
  }

  // Return the user to an error page with instructions
  console.log('[Auth Callback] ====== CALLBACK FAILED ======')
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
