'use client'

import * as React from 'react'
import Image from 'next/image'
import { motion, useReducedMotion } from 'motion/react'
import { Sparkles, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface EventTypeItem {
  id: number
  name: string
  slug: string
  icon?: { url?: string | null } | number | null
}

interface EventTypePickerProps {
  eventTypes: EventTypeItem[]
  value: number[]
  onChange: (ids: number[]) => void
}

const snappySpring = { type: 'spring' as const, stiffness: 400, damping: 28, mass: 0.6 }

function EventTypeIcon({ icon }: { icon?: EventTypeItem['icon'] }) {
  const [failed, setFailed] = React.useState(false)
  if (!failed && typeof icon === 'object' && icon?.url) {
    return (
      <Image
        src={icon.url}
        alt=""
        width={28}
        height={28}
        className="size-7 shrink-0 rounded-sm object-contain dark:invert"
        onError={() => setFailed(true)}
      />
    )
  }
  return <Sparkles className="size-7 shrink-0 text-accent/60" />
}

export function EventTypePicker({ eventTypes, value, onChange }: EventTypePickerProps) {
  const shouldReduceMotion = useReducedMotion()
  const selectedSet = React.useMemo(() => new Set(value), [value])

  const toggle = (id: number) => {
    if (selectedSet.has(id)) {
      onChange(value.filter((v) => v !== id))
    } else {
      onChange([...value, id])
    }
  }

  const selectAll = () => onChange(eventTypes.map((t) => t.id))
  const clearAll = () => onChange([])

  const selectedCount = value.length
  const totalCount = eventTypes.length

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {eventTypes.map((t) => {
          const isSelected = selectedSet.has(t.id)
          return (
            <motion.button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id)}
              whileHover={shouldReduceMotion ? undefined : { y: -2, transition: snappySpring }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              aria-pressed={isSelected}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition-colors',
                isSelected
                  ? 'border border-primary/40 bg-primary/5 text-foreground shadow-sm'
                  : 'bg-background border border-border/20 hover:border-accent/30 hover:bg-accent/5',
              )}
            >
              <EventTypeIcon icon={t.icon} />
              <span className="min-w-0 flex-1 truncate font-medium">{t.name}</span>
              {isSelected && <Check className="size-4 shrink-0 text-primary" />}
            </motion.button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Wybrano {selectedCount} z {totalCount} rodzajów
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={selectAll}
            disabled={selectedCount === totalCount}
          >
            Wybierz wszystkie
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            disabled={selectedCount === 0}
          >
            Odznacz wszystkie
          </Button>
        </div>
      </div>
    </div>
  )
}
