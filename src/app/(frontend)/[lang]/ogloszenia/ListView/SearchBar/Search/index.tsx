'use client'

import { SearchIcon, XIcon } from 'lucide-react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback, useState, useTransition, useRef, useEffect } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { cn } from '@/lib/utils'

export default function Search() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const initialValue = searchParams.get('szukaj') ?? ''
  const [value, setValue] = useState(initialValue)

  // Track the last value we sent to the URL
  const lastSubmittedRef = useRef(initialValue)

  // Debounced URL update
  const debouncedSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (term) {
      params.set('szukaj', term)
    } else {
      params.delete('szukaj')
    }

    params.delete('strona')

    // Update our ref before navigation
    lastSubmittedRef.current = term

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }, 300)

  // Sync from URL only when it differs from what we submitted
  // (handles browser back/forward, external navigation)
  useEffect(() => {
    const urlValue = searchParams.get('szukaj') ?? ''

    // Only sync if URL changed externally (not from our own navigation)
    if (urlValue !== lastSubmittedRef.current) {
      setValue(urlValue)
      lastSubmittedRef.current = urlValue
    }
  }, [searchParams])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setValue(newValue)
      debouncedSearch(newValue)
    },
    [debouncedSearch],
  )

  const handleClear = useCallback(() => {
    setValue('')
    debouncedSearch('')
  }, [debouncedSearch])

  return (
    <div
      className={cn(
        'flex items-center gap-4 h-full dark:bg-black/60 hover:bg-muted dark:hover:bg-black/80 border px-6 py-4 rounded-2xl w-full transition-all duration-200',
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
        className="flex-1 text-ellipsis w-full bg-transparent text-foreground placeholder:text-foreground/50 outline-none"
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
