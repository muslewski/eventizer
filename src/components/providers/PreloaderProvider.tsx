'use client'

import EventizerIcon from '@/assets/eventizer-icon-1.png'
import Preloader from '@/components/react-bits/preloader'
import { useLenis } from 'lenis/react'
import Image from 'next/image'
import { useEffect, useState } from 'react'

/**
 * Session-scoped preloader.
 *
 * Pattern: one brand-reveal moment per browser tab (sessionStorage gate),
 * matching liceum7bydgoszcz's `SitePreloader`. The previous implementation
 * intercepted every same-origin anchor click and re-played the curtain on
 * each navigation — slick the first time, fatiguing every time after.
 *
 * Rules:
 * 1. Skip entirely when landing directly on a `/panel` route — panel users
 *    open the app to work, not to watch a logo.
 * 2. Otherwise, on the first marketing-page entry in this tab, show the
 *    preloader for `INITIAL_DURATION_MS`, then set the sessionStorage flag.
 * 3. Any subsequent mount (reload, in-app nav back to a marketing page) in
 *    the same tab reads the flag and short-circuits to `loading = false`.
 *
 * The Lenis stop/start guard is left intact so it works once Lenis is
 * re-enabled site-wide; today `useLenis()` returns null and the effect
 * no-ops.
 */

const STORAGE_KEY = 'eventizer-preloaded'
const INITIAL_DURATION_MS = 1200
const PANEL_PATH_RE = /^\/[a-z]{2}\/panel(\/|$)/

function isPanelPath(pathname: string): boolean {
  return PANEL_PATH_RE.test(pathname)
}

export function PreloaderProvider({ children }: { children: React.ReactNode }) {
  const lenis = useLenis()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Skip on panel pages — work context, no brand intro.
    if (isPanelPath(window.location.pathname)) {
      setLoading(false)
      return
    }

    // Session gate — only show once per tab.
    let alreadyShown = false
    try {
      alreadyShown = sessionStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      // Storage blocked (privacy mode / disabled cookies) — treat as shown so
      // we don't bombard the user with a preloader on every page.
      alreadyShown = true
    }
    if (alreadyShown) {
      setLoading(false)
      return
    }

    const t = setTimeout(() => {
      setLoading(false)
      try {
        sessionStorage.setItem(STORAGE_KEY, '1')
      } catch {
        /* noop */
      }
    }, INITIAL_DURATION_MS)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!lenis) return
    if (loading) lenis.stop()
    else lenis.start()
  }, [lenis, loading])

  return (
    <Preloader
      loading={loading}
      variant="curtain"
      position="fixed"
      loadingText=""
      duration={INITIAL_DURATION_MS}
      zIndex={100}
      respectReducedMotion
      reducedMotionFallback="fade"
      ariaLabel="Ładowanie strony"
      centerContent={
        <Image
          src={EventizerIcon}
          alt="Eventizer"
          priority
          className="h-40 w-auto object-contain drop-shadow-[0_0_24px_rgba(210,140,8,0.35)]"
        />
      }
    >
      {children}
    </Preloader>
  )
}
