'use client'

import { useState } from 'react'
import Image from 'next/image'
import BlurText from '@/components/react-bits/BlurText'

interface DashboardHeroProps {
  userName: string
  backgroundImageUrl?: string | null
}

export function DashboardHero({ userName, backgroundImageUrl }: DashboardHeroProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  const firstName = userName?.split(' ')[0] || 'użytkowniku'

  return (
    <div
      className="relative h-48 sm:h-56 w-full overflow-hidden rounded-2xl"
      data-theme="dark"
    >
      {/* Background image */}
      {backgroundImageUrl && (
        <div
          className="absolute inset-0 z-0 animate-zoom-in will-change-transform transform-gpu backface-hidden"
          style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.6s ease-in-out' }}
        >
          <Image
            src={backgroundImageUrl}
            alt=""
            fill
            priority
            quality={80}
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 80vw"
            onLoad={() => setIsLoaded(true)}
          />
          {/* Inset shadow */}
          <div
            className="absolute inset-0"
            style={{ boxShadow: 'inset 0 4px 61.4px rgba(0, 0, 0, 0.5)' }}
          />
        </div>
      )}

      {/* Fallback gradient when no image */}
      {!backgroundImageUrl && (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-accent/20 via-background to-background" />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 z-1 bg-gradient-to-b from-transparent via-black/40 to-black/80" />

      {/* Noise texture */}
      <div className="absolute inset-0 z-2 opacity-[0.15] mix-blend-hard-light pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />

      {/* Accent glow */}
      <div className="absolute -bottom-8 -left-8 z-1 size-32 rounded-full bg-accent/15 blur-[60px]" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-end gap-2 px-6 pb-6 sm:px-8 sm:pb-8">
        <p className="text-sm text-white/50">Panel Eventizer</p>
        <BlurText
          text={`Witaj ponownie, ${firstName}`}
          className="font-bebas text-3xl sm:text-4xl tracking-wide text-white mix-blend-difference"
          delay={100}
          animateBy="words"
        />

        {/* Decorative bottom bar */}
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1 w-8 rounded-full bg-accent/60" />
          <div className="h-1 w-4 rounded-full bg-white/20" />
          <div className="h-1 w-2 rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  )
}
