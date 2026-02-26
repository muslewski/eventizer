'use client'

import { useEffect } from 'react'
import { toast } from '@payloadcms/ui'
import { useSearchParams } from 'next/navigation'

/**
 * Shows a toast notification when the user is redirected from offer creation
 * due to reaching the maximum offer limit.
 */
export function OfferLimitToast() {
  const searchParams = useSearchParams()
  const limitReached = searchParams.get('limit') === 'reached'

  useEffect(() => {
    if (limitReached) {
      toast.error('Osiągnięto maksymalną liczbę ofert. Nie możesz dodać więcej.')

      // Clean up the URL param without triggering a navigation
      const url = new URL(window.location.href)
      url.searchParams.delete('limit')
      window.history.replaceState({}, '', url.toString())
    }
  }, [limitReached])

  return null
}
