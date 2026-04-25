/**
 * Polish-aware slug helper used by the offer wizard's link field and any
 * other place that needs a friendly URL component generated from a title.
 *
 * Output shape: lowercase ASCII, alphanumeric segments joined by `-`, no
 * leading / trailing dashes, max 80 chars (matches the regex enforced in
 * offerSchema.ts).
 */

const POLISH_CHAR_MAP: Record<string, string> = {
  ą: 'a',
  Ą: 'a',
  ć: 'c',
  Ć: 'c',
  ę: 'e',
  Ę: 'e',
  ł: 'l',
  Ł: 'l',
  ń: 'n',
  Ń: 'n',
  ó: 'o',
  Ó: 'o',
  ś: 's',
  Ś: 's',
  ź: 'z',
  Ź: 'z',
  ż: 'z',
  Ż: 'z',
}

const SLUG_MAX_LEN = 80

export function slugify(input: string): string {
  if (!input) return ''
  // Replace Polish diacritics with ASCII equivalents.
  let out = ''
  for (const ch of input) {
    out += POLISH_CHAR_MAP[ch] ?? ch
  }
  // Strip remaining accents that might leak in (e.g. a copy-paste with é).
  out = out.normalize('NFKD').replace(/\p{M}/gu, '')
  // Lowercase, replace runs of non-alphanumerics with a single dash.
  out = out.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  // Trim leading / trailing dashes.
  out = out.replace(/^-+|-+$/g, '')
  if (out.length > SLUG_MAX_LEN) {
    out = out.slice(0, SLUG_MAX_LEN).replace(/-+$/g, '')
  }
  return out
}

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/
export const SLUG_MIN = 2
export const SLUG_MAX = SLUG_MAX_LEN
