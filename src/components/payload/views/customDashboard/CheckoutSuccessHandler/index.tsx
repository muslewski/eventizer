'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'

/**
 * Client component shown after Stripe checkout redirect.
 * Displays a success message and auto-refreshes the page
 * to fetch fresh subscription data (giving webhooks time to process).
 */
export function CheckoutSuccessHandler() {
  const router = useRouter()
  const [phase, setPhase] = useState<'success' | 'refreshing'>('success')

  useEffect(() => {
    // Phase 1: Show success message for 2.5s
    const successTimer = setTimeout(() => {
      setPhase('refreshing')
    }, 2500)

    // Phase 2: Refresh with clean URL after 4s
    const refreshTimer = setTimeout(() => {
      // Replace URL to remove ?checkout=success, then refresh server data
      router.replace('/app')
      router.refresh()
    }, 4000)

    return () => {
      clearTimeout(successTimer)
      clearTimeout(refreshTimer)
    }
  }, [router])

  return (
    <div className="max-w-3xl rounded-lg border-2 border-green-500/30 bg-green-500/5 px-6 py-5">
      <div className="flex items-center gap-4">
        {phase === 'success' ? (
          <CheckCircle className="h-8 w-8 shrink-0 text-green-600 dark:text-green-400" />
        ) : (
          <Loader2 className="h-8 w-8 shrink-0 animate-spin text-green-600 dark:text-green-400" />
        )}
        <div>
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">
            {phase === 'success'
              ? 'Płatność zakończona sukcesem!'
              : 'Konfigurujemy Twoje konto...'}
          </h3>
          <p className="mt-1 text-sm text-green-700/80 dark:text-green-400/80">
            {phase === 'success'
              ? 'Twoja subskrypcja została aktywowana.'
              : 'Za chwilę zobaczysz zaktualizowany panel.'}
          </p>
        </div>
      </div>
    </div>
  )
}
