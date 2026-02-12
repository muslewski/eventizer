'use client'

import type { User } from '@/payload-types'
import { useRouter } from 'next/navigation'
import { createContext, useState, useEffect, use } from 'react'

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

  async function refreshUser() {
    try {
      setStatus('loading')
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

  useEffect(() => {
    refreshUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
