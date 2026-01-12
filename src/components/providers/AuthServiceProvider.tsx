'use client'

import { becomeServiceProvider } from '@/actions/user/becomeServiceProvider'
import { authClient } from '@/auth/auth-client'
import { Toaster } from '@/components/ui/sonner'
import { AuthUIProvider } from '@daveyplate/better-auth-ui'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, type ReactNode } from 'react'
import { toast } from 'sonner'

export function AuthServiceProvider({ children }: { children: ReactNode }) {
  const router = useRouter()

  const handleSessionChange = useCallback(async () => {
    // Clear router cache (protected routes)
    router.refresh()

    const session = await authClient.getSession()

    if (session?.data?.user?.id) {
      const userId = Number(session.data.user.id)

      const result = await becomeServiceProvider(userId)

      if (result.success) {
        toast.success('Konto usługodawcy zostało utworzone pomyślnie.')
        router.push('/app/onboarding/service-provider')
      } else {
        // toast.error(result.error || 'Nie udało się utworzyć konta usługodawcy')
        router.push('/app')
      }
    }
  }, [router])

  return (
    <AuthUIProvider
      // basePath="/app/auth"
      basePath="/auth"
      viewPaths={{
        SIGN_UP: 'sign-up/service-provider',
        SIGN_IN: 'sign-in/service-provider',
      }}
      redirectTo="/app/service-provider"
      authClient={authClient}
      navigate={router.push}
      replace={router.replace}
      social={{
        providers: ['google', 'facebook'],
      }}
      emailVerification={true}
      optimistic={true}
      onSessionChange={handleSessionChange}
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
