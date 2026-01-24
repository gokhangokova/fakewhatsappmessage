import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  console.log('[Auth Callback] Code received:', code ? 'yes' : 'no')

  if (code) {
    // Client-side'da code exchange yapılacak
    // Sadece code'u URL'de tutarak ana sayfaya yönlendir
    const redirectUrl = new URL(next, origin)
    redirectUrl.searchParams.set('code', code)

    console.log('[Auth Callback] Redirecting to:', redirectUrl.toString())
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
