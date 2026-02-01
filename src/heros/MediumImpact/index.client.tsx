'use client'

import { useEffect } from 'react'
import { useHeaderTheme } from '@/components/providers/HeaderTheme'
import './styles.css'

export const MediumImpactHeroClient: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme('dark')
  }, [setHeaderTheme])

  return (
    <div
      className="xl:h-[calc(100vh-64px)] -mt-12 sm:-mt-8 transition-[margin-top] rounded-2xl overflow-visible py-0 px-0 sm:px-0 relative flex flex-col xl:flex-row gap-4 xl:gap-16 items-center w-full from-foreground dark:from-background bg-linear-to-b via-stone-300 dark:via-background  to-white dark:to-background"
      data-theme="dark"
    >
      {children}
    </div>
  )
}
