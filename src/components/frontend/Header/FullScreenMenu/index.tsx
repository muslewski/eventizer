'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { Transition } from 'framer-motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/providers/Theme/ThemeSwitcher'
import { LanguageSwitcher } from '@/components/frontend/LanguageSwitcher'
import { ReduceMotionToggle } from '@/components/frontend/Header/ReduceMotionToggle'
import { useMobileMenu } from '@/components/frontend/Header/MobileMenuContext'
import { useRootAuth } from '@/providers/RootAuthProvider'
import { HeaderAvatar } from '@/components/frontend/Header/Avatar'
import { navLinks } from '@/components/frontend/Header/shared'
import AnimatedMenuIcon from '@/components/frontend/Header/AnimatedMenuIcon'
import HeaderLogo from '@/components/frontend/Header/Logo'

const overlayVariants = {
  closed: {
    opacity: 0,
    transition: { duration: 0.3, ease: 'easeInOut' } as Transition,
  },
  open: {
    opacity: 1,
    transition: { duration: 0.4, ease: 'easeOut' } as Transition,
  },
}

const contentVariants = {
  closed: {
    opacity: 0,
    y: 40,
    transition: { duration: 0.25 } as Transition,
  },
  open: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
      staggerChildren: 0.06,
      delayChildren: 0.15,
    } as Transition,
  },
}

const itemVariants = {
  closed: { opacity: 0, y: 20 },
  open: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    } as Transition,
  },
}

export default function FullScreenMenu({ normalizedPathname }: { normalizedPathname: string }) {
  const { isOpen, close } = useMobileMenu()
  const { user } = useRootAuth()

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col"
          variants={overlayVariants}
          initial="closed"
          animate="open"
          exit="closed"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/95 backdrop-blur-2xl" />

          {/* Top bar with logo and close */}
          <div className="relative z-10 flex items-center justify-between px-12 sm:px-15 md:px-16 h-fit pt-7 md:pt-10 shrink-0">
            <HeaderLogo />
            <Button
              variant="ghost"
              onClick={close}
              className="p-2 text-foreground/80 hover:text-foreground"
              aria-label="Close menu"
            >
              <AnimatedMenuIcon isOpen={true} />
            </Button>
          </div>

          {/* Content */}
          <motion.div
            className="relative z-10 flex-1 flex flex-col items-center justify-center gap-12 px-8 pb-16 overflow-y-auto"
            variants={contentVariants}
            initial="closed"
            animate="open"
            exit="closed"
          >
            {/* Nav links */}
            <nav className="flex flex-col items-center gap-2">
              {navLinks.map((link) => (
                <motion.div key={link.href} variants={itemVariants}>
                  <Link
                    href={link.href}
                    prefetch
                    onClick={close}
                    className={cn(
                      'block px-8 py-3 text-3xl sm:text-4xl font-bebas tracking-wide transition-colors duration-200 rounded-2xl',
                      normalizedPathname === link.href
                        ? 'text-foreground'
                        : 'text-foreground/40 hover:text-foreground/70',
                    )}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* Divider */}
            <motion.div variants={itemVariants} className="w-16 h-px bg-foreground/10" />

            {/* Settings */}
            <motion.div variants={itemVariants} className="flex items-center gap-4">
              <ModeToggle variant="ghost" />
              <LanguageSwitcher variant="ghost" />
              <ReduceMotionToggle variant="ghost" />
            </motion.div>

            {/* CTA / Avatar */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col items-center gap-3 w-full max-w-xs"
            >
              {user ? (
                <HeaderAvatar />
              ) : (
                <>
                  <Button
                    variant="golden"
                    asChild
                    className="w-full justify-center py-6 text-base font-semibold rounded-2xl"
                  >
                    <Link href="/auth/sign-in/service-provider" prefetch onClick={close}>
                      Panel usługodawcy
                    </Link>
                  </Button>
                  <Button
                    variant="default"
                    asChild
                    className="w-full justify-center py-6 text-base font-medium rounded-2xl"
                  >
                    <Link href="/auth/sign-in" prefetch onClick={close}>
                      Zaloguj się
                    </Link>
                  </Button>
                </>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
