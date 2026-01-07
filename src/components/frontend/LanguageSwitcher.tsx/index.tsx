'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function LanguageSwitcher() {
  const pathname = usePathname()

  // Remove the current locale from the pathname
  const pathnameWithoutLocale = pathname.replace(/^\/(?:en|pl)/, '') || '/'

  const handlePolish = () => {
    // Clear cookie to use default (Polish)
    document.cookie = 'NEXT_LOCALE=; path=/; max-age=0'
  }

  const handleEnglish = () => {
    // Set cookie for English preference
    document.cookie = 'NEXT_LOCALE=en; path=/; max-age=31536000'
  }

  return (
    <div className="flex gap-2">
      <Link href={pathnameWithoutLocale} onClick={handlePolish}>
        Polski
      </Link>
      <Link href={`/en${pathnameWithoutLocale}`} onClick={handleEnglish}>
        English
      </Link>
    </div>
  )
}
