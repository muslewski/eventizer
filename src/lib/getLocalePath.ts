const DEFAULT_LOCALE = 'pl'

/**
 * Returns a path with locale prefix when needed.
 * For the default locale (pl), returns the path as-is.
 * For other locales, prepends the locale prefix.
 */
export function getLocalePath(path: string, locale: string): string {
  if (locale === DEFAULT_LOCALE) return path
  return `/${locale}${path}`
}