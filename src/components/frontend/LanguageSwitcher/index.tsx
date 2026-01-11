'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTransition } from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LanguagesIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LanguageSwitcher() {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Detect current locale from pathname
  const currentLocale = pathname.startsWith('/en') ? 'en' : 'pl'

  // Remove the current locale from the pathname
  const pathnameWithoutLocale = pathname.replace(/^\/(?:en|pl)/, '') || '/'

  const switchLocale = (locale: 'en' | 'pl') => {
    const newPath = locale === 'en' ? `/en${pathnameWithoutLocale}` : pathnameWithoutLocale

    // Set or clear cookie
    if (locale === 'pl') {
      document.cookie = 'NEXT_LOCALE=; path=/; max-age=0'
    } else {
      document.cookie = 'NEXT_LOCALE=en; path=/; max-age=31536000'
    }

    startTransition(() => {
      router.push(newPath)
      router.refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="blend" size="icon" disabled={isPending}>
          <LanguagesIcon className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => switchLocale('pl')} disabled={currentLocale === 'pl'}>
          <span className="mr-1">🇵🇱 </span>Polski
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => switchLocale('en')} disabled={currentLocale === 'en'}>
          <span className="mr-1">🇬🇧 </span>English (Coming Soon)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
