import type { InstallAppBlock as InstallAppBlockProps } from '@/payload-types'
import React from 'react'
import { InstallAppClient } from './Component.client'
import { BlockHeader } from '@/components/frontend/Content/BlockHeader'
import { Smartphone } from 'lucide-react'

export const InstallAppBlock: React.FC<
  InstallAppBlockProps & {
    id?: string | number
    className?: string
  }
> = ({ sectionHeading, sectionDescription, ...props }) => {
  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <BlockHeader
        heading={sectionHeading}
        description={sectionDescription}
        badge={{label: 'Aplikacja'}}
        grid
        gap
      />
      <InstallAppClient {...props} />
    </div>
  )
}
