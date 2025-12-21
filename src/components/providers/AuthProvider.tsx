'use client'

import { authClient } from '@/auth/auth-client'
import { Toaster } from '@/components/ui/sonner'
import { AuthUIProvider } from '@daveyplate/better-auth-ui'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [redirectTo, setRedirectTo] = useState('/app')

  useEffect(() => {
    // Read the hash on mount and on hash change
    const updateRedirectFromHash = () => {
      const hash = window.location.hash

      if (hash === '#service-provider') {
        setRedirectTo('/app#service-provider')
      } else {
        setRedirectTo('/app')
      }
    }

    // Initial check
    updateRedirectFromHash()

    // Listen for hash changes (in case user navigates)
    window.addEventListener('hashchange', updateRedirectFromHash)

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('hashchange', updateRedirectFromHash)
    }
  }, [])

  return (
    <AuthUIProvider
      basePath="/app/auth"
      redirectTo="/app"
      authClient={authClient}
      navigate={router.push}
      replace={router.replace}
      social={{ providers: ['google', 'facebook'] }}
      emailVerification={true}
      optimistic={true}
      onSessionChange={() => {
        // Clear router cache (protected routes)
        router.refresh()
      }}
      Link={Link}
      toast={({ message, variant }) => {
        switch (variant) {
          case 'error':
            toast.error(message)
            break
          case 'info':
            toast.info(message)
            break
          case 'success':
            toast.success(message)
            break
          case 'warning':
            toast.warning(message)
            break
          case 'default':
          default:
            toast(message)

            break
        }
      }}
    >
      {children}
      <Toaster />
    </AuthUIProvider>
  )
}
