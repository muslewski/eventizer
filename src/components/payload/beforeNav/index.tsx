'use client'

import Image from 'next/image'
import LogoDark from '@/assets/eventizer-logo-1-dark.png'
import LogoLight from '@/assets/eventizer-logo-1-light.png'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useRef, useEffect } from 'react'

import './index.scss'
import { Button } from '@/components/ui/button'
import { StarIcon } from 'lucide-react'

const baseClass = 'before-nav'

const CustomBeforeNav: React.FC = () => {
  const hasAnimatedRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hasAnimatedRef.current && containerRef.current) {
      hasAnimatedRef.current = true
    } else if (containerRef.current) {
      containerRef.current.classList.add(`${baseClass}--no-animation`)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn(
        baseClass,
        'relative w-full -mt-12 px-4 pb-5 flex flex-col gap-4',
        // Animated bottom border with shimmer
        // 'after:absolute after:bottom-0 after:left-4 after:right-4 after:h-[1px]',
        // 'after:bg-gradient-to-r after:from-transparent after:via-accent/40 after:to-transparent',
      )}
    >
      <Link
        href="/app"
        className={cn(
          `${baseClass}__link`,
          'relative block w-fit group',
          'transition-transform duration-300 ease-out',
          'hover:translate-x-0.5',
        )}
      >
        {/* Logo wrapper with glow animation */}
        <div className={cn(`${baseClass}__logo-wrapper`, 'relative rounded-lg')}>
          <Image
            src={LogoLight}
            alt="Eventizer Logo"
            width={120}
            height={28}
            className="dark:hidden transition-opacity duration-300 group-hover:opacity-90"
            priority
          />
          <Image
            src={LogoDark}
            alt="Eventizer Logo"
            width={120}
            height={28}
            className="hidden dark:block transition-opacity duration-300 group-hover:opacity-90"
            priority
          />
        </div>

        {/* Animated underline accent */}
        <div
          className={cn(
            'absolute -bottom-1 left-0 h-[2px] w-0',
            'bg-gradient-to-r from-accent/60 to-accent/40',
            'transition-all duration-300 ease-out',
            'group-hover:w-full',
          )}
        />
      </Link>
      <Button variant="golden" asChild className="no-underline">
        <Link href="/ogloszenia#oferty" prefetch>
          <StarIcon className="size-4" />
          Przejdź do ogłoszeń
        </Link>
      </Button>
    </div>
  )
}

export default CustomBeforeNav
