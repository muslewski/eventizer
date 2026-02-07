'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'

import HeaderLogo from '@/components/frontend/Header/Logo'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useScrollPast } from '@/hooks/useScrollPast'
import { navLinks, removeLocalePrefix } from '@/components/frontend/Header/shared'
import { ModeToggle } from '@/components/providers/Theme/ThemeSwitcher'
import { LanguageSwitcher } from '@/components/frontend/LanguageSwitcher'
import { ReduceMotionToggle } from '@/components/frontend/Header/ReduceMotionToggle'
import AnimatedMenuIcon from '@/components/frontend/Header/AnimatedMenuIcon'
import { useMobileMenu } from '@/components/frontend/Header/MobileMenuContext'
import HeaderCTA from '@/components/frontend/Header/HeaderCTA'

export default function StickyHeader() {
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

  // Don't render on /ogloszenia
  if (normalizedPathname === '/ogloszenia') return null

  return (
    <motion.header
      className={cn(
        'fixed z-50 top-4 left-1/2 -translate-x-1/2',
        'h-12 w-[min(96vw,75rem)] rounded-full',
        'border border-white/15 bg-base-900/40 backdrop-blur-xl shadow-lg shadow-black/20',
        'flex items-center justify-between px-5 gap-6',
        !pastThreshold && 'pointer-events-none',
      )}
      variants={{
        visible: { opacity: 1, y: 0 },
        hidden: { opacity: 0, y: '-200%' },
      }}
      initial="hidden"
      animate={pastThreshold && !hidden ? 'visible' : 'hidden'}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      {/* Logo – compact */}
      <HeaderLogo />

      {/* Nav links – desktop only */}
      <nav className="hidden md:flex items-center gap-6">
        {navLinks.map((link) => (
          <Button
            key={link.href}
            variant="link"
            asChild
            className={cn(
              'text-sm text-white/60 after:from-white after:to-white/50',
              normalizedPathname === link.href && 'after:scale-x-100 text-white',
            )}
          >
            <Link href={link.href} prefetch>
              {link.label}
            </Link>
          </Button>
        ))}
      </nav>

      {/* Settings + CTA */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-3">
          <ModeToggle variant="ghost" className="text-white" />
          <LanguageSwitcher variant="link" className="text-white" />
          <ReduceMotionToggle variant="ghost" className="text-white" />
        </div>

        {/* Desktop: avatar or sign-in */}
        <div className="hidden lg:block">
          <HeaderCTA />
        </div>

        {/* Mobile/Tablet: hamburger */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMobileMenu}
          className="lg:hidden text-white/80 hover:text-white"
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          <AnimatedMenuIcon isOpen={isMobileMenuOpen} />
        </Button>
      </div>
    </motion.header>
  )
}
