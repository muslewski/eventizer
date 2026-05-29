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
 * Compact, horizontally-scrollable row of an offer's event types — one chip
 * per type. No auto-motion: the user scrolls at their own pace. The scrollbar
 * is hidden and the row edge-fades so it reads as content, not a control. When
 * `allMode` is set the row is prefixed with a small "wszystkie ·" hint.
 */
export function EventTypeChips({ types, allMode = false }: EventTypeChipsProps) {
  if (types.length === 0) return null

  return (
    <span className="flex min-w-0 items-center gap-2">
      {allMode && (
        <span className="shrink-0 text-xs text-muted-foreground">wszystkie&nbsp;·</span>
      )}
      <span
        className="flex min-w-0 gap-1.5 overflow-x-auto py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,transparent,black_0.5rem,black_calc(100%-0.75rem),transparent)]"
      >
        {types.map((t) => (
          <span
            key={t.id}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-sm font-medium text-primary"
          >
            <TypeIcon icon={t.icon} />
            {t.name}
          </span>
        ))}
      </span>
    </span>
  )
}
