'use client'

import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

export interface TypeOption<T extends string> {
  value: T
  label: string
  icon: LucideIcon
}

interface TypeSelectorProps<T extends string> {
  options: readonly TypeOption<T>[]
  value: T
  onChange: (value: T) => void
  layoutId?: string
  className?: string
}

export function TypeSelector<T extends string>({
  options,
  value,
  onChange,
  layoutId = 'contact-type-indicator',
  className,
}: TypeSelectorProps<T>) {
  return (
    <div className={cn('grid grid-cols-3 gap-2 sm:gap-3', className)}>
      {options.map((option) => {
        const isActive = value === option.value
        const Icon = option.icon

        return (
          <motion.button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            whileTap={{ scale: 0.96 }}
            className={cn(
              'group relative flex flex-col items-center justify-center gap-2.5 rounded-xl border px-2 py-4 text-center outline-none transition-colors duration-200',
              'focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              isActive
                ? 'border-accent/45 text-foreground'
                : 'border-border/40 bg-background/40 text-muted-foreground hover:border-accent/25 hover:text-foreground',
            )}
          >
            {isActive && (
              <motion.span
                layoutId={layoutId}
                aria-hidden="true"
                className="absolute inset-0 -z-10 rounded-xl border border-accent/30 bg-gradient-to-b from-accent/10 via-accent/[0.04] to-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                transition={{ type: 'spring', stiffness: 360, damping: 30 }}
              />
            )}
            <span
              aria-hidden="true"
              className={cn(
                'inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] border transition-colors duration-200',
                isActive
                  ? 'border-accent/40 bg-gradient-to-b from-accent/25 to-accent/5 text-accent'
                  : 'border-border/40 bg-background/40 text-muted-foreground group-hover:text-accent group-hover:border-accent/25',
              )}
            >
              <Icon className="size-4" />
            </span>
            <span className="text-xs font-medium leading-tight">{option.label}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
