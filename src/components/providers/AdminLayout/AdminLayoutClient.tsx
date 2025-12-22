'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import type { UserSubscriptionData } from './index'

const PATH_TO_SERVICE_PROVIDER_ONBOARDING = '/app/onboarding/service-provider'
const PATH_TO_APP = '/app'

export interface AdminLayoutClientProps {
  children: React.ReactNode
  userSubscriptionData: UserSubscriptionData
}

export function AdminLayoutClient({ children, userSubscriptionData }: AdminLayoutClientProps) {
  const pathname = usePathname()
  const router = useRouter()

  const { role, subscriptionStatus } = userSubscriptionData

  useEffect(() => {
    // Skip if not a service provider
    if (role !== 'service-provider') return

    const isOnOnboardingPath = pathname.startsWith(PATH_TO_SERVICE_PROVIDER_ONBOARDING)
    const hasActiveSubscription = subscriptionStatus?.hasActiveSubscription

    // If on onboarding page but already has active subscription, redirect to app
    if (isOnOnboardingPath && hasActiveSubscription) {
      router.replace(PATH_TO_APP)
      return
    }

    // If not on onboarding page and no active subscription, redirect to onboarding
    if (!isOnOnboardingPath && !hasActiveSubscription) {
      router.replace(PATH_TO_SERVICE_PROVIDER_ONBOARDING)
    }
  }, [role, subscriptionStatus, pathname, router])

  return <>{children}</>
}
