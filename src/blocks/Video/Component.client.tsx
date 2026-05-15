'use client'

import { useRef, useState, useCallback } from 'react'
import { Play, PlayIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { BlockHeader } from '@/components/frontend/Content/BlockHeader'
import { cn } from '@/lib/utils'
import { getVideoAspectConfig } from '@/lib/getVideoAspectClasses'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { PhoneFrame } from '@/components/video/PhoneFrame'

interface VideoClientProps {
  heading: string
  description: string
  videoUrl: string
  videoTitle: string
  mimeType: string
  aspectRatio?: string
  className?: string
}

export const VideoClient: React.FC<VideoClientProps> = ({
  heading,
  description,
  videoUrl,
  videoTitle,
  mimeType,
  aspectRatio,
  className,
}) => {
  const { ratio: numericRatio, wrapperClass } = getVideoAspectConfig(aspectRatio)
  const isPhoneFrame = aspectRatio === '9:16'
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  const handlePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    setIsPlaying(true)
    setHasStarted(true)
    // play() returns a Promise that rejects with AbortError if the element
    // unmounts mid-load (route nav, AnimatePresence exit, StrictMode double
    // mount). Swallow expected aborts; surface the rest for debugging.
    void video.play().catch((err: unknown) => {
      const isAbort =
        err instanceof DOMException &&
        (err.name === 'AbortError' || err.name === 'NotAllowedError')
      if (!isAbort) {
        // eslint-disable-next-line no-console
        console.warn('[VideoBlock] play() failed:', err)
      }
    })
  }, [])

  const handleVideoPause = useCallback(() => {
    setIsPlaying(false)
  }, [])

  const handleVideoPlay = useCallback(() => {
    setIsPlaying(true)
    setHasStarted(true)
  }, [])

  return (
    <motion.section
      className={cn('w-full flex flex-col items-center justify-center gap-5 py-16', className)}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      <BlockHeader heading={heading} description={description} gap lines />

      <div className={cn('w-full max-w-5xl mx-auto px-4 mt-16', wrapperClass)}>
        {/* Outer wrapper — phone-shaped bezel for 9:16, simple rounded frame
            otherwise. Inner motion.div handles the hover scale. */}
        <FrameWrapper isPhoneFrame={isPhoneFrame}>
          <motion.div
            className="relative bg-black group transform-gpu"
            style={{ backfaceVisibility: 'hidden' }}
            whileHover={!isPlaying ? { scale: 1.01 } : {}}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <AspectRatio ratio={numericRatio} className="bg-black">
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                controls={hasStarted}
                preload="metadata"
                playsInline
                controlsList="nodownload"
                onPause={handleVideoPause}
                onPlay={handleVideoPlay}
                onEnded={() => setIsPlaying(false)}
                aria-label={videoTitle}
              >
                <source src={videoUrl} type={mimeType} />
                Your browser does not support the video tag.
              </video>
            </AspectRatio>

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
        </FrameWrapper>
      </div>
    </motion.section>
  )
}

/**
 * Picks between the existing simple rounded wrapper and the new PhoneFrame
 * based on whether the video is 9:16. Inlined here so the JSX stays readable.
 */
function FrameWrapper({
  isPhoneFrame,
  children,
}: {
  isPhoneFrame: boolean
  children: React.ReactNode
}) {
  if (isPhoneFrame) return <PhoneFrame>{children}</PhoneFrame>
  return (
    <div className="relative rounded-[0.8rem] overflow-hidden shadow-2xl">{children}</div>
  )
}
