'use client'

import * as React from 'react'
import { CheckIcon, QuoteIcon, StarIcon, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * A richer variant of `_CardPicker` for high-stakes onboarding choices. Same
 * `role="radiogroup"` + arrow-key semantics, but each option is a full marketing
 * card with an accent-tinted icon, optional eyebrow, title, tagline, bulleted
 * feature list, and an optional italic motivational footer line.
 *
 * Visual language matches `OfferCard` (panel/oferty) and `CategoryPicker`
 * (panel/wizard) for codebase consistency:
 * - `bg-card-elevated border-border/30` base — beige in light (warm,
 *   deliberate "product card" feel) and gray in dark (the existing lift)
 * - inset accent glow on hover/selected: `inset_0_0_0_1px_rgba(210,140,8,...)`
 * - `font-bebas` titles in tracking-wide caps
 * - accent-tinted icon square in the header (mirrors the OfferCard price pill)
 *
 * Options may also be marked `popular` — renders a star-prefixed pill that
 * overflows the top edge of the card (the classic "most popular plan" pattern).
 */

export interface RichCardOption<V extends string> {
  value: V
  /** Lucide icon rendered in the accent-tinted header square. */
  icon: LucideIcon
  /** Small uppercase eyebrow rendered above the title (e.g. "Do 4 usług"). */
  supertitle?: string
  title: string
  tagline: string
  bullets: string[]
  /** Optional italic motivational line rendered below bullets with its own icon. */
  footer?: {
    icon: LucideIcon
    text: string
  }
  /** Highlights this option with a "most popular" star pill at the top edge. */
  popular?: boolean
}

export interface RichCardPickerProps<V extends string> {
  options: RichCardOption<V>[]
  value: V | undefined
  onChange: (v: V) => void
  ariaLabelledBy: string
  /** Label for the "most popular" badge. Default: PL "Najczęściej wybierany". */
  popularLabel?: string
}

export function RichCardPicker<V extends string>({
  options,
  value,
  onChange,
  ariaLabelledBy,
  popularLabel = 'Najczęściej wybierany',
}: RichCardPickerProps<V>) {
  const refs = React.useRef<Array<HTMLButtonElement | null>>([])
  const hasAnyPopular = options.some((o) => o.popular)

  function onKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      const next = (idx + 1) % options.length
      refs.current[next]?.focus()
      e.preventDefault()
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      const prev = (idx - 1 + options.length) % options.length
      refs.current[prev]?.focus()
      e.preventDefault()
    }
  }

  return (
    <div
      role="radiogroup"
      aria-labelledby={ariaLabelledBy}
      className={cn(
        // Mobile stacks vertically, so it benefits from a bigger gap. Desktop
        // sits side-by-side where less air between the columns reads better.
        'grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-4',
        // Reserve space for the popular-badge that overflows the top edge of cards.
        hasAnyPopular && 'pt-3',
      )}
    >
      {options.map((opt, idx) => {
        const isSelected = value === opt.value
        const Icon = opt.icon
        const FooterIcon = opt.footer?.icon
        return (
          <button
            key={opt.value}
            ref={(el) => {
              refs.current[idx] = el
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected || (!value && idx === 0) ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => onKeyDown(e, idx)}
            className={cn(
              'group relative flex flex-col gap-4 rounded-xl border bg-card-elevated p-5 sm:p-6 text-left shadow-sm',
              'transition-[border-color,box-shadow,transform,background-color] duration-200 ease-out',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              isSelected
                ? 'border-accent bg-accent/[0.06] shadow-[inset_0_0_0_1px_rgba(210,140,8,0.18)]'
                : 'border-border/30 hover:border-accent/40 hover:bg-accent/[0.04] hover:shadow-[inset_0_0_0_1px_rgba(210,140,8,0.08)] hover:-translate-y-0.5',
            )}
          >
            {/* "Most popular" badge — overflows the top edge of the card */}
            {opt.popular && (
              <div
                className={cn(
                  'absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10',
                  'flex items-center gap-1.5 rounded-full bg-accent px-4 py-1 shadow-sm',
                  'text-xs font-semibold uppercase tracking-wider text-accent-foreground whitespace-nowrap',
                )}
                aria-label={popularLabel}
              >
                <StarIcon className="size-3.5" fill="currentColor" strokeWidth={0} />
                <span>{popularLabel}</span>
              </div>
            )}

            {/* Selected indicator badge (top-right corner) */}
            <div
              aria-hidden="true"
              className={cn(
                'absolute top-4 right-4 flex size-6 items-center justify-center rounded-full',
                'transition-all duration-200 ease-out',
                isSelected
                  ? 'bg-accent text-accent-foreground scale-100 opacity-100'
                  : 'bg-transparent border border-border/40 scale-90 opacity-50 group-hover:opacity-90',
              )}
            >
              {isSelected && <CheckIcon className="size-3.5" strokeWidth={3} />}
            </div>

            {/* Header: icon + supertitle + title + tagline */}
            <div className="flex items-start gap-3 sm:gap-4 pr-10">
              {/* Accent-tinted icon square — mirrors the OfferCard price pill */}
              <div
                aria-hidden="true"
                className={cn(
                  'flex size-11 sm:size-12 flex-shrink-0 items-center justify-center rounded-lg border transition-colors',
                  isSelected
                    ? 'bg-accent/15 border-accent/30 text-accent'
                    : 'bg-accent/[0.06] border-accent/20 text-accent/80 group-hover:bg-accent/10 group-hover:border-accent/30',
                )}
              >
                <Icon className="size-5 sm:size-6" strokeWidth={2} />
              </div>

              <div className="flex flex-col gap-1.5 min-w-0">
                {opt.supertitle && (
                  <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium leading-none">
                    {opt.supertitle}
                  </span>
                )}
                <h3 className="font-bebas text-2xl sm:text-3xl tracking-wide leading-none">
                  {opt.title}
                </h3>
                <div className="flex items-start gap-1.5">
                  <QuoteIcon
                    aria-hidden="true"
                    className="size-3 mt-1 flex-shrink-0 text-accent/60"
                  />
                  <span className="text-sm italic text-muted-foreground leading-snug">
                    {opt.tagline}
                  </span>
                </div>
              </div>
            </div>

            {/* Subtle divider */}
            <div className="h-px bg-border/40" aria-hidden="true" />

            {/* Bullet list */}
            <ul className="flex flex-col gap-2.5">
              {opt.bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <span
                    className={cn(
                      'flex size-5 mt-px flex-shrink-0 items-center justify-center rounded-full transition-colors',
                      isSelected ? 'bg-accent/20' : 'bg-accent/[0.08]',
                    )}
                    aria-hidden="true"
                  >
                    <CheckIcon
                      className={cn(
                        'size-3 transition-colors',
                        isSelected ? 'text-accent' : 'text-accent/70',
                      )}
                      strokeWidth={3}
                    />
                  </span>
                  <span className="text-foreground/90 leading-snug">{bullet}</span>
                </li>
              ))}
            </ul>

            {/* Optional italic motivational footer */}
            {opt.footer && FooterIcon && (
              <>
                <div className="h-px bg-border/40" aria-hidden="true" />
                <div className="flex items-start gap-2">
                  <FooterIcon
                    aria-hidden="true"
                    className={cn(
                      'size-4 mt-0.5 flex-shrink-0 transition-colors',
                      isSelected ? 'text-accent' : 'text-accent/75',
                    )}
                  />
                  <span className="text-sm italic text-foreground/85 leading-snug">
                    {opt.footer.text}
                  </span>
                </div>
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}
