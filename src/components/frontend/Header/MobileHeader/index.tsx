'use client'

import HeaderLogo from '@/components/frontend/Header/Logo'
import { Button } from '@/components/ui/button'
import AnimatedMenuIcon from './animatedMenuIcon'
import { useMobileMenu } from '@/components/frontend/Header/MobileMenuContext'

export default function MobileHeader() {
  const { isOpen, toggle } = useMobileMenu()

  return (
    <header className="rounded-t-2xl h-16 absolute z-50 top-4 sm:top-8 transition-[top] duration-900 ease-in-out w-full border-b border-white/20 bg-black/5 backdrop-blur-md flex xl:hidden justify-between items-center px-8 gap-8">
      <HeaderLogo />

      <Button
        variant="blend"
        onClick={toggle}
        className="p-2 text-white/80 hover:text-white transition-colors"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        <AnimatedMenuIcon isOpen={isOpen} />
      </Button>
    </header>
  )
}
