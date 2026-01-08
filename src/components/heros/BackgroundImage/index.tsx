'use client'

import Image from 'next/image'
import { Media } from '@/payload-types'
import { useState } from 'react'

export default function BackgroundImage({ backgroundImage }: { backgroundImage: Media }) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <div
      className="absolute inset-0 z-0 animate-zoom-in will-change-transform transform-gpu backface-hidden"
      style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}
    >
      <Image
        src={backgroundImage.url || ''}
        alt={backgroundImage.alt || ''}
        fill
        priority
        quality={90}
        className="object-cover object-center"
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
