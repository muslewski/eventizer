import type { Config } from '@/payload-types'

type Locale = Config['locale']

export const navLinks = [
  { href: '/ogloszenia', label: 'Ogłoszenia' },
  { href: '/o-nas', label: 'O nas' },
  { href: '/kontakt', label: 'Kontakt' },
] as const

export function removeLocalePrefix(pathname: string): string {
  const segments = pathname.split('/')
  if (segments.length > 1 && segments[1].length <= 3 && /^[a-z]{2,3}$/.test(segments[1])) {
    return '/' + segments.slice(2).join('/') || '/'
  }
  return pathname
}
