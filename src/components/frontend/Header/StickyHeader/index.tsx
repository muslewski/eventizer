'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'

import HeaderLogo from '@/components/frontend/Header/Logo'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useScrollPast } from '@/hooks/useScrollPast'
import { removeLocalePrefix } from '@/components/frontend/Header/shared'
import { ModeToggle } from '@/components/providers/Theme/ThemeSwitcher'
import { LanguageSwitcher } from '@/components/frontend/LanguageSwitcher'
import { ReduceMotionToggle } from '@/components/frontend/Header/ReduceMotionToggle'
import AnimatedMenuIcon from '@/components/frontend/Header/AnimatedMenuIcon'
import { useMobileMenu } from '@/components/frontend/Header/MobileMenuContext'
import HeaderCTA from '@/components/frontend/Header/HeaderCTA'
import NavigationLinks from '@/components/frontend/Header/NavigationLinks'
import type { NavCategory } from '@/components/frontend/Header/NavigationLinks'

interface StickyHeaderProps {
  categories: NavCategory[]
}

export default function StickyHeader({ categories }: StickyHeaderProps) {
  const pastThreshold = useScrollPast(0.2)
  const pathname = usePathname()
  const normalizedPathname = removeLocalePrefix(pathname)
  const { isOpen: isMobileMenuOpen, toggle: toggleMobileMenu } = useMobileMenu()

  // Hide on scroll down, show on scroll up (like BioFloor nav)
  const { scrollY } = useScroll()
  const [hidden, setHidden] = useState(false)

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious()
    if (previous !== undefined && latest > previous && latest > 50) {
      setHidden(true)
    } else {
      setHidden(false)
    }
  })

  const isOgloszenia = normalizedPathname === '/ogloszenia'

  return (
    <motion.header
      className={cn(
        'fixed z-50 top-4 left-1/2 -translate-x-1/2',
        'h-14 w-[min(96vw,75rem)] rounded-full',
        'border border-base-300/50 dark:border-white/15 bg-white/60 dark:bg-base-900/40 backdrop-blur-lg shadow-lg shadow-black/10 dark:shadow-black/20',
        'flex items-center justify-between px-5 gap-6',
        !pastThreshold && 'pointer-events-none',
      )}
      variants={{
        visible: { opacity: 1, y: 0 },
        hidden: { opacity: 0, y: '-200%' },
      }}
      initial="hidden"
      animate={pastThreshold && !hidden && !isOgloszenia ? 'visible' : 'hidden'}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      {/* Logo – compact */}
      <HeaderLogo variant="sticky" />

      {/* Nav links – desktop only */}
      <nav className="hidden md:flex items-center gap-6">
        <NavigationLinks
          normalizedPathname={normalizedPathname}
          variant="sticky"
          categories={categories}
        />
      </nav>

      {/* Settings + CTA */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-3">
          <ModeToggle variant="ghost" className="text-base-700 dark:text-white" />
          <LanguageSwitcher variant="link" className="text-base-700 dark:text-white" />
          <ReduceMotionToggle variant="ghost" className="text-base-700 dark:text-white" />
        </div>

        {/* Desktop: avatar or sign-in */}
        <div className="hidden lg:block">
          <HeaderCTA variant="sticky" />
        </div>

        {/* Mobile/Tablet: hamburger */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMobileMenu}
          className="lg:hidden text-base-600 hover:text-base-900 dark:text-white/80 dark:hover:text-white"
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          <AnimatedMenuIcon isOpen={isMobileMenuOpen} />
        </Button>
      </div>
    </motion.header>
  )
}
