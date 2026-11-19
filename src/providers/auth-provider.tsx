'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useTransition,
} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUser, signOut as serverSignOut } from '@/app/actions/auth'
import type { CurrentUser } from '@/types/app'

interface AuthContextType {
  currentUser: CurrentUser | null
  isLoading: boolean
  refreshUser: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [, startTransition] = useTransition()
  const router = useRouter()
  const supabase = createClient()

  const refreshUser = useCallback(async () => {
    try {
      const user = await getCurrentUser()
      setCurrentUser(user)
    } catch (err) {
      console.error('Failed to refresh user:', err)
      setCurrentUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    // Initial load
    getCurrentUser()
      .then((user) => {
        if (isMounted) {
          setCurrentUser(user)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        console.error('Initial user fetch failed:', err)
        if (isMounted) {
          setCurrentUser(null)
          setIsLoading(false)
        }
      })

    // Listen to Supabase auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        startTransition(async () => {
          await refreshUser()
        })
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null)
        setIsLoading(false)
        router.push('/login')
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase, refreshUser, router])

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await serverSignOut()
      setCurrentUser(null)
    } catch (err) {
      console.error('Sign out failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        refreshUser,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
