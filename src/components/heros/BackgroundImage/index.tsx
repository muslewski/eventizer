'use client'

import { Media } from '@/payload-types'
import { useState } from 'react'
import { PositionedImage } from '@/components/image-position/PositionedImage'
import type { ImagePosition } from '@/components/image-position/types'

interface BackgroundImageProps {
  backgroundImage: Media
  position?: Partial<ImagePosition> | null
}

export default function BackgroundImage({ backgroundImage, position }: BackgroundImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <div
      className="absolute inset-0 z-0 animate-zoom-in will-change-transform transform-gpu backface-hidden"
      style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}
    >
      <PositionedImage
        src={backgroundImage.url || ''}
        alt={backgroundImage.alt || ''}
        position={position}
        className="absolute inset-0"
        priority
        quality={90}
        sizes="100vw"
        onLoad={() => setIsLoaded(true)}
      />
      {/* Inset shadow overlay */}
      <div
        className="absolute inset-0"
        style={{ boxShadow: 'inset 0 4px 61.4px rgba(0, 0, 0, 0.5)' }}
      />
    </div>
  )
}
