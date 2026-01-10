'use client'

import { LanguageSwitcher } from '@/components/frontend/LanguageSwitcher'
import { ModeToggle } from '@/components/providers/Theme/ThemeSwitcher'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

import HeaderLogo from '@/components/frontend/Header/Logo'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import type { Config } from '@/payload-types'

type Locale = Config['locale']

function removeLocalePrefix(pathname: string): string {
  const segments = pathname.split('/')
  // Check if second segment matches locale pattern (2-letter code)
  // This works because Config['locale'] is a union like 'pl' | 'en'
  const possibleLocale = segments[1] as Locale
  // If it's a valid locale (short 2-3 letter segment that's not a route)
  if (segments.length > 1 && segments[1].length <= 3 && /^[a-z]{2,3}$/.test(segments[1])) {
    return '/' + segments.slice(2).join('/') || '/'
  }
  return pathname
}

export default function Header() {
  const pathname = usePathname()
  const normalizedPathname = removeLocalePrefix(pathname)

  const navLinks = [
    { href: '/ogloszenia', label: 'Ogłoszenia' },
    { href: '/o-nas', label: 'O nas' },
    { href: '/kontakt', label: 'Kontakt' },
  ]

  return (
    <header className="rounded-t-2xl h-16 relative z-20 top-8 w-full border-b border-white/20 bg-black/5 backdrop-blur-md flex justify-between items-center px-8 gap-8">
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
        <div className="flex gap-6">
          <ModeToggle />
          <LanguageSwitcher />
        </div>
      </nav>

      {/* Call to action buttons */}
      <div className="flex gap-4">
        <Button variant="golden" asChild>
          <Link href="/auth/sign-in/service-provider" prefetch>
            Oferuj usługi
          </Link>
        </Button>
        <Button variant="blend" asChild>
          <Link href="/auth/sign-in" prefetch>
            Zaloguj się
          </Link>
        </Button>
      </div>
    </header>
  )
}
