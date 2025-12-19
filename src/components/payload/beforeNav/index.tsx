'use client'

import Image from 'next/image'
import LogoDark from '@/assets/eventizer-logo-1-dark.png'
import LogoLight from '@/assets/eventizer-logo-1-light.png'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useRef, useEffect } from 'react'

import './index.scss'

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
        'relative w-full px-4 py-5 mb-6',
        // Animated bottom border with shimmer
        'after:absolute after:bottom-0 after:left-4 after:right-4 after:h-[1px]',
        'after:bg-gradient-to-r after:from-transparent after:via-amber-500/40 after:to-transparent',
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
        {/* Subtle glow effect on hover */}
        <div
          className={cn(
            'absolute -inset-3 rounded-lg opacity-0 transition-opacity duration-300',
            'bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-amber-500/5',
            'group-hover:opacity-100 blur-sm',
          )}
        />

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
            'bg-gradient-to-r from-amber-500/60 to-amber-400/40',
            'transition-all duration-300 ease-out',
            'group-hover:w-full',
          )}
        />
      </Link>
    </div>
  )
}

export default CustomBeforeNav
