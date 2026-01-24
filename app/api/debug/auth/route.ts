import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    }
  )

  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    return NextResponse.json({
      error: 'Session error',
      details: sessionError.message
    })
  }

  if (!session) {
    return NextResponse.json({
      error: 'No session',
      cookies: cookieStore.getAll().map(c => c.name)
    })
  }

  // Try to fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  return NextResponse.json({
    user: {
      id: session.user.id,
      email: session.user.email,
    },
    profile: profile,
    profileError: profileError?.message,
    isAdmin: profile?.role === 'admin' || profile?.role === 'super_admin'
  })
}
