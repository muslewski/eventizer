'use client'

import * as React from 'react'
import { CheckIcon, QuoteIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * A richer variant of `_CardPicker` for high-stakes onboarding choices. Same
 * `role="radiogroup"` + arrow-key semantics, but each option is a full marketing
 * card with title, tagline (quoted, italic), and a bulleted feature list.
 *
 * Used by `PlanKindStep` for the Single-vs-Multi decision; will be reused in
 * subsequent wizard steps that need the same level of visual weight.
 */

export interface RichCardOption<V extends string> {
  value: V
  title: string
  tagline: string
  bullets: string[]
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
              'group relative flex flex-col gap-4 rounded-xl border p-5 sm:p-6 text-left',
              'transition-[border-color,background-color,box-shadow,transform] duration-200 ease-out',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              isSelected
                ? 'border-accent bg-accent/[0.06] shadow-sm'
                : 'border-border/60 hover:border-accent/40 hover:bg-accent/[0.02] hover:-translate-y-0.5',
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

            {/* Title */}
            <h3 className="font-bebas text-2xl sm:text-3xl tracking-wide leading-none pr-10">
              {opt.title}
            </h3>

            {/* Tagline — quoted, italic, accent-tinted */}
            <div className="flex items-start gap-2">
              <QuoteIcon
                aria-hidden="true"
                className="size-3.5 mt-1 flex-shrink-0 text-accent/70"
              />
              <span className="text-sm italic text-muted-foreground leading-snug">
                {opt.tagline}
              </span>
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
                      isSelected ? 'bg-accent/15' : 'bg-accent/[0.08]',
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
