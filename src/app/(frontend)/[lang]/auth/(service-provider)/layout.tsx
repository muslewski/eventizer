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

  return (
    <MediumImpactHero
      title="Zarządzaj swoim kontem usługodawcy"
      backgroundImage={backgroundImage}
      informationTitle1="200K+"
      informationValue1="Zarejestrowanych użytkowników"
      informationTitle2="5K+"
      informationValue2="Wydarzeń miesięcznie"
      customReactComponent={<AuthServiceProvider>{children}</AuthServiceProvider>}
    />
  )
}

export default Layout
