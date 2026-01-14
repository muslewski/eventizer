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
    // Wrapper div to prevent entire page height to animate on ios when dvh units are used
    <div className="h-screen">
      {/* Bottom filler pattern - only visible on iOS when browser tools affect viewport */}
      <div
        className="absolute block sm:hidden top-[calc(82vh)] left-0 right-0 h-32 bg-linear-to-t from-background to-transparent pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute bottom-0 inset-0 opacity-20 bg-radial from-foreground via-transparent to-transparent" />
      </div>

      <div
        className="h-[calc(100dvh-32px)] sm:h-[calc(100dvh-64px)] -mt-12 sm:-mt-8 high-impact-hero rounded-2xl overflow-hidden pb-8 sm:pb-16 pt-16  px-8 sm:px-16 relative"
        data-theme="dark"
      >
        {children}
      </div>
    </div>
  )
}
