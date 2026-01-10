import type { ComingSoonBlock as ComingSoonBlockProps } from '@/payload-types'
import React from 'react'
import { ComingSoonClient } from './Component.client'

export const ComingSoonBlock: React.FC<
  ComingSoonBlockProps & {
    id?: string | number
    className?: string
  }
> = ({ heading, description, icon, className }) => {
  return (
    <ComingSoonClient
      heading={heading}
      description={description}
      icon={icon}
      className={className}
    />
  )
}
