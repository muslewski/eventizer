'use client'

import { useEffect, useState } from 'react'

/**
 * Returns true once the user has scrolled past the given viewport-height threshold.
 * @param vh - fraction of viewport height (e.g. 0.75 for 75vh)
 */
export function useScrollPast(vh: number): boolean {
  const [past, setPast] = useState(false)

  useEffect(() => {
    const threshold = window.innerHeight * vh

    const check = () => setPast(window.scrollY > threshold)
    check() // initial

    window.addEventListener('scroll', check, { passive: true })
    return () => window.removeEventListener('scroll', check)
  }, [vh])

  return past
}
