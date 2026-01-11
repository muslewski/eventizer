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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function LanguageSwitcher() {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Detect current locale from pathname
  const currentLocale = pathname.startsWith('/en') ? 'en' : 'pl'

  // Remove the current locale from the pathname
  const pathnameWithoutLocale = pathname.replace(/^\/(?:en|pl)/, '') || '/'

  const switchToPolish = async () => {
    // Clear cookie to use default (Polish)
    document.cookie = 'NEXT_LOCALE=; path=/; max-age=0'

    // Wait for cookie to be set
    await delay(50)

    startTransition(() => {
      router.push(pathnameWithoutLocale)
      router.refresh()
    })

    // Use window.location to trigger full navigation (runs middleware)
    // window.location.href = pathnameWithoutLocale
  }

  const switchToEnglish = async () => {
    // Set cookie for English preference
    document.cookie = 'NEXT_LOCALE=en; path=/; max-age=31536000'

    // Wait for cookie to be set
    await delay(50)

    startTransition(() => {
      router.push(`/en${pathnameWithoutLocale}`)
      router.refresh()
    })

    // Use window.location to trigger full navigation (runs middleware)
    // window.location.href = `/en${pathnameWithoutLocale}`
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
        <DropdownMenuItem onClick={switchToPolish} disabled={currentLocale === 'pl' || isPending}>
          <span className="mr-1">🇵🇱 </span>Polski
        </DropdownMenuItem>
        <DropdownMenuItem onClick={switchToEnglish} disabled={currentLocale === 'en' || isPending}>
          <span className="mr-1">🇬🇧 </span>English (Coming Soon)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
