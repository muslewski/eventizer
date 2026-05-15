import { cn } from '@/lib/utils'

/**
 * Phone-shaped frame for vertical (9:16) videos.
 *
 * Pure CSS — one outer wrapper with gradient + drop shadow as the bezel,
 * one inner wrapper with smaller rounding + overflow-hidden as the screen.
 * Two tiny decorative spans for the Dynamic Island pill and the home-indicator
 * bar. No images, no SVGs, no JS — costs roughly the same as the existing
 * `rounded-[0.8rem] overflow-hidden` wrapper it replaces.
 *
 * Drop-in for the OfferVideo / VideoBlock outer wrapper: caller wraps the
 * existing scaling `<motion.div>` and its children with `<PhoneFrame>` only
 * when the video aspect ratio is 9:16 (see usage in both components).
 *
 * Radii are tuned for the 9:16 wrapper sizes (`max-w-xs` → 320px, `sm:max-w-sm`
 * → 384px). The outer phone curvature stays around 10% of width — close to
 * the proportions of a modern handset without trying to be photo-real.
 */
export function PhoneFrame({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        // Outer bezel: dark gradient + heavy drop shadow + subtle rim highlight
        'relative isolate',
        'rounded-[2rem] sm:rounded-[2.25rem]',
        'p-2 sm:p-2.5',
        'bg-gradient-to-br from-zinc-800 via-zinc-950 to-zinc-900',
        'shadow-[0_35px_70px_-20px_rgba(0,0,0,0.65)]',
        'ring-1 ring-white/[0.04]',
        className,
      )}
    >
      {/* Top inner highlight — gives the bezel a slight metallic sheen */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10)' }}
      />

      {/* Dynamic Island — small black pill centered above the screen */}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute z-30',
          'top-3.5 sm:top-4 left-1/2 -translate-x-1/2',
          'h-3.5 sm:h-4 w-16 sm:w-20',
          'rounded-full bg-black ring-1 ring-white/[0.05]',
        )}
      />

      {/* Home indicator — thin white pill at the bottom of the screen */}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute z-30',
          'bottom-3.5 sm:bottom-4 left-1/2 -translate-x-1/2',
          'h-1 w-24 sm:w-28',
          'rounded-full bg-white/70 mix-blend-overlay',
        )}
      />

      {/* Screen — clips the video at the rounded inner corners */}
      <div className="relative rounded-[1.55rem] sm:rounded-[1.8rem] overflow-hidden">
        {children}
      </div>
    </div>
  )
}
