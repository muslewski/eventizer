'use client'

import { LanguageSwitcher } from '@/components/frontend/LanguageSwitcher'
import { ModeToggle } from '@/components/providers/Theme/ThemeSwitcher'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

import HeaderLogo from '@/components/frontend/Header/Logo'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import { ReduceMotionToggle } from '@/components/frontend/Header/ReduceMotionToggle'
import StickyHeader from '@/components/frontend/Header/StickyHeader'
import { navLinks, removeLocalePrefix } from '@/components/frontend/Header/shared'
import { MobileMenuProvider } from '@/components/frontend/Header/MobileMenuContext'
import { useMobileMenu } from '@/components/frontend/Header/MobileMenuContext'
import FullScreenMenu from '@/components/frontend/Header/FullScreenMenu'
import HeaderCTA from '@/components/frontend/Header/HeaderCTA'
import AnimatedMenuIcon from '@/components/frontend/Header/AnimatedMenuIcon'

export default function HeaderClient() {
  const pathname = usePathname()
  const normalizedPathname = removeLocalePrefix(pathname)

  return (
    <MobileMenuProvider>
      <HeaderBar normalizedPathname={normalizedPathname} />

      {/* Sticky Header – appears after scrolling */}
      <StickyHeader />

      {/* Full-screen menu overlay */}
      <FullScreenMenu normalizedPathname={normalizedPathname} />
    </MobileMenuProvider>
  )
}

function HeaderBar({ normalizedPathname }: { normalizedPathname: string }) {
  const { isOpen, toggle } = useMobileMenu()

  return (
    <header className="rounded-t-2xl h-16 top-4 md:top-8 absolute z-20 inset-0 w-full border-b border-white/20 bg-base-900/20 backdrop-blur-md flex justify-between items-center px-8 gap-8">
      {/* Logo */}
      <HeaderLogo />

      {/* Desktop nav links */}
      <nav className="hidden md:flex gap-10 items-center">
        {navLinks.map((link, index) => (
          <div key={link.href} className="flex gap-10 items-center">
            {index > 0 && (
              <div
                className={cn(
                  'h-16 w-px',
                  index % 2 === 1
                    ? 'bg-linear-to-t from-white/50 to-transparent'
                    : 'bg-linear-to-b from-white/50 to-transparent',
                )}
              />
            )}
            <Button
              variant="link"
              asChild
              className={cn(
                'text-white/70 after:from-white after:to-white/50',
                normalizedPathname === link.href && 'after:scale-x-100',
              )}
            >
              <Link href={link.href} prefetch>
                {link.label}
              </Link>
            </Button>
          </div>
        ))}
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
