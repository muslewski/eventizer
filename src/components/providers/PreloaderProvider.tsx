'use client'

import EventizerIcon from '@/assets/eventizer-icon-1.png'
import Preloader from '@/components/react-bits/preloader'
import { useLenis } from 'lenis/react'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const MIN_DISPLAY_MS = 600
const INITIAL_DURATION_MS = 1200
const PANEL_PATH_RE = /^\/[a-z]{2}\/panel(\/|$)/

function isPanelPath(pathname: string): boolean {
  return PANEL_PATH_RE.test(pathname)
}

export function PreloaderProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const lenis = useLenis()

  const [loading, setLoading] = useState(true)
  const loadingStartRef = useRef<number>(Date.now())
  const lastPathnameRef = useRef(pathname)

  useEffect(() => {
    if (isPanelPath(window.location.pathname)) {
      setLoading(false)
      return
    }

    const t = setTimeout(() => setLoading(false), INITIAL_DURATION_MS)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!lenis) return
    if (loading) lenis.stop()
    else lenis.start()
  }, [lenis, loading])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      if (e.button !== 0) return

      const anchor = (e.target as HTMLElement | null)?.closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return
      if (anchor.target && anchor.target !== '_self') return
      if (anchor.hasAttribute('download')) return
      if (href.startsWith('mailto:') || href.startsWith('tel:')) return
      if (href.startsWith('#')) return

      let dest: URL
      try {
        dest = new URL(href, window.location.href)
      } catch {
        return
      }
      if (dest.origin !== window.location.origin) return
      if (
        dest.pathname === window.location.pathname &&
        dest.search === window.location.search
      ) {
        return
      }

      if (isPanelPath(dest.pathname) || isPanelPath(window.location.pathname)) {
        return
      }

      e.preventDefault()
      loadingStartRef.current = Date.now()
      setLoading(true)
      router.push(dest.pathname + dest.search + dest.hash)
    }

    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [router])

  useEffect(() => {
    if (pathname === lastPathnameRef.current) return
    lastPathnameRef.current = pathname

    if (!loading) return
    if (isPanelPath(pathname)) {
      setLoading(false)
      return
    }

    const elapsed = Date.now() - loadingStartRef.current
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed)
    const t = setTimeout(() => setLoading(false), remaining)
    return () => clearTimeout(t)
  }, [pathname, loading])

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
          className="h-20 w-auto object-contain drop-shadow-[0_0_24px_rgba(210,140,8,0.35)]"
        />
      }
    >
      {children}
    </Preloader>
  )
}
