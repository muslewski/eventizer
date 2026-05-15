import { HighImpactHero } from '@/heros/HighImpact'
import type { BasePayload } from 'payload'
import type { Media } from '@/payload-types'

interface HeroViewProps {
  payload: BasePayload
}

// Manually-provided light-theme background.
//
// Earlier this was looked up from the Payload media collection by filename,
// but that coupled the design to a specific CMS upload surviving renames /
// deletes. Hardcoding the path here keeps the source of truth in code; the
// file still lives in the Payload media bucket so it's served via the same
// /api/media/file/* endpoint. BackgroundImage only reads `url` and `alt`,
// so a minimal shape cast to Media is safe.
const LIGHT_BACKGROUND_IMAGE = {
  url: '/api/media/file/ogloszenia-background.JPG',
  alt: 'Tło ogłoszeń',
} as Media

export default async function HeroView({ payload }: HeroViewProps) {
  const [{ docs: darkDocs }, { docs: videoDocs }] = await Promise.all([
    payload.find({
      collection: 'media',
      where: { filename: { equals: 'offers-background-compressed.jpg' } },
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
  const backgroundVideo = videoDocs[0] || null

  return (
    <HighImpactHero
      title="Znajdź specjalistów, którzy uczynią Twoje wydarzenie wyjątkowym"
      backgroundImage={backgroundImage}
      lightBackgroundImage={LIGHT_BACKGROUND_IMAGE}
      backgroundVideo={backgroundVideo}
      showScrollIndicator
    />
  )
}
