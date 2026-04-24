'use client'

import { motion, useInView } from 'motion/react'
import { useRef, type ReactNode } from 'react'

/**
 * Wraps a list of children — just provides the className container.
 */
export function AnimatedCardGrid({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={className}>{children}</div>
}

/**
 * Wraps a single card in a spring-in animation triggered when in view.
 */
export function AnimatedCard({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '0px 0px -60px 0px' })

  return (
    <motion.div
      ref={ref}
      className={`${className ?? ''} rounded-xl [&>[data-slot=card]]:transition-all [&>[data-slot=card]]:hover:border-accent/40 [&>[data-slot=card]]:hover:shadow-[inset_0_0_0_1px_rgba(210,140,8,0.08)]`}
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.97 }}
      whileHover={{ y: -3, scale: 1.01, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
      transition={{
        type: 'spring' as const,
        stiffness: 300,
        damping: 24,
        mass: 0.8,
        delay,
      }}
    >
      {children}
    </motion.div>
  )
}
