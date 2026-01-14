import config from '@payload-config'

import { HighImpactHero } from '@/heros/HighImpact'
import { getPayload } from 'payload'

export default async function NotFound() {
  const payload = await getPayload({ config })

  // find background image
  const { docs } = await payload.find({
    collection: 'media',
    where: {
      filename: {
        equals: '404-background-compressed.jpeg',
      },
    },
    limit: 1,
  })

  const backgroundImage = docs[0] || null

  // find icon image
  const { docs: iconDocs } = await payload.find({
    collection: 'media',
    where: {
      filename: {
        equals: 'house.svg',
      },
    },
    limit: 1,
  })

  const iconImage = iconDocs[0] || null

  // find background video
  const { docs: videoDocs } = await payload.find({
    collection: 'media',
    where: {
      filename: {
        equals: '404-background-video-compressed.mp4',
      },
    },
    limit: 1,
  })

  const backgroundVideo = videoDocs[0] || null

  return (
    <HighImpactHero
      title="Niestety nie znaleziono strony"
      backgroundImage={backgroundImage}
      backgroundVideo={backgroundVideo}
      links={[
        {
          link: {
            type: 'custom',
            url: '/',
            appearance: 'cta',
            label: 'Powrót do strony głównej',
            icon: iconImage,
          },
        },
      ]}
    />
  )
}
