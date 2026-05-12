'use client'

import * as React from 'react'
import { CheckIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CardOption<V extends string> {
  value: V
  label: string
  description: string
}

export interface CardPickerProps<V extends string> {
  options: CardOption<V>[]
  value: V | undefined
  onChange: (v: V) => void
  ariaLabelledBy: string
}

export function CardPicker<V extends string>({
  options,
  value,
  onChange,
  ariaLabelledBy,
}: CardPickerProps<V>) {
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
      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
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
              'flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:ring-accent',
              isSelected
                ? 'border-accent bg-accent/5'
                : 'border-border hover:border-accent/30',
            )}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-bebas text-xl tracking-wide">{opt.label}</span>
              {isSelected && <CheckIcon className="size-4 text-accent" />}
            </div>
            <p className="text-sm text-muted-foreground">{opt.description}</p>
          </button>
        )
      })}
    </div>
  )
}
