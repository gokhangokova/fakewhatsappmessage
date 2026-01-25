import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

// Environment variables with fallback for build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export function createClient(): SupabaseClient {
  // Check if we have the required environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a dummy client during SSG build - this will never be used at runtime
    // because AuthProvider is loaded with ssr: false
    console.warn('[Supabase] Missing environment variables, returning placeholder client')
    return createSupabaseClient(
      'https://placeholder.supabase.co',
      'placeholder-key',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )
  }

  // Server-side: her seferinde yeni client
  if (typeof window === 'undefined') {
    return createSupabaseClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )
  }

  // Client-side: singleton kullan
  if (supabaseClient) {
    return supabaseClient
  }

  supabaseClient = createSupabaseClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    }
  )

  return supabaseClient
}
