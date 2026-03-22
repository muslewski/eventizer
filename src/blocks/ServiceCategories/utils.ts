import type { Media } from '@/payload-types'

export const getIconUrl = (icon: (number | null) | Media | undefined): string | null => {
  if (!icon || typeof icon === 'number') return null
  return icon.url || null
}
