'use client'

import { useRef, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import '@/heros/HighImpact/styles.css'

interface MediaBlockWrapperProps {
  className?: string
  children: React.ReactNode
}

export const MediaBlockWrapper: React.FC<MediaBlockWrapperProps> = ({ className, children }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '-50px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn(
        className,
        'media-block-hover',
      )}
      data-visible={isVisible}
    >
      {children}
    </div>
  )
}
