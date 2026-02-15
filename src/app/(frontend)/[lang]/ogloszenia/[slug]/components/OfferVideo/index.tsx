'use client'

import { useMemo, useRef, useState, useCallback } from 'react'
import type { Offer, OfferVideoUpload } from '@/payload-types'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import { Clapperboard, Play } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { BlockHeader } from '@/components/frontend/Content/BlockHeader'

interface OfferVideoProps {
  offer: Offer
}

export const OfferVideo: React.FC<OfferVideoProps> = ({ offer }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  const videoData = useMemo(() => {
    if (!offer.video) return null
    const video = isExpandedDoc<OfferVideoUpload>(offer.video) ? offer.video : null
    if (!video?.url) return null

    // Use the public proxy route so the browser doesn't send auth cookies
    // (the direct Payload URL returns 403 for logged-in non-owners)
    const proxyUrl = `/api/offer-video/${encodeURIComponent(video.filename ?? '')}`

    return {
      url: proxyUrl,
      title: video.title || offer.title,
      mimeType: video.mimeType ?? 'video/mp4',
    }
  }, [offer.video, offer.title])

  const handlePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.play()
    setIsPlaying(true)
    setHasStarted(true)
  }, [])

  const handleVideoPause = useCallback(() => {
    setIsPlaying(false)
  }, [])

  const handleVideoPlay = useCallback(() => {
    setIsPlaying(true)
    setHasStarted(true)
  }, [])

  if (!videoData) return null

  return (
    <motion.section
      className="w-full flex flex-col items-center justify-center gap-5"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      <BlockHeader
        heading="Film promocyjny"
        description="Zobacz krótką prezentację usługi przygotowaną przez usługodawcę."
        gap
        lines
      />

      <div className="w-full max-w-4xl mx-auto px-4 mt-16">
        {/* Outer border wrapper — never scaled, so border stays crisp */}
        <div className="relative rounded-[0.8rem] overflow-hidden">
          {/* Inner content — scales on hover without affecting the border */}
          <motion.div
            className="relative bg-black group transform-gpu"
            style={{ backfaceVisibility: 'hidden' }}
            whileHover={!isPlaying ? { scale: 1.015 } : {}}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
               <div className="relative w-full aspect-video bg-black">
          <video
            ref={videoRef}
            className="w-full max-h-[600px] object-contain aspect-video"
            controls={hasStarted}
            preload="metadata"
            playsInline
            controlsList="nodownload"
            onPause={handleVideoPause}
            onPlay={handleVideoPlay}
            onEnded={() => setIsPlaying(false)}
          >
            <source src={`${videoData.url}#t=0.001`} type={videoData.mimeType} />
            Your browser does not support the video tag.
          </video></div>

          {/* Inner shadow overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ boxShadow: 'inset 0 2px 20px rgba(0, 0, 0, 0.25)' }}
          />

          {/* Play button overlay — visible until the user starts the video */}
          <AnimatePresence>
            {!hasStarted && (
              <motion.button
                type="button"
                aria-label="Play video"
                onClick={handlePlay}
                className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer bg-black/20 backdrop-blur-[2px]"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Ripple ring */}
                <span className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-white/30 animate-ping" />

                {/* Play circle */}
                <motion.span
                  className="relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/90 shadow-2xl backdrop-blur-sm"
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  {/* Offset the icon slightly right to visually center the triangle */}
                  <Play
                    className="w-8 h-8 sm:w-10 sm:h-10 text-black ml-1"
                    fill="currentColor"
                    strokeWidth={0}
                  />
                </motion.span>
              </motion.button>
            )}
          </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </motion.section>
  )
}
