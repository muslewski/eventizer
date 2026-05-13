import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

/**
 * Rich alert card used in `ImpactSummaryStep` to match the wizard's visual
 * language (`bg-background` surface, tinted icon square, `font-bebas` title)
 * instead of the flat default shadcn Alert. Two variants:
 *
 * - `info` — accent-tinted icon square, default border. Most informational notices.
 * - `destructive` — destructive-tinted icon + light destructive bg + matching border.
 *   Used for currency mismatches and cross-plan downgrades.
 *
 * Title is laid out next to the icon square; description sits below, spanning
 * across so multi-line copy doesn't get cramped beside the square.
 */
export function SummaryNotice({
  icon: Icon,
  title,
  children,
  variant = 'info',
}: {
  icon: LucideIcon
  title: string
  children: React.ReactNode
  variant?: 'info' | 'destructive'
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col gap-3 rounded-xl border bg-background p-4 sm:p-5',
        variant === 'destructive'
          ? 'border-destructive/30 bg-destructive/[0.04]'
          : 'border-border/20',
      )}
    >
      <div className="flex items-center gap-3">
        <div
          aria-hidden="true"
          className={cn(
            'flex size-9 sm:size-10 flex-shrink-0 items-center justify-center rounded-lg border',
            variant === 'destructive'
              ? 'bg-destructive/15 border-destructive/30 text-destructive'
              : 'bg-accent/[0.08] border-accent/20 text-accent/80',
          )}
        >
          <Icon className="size-4 sm:size-5" strokeWidth={2} />
        </div>
        <h3
          className={cn(
            'font-bebas text-xl sm:text-2xl tracking-wide leading-none',
            variant === 'destructive' && 'text-destructive',
          )}
        >
          {title}
        </h3>
      </div>
      <div
        className={cn(
          'text-sm leading-snug',
          variant === 'destructive' ? 'text-destructive/90' : 'text-muted-foreground',
        )}
      >
        {children}
      </div>
    </div>
  )
}
