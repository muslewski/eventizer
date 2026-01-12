'use client'

import { Media } from '@/payload-types'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import './styles.css'

interface BackgroundVideoProps {
  backgroundVideo: Media
  poster?: string // Optional poster from backgroundImage
}

export default function BackgroundVideo({ backgroundVideo, poster }: BackgroundVideoProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Delay video loading until after initial render to not block LCP
  useEffect(() => {
    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => setShouldLoad(true), { timeout: 2000 })
      return () => window.cancelIdleCallback(id)
    } else {
      const timer = setTimeout(() => setShouldLoad(true), 100)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleCanPlay = () => {
    setIsLoaded(true)
  }

  if (!backgroundVideo.url) return null

  return (
    <div
      className={cn(
        'absolute inset-0 hide-video-on-reduce animate-zoom-in will-change-transform backface-hidden  transform-gpu',
      )}
      style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.9s ease-in-out' }}
    >
      {shouldLoad && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster={poster}
          onCanPlay={handleCanPlay}
          className="absolute inset-0 w-full h-full object-cover object-center"
        >
          <source src={backgroundVideo.url} type={backgroundVideo.mimeType || 'video/mp4'} />
        </video>
      )}
      {/* Inset shadow overlay */}
      <div
        className="absolute inset-0"
        style={{ boxShadow: 'inset 0 4px 61.4px rgba(0, 0, 0, 0.5)' }}
      />
    </div>
  )
}
