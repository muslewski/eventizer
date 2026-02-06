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
  planet?: boolean
  spotlight?: boolean
  cornerAccentColor?: string // e.g. 'accent', 'pink-400'
  className?: string
  children?: React.ReactNode
}

export const BlockHeader: React.FC<BlockHeaderProps> = ({
  heading,
  description,
  badge,
  lines = false,
  planet = false,
  spotlight = false,
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

  const effects = (planet || spotlight) && (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {planet && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-50 h-50 bg-linear-to-br from-primary/50 via-transparent to-accent/5 rounded-full blur-sm" />
      )}
      {spotlight && (
        <div className="absolute top-1/2 left-2/5 -translate-x-1/2 -translate-y-1/2 w-35 -rotate-45 h-100 bg-linear-to-br from-primary/5 via-accent-foreground/5 to-transparent rounded-full blur-3xl" />
      )}
    </div>
  )

  if (!lines) {
    return (
      <div className={cn('relative flex flex-col items-center', className)}>
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
