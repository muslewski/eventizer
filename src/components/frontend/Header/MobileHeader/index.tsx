'use client'

import { useState } from 'react'
import HeaderLogo from '@/components/frontend/Header/Logo'
import { Button } from '@/components/ui/button'
import AnimatedMenuIcon from './animatedMenuIcon'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { ModeToggle } from '@/components/providers/Theme/ThemeSwitcher'
import { LanguageSwitcher } from '@/components/frontend/LanguageSwitcher'

export default function MobileHeader({
  navLinks,
  normalizedPathname,
}: {
  navLinks: { href: string; label: string }[]
  normalizedPathname: string
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <header className="rounded-t-2xl h-16 relative z-50 top-4 sm:top-8 transition-[top] duration-900 ease-in-out w-full border-b border-white/20 bg-black/5 backdrop-blur-md flex xl:hidden justify-between items-center px-8 gap-8">
        <HeaderLogo />

        <Button
          variant="blend"
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-white/80 hover:text-white transition-colors"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
        >
          <AnimatedMenuIcon isOpen={isOpen} />
        </Button>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={cn(
          'xl:hidden fixed inset-0 z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            'absolute inset-0',
            // 'bg-linear-to-b from-black/70 via-black/60 to-black/80',
          )}
          onClick={() => setIsOpen(false)}
        />

        {/* Menu Panel */}
        <nav
          className={cn(
            'absolute top-16 sm:top-24 bottom-0 left-0 right-0 sm:left-8 sm:right-8 max-h-[calc(100vh-128px)] overflow-y-auto',
            ' border border-white/10 bg-white dark:bg-[#0B0B0D]',
            'shadow-2xl shadow-black/20',
            'transition-opacity duration-500 ease-out',
            isOpen ? 'opacity-100 ' : 'opacity-0 pointer-events-none',
          )}
        >
          {/* Header Section */}
          <div className="p-6 pb-4 border-b border-primary/10">
            <p className="text-xs font-medium uppercase tracking-widest text-primary/40">Menu</p>
          </div>

          {/* Nav Links */}
          <div className="p-4">
            <div className="flex flex-col gap-1">
              {navLinks.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'group relative px-5 py-4 rounded-2xl transition-all duration-300',
                    'dark:text-white/60 dark:hover:text-white text-black/60 hover:text-black',
                    normalizedPathname === link.href
                      ? 'text-black dark:text-white dark:bg-white/10 bg-black/10'
                      : 'dark:hover:bg-white/5 hover:bg-black/5',
                  )}
                  style={{
                    transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
                  }}
                >
                  <span className="relative z-10 text-base font-medium">{link.label}</span>

                  {/* Active indicator */}
                  {normalizedPathname === link.href && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-stone-400 to-stone-600 rounded-full" />
                  )}

                  {/* Hover glow effect */}
                  <span
                    className={cn(
                      'absolute inset-0 rounded-2xl bg-gradient-to-r from-white/5 to-transparent',
                      'opacity-0 group-hover:opacity-100 transition-opacity duration-300',
                    )}
                  />
                </Link>
              ))}
            </div>
          </div>

          {/* Settings Section */}
          <div className="mx-4 px-5 py-4 rounded-2xl bg-primary/5 border border-primary/5">
            <p className="text-xs font-medium uppercase tracking-widest text-primary/40 mb-4">
              Ustawienia
            </p>
            <div className="flex items-center gap-3 *:text-primary">
              <ModeToggle />
              <LanguageSwitcher />
            </div>
          </div>

          {/* CTA Section */}
          <div className="p-6 pt-4 mt-2">
            <div className="flex flex-col gap-3">
              <Button
                variant="golden"
                asChild
                className="w-full justify-center py-6 text-base font-semibold rounded-2xl"
              >
                <Link
                  href="/auth/sign-in/service-provider"
                  prefetch
                  onClick={() => setIsOpen(false)}
                >
                  Oferuj usługi
                </Link>
              </Button>
              <Button
                variant="ghost"
                asChild
                className="w-full justify-center py-6 text-base text-primary font-medium rounded-2xl border border-primary/20"
              >
                <Link href="/auth/sign-in" prefetch onClick={() => setIsOpen(false)}>
                  Zaloguj się
                </Link>
              </Button>
            </div>
          </div>
        </nav>
      </div>
    </>
  )
}
