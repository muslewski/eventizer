import { HighImpactHero } from '@/heros/HighImpact'
import type { BasePayload } from 'payload'

interface HeroViewProps {
  payload: BasePayload
}

export default async function HeroView({ payload }: HeroViewProps) {
  // find background image
  const { docs } = await payload.find({
    collection: 'media',
    where: {
      filename: {
        equals: 'offers-background-compressed.jpg',
      },
    },
    limit: 1,
  })

  const backgroundImage = docs[0] || null

  // find background video
  const { docs: videoDocs } = await payload.find({
    collection: 'media',
    where: {
      filename: {
        equals: 'offers-background-video-compressed.mp4',
      },
    },
    limit: 1,
  })

  const backgroundVideo = videoDocs[0] || null

  return (
    <HighImpactHero
      title="Znajdź specjalistów, którzy uczynią Twoje wydarzenie wyjątkowym"
      backgroundImage={backgroundImage}
      backgroundVideo={backgroundVideo}
    />
  )
}
