import { SparklesIcon, type LucideIcon } from 'lucide-react'

/**
 * Reusable ROI nudge rendered below a wizard step's card grid. Always centered,
 * accent-tinted, italic — a low-pressure reminder that a single booking can
 * recoup the subscription cost. The italic styling carries across steps to keep
 * tonal consistency.
 */
export function WizardRoiHint({
  children,
  icon: Icon = SparklesIcon,
}: {
  children: React.ReactNode
  icon?: LucideIcon
}) {
  return (
    <div className="flex justify-center px-2">
      <div className="flex items-center gap-2.5 rounded-full border border-accent/20 bg-accent/[0.06] px-4 py-2 text-center">
        <Icon className="size-4 text-accent flex-shrink-0" aria-hidden="true" />
        <span className="text-sm italic text-foreground/85">{children}</span>
      </div>
    </div>
  )
}
