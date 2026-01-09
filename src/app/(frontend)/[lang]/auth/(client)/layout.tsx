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

  return (
    <MediumImpactHero
      title="Zarządzaj swoim kontem usługodawcy"
      backgroundImage={backgroundImage}
      informationTitle1="70K+"
      informationValue1="Aktywnych usług"
      informationTitle2="120+"
      informationValue2="Branż eventowych"
      customReactComponent={<AuthProvider>{children}</AuthProvider>}
    />
  )
}

export default Layout
