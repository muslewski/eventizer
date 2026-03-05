import type { BetaBannerBlock as BetaBannerBlockProps } from '@/payload-types'
import React from 'react'
import { BetaBannerClient } from './Component.client'

export const BetaBannerBlock: React.FC<
  BetaBannerBlockProps & {
    id?: string | number
    className?: string
  }
> = (props) => {
  return <BetaBannerClient {...props} />
}
