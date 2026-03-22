import { HighImpactHero } from '@/heros/HighImpact'
import type { BasePayload } from 'payload'

interface HeroViewProps {
  payload: BasePayload
}

export default async function HeroView({ payload }: HeroViewProps) {
  const [
    { docs: darkDocs },
    { docs: lightDocs },
    { docs: videoDocs },
  ] = await Promise.all([
    payload.find({
      collection: 'media',
      where: { filename: { equals: 'offers-background-compressed.jpg' } },
      limit: 1,
      depth: 0,
    }),
    payload.find({
      collection: 'media',
      where: { filename: { equals: 'offers-background2-light-compressed.jpeg' } },
      limit: 1,
      depth: 0,
    }),
    payload.find({
      collection: 'media',
      where: { filename: { equals: 'offers-background-video-compressed.mp4' } },
      limit: 1,
      depth: 0,
    }),
  ])

  const backgroundImage = darkDocs[0] || null
  const lightBackgroundImage = lightDocs[0] || null
  const backgroundVideo = videoDocs[0] || null

  return (
    <HighImpactHero
      title="Znajdź specjalistów, którzy uczynią Twoje wydarzenie wyjątkowym"
      backgroundImage={backgroundImage}
      lightBackgroundImage={lightBackgroundImage}
      backgroundVideo={backgroundVideo}
      showScrollIndicator
    />
  )
}
