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
      className="h-[calc(100vh-64px)] rounded-2xl overflow-hidden py-16 -mt-8 px-8 sm:px-16 relative"
      data-theme="dark"
    >
      {children}
    </div>
  )
}
