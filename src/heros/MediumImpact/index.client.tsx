'use client'

import { useEffect } from 'react'
import { useHeaderTheme } from '@/components/providers/HeaderTheme'
import './styles.css'

export const MediumImpactHeroClient: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme('dark')
  }, [setHeaderTheme])

  useEffect(() => {
    if (!window.location.hash) {
      window.scrollTo(0, 0)
    }
  }, [])

  return (
    <div className="xl:h-screen pt-4 sm:pt-8 xl:pt-0 w-full flex justify-center items-center">
      <div
        className="xl:h-[calc(100vh-64px)]  transition-[margin-top] rounded-2xl  py-0 px-0 sm:px-0 relative flex flex-col xl:flex-row gap-4 xl:gap-16 items-center w-full from-base-900 dark:from-background bg-linear-to-b via-stone-300 dark:via-background  to-white dark:to-background "
        data-theme="dark"
      >
        {children}
      </div>
    </div>
  )
}
