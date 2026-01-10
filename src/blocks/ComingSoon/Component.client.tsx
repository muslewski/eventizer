'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Construction, Clock, Rocket, Sparkles, Hammer, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const iconMap: Record<string, LucideIcon> = {
  construction: Construction,
  clock: Clock,
  rocket: Rocket,
  sparkles: Sparkles,
  hammer: Hammer,
}

interface ComingSoonClientProps {
  heading: string
  description: string
  icon?: string | null
  className?: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
    },
  },
}

export const ComingSoonClient: React.FC<ComingSoonClientProps> = ({
  heading,
  description,
  icon = 'construction',
  className,
}) => {
  const IconComponent = iconMap[icon || 'construction'] || Construction

  return (
    <section
      className={cn(
        'relative flex flex-col items-center justify-center min-h-[60vh] py-32 px-6 overflow-hidden',
        className,
      )}
    >
      {/* Ambient background effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Primary gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-transparent" />

        {/* Radial glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl"
        />

        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px),
                             linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center max-w-2xl"
      >
        {/* Icon container with layered effects */}
        <motion.div variants={itemVariants} className="relative mb-10">
          {/* Outer ring */}
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 60,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute -inset-6 rounded-full border border-dashed border-primary/20"
          />

          {/* Inner glow ring */}
          <motion.div
            animate={{
              opacity: [0.4, 0.8, 0.4],
              scale: [0.95, 1.05, 0.95],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute -inset-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-md"
          />

          {/* Icon wrapper with float animation */}
          <motion.div
            animate={{
              y: [0, -6, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative p-5 bg-gradient-to-br from-muted/80 to-muted/40 rounded-2xl border border-border/50 backdrop-blur-sm shadow-lg shadow-primary/5"
          >
            <IconComponent className="w-12 h-12 text-primary" strokeWidth={1.5} />
          </motion.div>
        </motion.div>

        {/* Status badge */}
        <motion.div variants={itemVariants} className="mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary/80 bg-primary/10 rounded-full border border-primary/20">
            <motion.span
              animate={{
                opacity: [1, 0.4, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="w-1.5 h-1.5 rounded-full bg-primary"
            />
            W trakcie realizacji
          </span>
        </motion.div>

        {/* Heading with Bebas font */}
        <motion.h2
          variants={itemVariants}
          className="font-bebas text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-center tracking-wide leading-[0.9] mb-6"
        >
          {heading}
        </motion.h2>

        {/* Decorative line */}
        <motion.div
          variants={itemVariants}
          className="w-16 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent mb-6"
        />

        {/* Description paragraph */}
        <motion.p
          variants={itemVariants}
          className="text-muted-foreground text-center text-base sm:text-lg md:text-xl max-w-lg leading-relaxed"
        >
          {description}
        </motion.p>

        {/* Animated progress indicator */}
        <motion.div variants={itemVariants} className="flex items-center gap-3 mt-10">
          <div className="flex gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.span
                key={i}
                animate={{
                  scaleY: [1, 1.8, 1],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: 'easeInOut',
                }}
                className="w-1 h-4 rounded-full bg-primary/60 origin-bottom"
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground/60 font-medium">Pracujemy nad tym...</span>
        </motion.div>
      </motion.div>
    </section>
  )
}
