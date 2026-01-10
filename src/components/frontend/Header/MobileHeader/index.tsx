'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Transition } from 'framer-motion'
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

  const menuVariants = {
    closed: {
      x: '-110%',
      opacity: 0,
      transition: {
        type: 'spring',
        stiffness: 200,
        damping: 40,
      } as Transition,
    },
    open: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 200,
        damping: 23,
        staggerChildren: 0.05,
        delayChildren: 0.1,
      } as Transition,
    },
  }

  const itemVariants = {
    closed: {
      x: -20,
      opacity: 0,
    },
    open: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24,
      } as Transition,
    },
  }

  const backdropVariants = {
    closed: {
      opacity: 0,
      transition: { duration: 0.3 } as Transition,
    },
    open: {
      opacity: 1,
      transition: { duration: 0.3 } as Transition,
    },
  }

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
      <AnimatePresence>
        {isOpen && (
          <div className="xl:hidden absolute rounded-b-2xl inset-0 z-40">
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0"
              variants={backdropVariants}
              initial="closed"
              animate="open"
              exit="closed"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu Panel */}
            <motion.nav
              className={cn(
                'absolute top-20 sm:top-24 rounded-b-2xl bottom-0 left-4 right-4 sm:left-8 sm:right-8 sm:py-8 md:py-16 h-fit overflow-y-auto',
                'bg-white/50 dark:bg-[#0B0B0D]/35',
                'backdrop-blur-md',
                'shadow-2xl shadow-black/20 ',
              )}
              variants={menuVariants}
              initial="closed"
              animate="open"
              exit="closed"
            >
              {/* Decorative lines */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.05] dark:opacity-[0.02]"
                style={{
                  backgroundImage: `
                    repeating-linear-gradient(
                      -85deg,
                      transparent 0px,
                      transparent 28px,
                      currentColor 28px,
                      currentColor 29px,
                      transparent 29px,
                      transparent 95px,
                      currentColor 95px,
                      currentColor 97px,
                      transparent 97px,
                      transparent 180px
                    )
                  `,
                  maskImage: 'linear-gradient(to bottom, black 0%, transparent 60%, black 100%)',
                  WebkitMaskImage:
                    'linear-gradient(to bottom, black 0%, transparent 60%, black 100%)',
                }}
              />
              {/* Scattered artistic lines */}
              <div className="absolute inset-0 pointer-events-none">
                <div
                  className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03]"
                  style={{
                    backgroundImage: `
                      repeating-linear-gradient(
                        -80deg,
                        transparent 0px,
                        transparent 35px,
                        currentColor 35px,
                        currentColor 36px,
                        transparent 36px,
                        transparent 89px,
                        currentColor 89px,
                        currentColor 90px,
                        transparent 90px,
                        transparent 167px
                      )
                    `,
                  }}
                />
                <div
                  className="absolute inset-0 opacity-[0.02] dark:opacity-[0.02]"
                  style={{
                    backgroundImage: `
                      repeating-linear-gradient(
                        80deg,
                        transparent 0px,
                        transparent 73px,
                        currentColor 73px,
                        currentColor 75px,
                        transparent 75px,
                        transparent 210px
                      )
                    `,
                  }}
                />
              </div>

              {/* Header Section */}
              <motion.div className="p-6 pb-4 border-b border-primary/10" variants={itemVariants}>
                <p className="text-xs font-medium uppercase tracking-widest text-primary/40">
                  Menu
                </p>
              </motion.div>

              {/* Nav Links */}
              <div className="p-4 max-w-md">
                <div className="flex flex-col gap-1 justify-center">
                  {navLinks.map((link, index) => (
                    <motion.div key={link.href} variants={itemVariants} custom={index}>
                      <Link
                        href={link.href}
                        prefetch
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          'group relative block px-5 py-4 rounded-2xl transition-all duration-300',
                          'dark:text-white/60 dark:hover:text-white text-black/60 hover:text-black',
                          normalizedPathname === link.href
                            ? 'text-black dark:text-white dark:bg-white/10 bg-black/10'
                            : 'dark:hover:bg-white/5 hover:bg-black/5',
                        )}
                      >
                        <span className="relative z-10 text-base font-medium">{link.label}</span>

                        {/* Active indicator */}
                        {normalizedPathname === link.href && (
                          <motion.span
                            layoutId="activeIndicator"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-stone-400 to-stone-600 rounded-full"
                          />
                        )}
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Settings Section */}
              <motion.div
                className="mx-4 px-5 py-4 rounded-2xl max-w-sm flex flex-col items-center bg-background/15 border border-primary/5"
                variants={itemVariants}
              >
                <p className="text-xs font-medium uppercase tracking-widest text-primary/40 mb-4">
                  Ustawienia
                </p>
                <div className="flex items-center gap-3 *:text-primary">
                  <ModeToggle />
                  <LanguageSwitcher />
                </div>
              </motion.div>

              {/* CTA Section */}
              <motion.div className="p-6 pt-4 mt-2 max-w-sm" variants={itemVariants}>
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
                    variant="default"
                    asChild
                    className="w-full justify-center py-6 text-base font-medium rounded-2xl border border-primary/20"
                  >
                    <Link href="/auth/sign-in" prefetch onClick={() => setIsOpen(false)}>
                      Zaloguj się
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </motion.nav>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
