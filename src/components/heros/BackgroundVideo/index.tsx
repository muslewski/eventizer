'use client'

import { Media } from '@/payload-types'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import './styles.css'

interface BackgroundVideoProps {
  backgroundVideo: Media
  poster?: string
}

export default function BackgroundVideo({ backgroundVideo, poster }: BackgroundVideoProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Delay video loading until after initial render
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => setShouldLoad(true), { timeout: 2000 })
      return () => window.cancelIdleCallback(id)
    } else {
      const timer = setTimeout(() => setShouldLoad(true), 100)
      return () => clearTimeout(timer)
    }
  }, [])

  // Pause/play video based on visibility
  useEffect(() => {
    const video = videoRef.current
    const container = containerRef.current
    if (!video || !container) return

    // Force iOS to treat video as non-interactive
    video.setAttribute('webkit-playsinline', 'true')
    video.setAttribute('x-webkit-airplay', 'deny')
    video.muted = true
    video.controls = false

    // Show video only once it actually starts playing (hides iOS play button)
    const handlePlaying = () => setIsLoaded(true)
    video.addEventListener('playing', handlePlaying)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {
            // Autoplay may be blocked, ignore
          })
        } else {
          video.pause()
        }
      },
      { threshold: 0.1 }, // Trigger when 10% visible
    )

    observer.observe(container)

    return () => {
      video.removeEventListener('playing', handlePlaying)
      observer.disconnect()
    }
  }, [shouldLoad])

  if (!backgroundVideo.url) return null

  return (
    <div
      ref={containerRef}
      className={cn(
        'absolute inset-0 hide-video-on-reduce animate-zoom-in will-change-transform backface-hidden transform-gpu',
      )}
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      {shouldLoad && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          controls={false}
          disableRemotePlayback
          disablePictureInPicture
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none background-video"
          style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.9s ease-in-out' }}
        >
          <source src={backgroundVideo.url} type={backgroundVideo.mimeType || 'video/mp4'} />
        </video>
      )}
      <div
        className="absolute inset-0"
        style={{ boxShadow: 'inset 0 4px 61.4px rgba(0, 0, 0, 0.5)' }}
      />
    </div>
  )
}
