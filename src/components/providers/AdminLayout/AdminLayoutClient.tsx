'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import type { UserSubscriptionData } from './index'

const PATH_TO_SERVICE_PROVIDER_ONBOARDING = '/app/onboarding/service-provider'
const PATH_TO_APP = '/app'
const PATH_TO_ACCOUNT = '/app/account'

export interface AdminLayoutClientProps {
  children: React.ReactNode
  userSubscriptionData: UserSubscriptionData
}

export function AdminLayoutClient({ children, userSubscriptionData }: AdminLayoutClientProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const { role, subscriptionStatus } = userSubscriptionData

  useEffect(() => {
    const isOnOnboardingPath = pathname.startsWith(PATH_TO_SERVICE_PROVIDER_ONBOARDING)
    const isEditMode = searchParams.get('edit') === 'true'

    // If on onboarding page but a client, redirect to account
    // (unless they're in the process of becoming a service provider - handled by the action)
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
    // This catches new service providers who need to complete onboarding
    if (!isOnOnboardingPath && !hasActiveSubscription) {
      router.replace(PATH_TO_SERVICE_PROVIDER_ONBOARDING)
    }
  }, [role, subscriptionStatus, pathname, router, searchParams])

  return <>{children}</>
}
