'use client'

import * as React from 'react'
import { CheckIcon, QuoteIcon, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * A richer variant of `_CardPicker` for high-stakes onboarding choices. Same
 * `role="radiogroup"` + arrow-key semantics, but each option is a full marketing
 * card with an accent-tinted icon, title, tagline, and a bulleted feature list.
 *
 * Visual language matches `OfferCard` (panel/oferty) for codebase consistency:
 * - `bg-card border-border/30` base (genuine elevation in dark mode)
 * - inset accent glow on hover/selected: `inset_0_0_0_1px_rgba(210,140,8,...)`
 * - `font-bebas` titles in tracking-wide caps
 * - accent-tinted icon square in the header (mirrors the OfferCard price pill)
 *
 * Used by `PlanKindStep` for the Single-vs-Multi decision; will be reused in
 * subsequent wizard steps that need the same level of visual weight.
 */

export interface RichCardOption<V extends string> {
  value: V
  title: string
  tagline: string
  bullets: string[]
  /** Lucide icon rendered in the accent-tinted header square. */
  icon: LucideIcon
}

export interface RichCardPickerProps<V extends string> {
  options: RichCardOption<V>[]
  value: V | undefined
  onChange: (v: V) => void
  ariaLabelledBy: string
}

export function RichCardPicker<V extends string>({
  options,
  value,
  onChange,
  ariaLabelledBy,
}: RichCardPickerProps<V>) {
  const refs = React.useRef<Array<HTMLButtonElement | null>>([])

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
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {options.map((opt, idx) => {
        const isSelected = value === opt.value
        const Icon = opt.icon
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
              'group relative flex flex-col gap-4 rounded-xl border bg-card p-5 sm:p-6 text-left shadow-sm',
              'transition-[border-color,box-shadow,transform] duration-200 ease-out',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              isSelected
                ? 'border-accent shadow-[inset_0_0_0_1px_rgba(210,140,8,0.18)]'
                : 'border-border/30 hover:border-accent/40 hover:shadow-[inset_0_0_0_1px_rgba(210,140,8,0.08)] hover:-translate-y-0.5',
            )}
          >
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

            {/* Header: icon + title + tagline */}
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
          </button>
        )
      })}
    </div>
  )
}
