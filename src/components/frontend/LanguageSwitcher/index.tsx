'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { switchLocaleAction } from '@/actions/switchLocale'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { LanguagesIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LanguageSwitcher() {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  // Detect current locale from pathname
  const currentLocale = pathname.startsWith('/en') ? 'en' : 'pl'

  // Remove the current locale from the pathname
  const pathnameWithoutLocale = pathname.replace(/^\/(?:en|pl)/, '') || '/'

  const handleSwitch = (locale: 'en' | 'pl') => {
    startTransition(async () => {
      await switchLocaleAction(locale, pathname)
    })
  }

  return (
    <TooltipProvider>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="blend" size="icon" disabled={isPending}>
                <LanguagesIcon className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Zmień język</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Zmień język</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => handleSwitch('pl')}
            // disabled={currentLocale === 'pl'}
          >
            <span className="mr-1">🇵🇱 </span>Polski
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleSwitch('en')}
            // disabled={currentLocale === 'en'}
            disabled
          >
            <span className="mr-1">🇬🇧 </span>English (Coming Soon)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  )
}
