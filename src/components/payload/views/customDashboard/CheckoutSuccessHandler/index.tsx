'use client'

import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@payloadcms/ui'
import { pollSubscriptionReady } from '@/actions/stripe/pollSubscriptionReady'
import type { User } from '@/payload-types'

/**
 * Client component shown after Stripe checkout redirect.
 * Polls the server to confirm the subscription is active before redirecting,
 * instead of relying on fixed delays that can't account for webhook timing.
 */
export function CheckoutSuccessHandler() {
  const { user } = useAuth<User>()
  const [phase, setPhase] = useState<'success' | 'polling' | 'ready'>('success')
  const [attempts, setAttempts] = useState(0)

  const MAX_ATTEMPTS = 15 // ~30 seconds total (2s intervals)
  const POLL_INTERVAL = 2000

  const redirectToDashboard = useCallback(() => {
    // Hard navigation to force full server re-render (router.replace + refresh
    // doesn't work because we're already on /app — the server component won't re-run)
    window.location.href = '/app'
  }, [])

  useEffect(() => {
    // Phase 1: Show success message briefly
    const successTimer = setTimeout(() => {
      setPhase('polling')
    }, 1500)

    return () => clearTimeout(successTimer)
  }, [])

  useEffect(() => {
    if (phase !== 'polling' || !user?.id) return

    let cancelled = false

    const poll = async () => {
      try {
        const result = await pollSubscriptionReady(user.id)

        if (cancelled) return

        if (result.ready) {
          setPhase('ready')
          // Small delay so user sees the "ready" state, then redirect
          setTimeout(() => {
            if (!cancelled) redirectToDashboard()
          }, 800)
          return
        }

        setAttempts((prev) => {
          const next = prev + 1
          if (next >= MAX_ATTEMPTS) {
            // Timeout — redirect anyway, dashboard self-heal will handle it
            if (!cancelled) redirectToDashboard()
            return next
          }
          return next
        })
      } catch {
        // On error, still increment attempts
        setAttempts((prev) => prev + 1)
      }
    }

    const intervalId = setInterval(poll, POLL_INTERVAL)
    // Also poll immediately
    poll()

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [phase, user?.id, redirectToDashboard])

  return (
    <div className="max-w-3xl rounded-lg border-2 border-green-500/30 bg-green-500/5 px-6 py-5">
      <div className="flex items-center gap-4">
        {phase === 'ready' ? (
          <CheckCircle className="h-8 w-8 shrink-0 text-green-600 dark:text-green-400" />
        ) : (
          <Loader2 className="h-8 w-8 shrink-0 animate-spin text-green-600 dark:text-green-400" />
        )}
        <div>
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">
            {phase === 'success'
              ? 'Płatność zakończona sukcesem!'
              : phase === 'ready'
                ? 'Konto gotowe!'
                : 'Konfigurujemy Twoje konto...'}
          </h3>
          <p className="mt-1 text-sm text-green-700/80 dark:text-green-400/80">
            {phase === 'success'
              ? 'Twoja subskrypcja została aktywowana.'
              : phase === 'ready'
                ? 'Za chwilę zobaczysz zaktualizowany panel.'
                : 'Trwa aktywacja subskrypcji. Proszę czekać...'}
          </p>
        </div>
      </div>
    </div>
  )
}
