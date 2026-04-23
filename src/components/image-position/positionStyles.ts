import type { CSSProperties } from 'react'
import type { ImagePosition } from './types'

/**
 * Convert an ImagePosition (focalX/Y 0–100, zoom 1–3) into CSS properties
 * suitable for applying to an <img> with object-fit: cover.
 *
 * object-position places the given focal % of the source image at the same
 * focal % of the container. transform: scale() then zooms around that same
 * point so the subject stays anchored as the user zooms in.
 */
export function positionStyles(position: ImagePosition): CSSProperties {
  const { focalX, focalY, zoom } = position
  const origin = `${focalX}% ${focalY}%`
  return {
    objectFit: 'cover',
    objectPosition: origin,
    transform: zoom > 1 ? `scale(${zoom})` : undefined,
    transformOrigin: origin,
    willChange: zoom > 1 ? 'transform' : undefined,
  }
}
