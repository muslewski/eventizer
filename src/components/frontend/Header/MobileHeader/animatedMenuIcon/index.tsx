'use client'

import { motion } from 'framer-motion'
import type { Transition } from 'framer-motion'

export default function AnimatedMenuIcon({ isOpen }: { isOpen: boolean }) {
  const springTransition: Transition = {
    type: 'spring',
    stiffness: 300,
    mass: 0.2,
    damping: 20,
  }

  return (
    <motion.div
      className="relative size-6 cursor-pointer"
      initial={false}
      animate={isOpen ? 'open' : 'closed'}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Top line */}
      <motion.span
        className="absolute left-0 h-0.5 bg-current rounded-full origin-center"
        initial={{ top: '20%', rotate: 0, translateY: 0, width: '100%' }}
        variants={{
          closed: {
            top: '20%',
            rotate: 0,
            translateY: 0,
            width: '100%',
          },
          open: {
            top: '50%',
            rotate: 45,
            translateY: '-50%',
            width: '100%',
          },
        }}
        transition={{
          ...springTransition,
          rotate: { delay: isOpen ? 0.1 : 0 },
        }}
      />

      {/* Middle line */}
      <motion.span
        className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-current rounded-full origin-left"
        initial={{ opacity: 1, scaleX: 1, x: 0 }}
        variants={{
          closed: {
            opacity: 1,
            scaleX: 1,
            x: 0,
          },
          open: {
            opacity: 0,
            scaleX: 0.5,
            x: -10,
          },
        }}
        transition={{
          duration: 0.2,
          ease: 'easeOut',
        }}
      />

      {/* Bottom line - starts shorter for visual interest */}
      <motion.span
        className="absolute right-0 h-0.5 bg-current rounded-full origin-center"
        initial={{ bottom: '20%', rotate: 0, translateY: 0, width: '66%' }}
        variants={{
          closed: {
            bottom: '20%',
            rotate: 0,
            translateY: 0,
            width: '66%',
          },
          open: {
            bottom: '50%',
            rotate: -45,
            translateY: '50%',
            width: '100%',
          },
        }}
        transition={{
          ...springTransition,
          rotate: { delay: isOpen ? 0.1 : 0 },
          width: { duration: 0.2 },
        }}
      />
    </motion.div>
  )
}
