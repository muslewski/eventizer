/**
 * Polish pluralization helper.
 *
 * Polish has three plural forms:
 *  - singular:  n == 1                           → "oferta"
 *  - few:       n % 10 in {2,3,4} AND n % 100 NOT in {12,13,14} → "oferty"
 *  - many:      everything else                  → "ofert"
 */
export function pluralize(
  n: number,
  singular: string,
  few: string,
  many: string,
): string {
  const formatted = n.toLocaleString('pl-PL')
  if (n === 1) return `${formatted} ${singular}`
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${formatted} ${few}`
  }
  return `${formatted} ${many}`
}
