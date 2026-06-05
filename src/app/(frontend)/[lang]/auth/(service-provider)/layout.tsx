import { AuthServiceProvider } from '@/components/providers/AuthServiceProvider'
import { ReactNode } from 'react'

import { MediumImpactHero } from '@/heros/MediumImpact'

import config from '@payload-config'
import { getPayload } from 'payload'

export interface LayoutProps {
  children: ReactNode
}

const Layout = async ({ children }: LayoutProps) => {
  const payload = await getPayload({ config })

  // find background image
  const { docs } = await payload.find({
    collection: 'media',
    where: {
      filename: {
        equals: 'sign-in-service-provider-background-compressed.jpg',
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
        equals: 'sign-in-service-provider-background-video-compressed.mp4',
      },
    },
    limit: 1,
  })

  const backgroundVideo = videoDocs[0] || null

  // find light theme background image (dark theme has video + image; light has image for now)
  const { docs: lightDocs } = await payload.find({
    collection: 'media',
    where: {
      filename: {
        equals: 'background-service-provider-light.jpeg',
      },
    },
    limit: 1,
  })

  const lightBackgroundImage = lightDocs[0] || null

  return (
    <MediumImpactHero
      title="Zarządzaj swoim kontem usługodawcy"
      backgroundImage={backgroundImage}
      backgroundVideo={backgroundVideo}
      lightBackgroundImage={lightBackgroundImage}
      informationTitle1="500+"
      informationValue1="Zarejestrowanych użytkowników"
      informationTitle2="50"
      informationValue2="Wydarzeń miesięcznie"
      customReactComponent={<AuthServiceProvider>{children}</AuthServiceProvider>}
    />
  )
}

export default Layout
