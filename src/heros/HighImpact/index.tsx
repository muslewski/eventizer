'use client'

import type { Page } from '@/payload-types'
import { useEffect } from 'react'
import { useHeaderTheme } from '@/components/providers/HeaderTheme'

export const HighImpactHero: React.FC<Page['hero']> = ({ links, media, richText }) => {
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme('dark')
  }, [])

  return (
    <div className="" data-theme="dark">
      test high impact
    </div>
  )
}
