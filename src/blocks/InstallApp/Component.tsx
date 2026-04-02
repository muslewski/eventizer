import type { InstallAppBlock as InstallAppBlockProps } from '@/payload-types'
import React from 'react'
import { InstallAppClient } from './Component.client'
import { BlockHeader } from '@/components/frontend/Content/BlockHeader'

export const InstallAppBlock: React.FC<
  InstallAppBlockProps & {
    id?: string | number
    className?: string
  }
> = (props) => {
  return (
    <InstallAppClient
      {...props}
      blockHeader={
        <BlockHeader
          heading={props.sectionHeading}
          description={props.sectionDescription}
          badge={{ label: 'Aplikacja' }}
          grid
          gap
        />
      }
    />
  )
}
