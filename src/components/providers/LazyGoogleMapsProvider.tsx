'use client'

import React, { useRef, useState, useEffect, ReactNode } from 'react'
import { GoogleMapsProvider } from '@/components/providers/GoogleMapsProvider'

export function LazyGoogleMapsProvider({ children }: { children: ReactNode }) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={sentinelRef}>
      {shouldLoad ? (
        <GoogleMapsProvider>{children}</GoogleMapsProvider>
      ) : (
        children
      )}
    </div>
  )
}
