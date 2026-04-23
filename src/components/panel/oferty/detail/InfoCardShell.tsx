import { type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface InfoCardShellProps {
  icon: LucideIcon
  title: string
  description: string
  className?: string
  children: ReactNode
}

/**
 * Shared shell for every card in the offer detail info grid.
 *
 * - Icon chip (34x34, rounded-[10px], accent-gold gradient) next to a CardTitle
 * - CardDescription underneath with the helper line
 * - CardContent wraps the per-card body
 *
 * The card is a shadcn <Card>, so it picks up the AnimatedCard hover
 * treatment (accent-tinted bg + border on hover) automatically when
 * wrapped by <AnimatedCard> in InfoCardGrid.
 */
export function InfoCardShell({
  icon: Icon,
  title,
  description,
  className,
  children,
}: InfoCardShellProps) {
  return (
    <Card className={cn('bg-background border-border/20 overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <span
          aria-hidden="true"
          className="inline-flex size-[34px] shrink-0 items-center justify-center rounded-[10px] border border-accent/25 bg-gradient-to-b from-accent/20 to-accent/5 text-accent"
        >
          <Icon className="size-4" />
        </span>
        <div className="flex flex-col gap-0.5 min-w-0">
          <CardTitle className="text-base leading-tight">{title}</CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  )
}
