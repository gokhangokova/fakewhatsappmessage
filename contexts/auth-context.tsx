'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { UserRole, SubscriptionTier } from '@/types'
import { isSignupEnabled } from '@/hooks/use-system-settings'

interface Profile {
  id: string
  email: string | null
  username: string | null
  avatar_url: string | null
  subscription_tier: SubscriptionTier
  role: UserRole
  is_banned: boolean
  ban_reason?: string | null
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  isLoading: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  banMessage: string | null
  clearBanMessage: () => void
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [banMessage, setBanMessage] = useState<string | null>(null)
  const [supabase] = useState(() => createClient())
  const banHandledRef = useRef<string | null>(null) // Track which user's ban we've handled

  const clearBanMessage = useCallback(() => {
    setBanMessage(null)
  }, [])

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    console.log('[Auth] Fetching profile for userId:', userId)
    try {
      // Add timeout wrapper
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout after 10s')), 10000)
      })

      const queryPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      const { data, error } = await Promise.race([queryPromise, timeoutPromise])

      console.log('[Auth] Profile query completed:', { data, error })

      if (error) {
        console.error('[Auth] Error fetching profile:', error)
        return null
      }

      console.log('[Auth] Profile fetched:', data)
      console.log('[Auth] Profile role:', data?.role, 'isAdmin:', data?.role === 'admin' || data?.role === 'super_admin')
      return data as Profile
    } catch (err) {
      console.error('[Auth] Exception in fetchProfile:', err)
      return null
    }
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (user) {
      const profileData = await fetchProfile(user.id)
      setProfile(profileData)
    }
  }, [user, fetchProfile])

  useEffect(() => {
    let isMounted = true

    // Check for OAuth code in URL
    const handleOAuthCode = async () => {
      if (typeof window === 'undefined') return false

      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')

      if (code) {
        console.log('[Auth] Found OAuth code in URL, exchanging...')
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            console.error('[Auth] Code exchange error:', error)
          } else {
            console.log('[Auth] Code exchange success:', data.session?.user?.email)
            // Clean up URL
            window.history.replaceState({}, '', window.location.pathname)
          }
          return true
        } catch (err) {
          console.error('[Auth] Code exchange exception:', err)
          return true
        }
      }
      return false
    }

    // Get initial session
    const getInitialSession = async () => {
      console.log('[Auth] Getting initial session...')

      // First check for OAuth code
      const hadCode = await handleOAuthCode()

      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!isMounted) return

        console.log('[Auth] Initial session:', session?.user?.email ?? 'no session')
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          const profileData = await fetchProfile(session.user.id)
          if (!isMounted) return
          console.log('[Auth] Setting profile in state:', profileData)
          setProfile(profileData)
        }
      } catch (error: unknown) {
        // Ignore AbortError - happens when component unmounts during auth
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('[Auth] Session fetch aborted (component unmounted)')
          return
        }
        console.error('[Auth] Error getting session:', error)
      } finally {
        if (isMounted) {
          console.log('[Auth] Setting isLoading to false')
          setIsLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return

        console.log('[Auth] onAuthStateChange:', event, session?.user?.email)

        try {
          if (session?.user) {
            const profileData = await fetchProfile(session.user.id)
            if (!isMounted) return

            // Check if user is banned
            if (profileData?.is_banned) {
              // Prevent double handling for the same user
              if (banHandledRef.current === session.user.id) {
                console.log('[Auth] Ban already handled for this user, skipping')
                return
              }
              banHandledRef.current = session.user.id

              console.log('[Auth] User is banned, signing out')
              await supabase.auth.signOut()
              setSession(null)
              setUser(null)
              setProfile(null)
              setIsLoading(false)
              // Set ban message for dialog display
              const reason = profileData.ban_reason ? `: ${profileData.ban_reason}` : ''
              setBanMessage(`Your account has been suspended${reason}`)
              return
            }

            // Clear ban handled ref for non-banned users
            banHandledRef.current = null

            setSession(session)
            setUser(session.user)
            setProfile(profileData)
          } else {
            setSession(null)
            setUser(null)
            setProfile(null)
          }

          setIsLoading(false)
        } catch (error: unknown) {
          // Ignore AbortError - happens when component unmounts during auth
          if (error instanceof Error && error.name === 'AbortError') {
            console.log('[Auth] Auth state change aborted (component unmounted)')
            return
          }
          console.error('[Auth] Error in auth state change:', error)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile, supabase])

  const signInWithGoogle = async () => {
    console.log('[Auth] Starting Google OAuth with PKCE flow')
    console.log('[Auth] redirectTo:', `${window.location.origin}/auth/callback`)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: false,
      },
    })

    console.log('[Auth] signInWithOAuth result:', { data, error })

    if (error) {
      console.error('Error signing in with Google:', error)
      throw error
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { error: error as Error | null }
    }

    // Check if user is banned
    if (data.user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_banned, ban_reason')
        .eq('id', data.user.id)
        .single()

      if (profileData?.is_banned) {
        // Sign out the banned user immediately
        await supabase.auth.signOut()
        const reason = profileData.ban_reason ? `: ${profileData.ban_reason}` : ''
        return { error: new Error(`Your account has been suspended${reason}`) }
      }
    }

    return { error: null }
  }

  const signUpWithEmail = async (email: string, password: string) => {
    // Check if signup is enabled
    const signupAllowed = await isSignupEnabled()
    if (!signupAllowed) {
      return { error: new Error('New registrations are currently disabled. Please try again later.') }
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    return { error: error as Error | null }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    return { error: error as Error | null }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Error signing out:', error)
      throw error
    }

    setUser(null)
    setProfile(null)
    setSession(null)
  }

  // Computed admin properties
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
  const isSuperAdmin = profile?.role === 'super_admin'

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isAdmin,
        isSuperAdmin,
        banMessage,
        clearBanMessage,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
