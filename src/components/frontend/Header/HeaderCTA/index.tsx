'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { useRootAuth } from '@/providers/RootAuthProvider'
import { HeaderAvatar } from '@/components/frontend/Header/Avatar'

const variants = {
  initial: { opacity: 0, scale: 0.9, filter: 'blur(4px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.9, filter: 'blur(4px)' },
}

const transition = { duration: 0.25, ease: 'easeInOut' as const }

export default function HeaderCTA() {
  const { user, status } = useRootAuth()

  return (
    <div className="relative flex items-center gap-4">
      <AnimatePresence mode="wait" initial={false}>
        {status === 'loading' ? (
          <motion.div
            key="loading"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
            className="h-8 w-8 rounded-full bg-white/10 animate-pulse"
          />
        ) : user ? (
          <motion.div
            key="avatar"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
          >
            <HeaderAvatar />
          </motion.div>
        ) : (
          <motion.div
            key="buttons"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
            className="flex items-center gap-2"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
