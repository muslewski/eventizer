'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'
import type { UserSubscriptionData } from './index'

const PATH_TO_SERVICE_PROVIDER_ONBOARDING = '/app/onboarding/service-provider'
const PATH_TO_APP = '/app'
const PATH_TO_ACCOUNT = '/app/account'
const PATH_TO_SIGN_IN = '/auth/sign-in'
const PATH_REDIRECT_TO_SIGN_IN = '/app/redirect-to-sign-in'

export interface AdminLayoutClientProps {
  children: React.ReactNode
  userSubscriptionData: UserSubscriptionData
}

export function AdminLayoutClient({ children, userSubscriptionData }: AdminLayoutClientProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isRedirectingToSignIn = useRef(false)

  const { userId, role, subscriptionStatus } = userSubscriptionData

  // Set data-user-role on body for CSS targeting
  useEffect(() => {
    if (role) {
      document.body.setAttribute('data-user-role', role)
    }
    return () => {
      document.body.removeAttribute('data-user-role')
    }
  }, [role])

  useEffect(() => {
    // If on redirect-to-sign-in page, just go to sign-in immediately
    if (pathname.startsWith(PATH_REDIRECT_TO_SIGN_IN)) {
      if (!isRedirectingToSignIn.current) {
        isRedirectingToSignIn.current = true
        window.location.href = PATH_TO_SIGN_IN
      }
      return
    }

    // If no user, redirect to sign-in
    if (!userId) {
      if (!isRedirectingToSignIn.current) {
        isRedirectingToSignIn.current = true
        window.location.href = PATH_TO_SIGN_IN
      }
      return
    }

    const isOnOnboardingPath = pathname.startsWith(PATH_TO_SERVICE_PROVIDER_ONBOARDING)
    const isEditMode = searchParams.get('edit') === 'true'

    // If on onboarding page but a client, redirect to account
    if (isOnOnboardingPath && role === 'client') {
      router.replace(PATH_TO_ACCOUNT)
      return
    }

    // Skip remaining logic if not a service provider
    if (role !== 'service-provider') return

    const hasActiveSubscription = subscriptionStatus?.hasActiveSubscription

    // If on onboarding page with active subscription and NOT in edit mode, redirect to app
    if (isOnOnboardingPath && hasActiveSubscription && !isEditMode) {
      router.replace(PATH_TO_APP)
      return
    }

    // If not on onboarding page and no active subscription, redirect to onboarding
    if (!isOnOnboardingPath && !hasActiveSubscription) {
      router.replace(PATH_TO_SERVICE_PROVIDER_ONBOARDING)
    }
  }, [userId, role, subscriptionStatus, pathname, router, searchParams])

  // Don't render anything while redirecting unauthenticated users
  if (!userId || pathname.startsWith(PATH_REDIRECT_TO_SIGN_IN)) {
    return null
  }

  return <>{children}</>
}
