import { Media, type Page } from '@/payload-types'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import { HorizontalLines } from '@/heros/HighImpact/Background/HorizontalLines/index'
import BackgroundImage from '@/heros/HighImpact/Background/BackgroundImage'
import dynamic from 'next/dynamic'

// Lazy load LightRays to prevent blocking initial render
const LightRays = dynamic(() => import('@/components/react-bits/LightRays'))

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
        <BackgroundImage backgroundImage={backgroundImage} />
      )}

      {/* Animated noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.2] mix-blend-hard-light pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />

      {/* Background horizontal lines */}
      <HorizontalLines />

      {/* Primary gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-br from-transparent via-black/30 to-black/90" />

      {/* Accent color glow */}
      <div className="absolute bottom-0 left-5/6 sm:left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] opacity-50 " />

      <LightRays
        raysOrigin="top-center"
        raysColor="#ffffff"
        raysSpeed={1.5}
        lightSpread={0.8}
        rayLength={1}
        followMouse={true}
        mouseInfluence={0.1}
        noiseAmount={0.1}
        distortion={0.05}
      />
    </>
  )
}
