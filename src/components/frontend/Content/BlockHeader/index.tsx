import { cn } from '@/lib/utils'
import { TitleH2 } from '@/components/frontend/Content/TitleH2'
import { Badge, type badgeVariants } from '@/components/ui/badge'
import type { VariantProps } from 'class-variance-authority'

interface BlockHeaderProps {
  heading: string
  description?: string
  badge?: {
    label: string
    variant?: VariantProps<typeof badgeVariants>['variant']
  }
  lines?: boolean
  gap?: boolean
  planet?: boolean
  spotlight?: boolean
  grid?: boolean
  aurora?: boolean
  overflowHidden?: boolean
  cornerAccentColor?: string // e.g. 'accent', 'pink-400'
  className?: string
  children?: React.ReactNode
}

export const BlockHeader: React.FC<BlockHeaderProps> = ({
  heading,
  description,
  badge,
  lines = false,
  gap = false,
  planet = false,
  spotlight = false,
  grid = false,
  aurora = false,
  overflowHidden = false,
  cornerAccentColor = 'accent',
  className,
  children,
}) => {
  const content = (
    <div className="text-center flex flex-col items-center gap-6">
      {badge && <Badge variant={badge.variant ?? 'golden'}>{badge.label}</Badge>}
      <div className="flex flex-col items-center">
        <TitleH2 align="center" title={heading} />
        {description && <p className="text-muted-foreground max-w-2xl">{description}</p>}
      </div>
      {children}
    </div>
  )

  const effects = (planet || spotlight || grid || aurora) && (
    <div
      className={cn('absolute inset-0 pointer-events-none', overflowHidden && 'overflow-hidden')}
    >
      {planet && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-50 h-50 bg-linear-to-br from-primary/50 via-transparent to-accent/5 rounded-full blur-sm" />
      )}
      {spotlight && (
        <div className="absolute top-1/2 left-2/5 -translate-x-1/2 -translate-y-1/2 w-35 -rotate-45 h-100 bg-linear-to-br from-primary/5 via-accent-foreground/5 to-transparent rounded-full blur-3xl" />
      )}
      {grid && (
        <div
          className="absolute inset-0 opacity-[0.07] dark:opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(to right, var(--color-accent) 1px, transparent 1px), linear-gradient(to bottom, var(--color-accent) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        >
          {/* Fade-out mask so the grid dissolves toward the edges */}
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-background/60 to-background" />
        </div>
      )}
      {aurora && (
        <>
          <div className="absolute -top-12 left-1/4 w-72 h-40 bg-linear-to-r from-primary/20 via-accent/15 to-transparent rounded-full blur-3xl animate-pulse [animation-duration:4s]" />
          <div className="absolute -bottom-8 right-1/4 w-64 h-36 bg-linear-to-l from-accent/20 via-primary/10 to-transparent rounded-full blur-3xl animate-pulse [animation-duration:4s] [animation-delay:2s]" />
        </>
      )}
    </div>
  )

  if (!lines && !gap) {
    return (
      <div className={cn('relative flex flex-col items-center', className)}>
        {effects}
        {content}
      </div>
    )
  }

  if (gap && !lines) {
    return (
      <div className={cn('relative flex flex-col items-center py-16', className)}>
        {effects}
        {content}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-16 relative', className)}>
      {effects}

      {/* Top line */}
      <div className="bg-linear-to-r from-accent dark:from-accent/50 via-transparent to-transparent h-px w-[calc(100%+4rem)] -ml-8" />

      {content}

      {/* Bottom line */}
      <div className="bg-linear-to-l from-accent dark:from-accent/40 via-transparent to-transparent h-px w-[calc(100%+4rem)] -ml-8" />

      {/* Corner accents */}
      <div
        className={cn(
          'absolute top-0 right-0 w-8 h-8 border-r border-t',
          `border-${cornerAccentColor}/20`,
        )}
      />
      <div
        className={cn(
          'absolute bottom-0 left-0 w-8 h-8 border-l border-b',
          `border-${cornerAccentColor}/20`,
        )}
      />
    </div>
  )
}
