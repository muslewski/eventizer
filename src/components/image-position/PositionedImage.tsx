import Image, { type ImageProps } from 'next/image'
import { cn } from '@/lib/utils'
import { positionStyles } from './positionStyles'
import { resolvePosition, type ImagePosition } from './types'

type PositionedImageProps = Omit<ImageProps, 'src' | 'alt' | 'fill' | 'style'> & {
  src: string
  alt: string
  position?: Partial<ImagePosition> | null
  /** Applied to the outer <div> wrapper (e.g. aspect + sizing). */
  className?: string
  /** Applied to the inner <Image> (e.g. hover:scale-105, transitions). */
  imgClassName?: string
}

/**
 * Display-time wrapper for the main image of an offer.
 *
 * Passes through every next/image prop except src/alt/fill/style (we control
 * those). Reads focalX/Y/zoom from `position` and applies them as
 * object-position + transform so the stored framing shows up on the card.
 * Defaults (center, zoom 1) reproduce today's `<Image fill object-cover>`
 * behavior exactly — offers with no stored position render identically.
 */
export function PositionedImage({
  src,
  alt,
  position,
  className,
  imgClassName,
  ...imageProps
}: PositionedImageProps) {
  const resolved = resolvePosition(position)
  const style = positionStyles(resolved)

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <Image
        {...imageProps}
        src={src}
        alt={alt}
        fill
        style={style}
        className={imgClassName}
      />
    </div>
  )
}
