import { Media, type Page } from '@/payload-types'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import Image from 'next/image'
import { HorizontalLines } from '@/heros/HighImpact/Background/HorizontalLines/index'

interface BackgroundProps {
  backgroundImage: Page['hero']['backgroundImage']
}

// TODO:
// - Add parallax effect / fixed background

export const Background: React.FC<BackgroundProps> = ({ backgroundImage }) => {
  return (
    <>
      {/* Background image */}
      {backgroundImage && isExpandedDoc<Media>(backgroundImage) && (
        <div className="absolute inset-0 z-0 animate-zoom-in will-change-transform transform-gpu backface-hidden">
          <Image
            src={backgroundImage.url || ''}
            alt={backgroundImage.alt || ''}
            fill
            priority
            quality={90}
            className="object-cover object-center"
            sizes="100vw"
          />
          {/* Inset shadow overlay */}
          <div
            className="absolute inset-0"
            style={{ boxShadow: 'inset 0 4px 61.4px rgba(0, 0, 0, 0.5)' }}
          />
        </div>
      )}

      {/* Animated noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.2] mix-blend-hard-light pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />

      {/* Background horizontal lines */}
      <HorizontalLines />

      {/* Primary gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-br from-transparent via-black/30 to-black/90" />

      {/* Accent color glow */}
      <div className="absolute bottom-0 left-5/6 sm:left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] opacity-50 " />
    </>
  )
}
