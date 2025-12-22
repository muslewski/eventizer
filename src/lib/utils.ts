import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert Unix timestamp (seconds) to ISO string
 */
export function timestampToISOString(timestamp: number | null | undefined): string | null {
  if (timestamp === null || timestamp === undefined) return null
  // Stripe timestamps are in seconds, JavaScript Date expects milliseconds
  return new Date(timestamp * 1000).toISOString()
}
