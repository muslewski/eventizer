'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { removeLocalePrefix } from '@/components/frontend/Header/shared'

import Logo from '@/assets/eventizer-icon-1.png'

interface HeaderLogoProps {
  variant?: 'header' | 'sticky' | 'footer'
}

export default function HeaderLogo({ variant = 'header' }: HeaderLogoProps) {
  const pathname = usePathname()
  const normalizedPathname = removeLocalePrefix(pathname)
  const isSticky = variant === 'sticky'
  const isFooter = variant === 'footer'

  const handleLogoClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (normalizedPathname !== '/') return

    event.preventDefault()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Link
      href="/"
      prefetch
      onClick={handleLogoClick}
      className="group h-full flex items-center gap-3 transition-transform duration-300 hover:scale-105"
    >
      <div className="relative h-8 w-8">
        <Image
          src={Logo}
          alt="Eventizer Logo"
          className="mix-blend-normal! object-contain h-full w-auto drop-shadow-lg transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(250,189,35,0.5)]"
        />
      </div>
      <h3
        className={cn(
          'text-3xl font-bebas tracking-wide text-shadow-sm transition-all duration-300 group-hover:from-accent/10 group-hover:via-accent/60 group-hover:to-accent',
          isFooter
            ? 'text-accent/60 dark:text-white/10 dark:text-shadow-white/20'
            : isSticky
              ? 'text-brand-500/75 dark:text-white/10 text-shadow-base-400/20 dark:text-shadow-white/20'
              : 'text-white/10 text-shadow-white/20',
        )}
      >
        Eventizer
      </h3>
    </Link>
  )
}
