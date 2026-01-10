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
      className="xl:h-[calc(100vh-72px)] -mt-10 sm:-mt-6 rounded-2xl overflow-visible py-0 px-0 sm:px-0 relative flex flex-col xl:flex-row gap-4 xl:gap-16 items-center w-full from-[#0B0B0D] dark:from-[#0B0B0D] bg-linear-to-b via-stone-300 dark:via-[#0B0B0D]  to-white dark:to-[#0B0B0D]"
      data-theme="dark"
    >
      {children}
    </div>
  )
}
