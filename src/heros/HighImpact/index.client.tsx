'use client'

import { useEffect } from 'react'
import { useHeaderTheme } from '@/components/providers/HeaderTheme'
import './styles.css'

export const HighImpactHeroClient: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme('dark')
  }, [setHeaderTheme])

  return (
    <div
      className="h-[calc(100dvh-32px)] sm:h-[calc(100dvh-64px)] -mt-12 sm:-mt-8 high-impact-hero rounded-2xl overflow-hidden pb-8 sm:pb-16 pt-16  px-8 sm:px-16 relative"
      data-theme="dark"
    >
      {children}
    </div>
  )
}
