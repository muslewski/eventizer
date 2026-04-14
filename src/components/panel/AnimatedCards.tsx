'use client'

import { motion } from 'motion/react'
import type { ReactNode } from 'react'

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 16,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
      mass: 0.8,
    },
  },
}

/**
 * Wraps a list of children in staggered spring-in animations.
 * Use as a direct parent of Card components.
 */
export function AnimatedCardGrid({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * Wraps a single card in the spring-in animation.
 * Must be a child of AnimatedCardGrid.
 */
export function AnimatedCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div variants={cardVariants} className={className}>
      {children}
    </motion.div>
  )
}
