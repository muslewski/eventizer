import { Media, type Page } from '@/payload-types'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import BackgroundImage from '@/components/heros/BackgroundImage'
import { HorizontalLines, LineConfig } from '@/components/heros/HorizontalLines'
import NoiseTexture from '@/components/heros/NoiseTexture'
import dynamic from 'next/dynamic'

const lines: LineConfig[] = [
  { direction: 'to-b', from: 35, blur: true, show: 'always' },
  // { direction: 'to-t', from: 35, show: 'always' },
  // { direction: 'to-b', from: 35, via: 35, show: 'md' },
  { direction: 'to-t', from: 35, blur: true, show: 'always' },
  { direction: 'to-b', from: 35, show: 'always' },
  { direction: 'to-b', from: 35, via: 0, show: 'always' },
  // { direction: 'to-b', from: 35, via: 35, show: 'always' },
  { direction: 'to-b', from: 35, via: 30, blur: true, show: 'sm' },
  { direction: 'to-t', from: 35, to: 0, show: 'always' },
  { direction: 'to-t', from: 35, via: 10, show: 'xl' },
  // { direction: 'to-b', from: 35, via: 40, blur: true, show: 'sm' },
  // { direction: 'to-b', from: 30, via: 0, show: 'xl' },
  // { direction: 'to-t', from: 35, via: 10, show: 'always' },
  // { direction: 'to-t', from: 35, via: 20, show: 'always' },
  { direction: 'to-b', from: 35, via: 35, show: 'xl' },
  { direction: 'to-b', from: 40, via: 0, show: 'xl' },
]
// import dynamic from 'next/dynamic'

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
      <NoiseTexture />

      {/* Background horizontal lines */}
      <HorizontalLines lines={lines} />

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
