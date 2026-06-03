'use client'

import * as React from 'react'
import Image from 'next/image'
import { Sparkles } from 'lucide-react'
import type { EventType } from '@/payload-types'

interface EventTypeChipsProps {
  types: EventType[]
  /** When the offer applies to every type, prefix the row with a subtle hint. */
  allMode?: boolean
}

function TypeIcon({ icon }: { icon: EventType['icon'] }) {
  const [failed, setFailed] = React.useState(false)
  if (!failed && typeof icon === 'object' && icon && 'url' in icon && icon.url) {
    return (
      <Image
        src={icon.url}
        alt=""
        width={16}
        height={16}
        className="size-4 shrink-0 rounded-sm object-contain dark:invert"
        onError={() => setFailed(true)}
      />
    )
  }
  return <Sparkles className="size-4 shrink-0 text-primary/70" />
}

/**
 * A set of an offer's event types — one chip per type, all visible (no horizontal
 * scroll). Stacks in a single column on mobile and becomes a flex-wrapped row from
 * the `sm` breakpoint up. When `allMode` is set the set is prefixed with a small
 * "wszystkie ·" hint (the offer applies to every event type).
 */
export function EventTypeChips({ types, allMode = false }: EventTypeChipsProps) {
  if (types.length === 0) return null

  return (
    <span className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      {allMode && (
        <span className="text-xs text-muted-foreground">wszystkie&nbsp;·</span>
      )}
      {types.map((t) => (
        <span
          key={t.id}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-sm font-medium text-primary"
        >
          <TypeIcon icon={t.icon} />
          {t.name}
        </span>
      ))}
    </span>
  )
}
