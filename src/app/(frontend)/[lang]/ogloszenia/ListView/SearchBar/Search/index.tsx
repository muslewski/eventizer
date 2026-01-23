'use client'

import { SearchIcon, XIcon } from 'lucide-react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback, useState, useTransition, useRef } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { cn } from '@/lib/utils'

export default function Search() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Local state for immediate UI feedback
  const [value, setValue] = useState(searchParams.get('szukaj') ?? '')

  // Track if user is actively typing to prevent URL sync from overwriting
  const isTypingRef = useRef(false)

  // Debounced URL update
  const debouncedSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (term) {
      params.set('szukaj', term)
    } else {
      params.delete('szukaj')
    }

    // Reset to page 1 when searching
    params.delete('strona')

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })

    // Mark typing as complete after URL update is triggered
    isTypingRef.current = false
  }, 300)

  // Sync with URL only when not typing (e.g., browser back/forward)
  const urlValue = searchParams.get('szukaj') ?? ''
  if (!isTypingRef.current && urlValue !== value) {
    setValue(urlValue)
  }

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      isTypingRef.current = true
      setValue(newValue)
      debouncedSearch(newValue)
    },
    [debouncedSearch],
  )

  const handleClear = useCallback(() => {
    isTypingRef.current = true
    setValue('')
    debouncedSearch('')
  }, [debouncedSearch])

  return (
    <div
      className={cn(
        'flex items-center gap-4 h-full bg-black/60 border px-6 py-4 rounded-2xl w-full transition-all duration-200',
        'focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20',
      )}
    >
      <SearchIcon
        size={22}
        className={cn(
          'text-foreground/50 flex-shrink-0 transition-colors',
          isPending && 'text-primary animate-pulse',
        )}
      />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Szukaj wykonawców i atrakcji"
        className="flex-1 bg-transparent text-foreground placeholder:text-foreground/50 outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="text-foreground/50 hover:text-foreground transition-colors flex-shrink-0"
          aria-label="Wyczyść wyszukiwanie"
        >
          <XIcon size={18} />
        </button>
      )}
    </div>
  )
}
