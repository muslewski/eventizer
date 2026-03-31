import type { InstallAppBlock as InstallAppBlockProps } from '@/payload-types'
import React from 'react'
import { InstallAppClient } from './Component.client'

export const InstallAppBlock: React.FC<
  InstallAppBlockProps & {
    id?: string | number
    className?: string
  }
> = (props) => {
  return <InstallAppClient {...props} />
}
