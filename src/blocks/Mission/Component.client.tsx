'use client'

import React from 'react'
import { motion, type Variants, type Transition } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { MissionBlock } from '@/payload-types'
import { OrbitVisualization } from './OrbitVisualization'

// --- Animation variants ---

const leftVariants: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.7,
      ease: [0.25, 0.46, 0.45, 0.94],
      staggerChildren: 0.1,
      delayChildren: 0.1,
    } as Transition,
  },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } as Transition,
  },
}

const orbitFadeIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] } as Transition,
  },
}

// --- Main component ---

interface MissionClientProps extends MissionBlock {
  className?: string
}

export const MissionClient: React.FC<MissionClientProps> = ({
  badge,
  heading,
  description,
  secondaryDescription,
  className,
}) => {
  return (
    <section
      className={cn('relative w-full overflow-hidden py-20 sm:py-24 lg:py-32', className)}
    >
      {/* === Background effects === */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {/* Soft radial glow — left-biased */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/[0.03] rounded-full blur-3xl" />

        {/* Right side warm glow */}
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-gradient-to-bl from-accent/6 via-primary/3 to-transparent rounded-full blur-3xl" />

        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Decorative vertical divider */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gradient-to-b from-transparent via-border/30 to-transparent hidden lg:block" />
      </div>

      {/* === Split layout === */}
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col lg:flex-row items-center gap-12 lg:gap-16 xl:gap-20 px-4 sm:px-6 lg:px-8">
        {/* --- LEFT SIDE: Copy --- */}
        <motion.div
          variants={leftVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="flex flex-1 flex-col items-start gap-6 text-left max-w-xl lg:max-w-none lg:sticky lg:top-32"
        >
          {/* Badge */}
          <motion.div variants={fadeUp}>
            <Badge variant="golden" className="flex items-center gap-2">
              <Sparkles className="h-3 w-3" />
              {badge}
            </Badge>
          </motion.div>

          {/* Heading */}
          <motion.h2
            variants={fadeUp}
            className="font-bebas text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-wide leading-[0.9]"
          >
            {heading}
          </motion.h2>

          {/* Decorative line */}
          <motion.div
            variants={fadeUp}
            className="w-16 h-0.5 rounded-full bg-gradient-to-r from-primary via-accent/60 to-transparent"
          />

          {/* Description */}
          <motion.p
            variants={fadeUp}
            className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-lg"
          >
            {description}
          </motion.p>

          {/* Secondary description — quote style */}
          {secondaryDescription && (
            <motion.blockquote
              variants={fadeUp}
              className="relative border-l-2 border-primary/40 pl-4 text-foreground/90 text-base sm:text-lg font-medium italic leading-relaxed max-w-lg"
            >
              {secondaryDescription}
            </motion.blockquote>
          )}
        </motion.div>

        {/* --- RIGHT SIDE: Ecosystem Orbit --- */}
        <motion.div
          variants={orbitFadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="flex flex-1 w-full items-center justify-center"
        >
          <OrbitVisualization />
        </motion.div>
      </div>
    </section>
  )
}
