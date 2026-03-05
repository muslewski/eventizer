'use client'

import React from 'react'
import { motion, type Variants, type Transition } from 'framer-motion'
import {
  Zap,
  Gift,
  Shield,
  TrendingUp,
  Users,
  Star,
  Clock,
  Rocket,
  Heart,
  Eye,
  ArrowRight,
  ImageIcon,
  MapPin,
  Tag,
  Check,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { BetaBannerBlock } from '@/payload-types'

const iconMap: Record<string, LucideIcon> = {
  zap: Zap,
  gift: Gift,
  shield: Shield,
  trendingUp: TrendingUp,
  users: Users,
  star: Star,
  clock: Clock,
  rocket: Rocket,
  heart: Heart,
  eye: Eye,
}

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

const rightVariants: Variants = {
  hidden: { opacity: 0, x: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94],
      delayChildren: 0.4,
      staggerChildren: 0.15,
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

const floatIn: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } as Transition,
  },
}

// --- Floating Benefit Badge ---

interface FloatingBadgeProps {
  icon: string
  title: string
  className?: string
  index: number
}

const FloatingBadge: React.FC<FloatingBadgeProps> = ({ icon, title, className, index }) => {
  const Icon = iconMap[icon] || Gift

  return (
    <motion.div
      variants={floatIn}
      animate={{ y: [0, -4, 0] }}
      transition={{
        y: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: index * 0.5 },
      }}
      className={cn(
        'absolute flex items-center gap-2 rounded-full border border-border/60 bg-card/90 px-3 py-1.5 shadow-lg shadow-black/5 backdrop-blur-md text-xs font-medium z-20',
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
      <span className="text-foreground whitespace-nowrap">{title}</span>
    </motion.div>
  )
}

// --- Browser Window Mockup ---

const BrowserMockup: React.FC<{ benefits: BetaBannerBlock['benefits'] }> = ({ benefits }) => {
  // Position floating badges around the browser
  const badgePositions = [
    '-top-4 -left-4 sm:-left-8',
    '-top-4 -right-4 sm:-right-8',
    '-bottom-4 -left-4 sm:-left-6',
    '-bottom-4 -right-4 sm:-right-6',
    'top-1/3 -right-4 sm:-right-10',
    'top-1/2 -left-4 sm:-left-10',
  ]

  return (
    <div className="relative w-full max-w-lg">
      {/* Floating benefit badges */}
      {benefits?.map((benefit, index) => (
        <FloatingBadge
          key={benefit.id ?? index}
          icon={benefit.icon}
          title={benefit.title}
          index={index}
          className={badgePositions[index % badgePositions.length]}
        />
      ))}

      {/* Browser chrome */}
      <div className="relative rounded-xl border border-border/60 bg-card/80 shadow-2xl shadow-black/10 backdrop-blur-sm overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-border/40 px-4 py-2.5 bg-muted/30">
          {/* Traffic lights */}
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
          </div>
          {/* Address bar */}
          <div className="flex-1 ml-3 flex items-center gap-2 rounded-md bg-background/60 border border-border/30 px-3 py-1 text-[11px] text-muted-foreground/60 font-mono">
            <div className="w-3 h-3 rounded-sm bg-primary/20" />
            eventizer.pl/ogloszenia
          </div>
        </div>

        {/* Page content — fake offer listing */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Page header hint */}
          <div className="flex items-center gap-2">
            <div className="h-2 w-20 rounded-full bg-muted-foreground/10" />
            <div className="h-2 w-12 rounded-full bg-muted-foreground/10" />
          </div>

          {/* Offer card mockup */}
          <div className="rounded-xl border border-border/50 bg-gradient-to-r from-muted/40 to-background/60 overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              {/* Image placeholder */}
              <div className="sm:w-36 h-28 sm:h-auto bg-gradient-to-br from-primary/10 via-accent/5 to-muted/30 flex items-center justify-center shrink-0">
                <ImageIcon className="h-8 w-8 text-muted-foreground/20" strokeWidth={1.5} />
              </div>

              {/* Content */}
              <div className="flex-1 p-4 space-y-3">
                {/* Category + location */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 rounded-md border border-border/40 bg-background/50 px-2 py-0.5 text-[10px] text-muted-foreground">
                    <Tag className="h-2.5 w-2.5" /> Fotografia
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md border border-border/40 bg-background/50 px-2 py-0.5 text-[10px] text-muted-foreground">
                    <MapPin className="h-2.5 w-2.5" /> Warszawa
                  </span>
                </div>

                {/* Title */}
                <div className="font-bebas text-lg sm:text-xl tracking-wide leading-tight text-foreground">
                  Twoja oferta tutaj
                </div>

                {/* Description skeleton */}
                <div className="space-y-1.5">
                  <div className="h-2 w-full rounded-full bg-muted-foreground/8" />
                  <div className="h-2 w-4/5 rounded-full bg-muted-foreground/8" />
                </div>

                {/* Price + CTA row */}
                <div className="flex items-center justify-between pt-1">
                  <div className="rounded-lg border border-border/40 bg-background/60 px-3 py-1">
                    <span className="font-bebas text-sm text-foreground tracking-wide">
                      0,00 zł
                    </span>
                  </div>
                  <div className="rounded-md bg-primary/10 text-primary px-3 py-1 text-[10px] font-semibold">
                    Sprawdź →
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Second offer card skeleton */}
          <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-lg bg-muted-foreground/5 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-2.5 w-3/5 rounded-full bg-muted-foreground/8" />
                <div className="h-2 w-full rounded-full bg-muted-foreground/5" />
                <div className="h-2 w-2/3 rounded-full bg-muted-foreground/5" />
              </div>
            </div>
          </div>

          {/* Third skeleton line */}
          <div className="rounded-xl border border-border/20 bg-muted/10 p-4">
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-lg bg-muted-foreground/3 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-2.5 w-2/5 rounded-full bg-muted-foreground/5" />
                <div className="h-2 w-4/5 rounded-full bg-muted-foreground/3" />
              </div>
            </div>
          </div>
        </div>

        {/* "Free" overlay badge on the mockup */}
        <motion.div
          animate={{ rotate: [-1, 1, -1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-14 right-4 z-10"
        >
          <div className="flex items-center gap-1.5 rounded-full bg-green-500/90 dark:bg-green-600/90 px-3 py-1 text-[11px] font-bold text-white shadow-lg shadow-green-500/20">
            <Check className="h-3 w-3" strokeWidth={3} />
            Za darmo!
          </div>
        </motion.div>
      </div>

      {/* Shadow / reflection effect */}
      <div className="absolute -bottom-3 left-4 right-4 h-6 bg-black/5 dark:bg-white/3 rounded-full blur-xl" />
    </div>
  )
}

// --- Main component ---

interface BetaBannerClientProps extends BetaBannerBlock {
  className?: string
}

export const BetaBannerClient: React.FC<BetaBannerClientProps> = ({
  badge: badgeText,
  heading,
  description,
  benefits,
  ctaLabel,
  ctaLink,
  footnote,
  className,
}) => {
  return (
    <section
      className={cn('relative w-full overflow-hidden py-20 sm:py-24 lg:py-32', className)}
    >
      {/* === Background effects === */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {/* Primary radial glow — offset toward left to underline the copy side */}
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-primary/[0.04] rounded-full blur-3xl" />

        {/* Accent glow — right side behind cards */}
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-to-bl from-accent/8 via-primary/4 to-transparent rounded-full blur-3xl" />

        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Decorative diagonal line */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gradient-to-b from-transparent via-border/40 to-transparent hidden lg:block" />
      </div>

      {/* === Split layout === */}
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col lg:flex-row items-center gap-12 lg:gap-16 xl:gap-20 px-4 sm:px-6 lg:px-8">
        {/* --- LEFT SIDE: Copy --- */}
        <motion.div
          variants={leftVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="flex flex-1 flex-col items-start gap-6 text-left max-w-xl lg:max-w-none"
        >
          {/* Badge */}
          <motion.div variants={fadeUp}>
            <Badge variant="golden" className="flex items-center gap-2">
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-block w-1.5 h-1.5 rounded-full bg-accent"
              />
              {badgeText}
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

          {/* CTA */}
          <motion.div variants={fadeUp} className="flex flex-col gap-3 pt-2">
            <Button asChild size="lg" variant="default">
              <Link href={ctaLink}>
                {ctaLabel}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>

            {footnote && (
              <p className="text-xs text-muted-foreground/50 tracking-wide pl-1">{footnote}</p>
            )}
          </motion.div>
        </motion.div>

        {/* --- RIGHT SIDE: Browser mockup --- */}
        {benefits && benefits.length > 0 && (
          <motion.div
            variants={rightVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="flex flex-1 items-center justify-center w-full"
          >
            <BrowserMockup benefits={benefits} />
          </motion.div>
        )}
      </div>
    </section>
  )
}
