import { AuthProvider } from '@/components/providers/AuthProvider'
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
        equals: 'sign-in-client-background-compressed.jpg',
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
        equals: 'sign-in-client-background-video-compressed.mp4',
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
        equals: 'background-client-light.jpeg',
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
      informationTitle1="70K+"
      informationValue1="Aktywnych usług"
      informationTitle2="120+"
      informationValue2="Branż eventowych"
      customReactComponent={<AuthProvider>{children}</AuthProvider>}
    />
  )
}

export default Layout
