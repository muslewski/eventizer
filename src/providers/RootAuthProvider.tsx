'use client'

import type { User } from '@/payload-types'
import { createContext, useCallback, useContext, useState, useEffect } from 'react'

type AuthContext = {
  user: User | null
  setUser: (user: User | null) => void
  status: 'loading' | 'authenticated' | 'unauthenticated'
  refreshUser?: () => Promise<void>
  logout: () => Promise<void>
}

const Context = createContext<AuthContext | undefined>(undefined)

export function RootAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthContext['status']>('loading')

  // authentication logic would go here

  const refreshUser = useCallback(async () => {
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
  }, [])

  const logout = useCallback(async () => {
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
        // Optionally redirect to home
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Failed to logout:', error)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  return (
    <Context.Provider value={{ user, setUser, status, refreshUser, logout }}>
      {children}
    </Context.Provider>
  )
}

export function useRootAuth() {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useRootAuth must be used within a RootAuthProvider')
  }
  return context
}
