'use client'

/**
 * Suppresses React hydration warnings caused by Payload's internal DnD Kit
 * components generating non-deterministic `useId()` values during SSR.
 *
 * The patch must run at module evaluation time (before React hydrates),
 * so it cannot be inside useEffect (which runs after hydration).
 */

if (typeof window !== 'undefined') {
  const originalConsoleError = console.error

  console.error = (...args: unknown[]) => {
    const message = typeof args[0] === 'string' ? args[0] : ''

    if (
      message.includes('A tree hydrated but some attributes') ||
      message.includes('did not match') ||
      message.includes('Hydration failed') ||
      message.includes("server rendered HTML didn't match")
    ) {
      return
    }

    originalConsoleError.apply(console, args)
  }
}

export function SuppressHydrationWarnings() {
  return null
}
