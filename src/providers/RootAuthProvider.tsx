'use client'

import type { User } from '@/payload-types'
import { useRouter, usePathname } from 'next/navigation'
import { createContext, useState, useEffect, useRef, use } from 'react'

type AuthContext = {
  user: User | null
  setUser: (user: User | null) => void
  status: 'loading' | 'authenticated' | 'unauthenticated'
  refreshUser: () => Promise<void>
  logout: () => Promise<void>
}

const Context = createContext<AuthContext | undefined>(undefined)

export function RootAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthContext['status']>('loading')
  const router = useRouter()
  const pathname = usePathname()

  async function refreshUser(silent = false) {
    try {
      if (!silent) setStatus('loading')
      const response = await fetch('/api/users/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          setUser(data.user)
          setStatus('authenticated')
        } else {
          setUser(null)
          setStatus('unauthenticated')
        }
      } else {
        setUser(null)
        setStatus('unauthenticated')
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      setUser(null)
      setStatus('unauthenticated')
    }
  }

  async function logout() {
    try {
      const response = await fetch('/api/users/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        setUser(null)
        setStatus('unauthenticated')
        // window.location.href = '/'
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to logout:', error)
    }
  }

  const initialPathname = useRef(pathname)

  // Initial fetch on mount
  useEffect(() => {
    refreshUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Silent refresh on pathname change (catches post-login redirects without re-triggering animations)
  useEffect(() => {
    if (pathname === initialPathname.current) return
    initialPathname.current = pathname
    refreshUser(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <Context.Provider value={{ user, setUser, status, refreshUser, logout }}>
      {children}
    </Context.Provider>
  )
}

export function useRootAuth() {
  const context = use(Context)
  if (context === undefined) {
    // During HMR/fast refresh, context can momentarily be undefined
    return {
      user: null,
      setUser: () => {},
      status: 'loading' as const,
      refreshUser: async () => {},
      logout: async () => {},
    }
  }
  return context
}
