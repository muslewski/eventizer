'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'
// import type { UserSubscriptionData } from './index'

// Because of payload default routes, we have to redirect to a specific page which then immediately redirects to sign-in. This is to prevent an infinite loop of redirects if the user is unauthenticated and tries to access a protected page.

export interface AdminLayoutClientProps {
  children: React.ReactNode
  // userSubscriptionData: UserSubscriptionData
}

export function AdminLayoutClient({ children, 
  // userSubscriptionData 
}: AdminLayoutClientProps) {
  const pathname = usePathname()
  const router = useRouter()

  // Set data-page-context on the admin layout for CSS targeting of localization button
  useEffect(() => {
    const adminLayout = document.getElementById('admin-layout')
    if (!adminLayout) return
    // Check if we're on a specific page item (e.g., /app/collections/pages/123)
    const isPageItem =
      pathname.startsWith('/app/collections/pages/') && pathname !== '/app/collections/pages/'

    if (isPageItem) {
      adminLayout.setAttribute('data-page-context', 'page-item')
    } else {
      adminLayout.removeAttribute('data-page-context')
    }
  }, [pathname])

  return <>{children}</>
}
