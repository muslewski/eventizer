'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

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

  // Detect current locale from pathname
  const currentLocale = pathname.startsWith('/en') ? 'en' : 'pl'

  // Remove the current locale from the pathname
  const pathnameWithoutLocale = pathname.replace(/^\/(?:en|pl)/, '') || '/'

  const switchToPolish = () => {
    // Clear cookie to use default (Polish)
    document.cookie = 'NEXT_LOCALE=; path=/; max-age=0'
    router.push(pathnameWithoutLocale)
  }

  const switchToEnglish = () => {
    // Set cookie for English preference
    document.cookie = 'NEXT_LOCALE=en; path=/; max-age=31536000'
    router.push(`/en${pathnameWithoutLocale}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="blend" size="icon">
          <LanguagesIcon className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={switchToPolish} disabled={currentLocale === 'pl'}>
          <span className="mr-1">🇵🇱 </span>Polski
        </DropdownMenuItem>
        <DropdownMenuItem onClick={switchToEnglish} disabled={currentLocale === 'en'}>
          <span className="mr-1">🇬🇧 </span>English (Coming Soon)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
