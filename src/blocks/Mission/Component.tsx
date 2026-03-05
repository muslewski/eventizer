import type { MissionBlock as MissionBlockProps } from '@/payload-types'
import React from 'react'
import { MissionClient } from './Component.client'

export const MissionBlock: React.FC<
  MissionBlockProps & {
    id?: string | number
    className?: string
  }
> = (props) => {
  return <MissionClient {...props} />
}
