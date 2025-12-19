'use client'

import { authClient } from '@/auth/auth-client'
import { Toaster } from '@/components/ui/sonner'
import { AuthUIProvider } from '@daveyplate/better-auth-ui'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { toast } from 'sonner'

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()

  return (
    <AuthUIProvider
      basePath="/app/auth"
      redirectTo="/app"
      authClient={authClient}
      navigate={router.push}
      replace={router.replace}
      social={{ providers: ['google', 'facebook'] }}
      emailVerification={true}
      // additionalFields={}
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
