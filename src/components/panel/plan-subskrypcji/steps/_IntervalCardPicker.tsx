'use client'

import * as React from 'react'
import { CheckIcon, QuoteIcon, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Three-column card picker for billing intervals. Sibling of `_RichCardPicker`,
 * but tuned for shorter content (no bullets, no footer) and a large price as
 * the visual anchor. One option may be marked `highlight` (typical "yearly =
 * best deal") — renders an overflowing top-edge pill plus a stronger baseline
 * border so it stands out even before the user selects it.
 *
 * Same surface tokens as the RichCardPicker: `bg-card border-border/30` plus
 * shadow-sm so the cards lift off the page, inset accent glow on hover/selected,
 * `font-bebas` for title and price.
 */

export interface IntervalCardOption {
  /** Stripe price id (also used as the selection value). */
  value: string
  label: string
  tagline: string
  /** Formatted period total, e.g. "299 PLN". */
  formattedPrice: string
  /** Suffix shown next to the price, e.g. "/rok". */
  perPeriod: string
  /** Optional best-deal pill rendered overflowing the top edge. */
  highlight?: {
    icon: LucideIcon
    label: string
  }
}

export interface IntervalCardPickerProps {
  options: IntervalCardOption[]
  value: string | null
  onChange: (v: string) => void
  ariaLabelledBy: string
}

export function IntervalCardPicker({
  options,
  value,
  onChange,
  ariaLabelledBy,
}: IntervalCardPickerProps) {
  const refs = React.useRef<Array<HTMLButtonElement | null>>([])
  const hasAnyHighlight = options.some((o) => o.highlight)

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
        // Mobile stacks vertically — bump the gap for breathing room. From sm
        // up the three columns sit side-by-side and gap-4 reads cleaner.
        'grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-4',
        hasAnyHighlight && 'pt-3',
      )}
    >
      {options.map((opt, idx) => {
        const isSelected = value === opt.value
        const isHighlighted = !!opt.highlight
        const HighlightIcon = opt.highlight?.icon
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
              'group relative flex flex-col gap-4 rounded-xl border bg-card p-5 text-left shadow-sm',
              'transition-[border-color,box-shadow,transform,background-color] duration-200 ease-out',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              isSelected
                ? 'border-accent bg-accent/[0.06] shadow-[inset_0_0_0_1px_rgba(210,140,8,0.18)]'
                : cn(
                    'hover:border-accent/40 hover:bg-accent/[0.04] hover:shadow-[inset_0_0_0_1px_rgba(210,140,8,0.08)] hover:-translate-y-0.5',
                    // Highlighted cards keep a stronger baseline border so the
                    // "best deal" visual hint persists even without hover/select.
                    // Bumped to /45 to stay distinct against the lighter bg-card
                    // surface (default border now at /30 instead of /20).
                    isHighlighted ? 'border-accent/45' : 'border-border/30',
                  ),
            )}
          >
            {/* Highlight badge — overflows top edge, accent fill */}
            {opt.highlight && HighlightIcon && (
              <div
                className={cn(
                  'absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10',
                  'flex items-center gap-1.5 rounded-full bg-accent px-4 py-1 shadow-sm',
                  'text-xs font-semibold uppercase tracking-wider text-accent-foreground whitespace-nowrap',
                )}
                aria-label={opt.highlight.label}
              >
                <HighlightIcon
                  className="size-3.5"
                  fill="currentColor"
                  strokeWidth={0}
                />
                <span>{opt.highlight.label}</span>
              </div>
            )}

            {/* Selected indicator (top-right corner) */}
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

            {/* Title + tagline */}
            <div className="flex flex-col gap-1.5 pr-10">
              <h3 className="font-bebas text-2xl sm:text-3xl tracking-wide leading-none">
                {opt.label}
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

            {/* Divider */}
            <div className="h-px bg-border/40" aria-hidden="true" />

            {/* Price block */}
            <div className="flex items-baseline gap-1.5">
              <span
                className={cn(
                  'font-bebas text-3xl sm:text-4xl tracking-wide leading-none transition-colors',
                  isSelected || isHighlighted
                    ? 'text-accent'
                    : 'text-foreground group-hover:text-accent/90',
                )}
              >
                {opt.formattedPrice}
              </span>
              <span className="text-sm text-muted-foreground">{opt.perPeriod}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
