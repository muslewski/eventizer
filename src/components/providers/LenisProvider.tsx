'use client'

import { ReactLenis } from 'lenis/react'
import { useEffect, useState } from 'react'

const MOBILE_QUERY = '(min-width: 768px)'
const POINTER_QUERY = '(pointer: fine)'
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: no-preference)'

function evaluateEligibility(): boolean {
  if (typeof window === 'undefined') return false

  const desktopViewport = window.matchMedia(MOBILE_QUERY).matches
  const precisePointer = window.matchMedia(POINTER_QUERY).matches
  const motionOk = window.matchMedia(REDUCED_MOTION_QUERY).matches
  const classOptOut = document.documentElement.classList.contains('reduce-motion')

  return desktopViewport && precisePointer && motionOk && !classOptOut
}

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const update = () => setEnabled(evaluateEligibility())
    update()

    const queries = [MOBILE_QUERY, POINTER_QUERY, REDUCED_MOTION_QUERY].map((q) =>
      window.matchMedia(q),
    )
    queries.forEach((mql) => mql.addEventListener('change', update))

    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => {
      queries.forEach((mql) => mql.removeEventListener('change', update))
      observer.disconnect()
    }
  }, [])

  if (!enabled) return <>{children}</>

  return (
    <ReactLenis
      root
      options={{
        duration: 1.15,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      }}
    >
      {children}
    </ReactLenis>
  )
}
