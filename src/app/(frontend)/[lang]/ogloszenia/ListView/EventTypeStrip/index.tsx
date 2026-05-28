'use client'

import * as React from 'react'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useListViewTransition } from '@/app/(frontend)/[lang]/ogloszenia/ListView/TransitionContext'
import type { EventType } from '@/payload-types'

interface EventTypeStripProps {
  eventTypes: EventType[]
  currentRodzaj?: string
}

const snappySpring = { type: 'spring' as const, stiffness: 400, damping: 28, mass: 0.6 }

function StripIcon({ icon }: { icon: EventType['icon'] }) {
  const [failed, setFailed] = React.useState(false)
  if (!failed && typeof icon === 'object' && icon && 'url' in icon && icon.url) {
    return (
      <Image
        src={icon.url}
        alt=""
        width={20}
        height={20}
        className="size-5 shrink-0 rounded-sm object-contain dark:invert"
        onError={() => setFailed(true)}
      />
    )
  }
  return <Sparkles className="size-5 shrink-0 text-accent/70" />
}

export default function EventTypeStrip({ eventTypes, currentRodzaj }: EventTypeStripProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { startTransition } = useListViewTransition()
  const shouldReduceMotion = useReducedMotion()

  const setRodzaj = React.useCallback(
    (slug: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (slug) params.set('rodzaj', slug)
      else params.delete('rodzaj')
      params.delete('strona')

      const qs = params.toString()
      startTransition(() => {
        router.push(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
      })
    },
    [router, pathname, searchParams, startTransition],
  )

  if (!eventTypes.length) return null

  const chip = (opts: {
    key: string
    active: boolean
    onClick: () => void
    icon?: React.ReactNode
    label: string
  }) => (
    <motion.button
      key={opts.key}
      type="button"
      onClick={opts.onClick}
      whileHover={shouldReduceMotion ? undefined : { y: -2, transition: snappySpring }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
      aria-pressed={opts.active}
      className={cn(
        'flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        opts.active
          ? 'border-primary/40 bg-primary/10 text-primary shadow-sm'
          : 'border-border/30 bg-background/60 text-muted-foreground hover:border-accent/40 hover:bg-accent/5 hover:text-foreground',
      )}
    >
      {opts.icon}
      <span>{opts.label}</span>
    </motion.button>
  )

  return (
    <ScrollArea
      orientation="horizontal"
      type="scroll"
      className="w-full"
      role="region"
      aria-label="Filtruj po rodzaju eventu"
    >
      {/* w-max so the row sizes to its content and overflows the viewport;
          pt-1 gives the hover-lift headroom, pb-3 leaves room for the bar. */}
      <div className="flex w-max items-center gap-2 px-0.5 pt-1 pb-3">
        {chip({
          key: 'all',
          active: !currentRodzaj,
          onClick: () => setRodzaj(null),
          label: 'Wszystkie',
        })}
        {eventTypes.map((t) =>
          chip({
            key: String(t.id),
            active: currentRodzaj === t.slug,
            onClick: () => setRodzaj(t.slug),
            icon: <StripIcon icon={t.icon} />,
            label: t.name,
          }),
        )}
      </div>
    </ScrollArea>
  )
}
