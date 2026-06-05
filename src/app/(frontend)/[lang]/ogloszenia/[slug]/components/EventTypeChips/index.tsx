'use client'

import * as React from 'react'
import Image from 'next/image'
import { Sparkles } from 'lucide-react'
import type { EventType } from '@/payload-types'

interface EventTypeChipsProps {
  types: EventType[]
}

function TypeIcon({ icon }: { icon: EventType['icon'] }) {
  const [failed, setFailed] = React.useState(false)
  if (!failed && typeof icon === 'object' && icon && 'url' in icon && icon.url) {
    return (
      <Image
        src={icon.url}
        alt=""
        width={24}
        height={24}
        className="size-6 shrink-0 rounded-sm object-contain dark:invert"
        onError={() => setFailed(true)}
      />
    )
  }
  return <Sparkles className="size-6 shrink-0 text-primary/70" />
}

/**
 * A set of an offer's event types — one chip per type, all visible (no horizontal
 * scroll). Stacks in a single column on mobile and becomes a flex-wrapped row from
 * the `sm` breakpoint up. When an offer applies to every type we simply render the
 * full list of chips; no separate "all" badge — the complete set already says so.
 */
export function EventTypeChips({ types }: EventTypeChipsProps) {
  if (types.length === 0) return null

  return (
    <span className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      {types.map((t) => (
        <span
          key={t.id}
          className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-5 py-2 text-base font-medium text-primary"
        >
          <TypeIcon icon={t.icon} />
          {t.name}
        </span>
      ))}
    </span>
  )
}
