'use client'

import { LanguageSwitcher } from '@/components/frontend/LanguageSwitcher'
import { ModeToggle } from '@/components/providers/Theme/ThemeSwitcher'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

import HeaderLogo from '@/components/frontend/Header/Logo'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import MobileHeader from '@/components/frontend/Header/MobileHeader'
import { ReduceMotionToggle } from '@/components/frontend/Header/ReduceMotionToggle'
import { useRootAuth } from '@/providers/RootAuthProvider'
import { HeaderAvatar } from '@/components/frontend/Header/Avatar'
import StickyHeader from '@/components/frontend/Header/StickyHeader'
import { navLinks, removeLocalePrefix } from '@/components/frontend/Header/shared'
import { MobileMenuProvider } from '@/components/frontend/Header/MobileMenuContext'
import FullScreenMenu from '@/components/frontend/Header/FullScreenMenu'

export default function HeaderClient() {
  const pathname = usePathname()
  const normalizedPathname = removeLocalePrefix(pathname)

  const { user } = useRootAuth()

  return (
    <MobileMenuProvider>
      {/* Desktop Header */}
      <header className="rounded-t-2xl h-16 top-8 absolute z-20  inset-0 w-full border-b border-white/20 bg-base-900/20 backdrop-blur-md hidden xl:flex justify-between items-center px-8 gap-8">
        {/* Eventizer Logo */}
        <HeaderLogo />

        {/*  Menu  */}
        <nav className="flex gap-10 items-center ">
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

          {/* Settings */}
          <div className="flex gap-6">
            <ModeToggle />
            <LanguageSwitcher />
            <ReduceMotionToggle />
          </div>
        </nav>

        {/* Call to action buttons */}
        <div className="flex gap-4">
          {user ? (
            <HeaderAvatar />
          ) : (
            <>
              <Button variant="golden" asChild>
                <Link href="/auth/sign-in/service-provider" prefetch>
                  Panel usługodawcy
                </Link>
              </Button>

              <Button variant="blend" asChild>
                <Link href="/auth/sign-in" prefetch>
                  Zaloguj się
                </Link>
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Mobile Header */}
      <MobileHeader />

      {/* Sticky Header – appears after scrolling 75vh */}
      <StickyHeader />

      {/* Full-screen menu overlay (shared by mobile header & sticky header) */}
      <FullScreenMenu normalizedPathname={normalizedPathname} />
    </MobileMenuProvider>
  )
}
