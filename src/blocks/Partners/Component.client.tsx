'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AnimatePresence, motion, useReducedMotion, type Transition, type Variants } from 'motion/react'
import { ArrowUpRight, Handshake } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { BlockHeader } from '@/components/frontend/Content/BlockHeader'
import type { ResolvedPartner } from '@/blocks/Partners/Component'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import type { Media } from '@/payload-types'

// --- Accent color mapping ---

type AccentKey = 'primary' | 'accent' | 'blue' | 'emerald' | 'violet' | 'rose'

const accentMap: Record<
  AccentKey,
  { bg: string; bgSoft: string; text: string; border: string; ringStroke: string }
> = {
  primary: {
    bg: 'bg-primary/20',
    bgSoft: 'bg-primary/5',
    text: 'text-primary',
    border: 'border-primary/30',
    ringStroke: 'var(--color-primary)',
  },
  accent: {
    bg: 'bg-accent/20',
    bgSoft: 'bg-accent/5',
    text: 'text-accent-foreground',
    border: 'border-accent/30',
    ringStroke: 'var(--color-accent)',
  },
  blue: {
    bg: 'bg-blue-500/20',
    bgSoft: 'bg-blue-500/5',
    text: 'text-blue-500',
    border: 'border-blue-500/30',
    ringStroke: 'rgb(59, 130, 246)',
  },
  emerald: {
    bg: 'bg-emerald-500/20',
    bgSoft: 'bg-emerald-500/5',
    text: 'text-emerald-500',
    border: 'border-emerald-500/30',
    ringStroke: 'rgb(16, 185, 129)',
  },
  violet: {
    bg: 'bg-violet-500/20',
    bgSoft: 'bg-violet-500/5',
    text: 'text-violet-500',
    border: 'border-violet-500/30',
    ringStroke: 'rgb(139, 92, 246)',
  },
  rose: {
    bg: 'bg-rose-500/20',
    bgSoft: 'bg-rose-500/5',
    text: 'text-rose-500',
    border: 'border-rose-500/30',
    ringStroke: 'rgb(244, 63, 94)',
  },
}

const resolveAccent = (key?: string | null) =>
  accentMap[(key as AccentKey) ?? 'primary'] ?? accentMap.primary

// --- Motion variants ---

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } as Transition,
  },
}

const stripItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] } as Transition,
  }),
}

// --- Helpers ---

const getInitial = (name: string) => name.trim().charAt(0).toUpperCase() || '·'

const partnerLogoUrl = (partner: ResolvedPartner): string | null => {
  if (!partner.logo) return null
  if (isExpandedDoc<Media>(partner.logo)) return partner.logo.url ?? null
  return null
}

// --- Props ---

interface PartnersClientProps {
  badge: string
  heading: string
  description?: string | null
  rotationSeconds?: number | null
  partners: ResolvedPartner[]
  className?: string
}

// --- Main component ---

export const PartnersClient: React.FC<PartnersClientProps> = ({
  badge,
  heading,
  description,
  rotationSeconds,
  partners,
  className,
}) => {
  const reduceMotion = useReducedMotion()
  const [activeIndex, setActiveIndex] = useState(0)

  // Auto-rotate spotlight (disabled when reduce-motion is on or rotation === 0)
  const rotationMs = (rotationSeconds ?? 8) * 1000
  useEffect(() => {
    if (reduceMotion || rotationMs <= 0 || partners.length <= 1) return
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % partners.length)
    }, rotationMs)
    return () => clearInterval(timer)
  }, [reduceMotion, rotationMs, partners.length])

  if (partners.length === 0) return null

  const safeIndex = Math.min(activeIndex, partners.length - 1)
  const active = partners[safeIndex]!
  const activeAccent = resolveAccent(active.accentColor)

  return (
    <section
      className={cn(
        'relative w-full overflow-hidden py-20 sm:py-24 lg:py-32',
        className,
      )}
    >
      {/* === Background effects === */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {/* Active-partner soft glow */}
        <motion.div
          key={`glow-${safeIndex}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className={cn(
            'absolute top-1/3 left-1/2 -translate-x-1/2 w-[640px] h-[420px] rounded-full blur-3xl',
            activeAccent.bgSoft,
          )}
        />
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-16 px-4 sm:px-6 lg:px-8">
        {/* === Header === */}
        <BlockHeader
          heading={heading}
          description={description ?? undefined}
          badge={{ label: badge, variant: 'golden' }}
          icon={Handshake}
          overflowHidden
        />

        {/* === Spotlight row === */}
        <div className="grid w-full grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16 items-center">
          {/* --- Avatar picker (left) --- */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6 lg:gap-x-6 pb-2"
          >
            {partners.map((partner, index) => {
              const accent = resolveAccent(partner.accentColor)
              const logoUrl = partnerLogoUrl(partner)
              const isActive = safeIndex === index
              return (
                <motion.button
                  key={`avatar-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  variants={stripItem}
                  custom={index}
                  animate={{
                    scale: isActive ? 1.1 : 0.9,
                    opacity: isActive ? 1 : 0.55,
                  }}
                  whileHover={{ opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 24, mass: 0.8 }}
                  aria-label={`Wyróżnij partnera: ${partner.name}`}
                  aria-pressed={isActive}
                  className="relative shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                >
                  <div
                    className={cn(
                      'relative flex h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20 items-center justify-center overflow-hidden rounded-full border transition-colors duration-500',
                      // Always tint with the partner's accent color so the
                      // logo-less placeholder still feels branded; just
                      // brighter when active.
                      isActive ? accent.bg : accent.bgSoft,
                      isActive ? accent.border : 'border-border/20',
                    )}
                  >
                    {logoUrl ? (
                      <Image
                        src={logoUrl}
                        alt={`${partner.name} logo`}
                        width={64}
                        height={64}
                        className={cn(
                          'h-full w-full object-contain p-2 transition-all duration-500',
                          isActive ? '' : 'grayscale',
                        )}
                      />
                    ) : (
                      <>
                        {/* Decorative inner sweep — gives the placeholder
                            some depth so it doesn't look like a flat letter. */}
                        <span
                          className={cn(
                            'absolute inset-0 bg-gradient-to-br from-transparent via-transparent transition-opacity duration-500',
                            isActive ? accent.bg : accent.bgSoft,
                            isActive ? 'opacity-100' : 'opacity-60',
                          )}
                          aria-hidden
                        />
                        <span
                          className={cn(
                            'relative font-bebas tracking-wide text-2xl sm:text-3xl lg:text-4xl transition-colors',
                            isActive ? accent.text : cn(accent.text, 'opacity-60'),
                          )}
                        >
                          {getInitial(partner.name)}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Circular progress ring on active */}
                  {isActive && !reduceMotion && rotationMs > 0 && partners.length > 1 && (
                    <svg
                      className="absolute -inset-2 h-[calc(100%+16px)] w-[calc(100%+16px)] -rotate-90 pointer-events-none"
                      viewBox="0 0 100 100"
                      aria-hidden
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="48"
                        fill="none"
                        stroke={accent.ringStroke}
                        strokeWidth="1.5"
                        opacity="0.2"
                      />
                      <motion.circle
                        key={`progress-${safeIndex}`}
                        cx="50"
                        cy="50"
                        r="48"
                        fill="none"
                        stroke={accent.ringStroke}
                        strokeWidth="1.5"
                        strokeDasharray={`${2 * Math.PI * 48}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
                        animate={{ strokeDashoffset: 0 }}
                        transition={{ duration: rotationMs / 1000, ease: 'linear' }}
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </motion.button>
              )
            })}
          </motion.div>

          {/* --- Spotlight content (right) --- */}
          <div className="flex flex-col justify-center text-left">
            <AnimatePresence mode="wait">
              <motion.div
                key={`spotlight-${safeIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex flex-col gap-5"
              >
                {/*
                  Reserve a fixed slot for the partner name + tagline so the
                  layout below (quote, button) doesn't jump when rotating
                  between short, single-line names and long, two-line ones.
                  Content is pinned to the bottom of the reserved space via
                  justify-end, so the visual relationship between name and
                  tagline stays tight regardless of wrap.
                */}
                <div className="flex flex-col justify-end gap-1 min-h-[6rem] sm:min-h-[7.5rem] lg:min-h-[9rem]">
                  <h3
                    className={cn(
                      'font-bebas tracking-wide leading-[0.95] text-4xl sm:text-5xl lg:text-6xl',
                      activeAccent.text,
                    )}
                  >
                    {active.name}
                  </h3>
                  {active.tagline && (
                    <span className="text-muted-foreground text-sm sm:text-base uppercase tracking-[0.18em]">
                      {active.tagline}
                    </span>
                  )}
                </div>

                {/*
                  Always render a quote area — fallback to a friendly Polish
                  placeholder when none is set. Rendering it unconditionally
                  also keeps the spotlight layout stable when rotating between
                  partners with and without a quote filled in.
                */}
                {active.quote ? (
                  <blockquote
                    className={cn(
                      'border-l-2 pl-4 text-foreground/85 text-base sm:text-lg leading-relaxed max-w-lg',
                      activeAccent.border,
                    )}
                  >
                    {active.quote}
                  </blockquote>
                ) : (
                  <p
                    className={cn(
                      'border-l-2 pl-4 text-muted-foreground/70 text-base sm:text-lg leading-relaxed max-w-lg italic',
                      activeAccent.border,
                    )}
                  >
                    Opis tego partnera pojawi się wkrótce — w międzyczasie zachęcamy do
                    bezpośredniego kontaktu lub zajrzenia na ich stronę.
                  </p>
                )}

                {active.href && (
                  <div className="pt-1">
                    <Button asChild variant="outline" size="lg" className="group">
                      <Link
                        href={active.href}
                        {...(active.isExternal
                          ? { target: '_blank', rel: 'noopener noreferrer' }
                          : {})}
                      >
                        {active.linkType === 'offer' ? 'Zobacz ofertę' : 'Odwiedź stronę'}
                        <ArrowUpRight className="ml-1 size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </Link>
                    </Button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* === Bottom strip — all partners === */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fadeUp}
          className="relative w-full"
        >
          {/* Divider */}
          <div className="mb-8 h-px w-full bg-linear-to-r from-transparent via-border/40 to-transparent" />

          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:gap-x-12">
            {partners.map((partner, index) => {
              const accent = resolveAccent(partner.accentColor)
              const isActive = safeIndex === index
              const inner = (
                <span
                  className={cn(
                    'font-bebas tracking-wide text-xl sm:text-2xl lg:text-3xl whitespace-nowrap transition-all duration-300',
                    isActive
                      ? cn(accent.text, 'opacity-100')
                      : 'text-muted-foreground/70 hover:text-foreground',
                  )}
                >
                  {partner.name}
                </span>
              )
              return (
                <motion.li
                  key={`mark-${index}`}
                  variants={stripItem}
                  custom={index}
                >
                  <button
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-1"
                    aria-label={`Pokaż partnera: ${partner.name}`}
                    aria-pressed={isActive}
                  >
                    {inner}
                  </button>
                </motion.li>
              )
            })}
          </ul>
        </motion.div>
      </div>
    </section>
  )
}
