'use client'

import { LanguageSwitcher } from '@/components/frontend/LanguageSwitcher'
import { ModeToggle } from '@/components/providers/Theme/ThemeSwitcher'
import { Button } from '@/components/ui/button'

import HeaderLogo from '@/components/frontend/Header/Logo'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import { ReduceMotionToggle } from '@/components/frontend/Header/ReduceMotionToggle'
import StickyHeader from '@/components/frontend/Header/StickyHeader'
import { removeLocalePrefix } from '@/components/frontend/Header/shared'
import NavigationLinks from '@/components/frontend/Header/NavigationLinks'
import { MobileMenuProvider } from '@/components/frontend/Header/MobileMenuContext'
import { useMobileMenu } from '@/components/frontend/Header/MobileMenuContext'
import FullScreenMenu from '@/components/frontend/Header/FullScreenMenu'
import HeaderCTA from '@/components/frontend/Header/HeaderCTA'
import AnimatedMenuIcon from '@/components/frontend/Header/AnimatedMenuIcon'
import type { NavCategory } from '@/components/frontend/Header/NavigationLinks'

interface HeaderClientProps {
  categories: NavCategory[]
}

export default function HeaderClient({ categories }: HeaderClientProps) {
  const pathname = usePathname()
  const normalizedPathname = removeLocalePrefix(pathname)

  return (
    <MobileMenuProvider>
      <HeaderBar normalizedPathname={normalizedPathname} categories={categories} />

      {/* Sticky Header – appears after scrolling */}
      <StickyHeader categories={categories} />

      {/* Full-screen menu overlay */}
      <FullScreenMenu normalizedPathname={normalizedPathname} />
    </MobileMenuProvider>
  )
}

function HeaderBar({
  normalizedPathname,
  categories,
}: {
  normalizedPathname: string
  categories: NavCategory[]
}) {
  const { isOpen, toggle } = useMobileMenu()

  return (
    <header className="rounded-t-2xl h-16 top-4 md:top-8 absolute z-20 inset-0 w-full border-b border-white/20 bg-base-900/20 backdrop-blur-md flex justify-between items-center px-8 gap-8">
      {/* Logo */}
      <HeaderLogo />

      {/* Desktop nav links */}
      <nav className="hidden md:flex gap-10 items-center">
        <NavigationLinks
          normalizedPathname={normalizedPathname}
          variant="header"
          categories={categories}
        />
        <div className="h-16 w-px bg-linear-to-t from-white/50 to-transparent" />

        {/* Settings – visible on large screens */}
        <div className="hidden xl:flex gap-6">
          <ModeToggle />
          <LanguageSwitcher />
          <ReduceMotionToggle />
        </div>
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* CTA – visible on large screens */}
        <div className="hidden xl:block">
          <HeaderCTA />
        </div>

        {/* Hamburger – visible below lg */}
        <Button
          variant="blend"
          size="icon"
          onClick={toggle}
          className="xl:hidden text-white/80 hover:text-white"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
        >
          <AnimatedMenuIcon isOpen={isOpen} />
        </Button>
      </div>
    </header>
  )
}
